import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireRole } from "./lib/rbac";
import { audited } from "./lib/audit";

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
    return audited(ctx, { action: "department.create", recordType: "departments" }, async () => {
      await requireRole(ctx, ["super_admin", "hr_director"]);

      const id = await ctx.db.insert("departments", {
        name: args.name,
        code: args.code,
      });

      return { result: id, recordId: id, details: { name: args.name, code: args.code } };
    });
  },
});
