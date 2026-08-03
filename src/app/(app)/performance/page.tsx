"use client";

import { useState } from "react";
import { LineChart, Plus, Calendar, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import PageHeader from "@/components/PageHeader";
import Select from "@/components/Select";
import SlideOver from "@/components/SlideOver";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  submitted: "Submitted",
  completed: "Completed",
};
const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  submitted: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
};

// Kenyan county FY runs 1 July – 30 June.
function currentFinancialYear(): string {
  const now = new Date();
  const year = now.getMonth() + 1 >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}/${year + 1}`;
}

function financialYearOptions(): string[] {
  const [startYear] = currentFinancialYear().split("/").map(Number);
  const years: string[] = [];
  for (let y = startYear - 1; y <= startYear + 2; y++) years.push(`${y}/${y + 1}`);
  return years;
}

export default function PerformancePage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const appraisals = useQuery(api.appraisals.listByCycle, {}) || [];
  const employees = useQuery(api.employees.list, {}) || [];
  const departments = useQuery(api.departments.list) || [];
  const initiateCycle = useMutation(api.appraisals.initiateCycle);

  const [financialYear, setFinancialYear] = useState(currentFinancialYear());
  const [cycleLabel, setCycleLabel] = useState(`FY ${currentFinancialYear()} Annual Appraisal`);
  const [departmentId, setDepartmentId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  const employeeFor = (id: string) => employees.find((e) => e._id === id);
  const employeeName = (id: string) => employeeFor(id)?.fullName ?? "Unknown";

  const completedCount = appraisals.filter((a) => a.status === "completed").length;
  const submittedCount = appraisals.filter((a) => a.status === "submitted").length;
  const pendingCount = appraisals.length - completedCount - submittedCount;

  const resetForm = () => {
    setFinancialYear(currentFinancialYear());
    setCycleLabel(`FY ${currentFinancialYear()} Annual Appraisal`);
    setDepartmentId("");
    setActionError("");
  };

  const handleLaunch = async () => {
    if (!cycleLabel) {
      setActionError("Enter a cycle name");
      return;
    }
    setSubmitting(true);
    try {
      await initiateCycle({
        cycleLabel,
        financialYear,
        departmentId: departmentId ? (departmentId as Id<"departments">) : undefined,
      });
      setIsDrawerOpen(false);
      resetForm();
    } catch (err: any) {
      setActionError(err?.data?.message ?? err?.message ?? "Failed to launch cycle");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        icon={LineChart}
        title="Performance"
        subtitle="Contracts & Appraisal Cycles"
        stats={[
          { label: "Total Appraisals", value: appraisals.length },
          { label: "Pending", value: pendingCount, accentClass: "text-amber-600" },
          { label: "Submitted", value: submittedCount, accentClass: "text-blue-600" },
          { label: "Completed", value: completedCount, accentClass: "text-emerald-600" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/performance/reports"
              className="h-9 px-4 text-[12px] font-bold border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 flex items-center transition-colors"
            >
              <FileSpreadsheet size={14} className="mr-2" /> CIPMC Reports
            </Link>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="h-9 px-4 text-[12px] font-bold bg-[#202b5d] text-white rounded-lg hover:bg-[#161f47] flex items-center transition-colors shadow-sm"
            >
              <Plus size={14} className="mr-2" /> Initiate Cycle
            </button>
          </div>
        }
      />

      <div className="bg-white border border-paper-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-paper-200">
                <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">Employee</th>
                <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">Appraisal Cycle</th>
                <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">Score</th>
                <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-100">
              {appraisals.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <LineChart size={32} className="text-slate-300 mb-3" />
                      <span className="text-[14px] font-bold text-slate-600">No active appraisal cycles</span>
                    </div>
                  </td>
                </tr>
              ) : (
                appraisals.map((rec, i) => (
                  <motion.tr
                    key={rec._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(i, 10) * 0.02 }}
                    onClick={() => (window.location.href = `/performance/${rec._id}`)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 text-[13px] font-bold text-[#202b5d]">{employeeName(rec.employeeId)}</td>
                    <td className="px-4 py-3 text-[12px] text-slate-600">{rec.cycleLabel}</td>
                    <td className="px-4 py-3 text-[13px] font-bold text-text-primary">{rec.score !== undefined ? rec.score.toFixed(1) : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusStyles[rec.status]}`}>
                        {STATUS_LABELS[rec.status]}
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Initiate Cycle */}
      <SlideOver
        open={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); resetForm(); }}
        title="Initiate Appraisal Cycle"
        icon={Calendar}
        footer={
          <>
            <button onClick={() => { setIsDrawerOpen(false); resetForm(); }} className="px-4 h-9 text-[12px] font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
            <button
              onClick={handleLaunch}
              disabled={submitting}
              className="px-4 h-9 text-[12px] font-bold bg-[#202b5d] text-white hover:bg-[#161f47] rounded-lg transition-colors shadow-sm disabled:opacity-60"
            >
              {submitting ? "Launching..." : "Launch Cycle"}
            </button>
          </>
        }
      >
        {actionError && (
          <div className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">{actionError}</div>
        )}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Financial Year</label>
          <Select
            value={financialYear}
            onChange={(v) => {
              setFinancialYear(v);
              setCycleLabel(`FY ${v} Annual Appraisal`);
            }}
            options={financialYearOptions().map((fy) => ({ value: fy, label: `FY ${fy}` }))}
          />
          <p className="text-[11px] text-slate-400 mt-1">Only one cycle can be initiated per financial year.</p>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Cycle Name</label>
          <input
            type="text"
            value={cycleLabel}
            onChange={(e) => setCycleLabel(e.target.value)}
            className="w-full border border-slate-300 rounded-lg h-9 px-3 text-[13px] focus:ring-1 focus:ring-[#202b5d] focus:outline-none"
            placeholder="e.g. FY 2026/2027 Annual Review"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Target Department</label>
          <Select
            value={departmentId}
            onChange={setDepartmentId}
            options={[
              { value: "", label: "All Departments (County-wide)" },
              ...departments.map((d) => ({ value: d._id, label: d.name })),
            ]}
          />
        </div>
      </SlideOver>
    </div>
  );
}
