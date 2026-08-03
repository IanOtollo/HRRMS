import { query } from "./_generated/server";
import { requireRole } from "./lib/rbac";

export const dashboardStats = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["super_admin", "hr_director"]);

    const employees = await ctx.db.query("employees").collect();
    const departments = await ctx.db.query("departments").collect();
    const documents = await ctx.db.query("documents").collect();
    const leaveBalances = await ctx.db.query("leaveBalances").collect();

    const departmentNameById = new Map(departments.map((d) => [d._id, d.name]));

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

    const now = Date.now();
    const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
    const upcomingRetirements = employees
      .filter((e) => {
        const retirementMs = new Date(e.retirementDate).getTime();
        return retirementMs - now > 0 && retirementMs - now <= sixtyDaysMs;
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

    const totalDocs = documents.length;
    const verifiedDocs = documents.filter((d) => d.status === "verified").length;
    const documentVerificationRate = totalDocs > 0 ? Math.round((verifiedDocs / totalDocs) * 100) : 0;

    const currentYear = new Date().getFullYear();
    const thisYearBalances = leaveBalances.filter((b) => b.year === currentYear);
    const totalLeaveDaysAllocated = thisYearBalances.reduce((sum, b) => sum + b.annualBalance, 0);
    const totalLeaveDaysTaken = thisYearBalances.reduce((sum, b) => sum + b.daysTakenYtd, 0);
    const leaveUtilizationRate = totalLeaveDaysAllocated > 0
      ? Math.round((totalLeaveDaysTaken / totalLeaveDaysAllocated) * 100)
      : 0;

    return {
      totalEmployees: employees.length,
      headcountByDepartment,
      genderSplit,
      employmentStatusBreakdown,
      upcomingRetirements,
      documentVerificationRate,
      totalDocs,
      verifiedDocs,
      leaveUtilizationRate,
      totalLeaveDaysTaken,
    };
  },
});
