"use client";

import { Users, FileDigit, UploadCloud, Scale, ArrowUpRight, Bell, Clock, AlertOctagon, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { STAGE_LABELS } from "@/lib/disciplinaryStages";

const ease = [0.16, 1, 0.3, 1] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / DAY_MS);
}

function wasMinorAtHire(dob?: string, appointmentDate?: string): boolean {
  if (!dob || !appointmentDate) return false;
  const d = new Date(dob);
  const a = new Date(appointmentDate);
  let age = a.getFullYear() - d.getFullYear();
  const monthDiff = a.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && a.getDate() < d.getDate())) age--;
  return age < 18;
}

export default function DashboardPage() {
  const currentUser = useQuery(api.users.me);
  const employees = useQuery(api.employees.list, {}) || [];
  const departments = useQuery(api.departments.list) || [];
  const pendingDocs = useQuery(api.documents.listPending) || [];
  const disciplinaryRecords = useQuery(
    api.disciplinaryRecords.list,
    currentUser?.role === "super_admin" || currentUser?.role === "hr_director" ? {} : "skip"
  ) || [];

  const stats = {
    totalEmployees: employees.length,
    pendingUploads: pendingDocs.length,
    activeDisciplinary: disciplinaryRecords.filter((r) => r.stage !== "closed").length,
  };

  const employeeName = (id: string) => employees.find((e) => e._id === id)?.fullName ?? "Unknown";

  const activeDisciplinaryCases = disciplinaryRecords
    .filter((r) => r.stage !== "closed")
    .sort((a, b) => b.openedAt - a.openedAt);

  const retiringSoon = employees
    .filter((e) => e.employmentStatus === "active" && e.retirementDate)
    .map((e) => ({ ...e, daysLeft: daysUntil(e.retirementDate) }))
    .filter((e) => e.daysLeft >= 0 && e.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const retiringUrgent = retiringSoon.filter((e) => e.daysLeft <= 15);
  const retiringUpcoming = retiringSoon.filter((e) => e.daysLeft > 15);

  const minorAtHireFlags = employees.filter((e) => wasMinorAtHire(e.dateOfBirth, e.firstAppointmentDate));

  const notificationCount = activeDisciplinaryCases.length + retiringSoon.length + minorAtHireFlags.length;

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-bold text-[#202b5d] mb-6">Dashboard</h1>

      {/* Row 1: Stat Cards */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6"
      >
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          hint="Employees on record"
          icon={Users}
          colorClass="text-blue-700"
        />
        <StatCard
          title="Pending Document to be Verified"
          value={stats.pendingUploads}
          hint="Uploaded, awaiting verification"
          icon={UploadCloud}
          colorClass="text-amber-600"
        />
        <StatCard
          title="Active Disciplinary Cases"
          value={stats.activeDisciplinary}
          hint="Open, not yet closed"
          icon={Scale}
          colorClass="text-red-700"
        />
        <StatCard
          title="Departments"
          value={departments.length}
          hint="County departments in the system"
          icon={FileDigit}
          colorClass="text-emerald-600"
          href="/departments"
        />
      </motion.div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease }}
          className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm min-h-[320px] flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] uppercase tracking-wider font-bold text-slate-600 flex items-center gap-2">
              <Bell size={15} /> System Notifications
              {notificationCount > 0 && (
                <span className="text-[10px] font-bold bg-red-100 text-red-700 rounded-full px-2 py-0.5">
                  {notificationCount}
                </span>
              )}
            </h2>
          </div>

          {notificationCount === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <Bell size={24} className="mb-2 opacity-20" />
              <p className="text-[13px] font-bold text-slate-600">No active notifications</p>
              <p className="text-[11px] mt-1">Disciplinary cases and upcoming retirements will show up here.</p>
            </div>
          ) : (
            <div className="space-y-5 max-h-[420px] overflow-y-auto">
              {activeDisciplinaryCases.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Active Disciplinary Cases</p>
                  <div className="space-y-1.5">
                    {activeDisciplinaryCases.map((rec, i) => (
                      <motion.div
                        key={rec._id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(i, 10) * 0.03 }}
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-50 text-red-700 flex items-center justify-center shrink-0">
                          <Scale size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold text-[#202b5d] truncate">{employeeName(rec.employeeId)}</p>
                          <p className="text-[11px] text-slate-500">{STAGE_LABELS[rec.stage]}</p>
                        </div>
                        <Link
                          href={`/disciplinary?case=${rec._id}`}
                          className="text-[11px] font-bold text-blue-600 hover:underline shrink-0"
                        >
                          View
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {retiringUrgent.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Retiring Within 15 Days</p>
                  <div className="space-y-1.5">
                    {retiringUrgent.map((e, i) => (
                      <motion.div
                        key={e._id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(i, 10) * 0.03 }}
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-rust-700/10 text-rust-700 flex items-center justify-center shrink-0">
                          <AlertOctagon size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold text-[#202b5d] truncate">{e.fullName}</p>
                          <p className="text-[11px] text-rust-700 font-semibold">
                            Retires in {e.daysLeft} {e.daysLeft === 1 ? "day" : "days"} ({e.retirementDate})
                          </p>
                        </div>
                        <Link
                          href={`/employees/${e._id}`}
                          className="text-[11px] font-bold text-blue-600 hover:underline shrink-0"
                        >
                          View
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {retiringUpcoming.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Retiring Within 30 Days</p>
                  <div className="space-y-1.5">
                    {retiringUpcoming.map((e, i) => (
                      <motion.div
                        key={e._id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(i, 10) * 0.03 }}
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <Clock size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold text-[#202b5d] truncate">{e.fullName}</p>
                          <p className="text-[11px] text-amber-600 font-semibold">
                            Retires in {e.daysLeft} days ({e.retirementDate})
                          </p>
                        </div>
                        <Link
                          href={`/employees/${e._id}`}
                          className="text-[11px] font-bold text-blue-600 hover:underline shrink-0"
                        >
                          View
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {minorAtHireFlags.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Hired Under 18 (Pre-Policy Review)</p>
                  <div className="space-y-1.5">
                    {minorAtHireFlags.map((e, i) => (
                      <motion.div
                        key={e._id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(i, 10) * 0.03 }}
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <AlertTriangle size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold text-[#202b5d] truncate">{e.fullName}</p>
                          <p className="text-[11px] text-amber-600 font-semibold">
                            DOB {e.dateOfBirth} · Appointed {e.firstAppointmentDate}
                          </p>
                        </div>
                        <Link
                          href={`/employees/${e._id}`}
                          className="text-[11px] font-bold text-blue-600 hover:underline shrink-0"
                        >
                          View
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({ title, value, hint, icon: Icon, colorClass, href }: any) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-1.5">
        <span className="text-[10.5px] sm:text-[12px] uppercase tracking-wider font-bold text-slate-500 leading-tight line-clamp-2 pr-1">{title}</span>
        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 ${colorClass}`}>
          <Icon size={13} className="sm:hidden" />
          <Icon size={15} className="hidden sm:block" />
        </div>
      </div>
      <div className={href ? "pr-6" : ""}>
        <div className="text-lg sm:text-2xl font-bold text-[#202b5d] leading-none">{value}</div>
        {hint && <p className="text-[9.5px] sm:text-[10.5px] text-slate-400 mt-1 leading-snug">{hint}</p>}
      </div>
      {href && (
        <div className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 bg-[#202b5d] rounded-tl-lg flex items-center justify-center text-white group-hover:bg-[#161f47] transition-colors">
          <ArrowUpRight size={11} className="sm:hidden" />
          <ArrowUpRight size={13} className="hidden sm:block" />
        </div>
      )}
    </>
  );

  const className = `relative block bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[92px] sm:min-h-[104px] overflow-hidden ${
    href ? "group cursor-pointer hover:border-[#202b5d]/30 transition-colors" : ""
  }`;

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
    >
      {href ? (
        <Link href={href} className={className}>{content}</Link>
      ) : (
        <div className={className}>{content}</div>
      )}
    </motion.div>
  );
}
