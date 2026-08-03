import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
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

    let records = await ctx.db.query("appraisals").collect();

    if (args.cycleLabel) {
      records = records.filter((r) => r.cycleLabel === args.cycleLabel);
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

export const get = query({
  args: { id: v.id("appraisals") },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, [
      "super_admin",
      "hr_director",
      "records_officer",
      "department_viewer",
    ]);

    const appraisal = await ctx.db.get(args.id);
    if (!appraisal) return null;

    const employee = await ctx.db.get(appraisal.employeeId);
    if (user.role === "department_viewer" && employee?.departmentId !== user.departmentId) {
      throw new ConvexError("Access denied: Department scope mismatch");
    }

    return { ...appraisal, employee };
  },
});

export const initiateCycle = mutation({
  args: {
    cycleLabel: v.string(),
    departmentId: v.optional(v.id("departments")),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["super_admin", "hr_director"]);

    let employees;
    if (args.departmentId) {
      employees = await ctx.db
        .query("employees")
        .withIndex("by_department", (q) => q.eq("departmentId", args.departmentId!))
        .collect();
    } else {
      employees = await ctx.db.query("employees").collect();
    }

    let created = 0;
    for (const emp of employees) {
      const existing = await ctx.db
        .query("appraisals")
        .withIndex("by_employee", (q) => q.eq("employeeId", emp._id))
        .filter((q) => q.eq(q.field("cycleLabel"), args.cycleLabel))
        .first();

      if (!existing) {
        await ctx.db.insert("appraisals", {
          employeeId: emp._id,
          cycleLabel: args.cycleLabel,
          status: "pending",
          submittedAt: Date.now(),
        });
        created++;
      }
    }

    await ctx.db.insert("auditLog", {
      userId: user._id,
      userName: user.name ?? "Unknown",
      action: "appraisal.initiateCycle",
      recordType: "appraisals",
      timestamp: Date.now(),
      details: { cycleLabel: args.cycleLabel, created },
    });

    return { created };
  },
});

// Moves a cycle-generated appraisal from "pending" (not yet started) to
// "submitted" (turned in for review, awaiting a score).
export const markSubmitted = mutation({
  args: { id: v.id("appraisals") },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["super_admin", "hr_director", "records_officer"]);

    const appraisal = await ctx.db.get(args.id);
    if (!appraisal) throw new ConvexError("Appraisal not found");
    if (appraisal.status !== "pending") {
      throw new ConvexError("Only a pending appraisal can be submitted for review");
    }

    await ctx.db.patch(args.id, { status: "submitted", submittedAt: Date.now() });

    await ctx.db.insert("auditLog", {
      userId: user._id,
      userName: user.name ?? "Unknown",
      action: "appraisal.markSubmitted",
      recordType: "appraisals",
      recordId: args.id,
      timestamp: Date.now(),
    });
  },
});

// Save reviewer comments without necessarily finalizing the score/status.
export const saveComments = mutation({
  args: {
    id: v.id("appraisals"),
    comments: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["super_admin", "hr_director", "records_officer"]);

    const appraisal = await ctx.db.get(args.id);
    if (!appraisal) throw new ConvexError("Appraisal not found");

    await ctx.db.patch(args.id, { comments: args.comments });

    await ctx.db.insert("auditLog", {
      userId: user._id,
      userName: user.name ?? "Unknown",
      action: "appraisal.saveComments",
      recordType: "appraisals",
      recordId: args.id,
      timestamp: Date.now(),
    });
  },
});

// CG/SPA Form 3 — Agreed Performance Targets & Achievements, plus any
// additional assignments taken on outside the agreed targets.
export const saveTargets = mutation({
  args: {
    id: v.id("appraisals"),
    targets: v.array(v.object({
      target: v.string(),
      achievement: v.string(),
    })),
    additionalAssignments: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["super_admin", "hr_director", "records_officer"]);

    const appraisal = await ctx.db.get(args.id);
    if (!appraisal) throw new ConvexError("Appraisal not found");

    await ctx.db.patch(args.id, {
      targets: args.targets,
      additionalAssignments: args.additionalAssignments,
    });

    await ctx.db.insert("auditLog", {
      userId: user._id,
      userName: user.name ?? "Unknown",
      action: "appraisal.saveTargets",
      recordType: "appraisals",
      recordId: args.id,
      timestamp: Date.now(),
    });
  },
});

// CG/SPA Form 5 — Individual Work Plan for the reporting period.
export const saveWorkPlan = mutation({
  args: {
    id: v.id("appraisals"),
    workPlanPeriod: v.string(),
    workPlan: v.array(v.object({
      directorateObjective: v.string(),
      individualTargets: v.string(),
      keyActivities: v.string(),
      resourcesRequired: v.string(),
      performanceIndicators: v.string(),
      timeFrame: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["super_admin", "hr_director", "records_officer"]);

    const appraisal = await ctx.db.get(args.id);
    if (!appraisal) throw new ConvexError("Appraisal not found");

    await ctx.db.patch(args.id, {
      workPlanPeriod: args.workPlanPeriod,
      workPlan: args.workPlan,
    });

    await ctx.db.insert("auditLog", {
      userId: user._id,
      userName: user.name ?? "Unknown",
      action: "appraisal.saveWorkPlan",
      recordType: "appraisals",
      recordId: args.id,
      timestamp: Date.now(),
    });
  },
});

// CG/SPA Form 4 line item — the MPMC/CIPMC recommendation for this officer.
export const saveRecommendation = mutation({
  args: {
    id: v.id("appraisals"),
    mpmcRecommendation: v.string(),
    mpmcRemarks: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["super_admin", "hr_director"]);

    const appraisal = await ctx.db.get(args.id);
    if (!appraisal) throw new ConvexError("Appraisal not found");

    await ctx.db.patch(args.id, {
      mpmcRecommendation: args.mpmcRecommendation,
      mpmcRemarks: args.mpmcRemarks,
    });

    await ctx.db.insert("auditLog", {
      userId: user._id,
      userName: user.name ?? "Unknown",
      action: "appraisal.saveRecommendation",
      recordType: "appraisals",
      recordId: args.id,
      timestamp: Date.now(),
    });
  },
});

export const submitScore = mutation({
  args: {
    id: v.id("appraisals"),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["super_admin", "hr_director", "records_officer"]);

    const appraisal = await ctx.db.get(args.id);
    if (!appraisal) throw new ConvexError("Appraisal not found");

    await ctx.db.patch(args.id, {
      score: args.score,
      status: "completed",
      submittedAt: Date.now(),
    });

    await ctx.db.insert("auditLog", {
      userId: user._id,
      userName: user.name ?? "Unknown",
      action: "appraisal.submitScore",
      recordType: "appraisals",
      recordId: args.id,
      timestamp: Date.now(),
      details: { score: args.score },
    });
  },
});
