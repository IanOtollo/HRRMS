"use client";

import { Users, FileDigit, UploadCloud, Scale, FolderOpen, Activity, CheckCircle2, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

const ease = [0.16, 1, 0.3, 1] as const;

export default function DashboardPage() {
  const currentUser = useQuery(api.users.me);
  const employees = useQuery(api.employees.list, {}) || [];
  const departments = useQuery(api.departments.list) || [];
  const pendingDocs = useQuery(api.documents.listPending) || [];
  const recentActivity = useQuery(
    api.auditLog.list,
    currentUser?.role === "super_admin" || currentUser?.role === "hr_director" ? { limit: 8 } : "skip"
  ) || [];
  const disciplinaryRecords = useQuery(
    api.disciplinaryRecords.list,
    currentUser?.role && currentUser.role !== "department_viewer" ? {} : "skip"
  ) || [];
  const verifyDoc = useMutation(api.documents.verify);

  const canVerify = currentUser?.role === "super_admin" || currentUser?.role === "hr_director";

  const stats = {
    totalEmployees: employees.length,
    pendingUploads: pendingDocs.length,
    activeDisciplinary: disciplinaryRecords.filter((r) => r.stage !== "closed").length,
  };

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
          title="Pending Document Uploads"
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease }}
          className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm min-h-[320px]"
        >
          <h2 className="text-[14px] uppercase tracking-wider font-bold text-slate-600 mb-4">Recent Activity</h2>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity, i) => (
                <motion.div
                  key={activity._id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className="flex gap-3"
                >
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-[#202b5d] shrink-0" />
                  <div>
                    <p className="text-[13px] font-medium text-slate-700">
                      <span className="font-bold">{activity.userName}</span> — {activity.action.replace(/\./g, " ")}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{new Date(activity.timestamp).toLocaleString()}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-slate-400">
              <Activity size={24} className="mb-2 opacity-20" />
              <p className="text-[13px] font-bold text-slate-600">No recent activity</p>
              <p className="text-[11px] text-center max-w-[200px] mt-1">Activity logs will appear here once users interact with the system.</p>
            </div>
          )}
        </motion.div>

        {/* Documents Awaiting Verification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease, delay: 0.1 }}
          className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm min-h-[320px] flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] uppercase tracking-wider font-bold text-slate-600">Pending Verification</h2>
            <Link href="/digitization-queue" className="text-[12px] text-blue-600 hover:underline font-bold">
              View All
            </Link>
          </div>

          {pendingDocs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                    <th className="pb-2">Employee</th>
                    <th className="pb-2">Filename</th>
                    {canVerify && <th className="pb-2 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="text-[13px]">
                  {pendingDocs.slice(0, 6).map((doc, i) => (
                    <motion.tr
                      key={doc._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-2.5">
                        <div className="font-bold text-[#202b5d]">{doc.employeeName}</div>
                      </td>
                      <td className="py-2.5 text-slate-600 truncate max-w-[140px]">{doc.originalFilename}</td>
                      {canVerify && (
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => verifyDoc({ documentId: doc._id })}
                            className="h-7 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded transition-colors inline-flex items-center gap-1"
                          >
                            <CheckCircle2 size={12} /> Verify
                          </button>
                        </td>
                      )}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <FolderOpen size={24} className="mb-2 opacity-20" />
              <p className="text-[13px] font-bold text-slate-600">No pending documents</p>
              <p className="text-[11px] mt-1">You're all caught up!</p>
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
