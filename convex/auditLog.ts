import { query } from "./_generated/server";
import { requireRole } from "./lib/rbac";
import { v } from "convex/values";

export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Only super admin and HR director can view audit logs
    const user = await requireRole(ctx, ["super_admin", "hr_director"]);

    const q = ctx.db.query("auditLog").order("desc");
    const records = await q.take(args.limit || 100);

    return records;
  },
});
