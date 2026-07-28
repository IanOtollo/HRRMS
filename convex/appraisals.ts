import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireRole } from "./lib/rbac";

export const listByCycle = query({
  args: { cycleLabel: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, [
      "super_admin",
      "hr_director",
      "records_officer",
      "department_viewer",
    ]);

    let q = ctx.db.query("appraisals");
    const records = await q.collect();

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
