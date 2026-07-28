import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireRole } from "./lib/rbac";

export const list = query({
  args: { employeeId: v.optional(v.id("employees")) },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, [
      "super_admin",
      "hr_director",
      "records_officer",
      "department_viewer",
    ]);

    let records;
    if (args.employeeId) {
      records = await ctx.db
        .query("leaveRecords")
        .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId!))
        .collect();
    } else {
      records = await ctx.db.query("leaveRecords").collect();
    }

    if (user.role === "department_viewer") {
      const filtered = [];
      for (const rec of records) {
        const emp = await ctx.db.get(rec.employeeId);
        if (emp && emp.departmentId === user.departmentId) {
          filtered.push(rec);
        }
      }
      return filtered;
    }

    return records;
  },
});
