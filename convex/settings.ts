import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireRole, getCurrentUser } from "./lib/rbac";

const DEFAULTS = {
  enforceMfa: false,
  ipWhitelistEnabled: false,
  allowedIpRanges: "",
};

export const get = query({
  args: {},
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    const existing = await ctx.db.query("systemSettings").first();
    return existing ?? { ...DEFAULTS, updatedAt: 0 };
  },
});

export const update = mutation({
  args: {
    enforceMfa: v.boolean(),
    ipWhitelistEnabled: v.boolean(),
    allowedIpRanges: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["super_admin"]);

    const existing = await ctx.db.query("systemSettings").first();
    const patch = {
      enforceMfa: args.enforceMfa,
      ipWhitelistEnabled: args.ipWhitelistEnabled,
      allowedIpRanges: args.allowedIpRanges,
      updatedBy: user._id,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
    } else {
      await ctx.db.insert("systemSettings", patch);
    }

    await ctx.db.insert("auditLog", {
      userId: user._id,
      userName: user.name ?? "Unknown",
      action: "settings.update",
      recordType: "systemSettings",
      timestamp: Date.now(),
      details: patch,
    });
  },
});
