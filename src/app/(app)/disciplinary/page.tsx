"use client";

import { useState, useEffect } from "react";
import { Scale, Plus, AlertTriangle, ShieldOff, ExternalLink, Save, Lock, CheckCircle2 } from "lucide-react";
import ErrorState from "@/components/ErrorState";
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
  warning: "Warning Letter",
  show_cause: "Show Cause Letter",
  interdiction: "Interdiction / Suspension",
  committee_decision: "Committee Decision",
  closed: "Closed",
};

const STAGE_ORDER = ["warning", "show_cause", "interdiction", "committee_decision", "closed"];

const stageStyles: Record<string, string> = {
  warning: "bg-amber-100 text-amber-700",
  show_cause: "bg-orange-100 text-orange-700",
  interdiction: "bg-red-100 text-red-700",
  committee_decision: "bg-purple-100 text-purple-700",
  closed: "bg-slate-100 text-slate-600",
};

export default function DisciplinaryPage() {
  const currentUser = useQuery(api.users.me);

  if (currentUser === undefined) return null;

  if (currentUser?.role === "department_viewer") {
    return (
      <div className="p-4 md:p-6">
        <ErrorState
          code={403}
          icon={ShieldOff}
          title="Access Restricted"
          message="Disciplinary records are confidential and not available to your role."
        />
      </div>
    );
  }

  return <DisciplinaryContent currentUser={currentUser} />;
}

function DisciplinaryContent({ currentUser }: { currentUser: any }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<Id<"disciplinaryRecords"> | null>(null);
  const records = useQuery(api.disciplinaryRecords.list) || [];
  const employees = useQuery(api.employees.list, {}) || [];
  const openCase = useMutation(api.disciplinaryRecords.openCase);

  const [selectedEmployee, setSelectedEmployee] = useState<Doc<"employees"> | null>(null);
  const [stage, setStage] = useState("warning");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  const employeeFor = (id: string) => employees.find((e) => e._id === id);
  const employeeName = (id: string) => employeeFor(id)?.fullName ?? "Unknown";

  const openCount = records.filter((r) => r.stage !== "closed").length;
  const closedCount = records.length - openCount;
  const selectedCase = records.find((r) => r._id === selectedCaseId) ?? null;

  const resetForm = () => {
    setSelectedEmployee(null);
    setStage("warning");
    setNotes("");
    setActionError("");
  };

  const handleSubmit = async () => {
    if (!selectedEmployee) {
      setActionError("Select an employee");
      return;
    }
    setSubmitting(true);
    try {
      await openCase({
        employeeId: selectedEmployee._id,
        stage: stage as any,
        restrictedNotes: notes || undefined,
      });
      setIsDrawerOpen(false);
      resetForm();
    } catch (err: any) {
      setActionError(err?.data?.message ?? err?.message ?? "Failed to log case");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        icon={Scale}
        title="Disciplinary"
        subtitle="Confidential Records Pipeline"
        stats={[
          { label: "Total Cases", value: records.length },
          { label: "Open Cases", value: openCount, accentClass: "text-red-700" },
          { label: "Closed Cases", value: closedCount, accentClass: "text-slate-500" },
        ]}
        action={
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="h-9 px-4 text-[12px] font-bold bg-red-700 text-white rounded-lg hover:bg-red-800 flex items-center transition-colors shadow-sm"
          >
            <Plus size={14} className="mr-2" /> Log Action
          </button>
        }
      />

      <div className="bg-white border border-paper-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-paper-200">
                <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">Employee</th>
                <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">Case Reference</th>
                <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">Date Opened</th>
                <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-100">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Scale size={32} className="text-slate-300 mb-3" />
                      <span className="text-[14px] font-bold text-slate-600">No disciplinary records</span>
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
                    onClick={() => setSelectedCaseId(rec._id)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 text-[13px] font-bold text-[#202b5d]">{employeeName(rec.employeeId)}</td>
                    <td className="px-4 py-3 text-[12px] text-slate-600 font-mono">{rec.caseReference}</td>
                    <td className="px-4 py-3 text-[12px] text-slate-600">{new Date(rec.openedAt).toLocaleDateString()}</td>
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

      {/* Log New Case */}
      <SlideOver
        open={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); resetForm(); }}
        title="Log Disciplinary Incident"
        icon={AlertTriangle}
        accentClass="bg-red-700"
        headerClass="bg-red-50"
        footer={
          <>
            <button onClick={() => { setIsDrawerOpen(false); resetForm(); }} className="px-4 h-9 text-[12px] font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 h-9 text-[12px] font-bold bg-red-700 text-white hover:bg-red-800 rounded-lg transition-colors shadow-sm disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save Confidential Record"}
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
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Incident Stage</label>
          <Select
            value={stage}
            onChange={setStage}
            options={[
              { value: "warning", label: "Warning Letter" },
              { value: "show_cause", label: "Show Cause Letter" },
              { value: "interdiction", label: "Interdiction / Suspension" },
            ]}
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Incident Summary (Confidential)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-3 text-[13px] focus:ring-1 focus:ring-red-700 focus:outline-none h-28 resize-none"
            placeholder="Describe the incident securely..."
          />
        </div>
      </SlideOver>

      {/* Case Portal */}
      <SlideOver
        open={!!selectedCase}
        onClose={() => setSelectedCaseId(null)}
        title={selectedCase ? employeeName(selectedCase.employeeId) : ""}
        icon={Scale}
        accentClass="bg-red-700"
        headerClass="bg-red-50"
      >
        {selectedCase && (
          <CasePortalBody
            record={selectedCase}
            employee={employeeFor(selectedCase.employeeId)}
            currentUser={currentUser}
            onClose={() => setSelectedCaseId(null)}
          />
        )}
      </SlideOver>
    </div>
  );
}

function CasePortalBody({
  record,
  employee,
  currentUser,
  onClose,
}: {
  record: Doc<"disciplinaryRecords">;
  employee: Doc<"employees"> | undefined;
  currentUser: any;
  onClose: () => void;
}) {
  const advanceStage = useMutation(api.disciplinaryRecords.advanceStage);
  const updateNotes = useMutation(api.disciplinaryRecords.updateNotes);

  const [notes, setNotes] = useState(record.restrictedNotes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [changingStage, setChangingStage] = useState(false);

  useEffect(() => {
    setNotes(record.restrictedNotes ?? "");
    setNotesSaved(false);
  }, [record._id, record.restrictedNotes]);

  const canEditNotes = currentUser?.role === "super_admin" || currentUser?.role === "hr_director";
  const currentStageIndex = STAGE_ORDER.indexOf(record.stage);

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
    setSavingNotes(true);
    try {
      await updateNotes({ id: record._id, restrictedNotes: notes });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <>
      {/* Case summary */}
      <div className="grid grid-cols-2 gap-3 text-[12px]">
        <div>
          <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold mb-0.5">Case Reference</p>
          <p className="font-mono font-bold text-text-primary">{record.caseReference}</p>
        </div>
        <div>
          <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold mb-0.5">Department</p>
          <p className="font-medium text-text-primary">{employee?.designation ?? "—"}</p>
        </div>
        <div>
          <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold mb-0.5">Opened</p>
          <p className="font-medium text-text-primary">{new Date(record.openedAt).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold mb-0.5">Closed</p>
          <p className="font-medium text-text-primary">{record.closedAt ? new Date(record.closedAt).toLocaleDateString() : "—"}</p>
        </div>
      </div>

      {/* Stage pipeline */}
      <div>
        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">Case Stage</p>
        <div className="space-y-1.5">
          {STAGE_ORDER.map((stageValue, i) => {
            const isActive = stageValue === record.stage;
            const isPast = i < currentStageIndex;
            return (
              <button
                key={stageValue}
                onClick={() => jumpToStage(stageValue)}
                disabled={changingStage}
                className={`w-full flex items-center gap-2.5 px-3 h-9 rounded-lg text-[12px] font-bold transition-colors text-left disabled:opacity-50 ${
                  isActive
                    ? "bg-red-700 text-white"
                    : isPast
                    ? "bg-red-50 text-red-700 hover:bg-red-100"
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

      {/* Confidential notes */}
      <div>
        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Confidential Notes</p>
        {canEditNotes ? (
          <>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-3 text-[13px] focus:ring-1 focus:ring-red-700 focus:outline-none h-24 resize-none"
              placeholder="No notes recorded yet..."
            />
            <button
              onClick={saveNotes}
              disabled={savingNotes || notes === (record.restrictedNotes ?? "")}
              className="mt-2 h-8 px-3 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Save size={12} /> {savingNotes ? "Saving..." : notesSaved ? "Saved" : "Save Notes"}
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2 text-[12px] text-slate-400 bg-slate-50 border border-slate-100 rounded-lg p-3">
            <Lock size={13} /> Confidential — not visible to your role
          </div>
        )}
      </div>

      {/* Link to employee record */}
      <Link
        href={`/employees/${record.employeeId}?cluster=disciplinary`}
        onClick={onClose}
        className="flex items-center justify-between px-3 h-10 border border-paper-200 rounded-lg text-[12px] font-bold text-[#202b5d] hover:bg-slate-50 transition-colors"
      >
        Open Employee Master Record <ExternalLink size={13} />
      </Link>
    </>
  );
}
