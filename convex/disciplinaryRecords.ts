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

// Waterfall order — a case can only move forward through this list, never
// back (e.g. once interdicted, it cannot return to "warning" territory).
const STAGE_ORDER = [
  "preliminary_inquiry",
  "investigation",
  "show_cause",
  "interdiction_suspension",
  "board_determination",
  "closed",
];

const stageValidator = v.union(
  v.literal("preliminary_inquiry"),
  v.literal("investigation"),
  v.literal("show_cause"),
  v.literal("interdiction_suspension"),
  v.literal("board_determination"),
  v.literal("closed")
);

const interdictionTypeValidator = v.union(v.literal("interdiction"), v.literal("suspension"));

const outcomeValidator = v.union(
  v.literal("no_further_action"),
  v.literal("reprimand"),
  v.literal("salary_stoppage"),
  v.literal("dismissal"),
  v.literal("retirement_public_interest")
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

    // A second disciplinary case, regardless of outcome, permanently marks
    // the employee as blacklisted — this never gets cleared automatically.
    const priorCases = await ctx.db
      .query("disciplinaryRecords")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
      .collect();
    if (priorCases.length >= 2 && !employee.isBlacklisted) {
      await ctx.db.patch(args.employeeId, { isBlacklisted: true, updatedAt: Date.now() });
    }

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
    interdictionType: v.optional(interdictionTypeValidator),
    outcome: v.optional(outcomeValidator),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["super_admin", "hr_director", "records_officer"]);

    const record = await ctx.db.get(args.id);
    if (!record) throw new ConvexError("Disciplinary record not found");

    const currentIndex = STAGE_ORDER.indexOf(record.stage);
    const nextIndex = STAGE_ORDER.indexOf(args.stage);
    if (nextIndex < currentIndex) {
      throw new ConvexError("Disciplinary cases can only move forward — this stage cannot be reversed");
    }

    if (args.stage === "interdiction_suspension" && !args.interdictionType) {
      throw new ConvexError("Specify whether this is an Interdiction or a Suspension");
    }

    await ctx.db.patch(args.id, {
      stage: args.stage,
      interdictionType: args.interdictionType ?? record.interdictionType,
      outcome: args.outcome ?? record.outcome,
      closedAt: args.stage === "closed" ? Date.now() : record.closedAt,
    });

    await ctx.db.insert("auditLog", {
      userId: user._id,
      userName: user.name ?? "Unknown",
      action: "disciplinary.advanceStage",
      recordType: "disciplinaryRecords",
      recordId: args.id,
      timestamp: Date.now(),
      details: { stage: args.stage, interdictionType: args.interdictionType, outcome: args.outcome },
    });
  },
});
