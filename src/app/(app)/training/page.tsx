"use client";

import { useState, useEffect } from "react";
import { GraduationCap, Plus, Award, CheckCircle2, ExternalLink, Save, Building2, CalendarRange } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import EmployeePicker from "@/components/EmployeePicker";
import PageHeader from "@/components/PageHeader";
import SlideOver from "@/components/SlideOver";

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function TrainingPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<Id<"trainingRecords"> | null>(null);
  const records = useQuery(api.trainingRecords.list) || [];
  const employees = useQuery(api.employees.list, {}) || [];
  const logTraining = useMutation(api.trainingRecords.logTraining);

  const [selectedEmployee, setSelectedEmployee] = useState<Doc<"employees"> | null>(null);
  const [title, setTitle] = useState("");
  const [institution, setInstitution] = useState("");
  const [nominationDate, setNominationDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  const employeeFor = (id: string) => employees.find((e) => e._id === id);
  const employeeName = (id: string) => employeeFor(id)?.fullName ?? "Unknown";

  const confirmedCount = records.filter((r) => r.attendanceConfirmed).length;
  const pendingCount = records.length - confirmedCount;
  const selectedRecord = records.find((r) => r._id === selectedId) ?? null;

  const resetForm = () => {
    setSelectedEmployee(null);
    setTitle("");
    setInstitution("");
    setNominationDate("");
    setStartDate("");
    setEndDate("");
    setActionError("");
  };

  const handleSubmit = async () => {
    if (!selectedEmployee || !title || !startDate || !endDate) {
      setActionError("Fill in employee, course title, and dates");
      return;
    }
    if (startDate < todayISO()) {
      setActionError("Start date cannot be in the past");
      return;
    }
    if (endDate < startDate) {
      setActionError("End date cannot be before the start date");
      return;
    }
    setActionError("");
    setSubmitting(true);
    try {
      await logTraining({
        employeeId: selectedEmployee._id,
        trainingTitle: title,
        institution: institution || undefined,
        nominationDate: nominationDate || startDate,
        startDate,
        endDate,
      });
      setIsDrawerOpen(false);
      resetForm();
    } catch (err: any) {
      setActionError(err?.data?.message ?? err?.message ?? "Failed to log training");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        icon={GraduationCap}
        title="Training"
        subtitle="Professional Development Records"
        stats={[
          { label: "Total Records", value: records.length },
          { label: "Attendance Confirmed", value: confirmedCount, accentClass: "text-emerald-600" },
          { label: "Awaiting Confirmation", value: pendingCount, accentClass: "text-amber-600" },
        ]}
        action={
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="h-9 px-4 text-[12px] font-bold bg-[#202b5d] text-white rounded-lg hover:bg-[#161f47] flex items-center transition-colors shadow-sm"
          >
            <Plus size={14} className="mr-2" /> Log Training
          </button>
        }
      />

      <div className="bg-white border border-paper-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-paper-200">
                <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">Employee</th>
                <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">Course / Certification</th>
                <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">Start</th>
                <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">End</th>
                <th className="px-4 py-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-100">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <GraduationCap size={32} className="text-slate-300 mb-3" />
                      <span className="text-[14px] font-bold text-slate-600">No training records found</span>
                      <span className="text-[12px] mt-1">Log a course or certification to get started.</span>
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
                    <td className="px-4 py-3 text-[12px] text-slate-600">{rec.trainingTitle}</td>
                    <td className="px-4 py-3 text-[12px] text-slate-600">{rec.startDate}</td>
                    <td className="px-4 py-3 text-[12px] text-slate-600">{rec.endDate}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        rec.attendanceConfirmed ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {rec.attendanceConfirmed ? "Confirmed" : "Pending"}
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Training */}
      <SlideOver
        open={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); resetForm(); }}
        title="Log Employee Training"
        icon={Award}
        footer={
          <>
            <button onClick={() => { setIsDrawerOpen(false); resetForm(); }} className="px-4 h-9 text-[12px] font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 h-9 text-[12px] font-bold bg-[#202b5d] text-white hover:bg-[#161f47] rounded-lg transition-colors shadow-sm disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save Record"}
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
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Course / Certification Name</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-slate-300 rounded-lg h-9 px-3 text-[13px] focus:ring-1 focus:ring-[#202b5d] focus:outline-none"
            placeholder="e.g. Senior Management Course (SMC)"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Institution</label>
          <input
            type="text"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            className="w-full border border-slate-300 rounded-lg h-9 px-3 text-[13px] focus:ring-1 focus:ring-[#202b5d] focus:outline-none"
            placeholder="e.g. Kenya School of Government"
          />
        </div>
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Start Date</label>
            <input
              type="date"
              min={todayISO()}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (endDate && endDate < e.target.value) setEndDate(e.target.value);
              }}
              className="w-full border border-slate-300 rounded-lg h-9 px-3 text-[13px] focus:ring-1 focus:ring-[#202b5d] focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">End Date</label>
            <input
              type="date"
              min={startDate || todayISO()}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-slate-300 rounded-lg h-9 px-3 text-[13px] focus:ring-1 focus:ring-[#202b5d] focus:outline-none"
            />
          </div>
        </div>
      </SlideOver>

      {/* Course Record Portal */}
      <SlideOver
        open={!!selectedRecord}
        onClose={() => setSelectedId(null)}
        title={selectedRecord ? employeeName(selectedRecord.employeeId) : ""}
        icon={GraduationCap}
      >
        {selectedRecord && (
          <CourseRecordBody record={selectedRecord} onClose={() => setSelectedId(null)} />
        )}
      </SlideOver>
    </div>
  );
}

function CourseRecordBody({
  record,
  onClose,
}: {
  record: Doc<"trainingRecords">;
  onClose: () => void;
}) {
  const confirmAttendance = useMutation(api.trainingRecords.confirmAttendance);
  const updateNotes = useMutation(api.trainingRecords.updateNotes);

  const [notes, setNotes] = useState(record.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setNotes(record.notes ?? "");
    setSaved(false);
  }, [record._id, record.notes]);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await confirmAttendance({ id: record._id });
    } finally {
      setConfirming(false);
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
      {/* Course card */}
      <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5">
        <p className="text-[14px] font-bold text-text-primary leading-snug mb-1">{record.trainingTitle}</p>
        {record.institution && (
          <p className="text-[12px] text-slate-500 flex items-center gap-1.5 mb-1">
            <Building2 size={12} /> {record.institution}
          </p>
        )}
        <p className="text-[12px] text-slate-500 flex items-center gap-1.5">
          <CalendarRange size={12} /> {record.startDate} – {record.endDate}
        </p>
        {record.nominationDate && (
          <p className="text-[11px] text-slate-400 mt-1">Nominated {record.nominationDate}</p>
        )}
      </div>

      {/* Attendance */}
      <div>
        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Attendance</p>
        {record.attendanceConfirmed ? (
          <div className="flex items-center gap-2 text-[12px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
            <CheckCircle2 size={15} /> Attendance confirmed
          </div>
        ) : (
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full h-9 flex items-center justify-center gap-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-[12px] font-bold transition-colors disabled:opacity-50"
          >
            <CheckCircle2 size={14} /> {confirming ? "Confirming..." : "Confirm Attendance"}
          </button>
        )}
      </div>

      {/* Notes */}
      <div>
        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Outcome / Notes</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border border-slate-300 rounded-lg p-3 text-[13px] focus:ring-1 focus:ring-[#202b5d] focus:outline-none h-24 resize-none"
          placeholder="Certification outcome, key takeaways, follow-up actions..."
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
        href={`/employees/${record.employeeId}?cluster=performance`}
        onClick={onClose}
        className="flex items-center justify-between px-3 h-10 border border-paper-200 rounded-lg text-[12px] font-bold text-[#202b5d] hover:bg-slate-50 transition-colors"
      >
        Open Employee Master Record <ExternalLink size={13} />
      </Link>
    </>
  );
}
