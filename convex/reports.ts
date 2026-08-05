import { query } from "./_generated/server";
import { requireRole } from "./lib/rbac";

// Mirrors documents.ts's SINGLE_UPLOAD_CATEGORIES — the core identity/
// compliance documents every active employee should have on file. Kept as
// its own local list (rather than imported) since convex/ functions don't
// share a module boundary with the src/lib frontend helpers.
const CORE_COMPLIANCE_CATEGORIES = [
  { key: "02_Birth_Certificate", label: "Birth Certificate" },
  { key: "05_National_ID", label: "National ID" },
  { key: "07_KRA_PIN", label: "KRA PIN" },
  { key: "06_Confirmation_PandP", label: "Confirmation Letter" },
];

function ageAt(dobStr: string, asOfMs: number): number {
  const dob = new Date(dobStr);
  const asOf = new Date(asOfMs);
  let age = asOf.getFullYear() - dob.getFullYear();
  const monthDiff = asOf.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < dob.getDate())) age--;
  return age;
}

function yearsBetween(startStr: string, endMs: number): number {
  return (endMs - new Date(startStr).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
}

function bucketCounts<T>(items: T[], bucketOf: (item: T) => string, order: string[]): { name: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const b = bucketOf(item);
    counts.set(b, (counts.get(b) ?? 0) + 1);
  }
  return order.map((name) => ({ name, value: counts.get(name) ?? 0 })).filter((b) => b.value > 0);
}

export const dashboardStats = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["super_admin", "hr_director"]);

    const employees = await ctx.db.query("employees").collect();
    const departments = await ctx.db.query("departments").collect();
    const documents = await ctx.db.query("documents").collect();
    const leaveBalances = await ctx.db.query("leaveBalances").collect();
    const leaveRecords = await ctx.db.query("leaveRecords").collect();
    const appraisals = await ctx.db.query("appraisals").collect();
    const trainingRecords = await ctx.db.query("trainingRecords").collect();
    const disciplinaryRecords = await ctx.db.query("disciplinaryRecords").collect();
    const exitRecords = await ctx.db.query("exitRecords").collect();

    const departmentNameById = new Map(departments.map((d) => [d._id, d.name]));
    const now = Date.now();
    const activeEmployees = employees.filter(
      (e) => e.employmentStatus !== "retired" && e.employmentStatus !== "terminated"
    );

    // ---- Workforce composition ----
    const headcountByDepartment = departments.map((dept) => ({
      name: dept.name,
      count: employees.filter((e) => e.departmentId === dept._id).length,
    })).filter((d) => d.count > 0);

    const genderSplit = ["Male", "Female", "Other"].map((gender) => ({
      name: gender,
      value: employees.filter((e) => e.gender === gender).length,
    })).filter((g) => g.value > 0);

    const employmentStatusBreakdown = ["active", "on_leave", "suspended", "retired", "terminated"].map((status) => ({
      name: status.replace("_", " "),
      value: employees.filter((e) => e.employmentStatus === status).length,
    })).filter((s) => s.value > 0);

    const termsOfServiceBreakdown = bucketCounts(
      employees,
      (e) => e.termsOfService || "Unspecified",
      Array.from(new Set(employees.map((e) => e.termsOfService || "Unspecified")))
    );

    const jobGroupBreakdown = bucketCounts(
      employees.filter((e) => e.jobGroup),
      (e) => e.jobGroup!,
      Array.from(new Set(employees.filter((e) => e.jobGroup).map((e) => e.jobGroup!))).sort()
    );

    const AGE_BANDS = ["Under 30", "30-39", "40-49", "50-59", "60+"];
    const ageBands = bucketCounts(
      employees.filter((e) => e.dateOfBirth),
      (e) => {
        const age = ageAt(e.dateOfBirth!, now);
        if (age < 30) return "Under 30";
        if (age < 40) return "30-39";
        if (age < 50) return "40-49";
        if (age < 60) return "50-59";
        return "60+";
      },
      AGE_BANDS
    );

    const TENURE_BANDS = ["Under 2 yrs", "2-5 yrs", "5-10 yrs", "10-20 yrs", "20+ yrs"];
    const tenureBands = bucketCounts(
      employees,
      (e) => {
        const yrs = yearsBetween(e.firstAppointmentDate, now);
        if (yrs < 2) return "Under 2 yrs";
        if (yrs < 5) return "2-5 yrs";
        if (yrs < 10) return "5-10 yrs";
        if (yrs < 20) return "10-20 yrs";
        return "20+ yrs";
      },
      TENURE_BANDS
    );

    // ---- Retirement & succession planning ----
    // A single 60-day window is easy to misread as "broken" when it's simply
    // empty — the bucketed forecast gives the real shape of the pipeline
    // regardless of how any one narrow window happens to land.
    const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
    const upcomingRetirements = activeEmployees
      .filter((e) => {
        const diff = new Date(e.retirementDate).getTime() - now;
        return diff > 0 && diff <= sixtyDaysMs;
      })
      .sort((a, b) => new Date(a.retirementDate).getTime() - new Date(b.retirementDate).getTime())
      .map((e) => ({
        employeeId: e._id,
        name: e.fullName,
        pfNumber: e.pfNumber,
        department: departmentNameById.get(e.departmentId) ?? "—",
        retirementDate: e.retirementDate,
        daysLeft: Math.ceil((new Date(e.retirementDate).getTime() - now) / (24 * 60 * 60 * 1000)),
      }));

    const RETIREMENT_HORIZONS = ["0-90 days", "91-180 days", "181-365 days", "1-2 years", "2-5 years", "5+ years"];
    const retirementForecast = bucketCounts(
      activeEmployees.filter((e) => new Date(e.retirementDate).getTime() > now),
      (e) => {
        const days = (new Date(e.retirementDate).getTime() - now) / (24 * 60 * 60 * 1000);
        if (days <= 90) return "0-90 days";
        if (days <= 180) return "91-180 days";
        if (days <= 365) return "181-365 days";
        if (days <= 730) return "1-2 years";
        if (days <= 1825) return "2-5 years";
        return "5+ years";
      },
      RETIREMENT_HORIZONS
    );

    // ---- Compliance & documents ----
    const totalDocs = documents.length;
    const verifiedDocs = documents.filter((d) => d.status === "verified").length;
    const documentVerificationRate = totalDocs > 0 ? Math.round((verifiedDocs / totalDocs) * 100) : 0;

    const documentsByEmployee = new Map<string, Set<string>>();
    for (const doc of documents) {
      const key = doc.employeeId as unknown as string;
      const set = documentsByEmployee.get(key) ?? new Set<string>();
      set.add(doc.category);
      documentsByEmployee.set(key, set);
    }
    const coreDocumentCompliance = CORE_COMPLIANCE_CATEGORIES.map((cat) => {
      const onFile = activeEmployees.filter((e) =>
        documentsByEmployee.get(e._id as unknown as string)?.has(cat.key)
      ).length;
      return {
        name: cat.label,
        onFile,
        missing: activeEmployees.length - onFile,
        rate: activeEmployees.length > 0 ? Math.round((onFile / activeEmployees.length) * 100) : 0,
      };
    });

    // ---- Performance & development ----
    let latestCycleLabel: string | null = null;
    let latestCycleAt = -Infinity;
    for (const a of appraisals) {
      if (a.submittedAt > latestCycleAt) {
        latestCycleAt = a.submittedAt;
        latestCycleLabel = a.cycleLabel;
      }
    }
    const latestCycleAppraisals = latestCycleLabel ? appraisals.filter((a) => a.cycleLabel === latestCycleLabel) : [];
    const appraisalCycleBreakdown = bucketCounts(
      latestCycleAppraisals,
      (a) => a.status,
      ["pending", "submitted", "completed"]
    );
    const completedScores = latestCycleAppraisals.filter((a) => a.status === "completed" && a.score !== undefined);
    const averageAppraisalScore = completedScores.length > 0
      ? Math.round((completedScores.reduce((sum, a) => sum + (a.score ?? 0), 0) / completedScores.length) * 10) / 10
      : null;

    const currentYear = new Date().getFullYear();
    const trainingThisYear = trainingRecords.filter((t) => new Date(t.startDate).getFullYear() === currentYear);
    const trainingAttendanceRate = trainingThisYear.length > 0
      ? Math.round((trainingThisYear.filter((t) => t.attendanceConfirmed).length / trainingThisYear.length) * 100)
      : 0;

    // ---- Leave & attendance ----
    const thisYearBalances = leaveBalances.filter((b) => b.year === currentYear);
    const totalLeaveDaysAllocated = thisYearBalances.reduce((sum, b) => sum + b.annualBalance, 0);
    const totalLeaveDaysTaken = thisYearBalances.reduce((sum, b) => sum + b.daysTakenYtd, 0);
    const leaveUtilizationRate = totalLeaveDaysAllocated > 0
      ? Math.round((totalLeaveDaysTaken / totalLeaveDaysAllocated) * 100)
      : 0;

    const approvedLeaveThisYear = leaveRecords.filter(
      (l) => l.status === "approved" && new Date(l.startDate).getFullYear() === currentYear
    );
    const leaveByType = bucketCounts(
      approvedLeaveThisYear,
      (l) => l.leaveType,
      Array.from(new Set(approvedLeaveThisYear.map((l) => l.leaveType)))
    );

    // ---- Discipline & exit pipeline ----
    const DISCIPLINARY_STAGES = ["preliminary_inquiry", "investigation", "show_cause", "interdiction_suspension", "board_determination"];
    const openDisciplinaryByStage = bucketCounts(
      disciplinaryRecords.filter((d) => d.stage !== "closed"),
      (d) => d.stage.replace(/_/g, " "),
      DISCIPLINARY_STAGES.map((s) => s.replace(/_/g, " "))
    );

    const EXIT_STAGES = ["notice_filed", "clearance", "exit_interview"];
    const openExitsByStage = bucketCounts(
      exitRecords.filter((e) => e.stage !== "finalized"),
      (e) => e.stage.replace(/_/g, " "),
      EXIT_STAGES.map((s) => s.replace(/_/g, " "))
    );

    return {
      totalEmployees: employees.length,
      activeEmployees: activeEmployees.length,

      headcountByDepartment,
      genderSplit,
      employmentStatusBreakdown,
      termsOfServiceBreakdown,
      jobGroupBreakdown,
      ageBands,
      tenureBands,

      upcomingRetirements,
      retirementForecast,

      documentVerificationRate,
      totalDocs,
      verifiedDocs,
      coreDocumentCompliance,

      latestCycleLabel,
      appraisalCycleBreakdown,
      averageAppraisalScore,
      trainingSessionsThisYear: trainingThisYear.length,
      trainingAttendanceRate,

      leaveUtilizationRate,
      totalLeaveDaysAllocated,
      totalLeaveDaysTaken,
      leaveByType,

      openDisciplinaryCases: disciplinaryRecords.filter((d) => d.stage !== "closed").length,
      openDisciplinaryByStage,
      openExitCases: exitRecords.filter((e) => e.stage !== "finalized").length,
      openExitsByStage,
    };
  },
});
