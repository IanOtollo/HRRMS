import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const generateOtp = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    const existingOtps = await ctx.db
      .query("otps")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();
      
    for (const record of existingOtps) {
      await ctx.db.delete(record._id);
    }

    const otpId = await ctx.db.insert("otps", {
      email: args.email,
      otp,
      expiresAt,
    });

    return { success: true };
  },
});

export const verifyOtp = mutation({
  args: { email: v.string(), otp: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("otps")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!record) {
      return { success: false, message: "Invalid or expired OTP" };
    }

    if (record.expiresAt < Date.now()) {
      await ctx.db.delete(record._id);
      return { success: false, message: "OTP has expired" };
    }

    if (record.otp !== args.otp) {
      return { success: false, message: "Incorrect OTP" };
    }

    await ctx.db.delete(record._id);

    return { success: true };
  },
});
