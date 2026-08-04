import { action, internalMutation, mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { createAccount, modifyAccountCredentials } from "@convex-dev/auth/server";
import { requireRole } from "./lib/rbac";
import { userRoleValidator } from "./schema";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { audited, toErrorMessage } from "./lib/audit";
import { FunctionReturnType } from "convex/server";

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
    // Actions don't have direct ctx.db access, so identity + audit writes go
    // through internal.users.logAudit rather than the audited() ctx.db helper.
    let caller: FunctionReturnType<typeof api.users.me> = null;
    try {
      caller = await ctx.runQuery(api.users.me, {});
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
        status: "success",
      });

      return user._id;
    } catch (err) {
      await ctx.runMutation(internal.users.logAudit, {
        userId: caller?._id,
        userName: caller?.name ?? "Unauthenticated",
        action: "user.create",
        status: "error",
        errorMessage: toErrorMessage(err),
      });
      throw err;
    }
  },
});

export const changePassword = action({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    let caller: FunctionReturnType<typeof api.users.me> = null;
    try {
      caller = await ctx.runQuery(api.users.me, {});
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
        status: "success",
      });
    } catch (err) {
      await ctx.runMutation(internal.users.logAudit, {
        userId: caller?._id,
        userName: caller?.name ?? "Unauthenticated",
        action: "user.changePassword",
        status: "error",
        errorMessage: toErrorMessage(err),
      });
      throw err;
    }
  },
});

export const updateRole = mutation({
  args: {
    id: v.id("users"),
    role: userRoleValidator,
    departmentId: v.optional(v.id("departments")),
  },
  handler: async (ctx, args) => {
    return audited(ctx, { action: "user.updateRole", recordType: "users", recordId: args.id }, async () => {
      await requireRole(ctx, ["super_admin"]);
      const target = await ctx.db.get(args.id);
      if (!target) throw new ConvexError("User not found");

      await ctx.db.patch(args.id, {
        role: args.role,
        departmentId: args.departmentId,
      });

      return { result: null, details: { fromRole: target.role, toRole: args.role } };
    });
  },
});

export const setActive = mutation({
  args: {
    id: v.id("users"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    return audited(
      ctx,
      { action: args.isActive ? "user.activate" : "user.deactivate", recordType: "users", recordId: args.id },
      async () => {
        const caller = await requireRole(ctx, ["super_admin"]);

        if (caller._id === args.id && !args.isActive) {
          throw new ConvexError("You cannot deactivate your own account");
        }

        const target = await ctx.db.get(args.id);
        if (!target) throw new ConvexError("User not found");

        await ctx.db.patch(args.id, { isActive: args.isActive });

        return { result: null, details: { fromActive: target.isActive ?? true, toActive: args.isActive } };
      }
    );
  },
});

// Called by the client right after a successful sign-in — records the
// login in the audit log and stamps lastLoginAt.
export const recordLoginSuccess = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    const user = await ctx.db.get(userId);
    if (!user) return;

    await ctx.db.patch(userId, { lastLoginAt: Date.now() });

    await ctx.db.insert("auditLog", {
      userId,
      userName: user.name ?? user.email ?? "Unknown",
      action: "user.login",
      recordType: "users",
      recordId: userId,
      timestamp: Date.now(),
      status: "success",
    });
  },
});

// Called by the client when sign-in throws — there is no authenticated
// identity at this point, so this must not require auth. Resolves the
// attempted email against the users table when possible so the log still
// names who was targeted, without ever revealing whether the account exists
// back to the caller.
export const recordLoginFailure = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.trim();
    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();

    await ctx.db.insert("auditLog", {
      userId: existing?._id,
      userName: existing?.name ?? email,
      action: "user.loginFailed",
      recordType: "users",
      recordId: existing?._id,
      timestamp: Date.now(),
      details: { email },
      status: "error",
      errorMessage: "Invalid credentials",
    });
  },
});

// Called by the client right before signOut() clears the session, while the
// identity is still resolvable.
export const recordLogout = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    const user = await ctx.db.get(userId);
    if (!user) return;

    await ctx.db.insert("auditLog", {
      userId,
      userName: user.name ?? user.email ?? "Unknown",
      action: "user.logout",
      recordType: "users",
      recordId: userId,
      timestamp: Date.now(),
      status: "success",
    });
  },
});

export const logAudit = internalMutation({
  args: {
    // Optional so a failure before identity is resolved (e.g. not signed in)
    // can still be logged, same as the rest of the auditLog table.
    userId: v.optional(v.id("users")),
    userName: v.string(),
    action: v.string(),
    recordId: v.optional(v.string()),
    details: v.optional(v.any()),
    status: v.optional(v.union(v.literal("success"), v.literal("error"))),
    errorMessage: v.optional(v.string()),
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
      status: args.status ?? "success",
      errorMessage: args.errorMessage,
    });
  },
});
