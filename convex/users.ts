import { action, internalMutation, mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { createAccount, modifyAccountCredentials } from "@convex-dev/auth/server";
import { requireRole } from "./lib/rbac";
import { userRoleValidator } from "./schema";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user || user.isActive === false) return null;
    return user;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["super_admin", "hr_director"]);
    const users = await ctx.db.query("users").collect();
    return users
      .filter((u) => !!u.role)
      .map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        departmentId: u.departmentId,
        isActive: u.isActive ?? true,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
      }));
  },
});

export const create = action({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    role: userRoleValidator,
    departmentId: v.optional(v.id("departments")),
  },
  handler: async (ctx, args): Promise<Id<"users">> => {
    const caller = await ctx.runQuery(api.users.me, {});
    if (!caller || caller.role !== "super_admin") {
      throw new ConvexError("Access denied: only a Super Administrator can create users");
    }

    if (args.role === "department_viewer" && !args.departmentId) {
      throw new ConvexError("Department Viewer accounts must be assigned a department");
    }

    const { user } = await createAccount(ctx, {
      provider: "password",
      account: { id: args.email, secret: args.password },
      profile: {
        email: args.email,
        name: args.name,
        role: args.role,
        departmentId: args.departmentId,
        isActive: true,
        createdAt: Date.now(),
      },
    });

    await ctx.runMutation(internal.users.logAudit, {
      userId: caller._id,
      userName: caller.name ?? "Unknown",
      action: "user.create",
      recordId: user._id,
      details: { email: args.email, role: args.role },
    });

    return user._id;
  },
});

export const changePassword = action({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const caller = await ctx.runQuery(api.users.me, {});
    if (!caller || !caller.email) {
      throw new ConvexError("Not authenticated");
    }

    if (args.newPassword.length < 8) {
      throw new ConvexError("New password must be at least 8 characters");
    }

    try {
      await ctx.runAction(api.auth.signIn, {
        provider: "password",
        params: { email: caller.email, password: args.currentPassword, flow: "signIn" },
      });
    } catch {
      throw new ConvexError("Current password is incorrect");
    }

    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: caller.email, secret: args.newPassword },
    });

    await ctx.runMutation(internal.users.logAudit, {
      userId: caller._id,
      userName: caller.name ?? "Unknown",
      action: "user.changePassword",
    });
  },
});

export const updateRole = mutation({
  args: {
    id: v.id("users"),
    role: userRoleValidator,
    departmentId: v.optional(v.id("departments")),
  },
  handler: async (ctx, args) => {
    const caller = await requireRole(ctx, ["super_admin"]);
    const target = await ctx.db.get(args.id);
    if (!target) throw new ConvexError("User not found");

    await ctx.db.patch(args.id, {
      role: args.role,
      departmentId: args.departmentId,
    });

    await ctx.db.insert("auditLog", {
      userId: caller._id,
      userName: caller.name ?? "Unknown",
      action: "user.updateRole",
      recordType: "users",
      recordId: args.id,
      timestamp: Date.now(),
      details: { role: args.role },
    });
  },
});

export const setActive = mutation({
  args: {
    id: v.id("users"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const caller = await requireRole(ctx, ["super_admin"]);

    if (caller._id === args.id && !args.isActive) {
      throw new ConvexError("You cannot deactivate your own account");
    }

    const target = await ctx.db.get(args.id);
    if (!target) throw new ConvexError("User not found");

    await ctx.db.patch(args.id, { isActive: args.isActive });

    await ctx.db.insert("auditLog", {
      userId: caller._id,
      userName: caller.name ?? "Unknown",
      action: args.isActive ? "user.activate" : "user.deactivate",
      recordType: "users",
      recordId: args.id,
      timestamp: Date.now(),
    });
  },
});

export const logAudit = internalMutation({
  args: {
    userId: v.id("users"),
    userName: v.string(),
    action: v.string(),
    recordId: v.optional(v.string()),
    details: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("auditLog", {
      userId: args.userId,
      userName: args.userName,
      action: args.action,
      recordType: "users",
      recordId: args.recordId,
      timestamp: Date.now(),
      details: args.details,
    });
  },
});
