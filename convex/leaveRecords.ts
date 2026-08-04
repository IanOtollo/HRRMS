import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { requireRole } from "./lib/rbac";
import { audited } from "./lib/audit";

const DEFAULT_ANNUAL_BALANCE = 30;
const DEFAULT_SICK_BALANCE = 14;

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

export const getBalance = query({
  args: { employeeId: v.id("employees"), year: v.number() },
  handler: async (ctx, args) => {
    await requireRole(ctx, [
      "super_admin",
      "hr_director",
      "records_officer",
      "department_viewer",
    ]);

    const balance = await ctx.db
      .query("leaveBalances")
      .withIndex("by_employee_year", (q) =>
        q.eq("employeeId", args.employeeId).eq("year", args.year)
      )
      .unique();

    return (
      balance ?? {
        employeeId: args.employeeId,
        year: args.year,
        annualBalance: DEFAULT_ANNUAL_BALANCE,
        sickBalance: DEFAULT_SICK_BALANCE,
        daysTakenYtd: 0,
      }
    );
  },
});

function daysBetween(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
}

export const apply = mutation({
  args: {
    employeeId: v.id("employees"),
    leaveType: v.string(),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    return audited(ctx, { action: "leave.apply", recordType: "leaveRecords" }, async () => {
      await requireRole(ctx, ["super_admin", "hr_director", "records_officer"]);

      const employee = await ctx.db.get(args.employeeId);
      if (!employee) throw new ConvexError("Employee not found");

      const daysCount = daysBetween(args.startDate, args.endDate);

      const id = await ctx.db.insert("leaveRecords", {
        employeeId: args.employeeId,
        leaveType: args.leaveType,
        startDate: args.startDate,
        endDate: args.endDate,
        daysCount,
        status: "pending",
        documentIds: [],
      });

      return { result: id, recordId: id, details: { employeeId: args.employeeId, leaveType: args.leaveType, daysCount } };
    });
  },
});

export const approve = mutation({
  args: { id: v.id("leaveRecords") },
  handler: async (ctx, args) => {
    return audited(ctx, { action: "leave.approve", recordType: "leaveRecords", recordId: args.id }, async () => {
      const user = await requireRole(ctx, ["super_admin", "hr_director"]);

      const record = await ctx.db.get(args.id);
      if (!record) throw new ConvexError("Leave record not found");
      if (record.status !== "pending") {
        throw new ConvexError("Only pending leave applications can be approved");
      }

      await ctx.db.patch(args.id, { status: "approved", approvedBy: user._id });

      const year = new Date(record.startDate).getFullYear();
      const existing = await ctx.db
        .query("leaveBalances")
        .withIndex("by_employee_year", (q) =>
          q.eq("employeeId", record.employeeId).eq("year", year)
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          daysTakenYtd: existing.daysTakenYtd + record.daysCount,
        });
      } else {
        await ctx.db.insert("leaveBalances", {
          employeeId: record.employeeId,
          year,
          annualBalance: DEFAULT_ANNUAL_BALANCE,
          sickBalance: DEFAULT_SICK_BALANCE,
          daysTakenYtd: record.daysCount,
        });
      }

      return { result: null };
    });
  },
});

export const reject = mutation({
  args: { id: v.id("leaveRecords") },
  handler: async (ctx, args) => {
    return audited(ctx, { action: "leave.reject", recordType: "leaveRecords", recordId: args.id }, async () => {
      const user = await requireRole(ctx, ["super_admin", "hr_director"]);

      const record = await ctx.db.get(args.id);
      if (!record) throw new ConvexError("Leave record not found");
      if (record.status !== "pending") {
        throw new ConvexError("Only pending leave applications can be rejected");
      }

      await ctx.db.patch(args.id, { status: "rejected", approvedBy: user._id });

      return { result: null };
    });
  },
});
