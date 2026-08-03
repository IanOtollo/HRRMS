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

    const records = await ctx.db.query("trainingRecords").collect();

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

export const logTraining = mutation({
  args: {
    employeeId: v.id("employees"),
    trainingTitle: v.string(),
    institution: v.optional(v.string()),
    nominationDate: v.string(),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["super_admin", "hr_director", "records_officer"]);

    const employee = await ctx.db.get(args.employeeId);
    if (!employee) throw new ConvexError("Employee not found");

    const id = await ctx.db.insert("trainingRecords", {
      employeeId: args.employeeId,
      trainingTitle: args.trainingTitle,
      institution: args.institution,
      nominationDate: args.nominationDate,
      startDate: args.startDate,
      endDate: args.endDate,
      attendanceConfirmed: false,
      documentIds: [],
    });

    await ctx.db.insert("auditLog", {
      userId: user._id,
      userName: user.name ?? "Unknown",
      action: "training.log",
      recordType: "trainingRecords",
      recordId: id,
      timestamp: Date.now(),
      details: { trainingTitle: args.trainingTitle },
    });

    return id;
  },
});

export const confirmAttendance = mutation({
  args: { id: v.id("trainingRecords") },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["super_admin", "hr_director", "records_officer"]);

    const record = await ctx.db.get(args.id);
    if (!record) throw new ConvexError("Training record not found");

    await ctx.db.patch(args.id, { attendanceConfirmed: true });

    await ctx.db.insert("auditLog", {
      userId: user._id,
      userName: user.name ?? "Unknown",
      action: "training.confirmAttendance",
      recordType: "trainingRecords",
      recordId: args.id,
      timestamp: Date.now(),
    });
  },
});

export const discardTraining = mutation({
  args: {
    id: v.id("trainingRecords"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["super_admin", "hr_director", "records_officer"]);

    const record = await ctx.db.get(args.id);
    if (!record) throw new ConvexError("Training record not found");
    if (record.attendanceConfirmed) throw new ConvexError("Cannot discard a training that already has confirmed attendance");

    await ctx.db.patch(args.id, { status: "discarded", discardReason: args.reason });

    await ctx.db.insert("auditLog", {
      userId: user._id,
      userName: user.name ?? "Unknown",
      action: "training.discard",
      recordType: "trainingRecords",
      recordId: args.id,
      timestamp: Date.now(),
      details: { reason: args.reason },
    });
  },
});

export const deferTraining = mutation({
  args: {
    id: v.id("trainingRecords"),
    newStartDate: v.string(),
    newEndDate: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["super_admin", "hr_director", "records_officer"]);

    const record = await ctx.db.get(args.id);
    if (!record) throw new ConvexError("Training record not found");
    if (record.attendanceConfirmed) throw new ConvexError("Cannot defer a training that already has confirmed attendance");

    const today = new Date().toISOString().slice(0, 10);
    if (args.newStartDate < today) throw new ConvexError("New start date cannot be in the past");
    if (args.newEndDate < args.newStartDate) throw new ConvexError("New end date cannot be before the new start date");

    const previousDates = { startDate: record.startDate, endDate: record.endDate };

    await ctx.db.patch(args.id, {
      startDate: args.newStartDate,
      endDate: args.newEndDate,
      status: "deferred",
    });

    await ctx.db.insert("auditLog", {
      userId: user._id,
      userName: user.name ?? "Unknown",
      action: "training.defer",
      recordType: "trainingRecords",
      recordId: args.id,
      timestamp: Date.now(),
      details: { previousDates, newStartDate: args.newStartDate, newEndDate: args.newEndDate },
    });
  },
});

export const updateNotes = mutation({
  args: {
    id: v.id("trainingRecords"),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["super_admin", "hr_director", "records_officer"]);

    const record = await ctx.db.get(args.id);
    if (!record) throw new ConvexError("Training record not found");

    await ctx.db.patch(args.id, { notes: args.notes });

    await ctx.db.insert("auditLog", {
      userId: user._id,
      userName: user.name ?? "Unknown",
      action: "training.updateNotes",
      recordType: "trainingRecords",
      recordId: args.id,
      timestamp: Date.now(),
    });
  },
});
