import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { requireRole } from "./lib/rbac";

export const list = query({
  handler: async (ctx) => {
    const user = await requireRole(ctx, [
      "super_admin",
      "hr_director",
      "records_officer",
      "department_viewer",
    ]);

    const records = await ctx.db.query("exitRecords").collect();

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

const exitTypeValidator = v.union(
  v.literal("retirement"),
  v.literal("resignation"),
  v.literal("termination")
);

const stageValidator = v.union(
  v.literal("notice_filed"),
  v.literal("clearance"),
  v.literal("exit_interview"),
  v.literal("finalized")
);

export const initiateExit = mutation({
  args: {
    employeeId: v.id("employees"),
    exitType: exitTypeValidator,
    noticeDate: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["super_admin", "hr_director", "records_officer"]);

    const employee = await ctx.db.get(args.employeeId);
    if (!employee) throw new ConvexError("Employee not found");

    const id = await ctx.db.insert("exitRecords", {
      employeeId: args.employeeId,
      exitType: args.exitType,
      stage: "notice_filed",
      noticeDate: args.noticeDate,
      documentIds: [],
    });

    await ctx.db.insert("auditLog", {
      userId: user._id,
      userName: user.name ?? "Unknown",
      action: "exit.initiate",
      recordType: "exitRecords",
      recordId: id,
      timestamp: Date.now(),
      details: { exitType: args.exitType },
    });

    return id;
  },
});

export const updateNotes = mutation({
  args: {
    id: v.id("exitRecords"),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["super_admin", "hr_director", "records_officer"]);

    const record = await ctx.db.get(args.id);
    if (!record) throw new ConvexError("Exit record not found");

    await ctx.db.patch(args.id, { notes: args.notes });

    await ctx.db.insert("auditLog", {
      userId: user._id,
      userName: user.name ?? "Unknown",
      action: "exit.updateNotes",
      recordType: "exitRecords",
      recordId: args.id,
      timestamp: Date.now(),
    });
  },
});

export const advanceStage = mutation({
  args: {
    id: v.id("exitRecords"),
    stage: stageValidator,
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["super_admin", "hr_director", "records_officer"]);

    const record = await ctx.db.get(args.id);
    if (!record) throw new ConvexError("Exit record not found");

    const isFinalizing = args.stage === "finalized";

    await ctx.db.patch(args.id, {
      stage: args.stage,
      finalizedDate: isFinalizing
        ? new Date().toISOString().slice(0, 10)
        : record.finalizedDate,
    });

    if (isFinalizing) {
      const newStatus = record.exitType === "retirement" ? "retired" : "terminated";
      await ctx.db.patch(record.employeeId, {
        employmentStatus: newStatus,
        updatedAt: Date.now(),
      });
    }

    await ctx.db.insert("auditLog", {
      userId: user._id,
      userName: user.name ?? "Unknown",
      action: "exit.advanceStage",
      recordType: "exitRecords",
      recordId: args.id,
      timestamp: Date.now(),
      details: { stage: args.stage },
    });
  },
});
