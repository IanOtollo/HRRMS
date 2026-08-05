"use client";

import { Fragment, useState } from "react";
import { Database, Download, ShieldOff, ChevronDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, usePaginatedQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import PageHeader from "@/components/PageHeader";
import ErrorState from "@/components/ErrorState";
import Select from "@/components/Select";

const RECORD_TYPE_LABELS: Record<string, string> = {
  employees: "Employees",
  documents: "Documents",
  appraisals: "Appraisals",
  exitRecords: "Retirement & Exit",
  disciplinaryRecords: "Disciplinary",
  trainingRecords: "Training",
  leaveRecords: "Leave",
  departments: "Departments",
  users: "Users",
  systemSettings: "Settings",
};

const RECORD_TYPE_OPTIONS = [
  { value: "", label: "All Modules" },
  ...Object.entries(RECORD_TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "success", label: "Success" },
  { value: "error", label: "Error" },
];

function startOfDayMs(dateStr: string) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function endOfDayMs(dateStr: string) {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function formatDetailValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function downloadCsv(rows: any[]) {
  const headers = ["Timestamp", "User", "Status", "Action", "Record Type", "Record ID", "Error Message"];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        new Date(r.timestamp).toISOString(),
        r.userName,
        r.status ?? "success",
        r.action,
        r.recordType,
        r.recordId ?? "",
        r.errorMessage ?? "",
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
  const canView =
    currentUser?.role === "super_admin" || currentUser?.role === "hr_director" || currentUser?.role === "ict_support";
  // The full user list (for the "filter by user" dropdown) stays admin-only
  // — ICT Support can view the log itself without the user-management list.
  const canListUsers = currentUser?.role === "super_admin" || currentUser?.role === "hr_director";

  const [searchText, setSearchText] = useState("");
  const [status, setStatus] = useState("");
  const [recordType, setRecordType] = useState("");
  const [userId, setUserId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const users = useQuery(api.users.list, canListUsers ? {} : "skip") || [];
  const stats = useQuery(api.auditLog.stats, canView ? {} : "skip");

  const queryArgs = canView
    ? {
        status: status ? (status as "success" | "error") : undefined,
        recordType: recordType || undefined,
        userId: userId ? (userId as Id<"users">) : undefined,
        startDate: dateFrom ? startOfDayMs(dateFrom) : undefined,
        endDate: dateTo ? endOfDayMs(dateTo) : undefined,
        search: searchText || undefined,
      }
    : ("skip" as const);

  const { results, status: loadStatus, loadMore } = usePaginatedQuery(api.auditLog.list, queryArgs, {
    initialNumItems: 50,
  });

  if (currentUser === undefined) return null;

  if (!canView) {
    return (
      <div className="p-4 md:p-6">
        <ErrorState
          code={403}
          icon={ShieldOff}
          title="Access Restricted"
          message="The audit log is only available to Super Administrators, HR Directors, and ICT Support."
        />
      </div>
    );
  }

  const userOptions = [
    { value: "", label: "All Users" },
    ...users.map((u) => ({ value: u._id as string, label: u.name ?? u.email ?? "Unknown" })),
  ];

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        icon={Database}
        title="Audit Log"
        subtitle="Immutable Security Trail"
        stats={[
          { label: "Entries (30d)", value: stats?.total30d ?? "—" },
          { label: "Errors (30d)", value: stats?.errors30d ?? "—", accentClass: "text-rust-700" },
          { label: "Actions Today", value: stats?.today ?? "—", accentClass: "text-blue-600" },
          { label: "Unique Users (30d)", value: stats?.uniqueUsers30d ?? "—", accentClass: "text-emerald-600" },
        ]}
        action={
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search user, action, error..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-9 px-3 text-[12px] border border-slate-300 rounded-lg w-52 focus:outline-none focus:ring-1 focus:ring-[#202b5d]"
            />
            <button
              onClick={() => downloadCsv(results)}
              disabled={results.length === 0}
              className="h-9 px-4 text-[12px] font-bold bg-[#202b5d] text-white rounded-lg hover:bg-[#161f47] flex items-center transition-colors shadow-sm disabled:opacity-50 shrink-0"
            >
              <Download size={14} className="mr-2" /> Export CSV
            </button>
          </div>
        }
      />

      <div className="bg-white border border-paper-200 shadow-sm rounded-xl overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-paper-200 bg-slate-50/60">
          <div className="w-40">
            <Select value={status} onChange={setStatus} options={STATUS_OPTIONS} />
          </div>
          <div className="w-48">
            <Select value={recordType} onChange={setRecordType} options={RECORD_TYPE_OPTIONS} />
          </div>
          <div className="w-48">
            <Select value={userId} onChange={setUserId} options={userOptions} />
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 px-2 text-[12px] border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#202b5d]"
            />
            <span className="text-[11px] text-slate-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 px-2 text-[12px] border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#202b5d]"
            />
          </div>
          <button
            onClick={() => setStatus(status === "error" ? "" : "error")}
            className={`h-9 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-colors flex items-center gap-1.5 ${
              status === "error"
                ? "bg-rust-700 text-white border-rust-700"
                : "bg-white text-rust-700 border-rust-700/30 hover:bg-rust-700/5"
            }`}
          >
            <AlertTriangle size={13} /> Errors Only
          </button>
          {(status || recordType || userId || dateFrom || dateTo || searchText) && (
            <button
              onClick={() => {
                setStatus("");
                setRecordType("");
                setUserId("");
                setDateFrom("");
                setDateTo("");
                setSearchText("");
              }}
              className="h-9 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-paper-200">
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Status</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Timestamp</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">User</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Action</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Resource</th>
                <th className="px-4 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-100">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Database size={24} className="text-slate-300 mb-2" />
                      <span className="text-[13px] font-medium">No audit log entries found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                results.map((r, i) => {
                  const isError = r.status === "error";
                  const isExpanded = expandedId === r._id;
                  const hasDetails = isError ? !!r.errorMessage : !!r.details;
                  return (
                    <Fragment key={r._id}>
                      <motion.tr
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(i, 15) * 0.015 }}
                        className={`transition-colors ${isError ? "bg-rust-700/5 hover:bg-rust-700/10" : "hover:bg-slate-50"} ${hasDetails ? "cursor-pointer" : ""}`}
                        onClick={() => hasDetails && setExpandedId(isExpanded ? null : r._id)}
                      >
                        <td className="px-4 py-2.5">
                          {isError ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rust-700/10 text-rust-700 uppercase tracking-wider">
                              <AlertTriangle size={11} /> Error
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider">
                              <CheckCircle2 size={11} /> Success
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-[12px] text-slate-600 font-mono">{new Date(r.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-[13px] font-bold text-[#202b5d]">{r.userName}</td>
                        <td className="px-4 py-2.5 text-[12px] text-slate-600">{r.action}</td>
                        <td className="px-4 py-2.5 text-[12px] text-slate-500">
                          {RECORD_TYPE_LABELS[r.recordType] ?? r.recordType}
                          {r.recordId ? ` · ${r.recordId.slice(-8)}` : ""}
                        </td>
                        <td className="px-4 py-2.5">
                          {hasDetails && (
                            <ChevronDown
                              size={14}
                              className={`text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            />
                          )}
                        </td>
                      </motion.tr>
                      <AnimatePresence>
                        {isExpanded && hasDetails && (
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={isError ? "bg-rust-700/5" : "bg-slate-50/70"}
                          >
                            <td colSpan={6} className="px-4 py-3">
                              {isError ? (
                                <p className="text-[12px] text-rust-700">
                                  <span className="font-bold">Error:</span> {r.errorMessage}
                                </p>
                              ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5">
                                  {Object.entries(r.details as Record<string, unknown>).map(([key, value]) => (
                                    <div key={key} className="text-[12px]">
                                      <span className="text-slate-400 font-mono">{key}:</span>{" "}
                                      <span className="text-slate-700 font-medium">{formatDetailValue(value)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {loadStatus !== "Exhausted" && results.length > 0 && (
          <div className="flex justify-center p-4 border-t border-paper-200">
            <button
              onClick={() => loadMore(50)}
              disabled={loadStatus !== "CanLoadMore"}
              className="h-9 px-5 text-[12px] font-bold text-[#202b5d] border border-[#202b5d]/20 rounded-lg hover:bg-[#202b5d]/5 transition-colors disabled:opacity-50"
            >
              {loadStatus === "LoadingMore" ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
