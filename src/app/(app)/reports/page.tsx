"use client";

import {
  FileBarChart, Download, ShieldOff, FileCheck2, CalendarClock, Building2,
  PieChart as PieChartIcon, Users2, TrendingUp, GraduationCap, Scale,
  DoorOpen, CalendarDays, BadgeCheck, Layers,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { api } from "../../../../convex/_generated/api";
import PageHeader from "@/components/PageHeader";
import ErrorState from "@/components/ErrorState";

// Reference categorical palette (fixed order — see dataviz skill palette.md)
const CATEGORICAL = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];
const SEQUENTIAL_BLUE = "#2a78d6";
const SEQUENTIAL_GREEN = "#1baf7a";
const SEQUENTIAL_AMBER = "#eda100";

const ease = [0.16, 1, 0.3, 1] as const;

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; subtitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, ease }}
      className="flex items-center gap-2.5 mt-10 mb-4 first:mt-0"
    >
      <div className="w-8 h-8 rounded-lg bg-[#202b5d]/5 border border-[#202b5d]/10 flex items-center justify-center text-[#202b5d] shrink-0">
        <Icon size={15} />
      </div>
      <div>
        <h2 className="text-[14px] font-bold text-[#202b5d] leading-tight">{title}</h2>
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{subtitle}</p>
      </div>
    </motion.div>
  );
}

function ChartCard({
  title,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease }}
      className="bg-white border border-paper-200 shadow-sm rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-4 gap-2">
        <h3
          className="text-[13px] font-bold text-[#202b5d] uppercase tracking-wider flex items-center gap-2 min-w-0 flex-1"
          title={title}
        >
          {Icon && <Icon size={14} className="text-slate-400 shrink-0" />}
          <span className="truncate">{title}</span>
        </h3>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </motion.div>
  );
}

function StatTile({ label, value, sub, accentClass }: { label: string; value: string | number; sub?: string; accentClass?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease }}
      className="bg-white border border-paper-200 shadow-sm rounded-xl p-5"
    >
      <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">{label}</p>
      <p className={`text-2xl font-bold ${accentClass ?? "text-[#202b5d]"}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
    </motion.div>
  );
}

function EmptyChart({ label = "Not enough data yet" }: { label?: string }) {
  return (
    <div className="h-[240px] flex flex-col items-center justify-center text-slate-400">
      <FileBarChart size={28} className="mb-2 opacity-20" />
      <p className="text-[12px] font-medium">{label}</p>
    </div>
  );
}

function HorizontalBar({ data, dataKey, nameKey, height = 240, fill = SEQUENTIAL_BLUE }: {
  data: any[]; dataKey: string; nameKey: string; height?: number; fill?: string;
}) {
  if (data.length === 0) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
        <CartesianGrid horizontal={false} stroke="#e1e0d9" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#898781" }} axisLine={{ stroke: "#c3c2b7" }} />
        <YAxis
          type="category"
          dataKey={nameKey}
          width={140}
          tick={{ fontSize: 11, fill: "#52514e" }}
          axisLine={{ stroke: "#c3c2b7" }}
          tickFormatter={(v: string) => (v.length > 20 ? v.slice(0, 20) + "…" : v)}
        />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
        <Bar dataKey={dataKey} radius={[0, 4, 4, 0]} barSize={14} fill={fill} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function DonutChart({ data, height = 240 }: { data: { name: string; value: number }[]; height?: number }) {
  if (data.length === 0) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={height * 0.22} outerRadius={height * 0.34} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={CATEGORICAL[i % CATEGORICAL.length]} stroke="#fcfcfb" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function downloadStatsCsv(stats: any) {
  const lines: string[] = [];
  const section = (title: string) => lines.push("", `# ${title}`);
  const row = (...cells: (string | number)[]) => lines.push(cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","));

  section("Executive Summary");
  row("Total Employees", stats.totalEmployees);
  row("Active Employees", stats.activeEmployees);
  row("Document Verification Rate (%)", stats.documentVerificationRate);
  row("Open Disciplinary Cases", stats.openDisciplinaryCases);
  row("Open Exit Cases", stats.openExitCases);
  row("Leave Utilization Rate (%)", stats.leaveUtilizationRate);

  section("Headcount by Department");
  row("Department", "Headcount");
  for (const d of stats.headcountByDepartment) row(d.name, d.count);

  section("Employment Status");
  for (const s of stats.employmentStatusBreakdown) row(s.name, s.value);

  section("Terms of Service");
  for (const s of stats.termsOfServiceBreakdown) row(s.name, s.value);

  section("Age Bands");
  for (const b of stats.ageBands) row(b.name, b.value);

  section("Tenure Bands");
  for (const b of stats.tenureBands) row(b.name, b.value);

  section("Retirement Forecast");
  for (const b of stats.retirementForecast) row(b.name, b.value);

  section("Retiring Within 60 Days");
  row("Employee", "PF Number", "Department", "Retirement Date", "Days Left");
  for (const r of stats.upcomingRetirements) row(r.name, r.pfNumber, r.department, r.retirementDate, r.daysLeft);

  section("Core Document Compliance");
  row("Category", "On File", "Missing", "Rate (%)");
  for (const c of stats.coreDocumentCompliance) row(c.name, c.onFile, c.missing, c.rate);

  section(`Latest Appraisal Cycle (${stats.latestCycleLabel ?? "—"})`);
  for (const s of stats.appraisalCycleBreakdown) row(s.name, s.value);
  row("Average Score", stats.averageAppraisalScore ?? "—");

  section("Training This Year");
  row("Sessions Logged", stats.trainingSessionsThisYear);
  row("Attendance Confirmed Rate (%)", stats.trainingAttendanceRate);

  section("Leave By Type (This Year, Approved)");
  for (const l of stats.leaveByType) row(l.name, l.value);

  section("Open Disciplinary Cases By Stage");
  for (const s of stats.openDisciplinaryByStage) row(s.name, s.value);

  section("Open Exit Cases By Stage");
  for (const s of stats.openExitsByStage) row(s.name, s.value);

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hrrms-comprehensive-report-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const currentUser = useQuery(api.users.me);
  const isAdmin = currentUser?.role === "super_admin" || currentUser?.role === "hr_director";
  const stats = useQuery(api.reports.dashboardStats, isAdmin ? {} : "skip");

  if (currentUser === undefined) return null;

  if (!isAdmin) {
    return (
      <div className="p-4 md:p-6">
        <ErrorState
          code={403}
          icon={ShieldOff}
          title="Access Restricted"
          message="Analytics & Reports are only available to Super Administrators and HR Directors."
        />
      </div>
    );
  }

  if (!stats) {
    return <div className="p-4 md:p-6 text-center text-slate-400 text-sm">Loading workforce analytics...</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        icon={FileBarChart}
        title="Reports"
        subtitle="HR Intelligence Dashboard"
        stats={[
          { label: "Total Employees", value: stats.totalEmployees },
          { label: "Doc. Verification Rate", value: `${stats.documentVerificationRate}%`, accentClass: "text-emerald-600" },
          { label: "Retiring ≤ 60 Days", value: stats.upcomingRetirements.length, accentClass: "text-amber-600" },
          { label: "Open Disciplinary Cases", value: stats.openDisciplinaryCases, accentClass: "text-rust-700" },
        ]}
        action={
          <button
            onClick={() => downloadStatsCsv(stats)}
            className="h-9 px-4 text-[12px] font-bold bg-[#9ECA3E] text-white rounded-lg hover:bg-[#7A9E2D] flex items-center transition-colors shadow-sm"
          >
            <Download size={14} className="mr-2" /> Export Full Report (CSV)
          </button>
        }
      />

      {/* Retirement & Succession Planning */}
      <SectionHeader icon={CalendarClock} title="Retirement & Succession Planning" subtitle="Forward-Looking Pipeline" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Retirement Forecast (Active Employees)" icon={TrendingUp}>
          <HorizontalBar data={stats.retirementForecast} dataKey="value" nameKey="name" fill={SEQUENTIAL_AMBER} />
        </ChartCard>
        <ChartCard title="Retiring Within 60 Days">
          {stats.upcomingRetirements.length === 0 ? (
            <div className="h-[240px] flex flex-col items-center justify-center text-slate-400 text-center px-6">
              <CalendarClock size={28} className="mb-2 opacity-20" />
              <p className="text-[12px] font-medium">No one is retiring in the next 60 days</p>
              <p className="text-[11px] mt-1">Check the forecast chart alongside this for the fuller pipeline.</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[240px]">
              <table className="w-full text-left text-[12px]">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-paper-100">
                    <th className="py-1.5">Employee</th>
                    <th className="py-1.5">Department</th>
                    <th className="py-1.5">Date</th>
                    <th className="py-1.5">In</th>
                    <th className="py-1.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-50">
                  {stats.upcomingRetirements.map((r: any) => (
                    <tr key={r.pfNumber}>
                      <td className="py-2 font-bold text-[#202b5d]">{r.name}</td>
                      <td className="py-2 text-slate-600 truncate max-w-[160px]">{r.department}</td>
                      <td className="py-2 text-slate-600">{r.retirementDate}</td>
                      <td className="py-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${r.daysLeft <= 15 ? "bg-rust-700/10 text-rust-700" : "bg-amber-100 text-amber-700"}`}>
                          {r.daysLeft}d
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <Link href={`/employees/${r.employeeId}`} className="text-blue-600 hover:underline font-bold">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Workforce Composition */}
      <SectionHeader icon={Users2} title="Workforce Composition" subtitle="Who Makes Up The County Workforce" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Headcount by Department" icon={Building2}>
          <HorizontalBar data={stats.headcountByDepartment} dataKey="count" nameKey="name" />
        </ChartCard>
        <ChartCard title="Employment Status Breakdown" icon={PieChartIcon}>
          <DonutChart data={stats.employmentStatusBreakdown} />
        </ChartCard>
        <ChartCard title="Gender Distribution" icon={Users2}>
          <DonutChart data={stats.genderSplit} />
        </ChartCard>
        <ChartCard title="Terms of Service" icon={Layers}>
          <DonutChart data={stats.termsOfServiceBreakdown} />
        </ChartCard>
        <ChartCard title="Age Distribution" icon={Users2}>
          <HorizontalBar data={stats.ageBands} dataKey="value" nameKey="name" fill={SEQUENTIAL_GREEN} />
        </ChartCard>
        <ChartCard title="Tenure Distribution" icon={TrendingUp}>
          <HorizontalBar data={stats.tenureBands} dataKey="value" nameKey="name" fill={SEQUENTIAL_BLUE} />
        </ChartCard>
        {stats.jobGroupBreakdown.length > 0 && (
          <ChartCard title="Job Group Distribution" icon={Layers}>
            <HorizontalBar data={stats.jobGroupBreakdown} dataKey="value" nameKey="name" />
          </ChartCard>
        )}
      </div>

      {/* Compliance & Documents */}
      <SectionHeader icon={FileCheck2} title="Compliance & Documents" subtitle="Personnel File Completeness" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 grid grid-cols-1 gap-6">
          <StatTile
            label="Document Verification Rate"
            value={`${stats.documentVerificationRate}%`}
            sub={`${stats.verifiedDocs} of ${stats.totalDocs} documents verified`}
            accentClass="text-emerald-600"
          />
          <StatTile
            label="Active Employees on File"
            value={stats.activeEmployees}
            sub="Currently active or on leave/suspended"
          />
        </div>
        <div className="lg:col-span-2">
          <ChartCard title="Core Document Compliance (Active Employees)" icon={BadgeCheck}>
            {stats.coreDocumentCompliance.every((c: any) => c.onFile === 0 && c.missing === 0) ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats.coreDocumentCompliance} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid horizontal={false} stroke="#e1e0d9" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#898781" }} axisLine={{ stroke: "#c3c2b7" }} unit="%" />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: "#52514e" }} axisLine={{ stroke: "#c3c2b7" }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} formatter={(v) => `${v}%`} />
                  <Bar dataKey="rate" radius={[0, 4, 4, 0]} barSize={16} fill={SEQUENTIAL_GREEN} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </div>

      {/* Performance & Development */}
      <SectionHeader icon={GraduationCap} title="Performance & Development" subtitle="Appraisals & Training" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title={`Latest Appraisal Cycle${stats.latestCycleLabel ? ` — ${stats.latestCycleLabel}` : ""}`}>
          <DonutChart data={stats.appraisalCycleBreakdown} height={200} />
        </ChartCard>
        <StatTile
          label="Average Appraisal Score"
          value={stats.averageAppraisalScore ?? "—"}
          sub={stats.latestCycleLabel ? `Completed appraisals, ${stats.latestCycleLabel}` : "No cycle initiated yet"}
          accentClass="text-blue-600"
        />
        <div className="grid grid-cols-1 gap-6">
          <StatTile label="Training Sessions This Year" value={stats.trainingSessionsThisYear} accentClass="text-slate-teal" />
          <StatTile label="Attendance Confirmed Rate" value={`${stats.trainingAttendanceRate}%`} accentClass="text-emerald-600" />
        </div>
      </div>

      {/* Leave & Attendance */}
      <SectionHeader icon={CalendarDays} title="Leave & Attendance" subtitle="Time Away From Work" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatTile
          label="Leave Utilization Rate"
          value={`${stats.leaveUtilizationRate}%`}
          sub={`${stats.totalLeaveDaysTaken} of ${stats.totalLeaveDaysAllocated} allocated days taken`}
          accentClass="text-blue-600"
        />
        <div className="lg:col-span-2">
          <ChartCard title="Leave by Type (This Year, Approved)" icon={CalendarDays}>
            <DonutChart data={stats.leaveByType} height={220} />
          </ChartCard>
        </div>
      </div>

      {/* Discipline & Exit Pipeline */}
      <SectionHeader icon={Scale} title="Discipline & Exit Pipeline" subtitle="Active Cases In Progress" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Open Disciplinary Cases by Stage" icon={Scale}>
          <HorizontalBar data={stats.openDisciplinaryByStage} dataKey="value" nameKey="name" fill="#e34948" />
        </ChartCard>
        <ChartCard title="Open Exit Cases by Stage" icon={DoorOpen}>
          <HorizontalBar data={stats.openExitsByStage} dataKey="value" nameKey="name" fill="#4a3aa7" />
        </ChartCard>
      </div>
    </div>
  );
}
