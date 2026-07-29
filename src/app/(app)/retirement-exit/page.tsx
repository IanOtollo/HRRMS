"use client";

import { useState, useEffect } from "react";
import { DoorOpen, Plus, UserMinus, ExternalLink, Save, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import EmployeePicker from "@/components/EmployeePicker";
import PageHeader from "@/components/PageHeader";
import Select from "@/components/Select";
import SlideOver from "@/components/SlideOver";

const STAGE_LABELS: Record<string, string> = {
  notice_filed: "Notice Filed",
  clearance: "Clearance",
  exit_interview: "Exit Interview",
  finalized: "Finalized",
};

const STAGE_ORDER = ["notice_filed", "clearance", "exit_interview", "finalized"];

const stageStyles: Record<string, string> = {
  notice_filed: "bg-amber-100 text-amber-700",
  clearance: "bg-blue-100 text-blue-700",
  exit_interview: "bg-purple-100 text-purple-700",
  finalized: "bg-green-100 text-green-700",
};

const EXIT_TYPE_LABELS: Record<string, string> = {
  retirement: "Retirement",
  resignation: "Resignation",
  termination: "Termination",
};

export default function RetirementExitPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<Id<"exitRecords"> | null>(null);
  const records = useQuery(api.exitRecords.list) || [];
  const employees = useQuery(api.employees.list, {}) || [];
  const initiateExit = useMutation(api.exitRecords.initiateExit);

  const [selectedEmployee, setSelectedEmployee] = useState<Doc<"employees"> | null>(null);
  const [exitType, setExitType] = useState("retirement");
  const [noticeDate, setNoticeDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  const employeeFor = (id: string) => employees.find((e) => e._id === id);
  const employeeName = (id: string) => employeeFor(id)?.fullName ?? "Unknown";

  const activeCount = records.filter((r) => r.stage !== "finalized").length;
  const finalizedCount = records.length - activeCount;
  const selectedRecord = records.find((r) => r._id === selectedId) ?? null;

  const resetForm = () => {
    setSelectedEmployee(null);
    setExitType("retirement");
    setNoticeDate("");
    setActionError("");
  };

  const handleSubmit = async () => {
    if (!selectedEmployee || !noticeDate) {
      setActionError("Select an employee and a notice date");
      return;
    }
    setSubmitting(true);
    try {
      await initiateExit({
        employeeId: selectedEmployee._id,
        exitType: exitType as any,
        noticeDate,
      });
      setIsDrawerOpen(false);
      resetForm();
    } catch (err: any) {
      setActionError(err?.data?.message ?? err?.message ?? "Failed to initiate exit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        icon={DoorOpen}
        title="Retirement & Exit"
        subtitle="Clearance Pipeline"
        stats={[
          { label: "Total Pipelines", value: records.length },
          { label: "In Progress", value: activeCount, accentClass: "text-amber-600" },
          { label: "Finalized", value: finalizedCount, accentClass: "text-emerald-600" },
        ]}
        action={
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="h-9 px-4 text-[12px] font-bold bg-[#202b5d] text-white rounded-lg hover:bg-[#161f47] flex items-center transition-colors shadow-sm"
          >
            <Plus size={14} className="mr-2" /> Initiate Exit
          </button>
        }
      />

      <div className="bg-white border border-paper-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-paper-200">
                <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">Employee</th>
                <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">Exit Type</th>
                <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">Notice Date</th>
                <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-100">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <DoorOpen size={32} className="text-slate-300 mb-3" />
                      <span className="text-[14px] font-bold text-slate-600">No active exit pipelines</span>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((rec, i) => (
                  <motion.tr
                    key={rec._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(i, 10) * 0.02 }}
                    onClick={() => setSelectedId(rec._id)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 text-[13px] font-bold text-[#202b5d]">{employeeName(rec.employeeId)}</td>
                    <td className="px-4 py-3 text-[12px] text-slate-600">{EXIT_TYPE_LABELS[rec.exitType]}</td>
                    <td className="px-4 py-3 text-[12px] text-slate-600">{rec.noticeDate}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${stageStyles[rec.stage]}`}>
                        {STAGE_LABELS[rec.stage]}
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Initiate Exit */}
      <SlideOver
        open={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); resetForm(); }}
        title="Initiate Employee Exit"
        icon={UserMinus}
        footer={
          <>
            <button onClick={() => { setIsDrawerOpen(false); resetForm(); }} className="px-4 h-9 text-[12px] font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 h-9 text-[12px] font-bold bg-[#202b5d] text-white hover:bg-[#161f47] rounded-lg transition-colors shadow-sm disabled:opacity-60"
            >
              {submitting ? "Starting..." : "Start Clearance Pipeline"}
            </button>
          </>
        }
      >
        {actionError && (
          <div className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">{actionError}</div>
        )}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Employee</label>
          <EmployeePicker value={selectedEmployee} onChange={setSelectedEmployee} />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Exit Type</label>
          <Select
            value={exitType}
            onChange={setExitType}
            options={[
              { value: "retirement", label: "Retirement" },
              { value: "resignation", label: "Resignation" },
              { value: "termination", label: "Termination" },
            ]}
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Effective Date of Exit</label>
          <input type="date" value={noticeDate} onChange={(e) => setNoticeDate(e.target.value)} className="w-full border border-slate-300 rounded-lg h-9 px-3 text-[13px] focus:ring-1 focus:ring-[#202b5d] focus:outline-none" />
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start">
          <p className="text-[11px] text-yellow-800">
            <strong className="font-bold">Notice:</strong> Finalizing this exit will update the employee's employment status automatically.
          </p>
        </div>
      </SlideOver>

      {/* Clearance Portal */}
      <SlideOver
        open={!!selectedRecord}
        onClose={() => setSelectedId(null)}
        title={selectedRecord ? employeeName(selectedRecord.employeeId) : ""}
        icon={DoorOpen}
      >
        {selectedRecord && (
          <ClearancePortalBody
            record={selectedRecord}
            employee={employeeFor(selectedRecord.employeeId)}
            onClose={() => setSelectedId(null)}
          />
        )}
      </SlideOver>
    </div>
  );
}

function ClearancePortalBody({
  record,
  employee,
  onClose,
}: {
  record: Doc<"exitRecords">;
  employee: Doc<"employees"> | undefined;
  onClose: () => void;
}) {
  const advanceStage = useMutation(api.exitRecords.advanceStage);
  const updateNotes = useMutation(api.exitRecords.updateNotes);

  const [notes, setNotes] = useState(record.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [changingStage, setChangingStage] = useState(false);

  useEffect(() => {
    setNotes(record.notes ?? "");
    setSaved(false);
  }, [record._id, record.notes]);

  const currentIndex = STAGE_ORDER.indexOf(record.stage);
  const isFinalized = record.stage === "finalized";

  const jumpToStage = async (stageValue: string) => {
    if (stageValue === record.stage) return;
    setChangingStage(true);
    try {
      await advanceStage({ id: record._id, stage: stageValue as any });
    } finally {
      setChangingStage(false);
    }
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      await updateNotes({ id: record._id, notes });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3 text-[12px]">
        <div>
          <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold mb-0.5">Exit Type</p>
          <p className="font-bold text-text-primary">{EXIT_TYPE_LABELS[record.exitType]}</p>
        </div>
        <div>
          <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold mb-0.5">Designation</p>
          <p className="font-medium text-text-primary">{employee?.designation ?? "—"}</p>
        </div>
        <div>
          <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold mb-0.5">Notice Filed</p>
          <p className="font-medium text-text-primary">{record.noticeDate}</p>
        </div>
        <div>
          <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold mb-0.5">Finalized</p>
          <p className="font-medium text-text-primary">{record.finalizedDate ?? "—"}</p>
        </div>
      </div>

      {!isFinalized && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-[11px] text-amber-800">
            Marking this pipeline as <strong>Finalized</strong> will automatically update {employee?.fullName ?? "the employee"}'s employment status to {record.exitType === "retirement" ? "Retired" : "Terminated"}.
          </p>
        </div>
      )}

      <div>
        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">Clearance Checklist</p>
        <div className="space-y-1.5">
          {STAGE_ORDER.map((stageValue, i) => {
            const isActive = stageValue === record.stage;
            const isPast = i < currentIndex;
            return (
              <button
                key={stageValue}
                onClick={() => jumpToStage(stageValue)}
                disabled={changingStage}
                className={`w-full flex items-center gap-2.5 px-3 h-9 rounded-lg text-[12px] font-bold transition-colors text-left disabled:opacity-50 ${
                  isActive
                    ? "bg-[#202b5d] text-white"
                    : isPast
                    ? "bg-[#202b5d]/5 text-[#202b5d] hover:bg-[#202b5d]/10"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                {isPast || isActive ? <CheckCircle2 size={14} className="shrink-0" /> : <span className="w-3.5 h-3.5 rounded-full border-2 border-current shrink-0" />}
                {STAGE_LABELS[stageValue]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Clearance / Exit Interview Notes</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border border-slate-300 rounded-lg p-3 text-[13px] focus:ring-1 focus:ring-[#202b5d] focus:outline-none h-24 resize-none"
          placeholder="Outstanding items, handover status, exit interview feedback..."
        />
        <button
          onClick={saveNotes}
          disabled={saving || notes === (record.notes ?? "")}
          className="mt-2 h-8 px-3 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          <Save size={12} /> {saving ? "Saving..." : saved ? "Saved" : "Save Notes"}
        </button>
      </div>

      <Link
        href={`/employees/${record.employeeId}?cluster=exit`}
        onClick={onClose}
        className="flex items-center justify-between px-3 h-10 border border-paper-200 rounded-lg text-[12px] font-bold text-[#202b5d] hover:bg-slate-50 transition-colors"
      >
        Open Employee Master Record <ExternalLink size={13} />
      </Link>
    </>
  );
}
