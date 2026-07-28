"use client";

import { Users, FileDigit, UploadCloud, Scale, FolderOpen, Activity } from "lucide-react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export default function DashboardPage() {
  const employees = useQuery(api.employees.list, {}) || [];
  
  const pendingDocs: any[] = [];
  const recentActivity: any[] = [];

  const stats = {
    totalEmployees: employees.length,
    recordsDigitized: 0,
    pendingUploads: pendingDocs.length,
    activeDisciplinary: 0,
  };

  const percentageDigitized = stats.totalEmployees > 0 
    ? Math.round((stats.recordsDigitized / stats.totalEmployees) * 100) 
    : 0;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-[#202b5d] mb-6">System Dashboard</h1>

      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={Users}
          colorClass="text-blue-700"
        />
        <div className="bg-white rounded p-4 border border-slate-200 shadow-sm flex flex-col justify-between h-[96px]">
          <div className="flex items-start justify-between">
            <span className="text-[12px] uppercase tracking-wider font-bold text-slate-500">Records Digitized</span>
            <FileDigit size={16} className="text-emerald-600" />
          </div>
          <div>
            <div className="flex items-end justify-between mb-1">
              <span className="text-2xl font-bold text-[#202b5d]">{stats.recordsDigitized}</span>
              <span className="text-[11px] font-bold text-emerald-600">{percentageDigitized}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full" 
                style={{ width: `${percentageDigitized}%` }} 
              />
            </div>
          </div>
        </div>
        <StatCard
          title="Pending Document Uploads"
          value={stats.pendingUploads}
          icon={UploadCloud}
          colorClass="text-amber-600"
        />
        <StatCard
          title="Active Disciplinary Cases"
          value={stats.activeDisciplinary}
          icon={Scale}
          colorClass="text-red-700"
        />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Activity */}
        <div className="bg-white rounded p-6 border border-slate-200 shadow-sm min-h-[320px]">
          <h2 className="text-[14px] uppercase tracking-wider font-bold text-slate-600 mb-4">Recent Activity</h2>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-[#202b5d] shrink-0" />
                  <div>
                    <p className="text-[13px] font-medium text-slate-700">{activity.description}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-slate-400">
              <Activity size={24} className="mb-2 opacity-20" />
              <p className="text-[13px] font-bold text-slate-600">No recent activity</p>
              <p className="text-[11px] text-center max-w-[200px] mt-1">Activity logs will appear here once users interact with the system.</p>
            </div>
          )}
        </div>

        {/* Documents Awaiting Verification */}
        <div className="bg-white rounded p-6 border border-slate-200 shadow-sm min-h-[320px] flex flex-col">
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
                    <th className="pb-2">Document Category</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-[13px]">
                  {pendingDocs.map((doc, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="py-2.5">
                        <div className="font-bold text-[#202b5d]">{doc.employeeName}</div>
                      </td>
                      <td className="py-2.5 text-slate-600">{doc.category}</td>
                      <td className="py-2.5 text-right">
                        <button className="h-7 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded transition-colors">
                          Review
                        </button>
                      </td>
                    </tr>
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
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, colorClass }: any) {
  return (
    <div className="bg-white rounded p-4 border border-slate-200 shadow-sm flex flex-col justify-between h-[96px]">
      <div className="flex items-start justify-between">
        <span className="text-[12px] uppercase tracking-wider font-bold text-slate-500 truncate pr-2">{title}</span>
        <Icon size={16} className={colorClass} />
      </div>
      <div className="text-2xl font-bold text-[#202b5d]">{value}</div>
    </div>
  );
}
