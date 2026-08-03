"use client";

import { useState, useEffect, useRef } from "react";
import { LineChart, Plus, Calendar, Save, ExternalLink, ClipboardCheck, Star, FileText, Eye, Trash2, UploadCloud } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id, Doc } from "../../../../convex/_generated/dataModel";
import PageHeader from "@/components/PageHeader";
import Select from "@/components/Select";
import SlideOver from "@/components/SlideOver";

const STATUS_ORDER = ["pending", "submitted", "completed"];
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

export default function PerformancePage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<Id<"appraisals"> | null>(null);
  const appraisals = useQuery(api.appraisals.listByCycle, {}) || [];
  const employees = useQuery(api.employees.list, {}) || [];
  const departments = useQuery(api.departments.list) || [];
  const initiateCycle = useMutation(api.appraisals.initiateCycle);

  const [cycleLabel, setCycleLabel] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  const employeeFor = (id: string) => employees.find((e) => e._id === id);
  const employeeName = (id: string) => employeeFor(id)?.fullName ?? "Unknown";

  const completedCount = appraisals.filter((a) => a.status === "completed").length;
  const submittedCount = appraisals.filter((a) => a.status === "submitted").length;
  const pendingCount = appraisals.length - completedCount - submittedCount;
  const selectedAppraisal = appraisals.find((a) => a._id === selectedId) ?? null;

  const handleLaunch = async () => {
    if (!cycleLabel) {
      setActionError("Enter a cycle name");
      return;
    }
    setSubmitting(true);
    try {
      await initiateCycle({
        cycleLabel,
        departmentId: departmentId ? (departmentId as Id<"departments">) : undefined,
      });
      setIsDrawerOpen(false);
      setCycleLabel("");
      setDepartmentId("");
      setDeadline("");
      setActionError("");
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
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="h-9 px-4 text-[12px] font-bold bg-[#202b5d] text-white rounded-lg hover:bg-[#161f47] flex items-center transition-colors shadow-sm"
          >
            <Plus size={14} className="mr-2" /> Initiate Cycle
          </button>
        }
      />

      <ReferenceFormsSection />

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
                    onClick={() => setSelectedId(rec._id)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 text-[13px] font-bold text-[#202b5d]">{employeeName(rec.employeeId)}</td>
                    <td className="px-4 py-3 text-[12px] text-slate-600">{rec.cycleLabel}</td>
                    <td className="px-4 py-3 text-[13px] font-bold text-text-primary">{rec.score !== undefined ? rec.score.toFixed(1) : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusStyles[rec.status]}`}>
                        {rec.status}
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
        onClose={() => setIsDrawerOpen(false)}
        title="Initiate Appraisal Cycle"
        icon={Calendar}
        footer={
          <>
            <button onClick={() => setIsDrawerOpen(false)} className="px-4 h-9 text-[12px] font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
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
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Submission Deadline</label>
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full border border-slate-300 rounded-lg h-9 px-3 text-[13px] focus:ring-1 focus:ring-[#202b5d] focus:outline-none" />
        </div>
      </SlideOver>

      {/* Review Portal */}
      <SlideOver
        open={!!selectedAppraisal}
        onClose={() => setSelectedId(null)}
        title={selectedAppraisal ? employeeName(selectedAppraisal.employeeId) : ""}
        icon={ClipboardCheck}
      >
        {selectedAppraisal && (
          <ReviewPortalBody
            appraisal={selectedAppraisal}
            employee={employeeFor(selectedAppraisal.employeeId)}
            onClose={() => setSelectedId(null)}
          />
        )}
      </SlideOver>
    </div>
  );
}

function ReferenceFormsSection() {
  const currentUser = useQuery(api.users.me);
  const templates = useQuery(api.performanceTemplates.list) || [];
  const generateUploadUrl = useMutation(api.performanceTemplates.generateUploadUrl);
  const createTemplate = useMutation(api.performanceTemplates.create);
  const removeTemplate = useMutation(api.performanceTemplates.remove);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canManage =
    currentUser?.role === "super_admin" || currentUser?.role === "hr_director" || currentUser?.role === "records_officer";

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      await createTemplate({ title: file.name.replace(/\.[^.]+$/, ""), storageId });
    } catch (err: any) {
      setUploadError(err?.data?.message ?? err?.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = (id: Id<"performanceTemplates">, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    removeTemplate({ id });
  };

  if (templates.length === 0 && !canManage) return null;

  return (
    <div className="bg-white border border-paper-200 shadow-sm rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[13px] font-bold text-[#202b5d]">Reference Forms</p>
          <p className="text-[11px] text-slate-500">CG/SPA appraisal form templates for the current cycle</p>
        </div>
        {canManage && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-8 px-3 text-[11px] font-bold border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 disabled:opacity-60"
          >
            <UploadCloud size={13} /> {uploading ? "Uploading..." : "Upload Form"}
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFileSelect} />
      </div>

      {uploadError && <p className="text-[11px] text-red-700 mb-2">{uploadError}</p>}

      {templates.length === 0 ? (
        <p className="text-[12px] text-slate-400">No reference forms uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {templates.map((t) => (
            <div key={t._id} className="flex items-center gap-2 border border-paper-100 rounded-lg px-3 py-2 bg-paper-50/30">
              <FileText size={14} className="text-slate-400 shrink-0" />
              <span className="text-[12px] font-medium text-text-primary truncate flex-1 min-w-0">{t.title}</span>
              {t.url && (
                <a
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View"
                  className="w-7 h-7 flex items-center justify-center text-text-secondary bg-white hover:bg-paper-100 border border-paper-200 rounded transition-colors shrink-0"
                >
                  <Eye size={12} />
                </a>
              )}
              {canManage && (
                <button
                  onClick={() => handleDelete(t._id, t.title)}
                  title="Delete"
                  className="w-7 h-7 flex items-center justify-center text-rust-700 bg-white hover:bg-rust-700/10 border border-rust-700/20 rounded transition-colors shrink-0"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewPortalBody({
  appraisal,
  employee,
  onClose,
}: {
  appraisal: Doc<"appraisals">;
  employee: Doc<"employees"> | undefined;
  onClose: () => void;
}) {
  const markSubmitted = useMutation(api.appraisals.markSubmitted);
  const submitScore = useMutation(api.appraisals.submitScore);
  const saveComments = useMutation(api.appraisals.saveComments);

  const [score, setScore] = useState(appraisal.score?.toString() ?? "");
  const [comments, setComments] = useState(appraisal.comments ?? "");
  const [savingComments, setSavingComments] = useState(false);
  const [commentsSaved, setCommentsSaved] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [markingSubmitted, setMarkingSubmitted] = useState(false);
  const [scoreError, setScoreError] = useState("");

  useEffect(() => {
    setScore(appraisal.score?.toString() ?? "");
    setComments(appraisal.comments ?? "");
    setCommentsSaved(false);
  }, [appraisal._id, appraisal.score, appraisal.comments]);

  const currentIndex = STATUS_ORDER.indexOf(appraisal.status);

  const handleMarkSubmitted = async () => {
    setMarkingSubmitted(true);
    try {
      await markSubmitted({ id: appraisal._id });
    } finally {
      setMarkingSubmitted(false);
    }
  };

  const handleFinalize = async () => {
    const parsed = parseFloat(score);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
      setScoreError("Enter a score between 0 and 100");
      return;
    }
    setScoreError("");
    setFinalizing(true);
    try {
      await submitScore({ id: appraisal._id, score: parsed });
    } finally {
      setFinalizing(false);
    }
  };

  const handleSaveComments = async () => {
    setSavingComments(true);
    try {
      await saveComments({ id: appraisal._id, comments });
      setCommentsSaved(true);
      setTimeout(() => setCommentsSaved(false), 2000);
    } finally {
      setSavingComments(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3 text-[12px]">
        <div>
          <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold mb-0.5">Cycle</p>
          <p className="font-bold text-text-primary">{appraisal.cycleLabel}</p>
        </div>
        <div>
          <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold mb-0.5">Designation</p>
          <p className="font-medium text-text-primary">{employee?.designation ?? "—"}</p>
        </div>
      </div>

      {/* Compact 3-state progress */}
      <div>
        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">Review Progress</p>
        <div className="flex items-center gap-1">
          {STATUS_ORDER.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
              <div className={`h-1.5 w-full rounded-full ${i <= currentIndex ? "bg-[#202b5d]" : "bg-slate-100"}`} />
              <span className={`text-[10px] font-bold uppercase tracking-wide ${i <= currentIndex ? "text-[#202b5d]" : "text-slate-400"}`}>
                {STATUS_LABELS[s]}
              </span>
            </div>
          ))}
        </div>
        {appraisal.status === "pending" && (
          <button
            onClick={handleMarkSubmitted}
            disabled={markingSubmitted}
            className="mt-3 w-full h-8 text-[11px] font-bold border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {markingSubmitted ? "Marking..." : "Mark as Submitted for Review"}
          </button>
        )}
      </div>

      {/* Score */}
      <div>
        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <Star size={12} /> Score
        </p>
        {scoreError && <p className="text-[11px] text-red-600 mb-1.5">{scoreError}</p>}
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={100}
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="w-24 h-9 px-3 text-[13px] border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#202b5d]"
            placeholder="0–100"
          />
          <button
            onClick={handleFinalize}
            disabled={finalizing}
            className="h-9 px-3 text-[11px] font-bold bg-[#202b5d] text-white hover:bg-[#161f47] rounded-lg transition-colors disabled:opacity-50"
          >
            {finalizing ? "Saving..." : appraisal.status === "completed" ? "Update Score" : "Finalize Score"}
          </button>
        </div>
      </div>

      {/* Comments */}
      <div>
        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Reviewer Comments</p>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className="w-full border border-slate-300 rounded-lg p-3 text-[13px] focus:ring-1 focus:ring-[#202b5d] focus:outline-none h-24 resize-none"
          placeholder="Strengths, areas for improvement, development plan..."
        />
        <button
          onClick={handleSaveComments}
          disabled={savingComments || comments === (appraisal.comments ?? "")}
          className="mt-2 h-8 px-3 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          <Save size={12} /> {savingComments ? "Saving..." : commentsSaved ? "Saved" : "Save Comments"}
        </button>
      </div>

      <Link
        href={`/employees/${appraisal.employeeId}?cluster=performance`}
        onClick={onClose}
        className="flex items-center justify-between px-3 h-10 border border-paper-200 rounded-lg text-[12px] font-bold text-[#202b5d] hover:bg-slate-50 transition-colors"
      >
        Open Employee Master Record <ExternalLink size={13} />
      </Link>
    </>
  );
}
