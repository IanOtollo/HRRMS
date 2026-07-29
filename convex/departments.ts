import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireRole } from "./lib/rbac";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, [
      "super_admin",
      "hr_director",
      "records_officer",
      "department_viewer",
    ]);
    return await ctx.db.query("departments").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["super_admin", "hr_director"]);

    const id = await ctx.db.insert("departments", {
      name: args.name,
      code: args.code,
    });

    await ctx.db.insert("auditLog", {
      userId: user._id,
      userName: user.name ?? "Unknown",
      action: "department.create",
      recordType: "departments",
      recordId: id,
      timestamp: Date.now(),
      details: { name: args.name, code: args.code },
    });

    return id;
  },
});
