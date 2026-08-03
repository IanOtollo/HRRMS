"use client";

import { useState } from "react";
import { Database, Download, ShieldOff } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import PageHeader from "@/components/PageHeader";
import ErrorState from "@/components/ErrorState";

function downloadCsv(rows: any[]) {
  const headers = ["Timestamp", "User", "Action", "Record Type", "Record ID"];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        new Date(r.timestamp).toISOString(),
        r.userName,
        r.action,
        r.recordType,
        r.recordId ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AuditLogPage() {
  const currentUser = useQuery(api.users.me);
  const isAdmin = currentUser?.role === "super_admin" || currentUser?.role === "hr_director";

  const [filterText, setFilterText] = useState("");
  const records = useQuery(api.auditLog.list, isAdmin ? { limit: 200 } : "skip") || [];

  if (currentUser === undefined) return null;

  if (!isAdmin) {
    return (
      <div className="p-4 md:p-6">
        <ErrorState
          code={403}
          icon={ShieldOff}
          title="Access Restricted"
          message="The audit log is only available to Super Administrators and HR Directors."
        />
      </div>
    );
  }

  const filtered = filterText
    ? records.filter(
        (r) =>
          r.action.toLowerCase().includes(filterText.toLowerCase()) ||
          r.userName.toLowerCase().includes(filterText.toLowerCase()) ||
          r.recordType.toLowerCase().includes(filterText.toLowerCase())
      )
    : records;

  const todayCount = records.filter((r) => new Date(r.timestamp).toDateString() === new Date().toDateString()).length;
  const uniqueUsers = new Set(records.map((r) => r.userName)).size;

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        icon={Database}
        title="Audit Log"
        subtitle="Immutable Security Trail"
        stats={[
          { label: "Total Entries", value: records.length },
          { label: "Actions Today", value: todayCount, accentClass: "text-blue-600" },
          { label: "Unique Users", value: uniqueUsers, accentClass: "text-emerald-600" },
        ]}
        action={
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Filter by user, action, resource..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="h-9 px-3 text-[12px] border border-slate-300 rounded-lg w-56 sm:w-64 focus:outline-none focus:ring-1 focus:ring-[#202b5d]"
            />
            <button
              onClick={() => downloadCsv(filtered)}
              disabled={filtered.length === 0}
              className="h-9 px-4 text-[12px] font-bold bg-[#202b5d] text-white rounded-lg hover:bg-[#161f47] flex items-center transition-colors shadow-sm disabled:opacity-50 shrink-0"
            >
              <Download size={14} className="mr-2" /> Export CSV
            </button>
          </div>
        }
      />

      <div className="bg-white border border-paper-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-paper-200">
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Timestamp</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">User</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Action</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Resource</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Database size={24} className="text-slate-300 mb-2" />
                      <span className="text-[13px] font-medium">No audit log entries found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => {
                  const isFailedLogin = r.action === "user.loginFailed";
                  return (
                    <motion.tr
                      key={r._id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(i, 15) * 0.015 }}
                      className={`transition-colors ${isFailedLogin ? "bg-rust-700/5 hover:bg-rust-700/10" : "hover:bg-slate-50"}`}
                    >
                      <td className="px-4 py-2.5 text-[12px] text-slate-600 font-mono">{new Date(r.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-[13px] font-bold text-[#202b5d]">{r.userName}</td>
                      <td className="px-4 py-2.5 text-[12px]">
                        {isFailedLogin ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rust-700/10 text-rust-700 uppercase tracking-wider">
                            Failed Login
                          </span>
                        ) : (
                          <span className="text-slate-600">{r.action}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-[12px] text-slate-500">{r.recordType}{r.recordId ? ` · ${r.recordId.slice(-8)}` : ""}</td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
