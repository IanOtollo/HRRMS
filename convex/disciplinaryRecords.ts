import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { requireRole } from "./lib/rbac";

export const list = query({
  handler: async (ctx) => {
    // Department viewer has NO access to disciplinary records
    const user = await requireRole(ctx, [
      "super_admin",
      "hr_director",
      "records_officer",
    ]);

    const records = await ctx.db.query("disciplinaryRecords").collect();

    // Records officer cannot see restricted notes
    if (user.role === "records_officer") {
      return records.map((r) => {
        const { restrictedNotes, ...rest } = r;
        return rest;
      });
    }

    return records;
  },
});

const stageValidator = v.union(
  v.literal("warning"),
  v.literal("show_cause"),
  v.literal("interdiction"),
  v.literal("committee_decision"),
  v.literal("closed")
);

export const openCase = mutation({
  args: {
    employeeId: v.id("employees"),
    stage: stageValidator,
    restrictedNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["super_admin", "hr_director", "records_officer"]);

    const employee = await ctx.db.get(args.employeeId);
    if (!employee) throw new ConvexError("Employee not found");

    if (args.restrictedNotes && user.role === "records_officer") {
      throw new ConvexError("Records Officer cannot record confidential notes");
    }

    const caseReference = `DISC-${new Date().getFullYear()}-${Math.floor(Date.now() / 1000).toString().slice(-6)}`;

    const id = await ctx.db.insert("disciplinaryRecords", {
      employeeId: args.employeeId,
      caseReference,
      stage: args.stage,
      openedAt: Date.now(),
      documentIds: [],
      restrictedNotes: args.restrictedNotes,
    });

    await ctx.db.insert("auditLog", {
      userId: user._id,
      userName: user.name ?? "Unknown",
      action: "disciplinary.openCase",
      recordType: "disciplinaryRecords",
      recordId: id,
      timestamp: Date.now(),
      details: { caseReference, stage: args.stage },
    });

    return id;
  },
});

export const updateNotes = mutation({
  args: {
    id: v.id("disciplinaryRecords"),
    restrictedNotes: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["super_admin", "hr_director"]);

    const record = await ctx.db.get(args.id);
    if (!record) throw new ConvexError("Disciplinary record not found");

    await ctx.db.patch(args.id, { restrictedNotes: args.restrictedNotes });

    await ctx.db.insert("auditLog", {
      userId: user._id,
      userName: user.name ?? "Unknown",
      action: "disciplinary.updateNotes",
      recordType: "disciplinaryRecords",
      recordId: args.id,
      timestamp: Date.now(),
    });
  },
});

export const advanceStage = mutation({
  args: {
    id: v.id("disciplinaryRecords"),
    stage: stageValidator,
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["super_admin", "hr_director", "records_officer"]);

    const record = await ctx.db.get(args.id);
    if (!record) throw new ConvexError("Disciplinary record not found");

    await ctx.db.patch(args.id, {
      stage: args.stage,
      closedAt: args.stage === "closed" ? Date.now() : record.closedAt,
    });

    await ctx.db.insert("auditLog", {
      userId: user._id,
      userName: user.name ?? "Unknown",
      action: "disciplinary.advanceStage",
      recordType: "disciplinaryRecords",
      recordId: args.id,
      timestamp: Date.now(),
      details: { stage: args.stage },
    });
  },
});
