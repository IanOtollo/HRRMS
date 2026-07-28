"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import nodemailer from "nodemailer";

export const sendOtpAction = action({
  args: { email: v.string(), otp: v.string() },
  handler: async (ctx, args) => {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: args.email,
      subject: "Busia County HRRMS - Your Verification Code",
      text: `Your 6-digit verification code is: ${args.otp}. It will expire in 5 minutes.`,
    };

    try {
      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error("Failed to send OTP email:", error);
      return { success: false, error: "Failed to send OTP email" };
    }
  },
});
