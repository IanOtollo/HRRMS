"use client";

import { useState, useEffect, use, Suspense } from "react";
import {
  ChevronLeft,
  Printer,
  Save,
  Plus,
  X,
  Star,
  ClipboardList,
  Target,
  Award,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

const STATUS_ORDER = ["pending", "submitted", "completed"];
const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  submitted: "Submitted",
  completed: "Completed",
};

type TargetRow = { target: string; achievement: string };
type WorkPlanRow = {
  directorateObjective: string;
  individualTargets: string;
  keyActivities: string;
  resourcesRequired: string;
  performanceIndicators: string;
  timeFrame: string;
};

const emptyTargetRow: TargetRow = { target: "", achievement: "" };
const emptyWorkPlanRow: WorkPlanRow = {
  directorateObjective: "",
  individualTargets: "",
  keyActivities: "",
  resourcesRequired: "",
  performanceIndicators: "",
  timeFrame: "",
};

const inputClass =
  "w-full border border-slate-300 rounded-lg p-2.5 text-[13px] focus:ring-1 focus:ring-[#202b5d] focus:outline-none resize-none";
const labelClass = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1";

function AppraisalPageInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const appraisalId = id as Id<"appraisals">;

  const appraisal = useQuery(api.appraisals.get, { id: appraisalId });
  const currentUser = useQuery(api.users.me);
  const departments = useQuery(api.departments.list) || [];

  if (appraisal === undefined || currentUser === undefined) {
    return <div className="p-8 text-center text-slate-400 text-sm">Loading appraisal...</div>;
  }
  if (appraisal === null) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        Appraisal not found. <Link href="/performance" className="text-county-blue underline">Back to Performance</Link>
      </div>
    );
  }

  const canRecommend = currentUser?.role === "super_admin" || currentUser?.role === "hr_director";
  const departmentName = departments.find((d) => d._id === appraisal.employee?.departmentId)?.name ?? "—";

  return (
    <AppraisalEditor
      appraisal={appraisal}
      departmentName={departmentName}
      canRecommend={canRecommend}
    />
  );
}

function AppraisalEditor({
  appraisal,
  departmentName,
  canRecommend,
}: {
  appraisal: any;
  departmentName: string;
  canRecommend: boolean;
}) {
  const employee = appraisal.employee;

  const saveTargets = useMutation(api.appraisals.saveTargets);
  const saveWorkPlan = useMutation(api.appraisals.saveWorkPlan);
  const saveRecommendation = useMutation(api.appraisals.saveRecommendation);
  const markSubmitted = useMutation(api.appraisals.markSubmitted);
  const submitScore = useMutation(api.appraisals.submitScore);
  const saveComments = useMutation(api.appraisals.saveComments);

  // Form 5 — Individual Work Plan
  const [workPlanPeriod, setWorkPlanPeriod] = useState(appraisal.workPlanPeriod ?? "");
  const [workPlan, setWorkPlan] = useState<WorkPlanRow[]>(
    appraisal.workPlan && appraisal.workPlan.length > 0 ? appraisal.workPlan : [{ ...emptyWorkPlanRow }]
  );
  const [savingWorkPlan, setSavingWorkPlan] = useState(false);
  const [workPlanSaved, setWorkPlanSaved] = useState(false);

  // Form 3 — Targets & Achievements
  const [targets, setTargets] = useState<TargetRow[]>(
    appraisal.targets && appraisal.targets.length > 0 ? appraisal.targets : [{ ...emptyTargetRow }]
  );
  const [additionalAssignments, setAdditionalAssignments] = useState<string[]>(
    appraisal.additionalAssignments && appraisal.additionalAssignments.length > 0 ? appraisal.additionalAssignments : [""]
  );
  const [savingTargets, setSavingTargets] = useState(false);
  const [targetsSaved, setTargetsSaved] = useState(false);

  // Score / recommendation / comments
  const [score, setScore] = useState(appraisal.score?.toString() ?? "");
  const [scoreError, setScoreError] = useState("");
  const [finalizing, setFinalizing] = useState(false);
  const [markingSubmitted, setMarkingSubmitted] = useState(false);

  const [mpmcRecommendation, setMpmcRecommendation] = useState(appraisal.mpmcRecommendation ?? "");
  const [mpmcRemarks, setMpmcRemarks] = useState(appraisal.mpmcRemarks ?? "");
  const [savingRecommendation, setSavingRecommendation] = useState(false);
  const [recommendationSaved, setRecommendationSaved] = useState(false);

  const [comments, setComments] = useState(appraisal.comments ?? "");
  const [savingComments, setSavingComments] = useState(false);
  const [commentsSaved, setCommentsSaved] = useState(false);

  useEffect(() => {
    setWorkPlanPeriod(appraisal.workPlanPeriod ?? "");
    setWorkPlan(appraisal.workPlan && appraisal.workPlan.length > 0 ? appraisal.workPlan : [{ ...emptyWorkPlanRow }]);
    setTargets(appraisal.targets && appraisal.targets.length > 0 ? appraisal.targets : [{ ...emptyTargetRow }]);
    setAdditionalAssignments(
      appraisal.additionalAssignments && appraisal.additionalAssignments.length > 0 ? appraisal.additionalAssignments : [""]
    );
    setScore(appraisal.score?.toString() ?? "");
    setMpmcRecommendation(appraisal.mpmcRecommendation ?? "");
    setMpmcRemarks(appraisal.mpmcRemarks ?? "");
    setComments(appraisal.comments ?? "");
  }, [appraisal._id]);

  const currentStatusIndex = STATUS_ORDER.indexOf(appraisal.status);

  // --- Work Plan handlers ---
  const updateWorkPlanRow = (index: number, field: keyof WorkPlanRow, value: string) => {
    setWorkPlan((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };
  const addWorkPlanRow = () => setWorkPlan((prev) => [...prev, { ...emptyWorkPlanRow }]);
  const removeWorkPlanRow = (index: number) => setWorkPlan((prev) => prev.filter((_, i) => i !== index));
  const handleSaveWorkPlan = async () => {
    setSavingWorkPlan(true);
    try {
      await saveWorkPlan({
        id: appraisal._id,
        workPlanPeriod,
        workPlan: workPlan.filter((r) => Object.values(r).some((v) => v.trim() !== "")),
      });
      setWorkPlanSaved(true);
      setTimeout(() => setWorkPlanSaved(false), 2000);
    } finally {
      setSavingWorkPlan(false);
    }
  };

  // --- Targets & Achievements handlers ---
  const updateTargetRow = (index: number, field: keyof TargetRow, value: string) => {
    setTargets((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };
  const addTargetRow = () => setTargets((prev) => [...prev, { ...emptyTargetRow }]);
  const removeTargetRow = (index: number) => setTargets((prev) => prev.filter((_, i) => i !== index));
  const updateAssignment = (index: number, value: string) => {
    setAdditionalAssignments((prev) => prev.map((a, i) => (i === index ? value : a)));
  };
  const addAssignment = () => setAdditionalAssignments((prev) => [...prev, ""]);
  const removeAssignment = (index: number) => setAdditionalAssignments((prev) => prev.filter((_, i) => i !== index));
  const handleSaveTargets = async () => {
    setSavingTargets(true);
    try {
      await saveTargets({
        id: appraisal._id,
        targets: targets.filter((r) => r.target.trim() !== "" || r.achievement.trim() !== ""),
        additionalAssignments: additionalAssignments.filter((a) => a.trim() !== ""),
      });
      setTargetsSaved(true);
      setTimeout(() => setTargetsSaved(false), 2000);
    } finally {
      setSavingTargets(false);
    }
  };

  // --- Score / status ---
  const handleMarkSubmitted = async () => {
    setMarkingSubmitted(true);
    try {
      await markSubmitted({ id: appraisal._id });
    } finally {
      setMarkingSubmitted(false);
    }
  };
  const handleFinalizeScore = async () => {
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

  // --- Recommendation ---
  const handleSaveRecommendation = async () => {
    setSavingRecommendation(true);
    try {
      await saveRecommendation({ id: appraisal._id, mpmcRecommendation, mpmcRemarks });
      setRecommendationSaved(true);
      setTimeout(() => setRecommendationSaved(false), 2000);
    } finally {
      setSavingRecommendation(false);
    }
  };

  // --- Comments ---
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
    <div className="max-w-5xl mx-auto p-4 md:p-6 pb-20 print:p-0 print:max-w-none">
      <div className="print:hidden space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/performance" className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-county-blue transition-colors">
            <ChevronLeft size={16} className="mr-1" /> Back to Performance
          </Link>
          <button
            onClick={() => window.print()}
            className="h-9 px-4 text-[12px] font-bold border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 flex items-center transition-colors"
          >
            <Printer size={14} className="mr-2" /> Print Form 3
          </button>
        </div>

        {/* Header band */}
        <div className="bg-white rounded-xl p-6 border border-paper-200 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-2xl font-semibold text-text-primary">{employee?.fullName ?? "Unknown"}</h1>
              <p className="text-[13px] text-slate-500 mt-0.5">{employee?.designation} · {departmentName}</p>
            </div>
            <div className="flex items-center gap-2 text-[12px]">
              <span className="font-mono bg-paper-100 px-2 py-1 rounded border border-paper-200">{appraisal.cycleLabel}</span>
              <span className="font-mono bg-paper-100 px-2 py-1 rounded border border-paper-200">P/F: {employee?.pfNumber}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 mt-5">
            {STATUS_ORDER.map((s, i) => (
              <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
                <div className={`h-1.5 w-full rounded-full ${i <= currentStatusIndex ? "bg-[#202b5d]" : "bg-slate-100"}`} />
                <span className={`text-[10px] font-bold uppercase tracking-wide ${i <= currentStatusIndex ? "text-[#202b5d]" : "text-slate-400"}`}>
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

        {/* CG/SPA Form 5 — Individual Work Plan */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl border border-paper-200 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-bold text-[#202b5d] flex items-center gap-2">
              <ClipboardList size={16} /> Individual Work Plan
            </h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CG/SPA Form 5</span>
          </div>

          <div className="mb-4">
            <label className={labelClass}>Period of Reporting</label>
            <input
              type="text"
              value={workPlanPeriod}
              onChange={(e) => setWorkPlanPeriod(e.target.value)}
              placeholder="e.g. FY 2026/2027, Quarter 1"
              className="w-full h-9 px-3 text-[13px] border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#202b5d]"
            />
          </div>

          <div className="space-y-3">
            {workPlan.map((row, i) => (
              <div key={i} className="border border-paper-100 rounded-lg p-3.5 relative bg-paper-50/30">
                {workPlan.length > 1 && (
                  <button
                    onClick={() => removeWorkPlanRow(i)}
                    className="absolute top-2 right-2 text-slate-400 hover:text-rust-700"
                  >
                    <X size={14} />
                  </button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-6">
                  <div>
                    <label className={labelClass}>Directorate Performance Objective</label>
                    <textarea
                      value={row.directorateObjective}
                      onChange={(e) => updateWorkPlanRow(i, "directorateObjective", e.target.value)}
                      className={`${inputClass} h-16`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Individual Targets</label>
                    <textarea
                      value={row.individualTargets}
                      onChange={(e) => updateWorkPlanRow(i, "individualTargets", e.target.value)}
                      className={`${inputClass} h-16`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Key Activities</label>
                    <textarea
                      value={row.keyActivities}
                      onChange={(e) => updateWorkPlanRow(i, "keyActivities", e.target.value)}
                      className={`${inputClass} h-16`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Resources Required</label>
                    <textarea
                      value={row.resourcesRequired}
                      onChange={(e) => updateWorkPlanRow(i, "resourcesRequired", e.target.value)}
                      className={`${inputClass} h-16`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Performance Indicators</label>
                    <textarea
                      value={row.performanceIndicators}
                      onChange={(e) => updateWorkPlanRow(i, "performanceIndicators", e.target.value)}
                      className={`${inputClass} h-16`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Time Frame</label>
                    <input
                      type="text"
                      value={row.timeFrame}
                      onChange={(e) => updateWorkPlanRow(i, "timeFrame", e.target.value)}
                      className="w-full h-9 px-3 text-[13px] border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#202b5d]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={addWorkPlanRow}
              className="h-8 px-3 text-[11px] font-bold border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Plus size={13} /> Add Item
            </button>
            <button
              onClick={handleSaveWorkPlan}
              disabled={savingWorkPlan}
              className="h-8 px-4 text-[11px] font-bold bg-[#202b5d] text-white hover:bg-[#161f47] rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Save size={12} /> {savingWorkPlan ? "Saving..." : workPlanSaved ? "Saved" : "Save Work Plan"}
            </button>
          </div>
        </motion.div>

        {/* CG/SPA Form 3 — Agreed Performance Targets & Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-white rounded-xl border border-paper-200 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-bold text-[#202b5d] flex items-center gap-2">
              <Target size={16} /> Agreed Performance Targets & Achievements
            </h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CG/SPA Form 3</span>
          </div>

          <div className="space-y-3">
            {targets.map((row, i) => (
              <div key={i} className="border border-paper-100 rounded-lg p-3.5 relative bg-paper-50/30">
                {targets.length > 1 && (
                  <button
                    onClick={() => removeTargetRow(i)}
                    className="absolute top-2 right-2 text-slate-400 hover:text-rust-700"
                  >
                    <X size={14} />
                  </button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-6">
                  <div>
                    <label className={labelClass}>{i + 1}. Agreed Performance Target</label>
                    <textarea
                      value={row.target}
                      onChange={(e) => updateTargetRow(i, "target", e.target.value)}
                      className={`${inputClass} h-16`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Achievement</label>
                    <textarea
                      value={row.achievement}
                      onChange={(e) => updateTargetRow(i, "achievement", e.target.value)}
                      className={`${inputClass} h-16`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={addTargetRow}
            className="mt-3 h-8 px-3 text-[11px] font-bold border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <Plus size={13} /> Add Target
          </button>

          <div className="mt-5 pt-5 border-t border-paper-100">
            <label className={labelClass}>Additional Assignments</label>
            <div className="space-y-2">
              {additionalAssignments.map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={a}
                    onChange={(e) => updateAssignment(i, e.target.value)}
                    className="flex-1 h-9 px-3 text-[13px] border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#202b5d]"
                  />
                  {additionalAssignments.length > 1 && (
                    <button onClick={() => removeAssignment(i)} className="text-slate-400 hover:text-rust-700">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addAssignment}
              className="mt-2 h-8 px-3 text-[11px] font-bold border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Plus size={13} /> Add Assignment
            </button>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={handleSaveTargets}
              disabled={savingTargets}
              className="h-8 px-4 text-[11px] font-bold bg-[#202b5d] text-white hover:bg-[#161f47] rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Save size={12} /> {savingTargets ? "Saving..." : targetsSaved ? "Saved" : "Save Targets & Achievements"}
            </button>
          </div>
        </motion.div>

        {/* Score & MPMC/CIPMC Recommendation */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-xl border border-paper-200 shadow-sm p-6"
        >
          <h2 className="text-[14px] font-bold text-[#202b5d] flex items-center gap-2 mb-4">
            <Star size={16} /> Score & CIPMC Recommendation
          </h2>

          {scoreError && <p className="text-[11px] text-red-600 mb-2">{scoreError}</p>}
          <div className="flex items-center gap-2 mb-5">
            <input
              type="number"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="w-28 h-9 px-3 text-[13px] border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#202b5d]"
              placeholder="Score 0–100"
            />
            <button
              onClick={handleFinalizeScore}
              disabled={finalizing}
              className="h-9 px-3 text-[11px] font-bold bg-[#202b5d] text-white hover:bg-[#161f47] rounded-lg transition-colors disabled:opacity-50"
            >
              {finalizing ? "Saving..." : appraisal.status === "completed" ? "Update Score" : "Finalize Score"}
            </button>
          </div>

          {canRecommend ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Recommendation by MPMC/CIPMC</label>
                  <input
                    type="text"
                    value={mpmcRecommendation}
                    onChange={(e) => setMpmcRecommendation(e.target.value)}
                    placeholder="e.g. Recommend for promotion"
                    className="w-full h-9 px-3 text-[13px] border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#202b5d]"
                  />
                </div>
                <div>
                  <label className={labelClass}>Remarks</label>
                  <input
                    type="text"
                    value={mpmcRemarks}
                    onChange={(e) => setMpmcRemarks(e.target.value)}
                    className="w-full h-9 px-3 text-[13px] border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#202b5d]"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleSaveRecommendation}
                  disabled={savingRecommendation}
                  className="h-8 px-4 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Save size={12} /> {savingRecommendation ? "Saving..." : recommendationSaved ? "Saved" : "Save Recommendation"}
                </button>
              </div>
            </>
          ) : (
            (appraisal.mpmcRecommendation || appraisal.mpmcRemarks) && (
              <div className="text-[12px] text-slate-500 bg-slate-50 border border-slate-100 rounded-lg p-3">
                <span className="font-bold text-slate-700">{appraisal.mpmcRecommendation}</span>
                {appraisal.mpmcRemarks && <p className="mt-1">{appraisal.mpmcRemarks}</p>}
              </div>
            )
          )}
        </motion.div>

        {/* Comments */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-white rounded-xl border border-paper-200 shadow-sm p-6"
        >
          <h2 className="text-[14px] font-bold text-[#202b5d] flex items-center gap-2 mb-3">
            <Award size={16} /> Supervisor's Comments
          </h2>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className={`${inputClass} h-24`}
            placeholder="Strengths, areas for improvement, development plan..."
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSaveComments}
              disabled={savingComments}
              className="h-8 px-4 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Save size={12} /> {savingComments ? "Saving..." : commentsSaved ? "Saved" : "Save Comments"}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Print-only CG/SPA Form 3 layout */}
      <div className="hidden print:block text-black">
        <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
          <div>
            <h1 className="text-lg font-bold">CG/SPA Form 3 — Staff Performance Appraisal</h1>
            <p className="text-xs">Busia County Government · HR Record Management System</p>
          </div>
          <p className="text-xs">Printed {new Date().toLocaleDateString()}</p>
        </div>

        <table className="w-full text-xs mb-4">
          <tbody>
            <tr><td className="py-1 pr-4 font-bold w-1/4">Division/Section/Unit</td><td className="py-1">{departmentName}</td></tr>
            <tr><td className="py-1 pr-4 font-bold">Quarter/Period</td><td className="py-1">{appraisal.cycleLabel}</td></tr>
            <tr><td className="py-1 pr-4 font-bold">Name of Officer</td><td className="py-1">{employee?.fullName}</td></tr>
            <tr><td className="py-1 pr-4 font-bold">Personal No.</td><td className="py-1">{employee?.pfNumber}</td></tr>
          </tbody>
        </table>

        <table className="w-full text-xs border-collapse mb-4">
          <thead>
            <tr>
              <th className="border border-black p-1.5 text-left w-10">S/No.</th>
              <th className="border border-black p-1.5 text-left">Agreed Performance Targets</th>
              <th className="border border-black p-1.5 text-left">Achievements</th>
            </tr>
          </thead>
          <tbody>
            {(appraisal.targets && appraisal.targets.length > 0 ? appraisal.targets : [emptyTargetRow]).map((row: TargetRow, i: number) => (
              <tr key={i}>
                <td className="border border-black p-1.5 align-top">{i + 1}.</td>
                <td className="border border-black p-1.5 align-top">{row.target}</td>
                <td className="border border-black p-1.5 align-top">{row.achievement}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="text-xs font-bold mb-1">Additional Assignments</p>
        <ol className="text-xs list-decimal list-inside mb-4">
          {(appraisal.additionalAssignments && appraisal.additionalAssignments.length > 0
            ? appraisal.additionalAssignments
            : ["", "", ""]
          ).map((a: string, i: number) => (
            <li key={i} className="border-b border-black/40 py-1">{a}</li>
          ))}
        </ol>

        <table className="w-full text-xs mt-8">
          <tbody>
            <tr>
              <td className="py-4 w-1/2">Name of Appraisee: {employee?.fullName}</td>
              <td className="py-4">Signature: ___________________ Date: ___________</td>
            </tr>
            <tr>
              <td className="py-4">Appraiser's Name: ___________________</td>
              <td className="py-4">Signature: ___________________ Date: ___________</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AppraisalPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <AppraisalPageInner params={params} />
    </Suspense>
  );
}
