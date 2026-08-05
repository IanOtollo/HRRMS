import { query } from "./_generated/server";
import { requireRole } from "./lib/rbac";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const list = query({
  args: {
    status: v.optional(v.union(v.literal("success"), v.literal("error"))),
    action: v.optional(v.string()),
    recordType: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    search: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // Only super admin and HR director can view audit logs
    await requireRole(ctx, ["super_admin", "hr_director", "ict_support"]);

    const result = await ctx.db
      .query("auditLog")
      .withIndex("by_timestamp")
      .order("desc")
      .filter((q) => {
        const clauses = [];
        if (args.status) {
          // Legacy rows have no status field — treat a missing status as "success".
          clauses.push(
            args.status === "success"
              ? q.or(q.eq(q.field("status"), "success"), q.eq(q.field("status"), undefined))
              : q.eq(q.field("status"), "error")
          );
        }
        if (args.action) clauses.push(q.eq(q.field("action"), args.action));
        if (args.recordType) clauses.push(q.eq(q.field("recordType"), args.recordType));
        if (args.userId) clauses.push(q.eq(q.field("userId"), args.userId));
        if (args.startDate !== undefined) clauses.push(q.gte(q.field("timestamp"), args.startDate));
        if (args.endDate !== undefined) clauses.push(q.lte(q.field("timestamp"), args.endDate));
        return clauses.length ? q.and(...clauses) : true;
      })
      .paginate(args.paginationOpts);

    if (!args.search) return result;

    // Filtered after pagination, so a page can come back smaller than
    // requested (or empty pre-isDone) when the search text is rare — the
    // client's "load more" simply fetches the next page as usual.
    const needle = args.search.toLowerCase();
    return {
      ...result,
      page: result.page.filter(
        (r) =>
          r.userName.toLowerCase().includes(needle) ||
          r.action.toLowerCase().includes(needle) ||
          r.recordType.toLowerCase().includes(needle) ||
          (r.errorMessage ?? "").toLowerCase().includes(needle)
      ),
    };
  },
});

// Bounded to the last 30 days so this stays a cheap, indexed scan even as
// the table grows — not a substitute for the paginated list above.
export const stats = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["super_admin", "hr_director", "ict_support"]);

    const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const startOfToday = new Date().setHours(0, 0, 0, 0);

    const recent = await ctx.db
      .query("auditLog")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", since))
      .collect();

    const errors30d = recent.filter((r) => r.status === "error").length;
    const today = recent.filter((r) => r.timestamp >= startOfToday).length;
    const uniqueUsers30d = new Set(recent.map((r) => r.userName)).size;

    return {
      total30d: recent.length,
      errors30d,
      today,
      uniqueUsers30d,
    };
  },
});
