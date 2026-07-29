"use client";

import { FileBarChart, Download, ShieldOff, FileCheck2, CalendarClock, Building2, PieChart as PieChartIcon, Users2 } from "lucide-react";
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

const ease = [0.16, 1, 0.3, 1] as const;

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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-bold text-[#202b5d] uppercase tracking-wider flex items-center gap-2">
          {Icon && <Icon size={14} className="text-slate-400" />}
          {title}
        </h3>
        {action}
      </div>
      {children}
    </motion.div>
  );
}

function downloadStatsCsv(stats: any) {
  const lines: string[] = ["Metric,Value"];
  lines.push(`Total Employees,${stats.totalEmployees}`);
  lines.push(`Document Verification Rate,${stats.documentVerificationRate}%`);
  lines.push("");
  lines.push("Department,Headcount");
  for (const d of stats.headcountByDepartment) lines.push(`"${d.name}",${d.count}`);
  lines.push("");
  lines.push("Employee,PF Number,Department,Retirement Date");
  for (const r of stats.upcomingRetirements) lines.push(`"${r.name}",${r.pfNumber},"${r.department}",${r.retirementDate}`);

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hrrms-report-${new Date().toISOString().slice(0, 10)}.csv`;
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
          { label: "Upcoming Retirements", value: stats.upcomingRetirements.length, accentClass: "text-amber-600" },
        ]}
        action={
          <button
            onClick={() => downloadStatsCsv(stats)}
            className="h-9 px-4 text-[12px] font-bold bg-[#9ECA3E] text-white rounded-lg hover:bg-[#7A9E2D] flex items-center transition-colors shadow-sm"
          >
            <Download size={14} className="mr-2" /> Export CSV
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white border border-paper-200 shadow-sm rounded-xl p-5 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <FileCheck2 size={22} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Document Verification Rate</p>
            <p className="text-2xl font-bold text-[#202b5d]">{stats.documentVerificationRate}%</p>
            <p className="text-[11px] text-slate-400">{stats.verifiedDocs} of {stats.totalDocs} documents verified</p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Headcount by Department" icon={Building2}>
          {stats.headcountByDepartment.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.headcountByDepartment} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid horizontal={false} stroke="#e1e0d9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#898781" }} axisLine={{ stroke: "#c3c2b7" }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={160}
                  tick={{ fontSize: 11, fill: "#52514e" }}
                  axisLine={{ stroke: "#c3c2b7" }}
                  tickFormatter={(v: string) => (v.length > 22 ? v.slice(0, 22) + "…" : v)}
                />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                <Bar dataKey="count" name="Employees" fill={SEQUENTIAL_BLUE} radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Employment Status Breakdown" icon={PieChartIcon}>
          {stats.employmentStatusBreakdown.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stats.employmentStatusBreakdown}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {stats.employmentStatusBreakdown.map((_: any, i: number) => (
                    <Cell key={i} fill={CATEGORICAL[i % CATEGORICAL.length]} stroke="#fcfcfb" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Gender Distribution" icon={Users2}>
          {stats.genderSplit.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={stats.genderSplit} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {stats.genderSplit.map((_: any, i: number) => (
                    <Cell key={i} fill={CATEGORICAL[i % CATEGORICAL.length]} stroke="#fcfcfb" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Upcoming Retirements (60 Days)" icon={CalendarClock}>
          {stats.upcomingRetirements.length === 0 ? (
            <div className="h-[240px] flex flex-col items-center justify-center text-slate-400">
              <FileBarChart size={28} className="mb-2 opacity-20" />
              <p className="text-[12px] font-medium">No upcoming retirements</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[240px]">
              <table className="w-full text-left text-[12px]">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-paper-100">
                    <th className="py-1.5">Employee</th>
                    <th className="py-1.5">Department</th>
                    <th className="py-1.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-50">
                  {stats.upcomingRetirements.map((r: any) => (
                    <tr key={r.pfNumber}>
                      <td className="py-2 font-bold text-[#202b5d]">{r.name}</td>
                      <td className="py-2 text-slate-600 truncate max-w-[160px]">{r.department}</td>
                      <td className="py-2 text-slate-600">{r.retirementDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-[240px] flex flex-col items-center justify-center text-slate-400">
      <FileBarChart size={28} className="mb-2 opacity-20" />
      <p className="text-[12px] font-medium">Not enough data yet</p>
    </div>
  );
}
