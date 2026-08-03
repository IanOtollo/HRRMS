"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, Printer, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import Select from "@/components/Select";

export default function PerformanceReportsPage() {
  const appraisals = useQuery(api.appraisals.listByCycle, {}) || [];
  const employees = useQuery(api.employees.list, {}) || [];
  const departments = useQuery(api.departments.list) || [];

  const cycleOptions = useMemo(() => {
    const labels = Array.from(new Set(appraisals.map((a) => a.cycleLabel)));
    return labels.sort();
  }, [appraisals]);

  const [cycleLabel, setCycleLabel] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const effectiveCycle = cycleLabel || cycleOptions[0] || "";
  const department = departments.find((d) => d._id === departmentId);

  const employeeFor = (id: string) => employees.find((e) => e._id === id);

  const rows = useMemo(() => {
    return appraisals
      .filter((a) => a.cycleLabel === effectiveCycle)
      .filter((a) => {
        if (!departmentId) return true;
        const emp = employeeFor(a.employeeId);
        return emp?.departmentId === departmentId;
      })
      .map((a) => {
        const employee = employeeFor(a.employeeId);
        const supervisor = employee?.supervisorId ? employeeFor(employee.supervisorId) : undefined;
        return { appraisal: a, employee, supervisor };
      })
      .filter((r) => r.employee);
  }, [appraisals, effectiveCycle, departmentId, employees]);

  const deptStaffCount = departmentId ? employees.filter((e) => e.departmentId === departmentId).length : employees.length;
  const appraisedCount = rows.filter((r) => r.appraisal.score !== undefined).length;
  const recommendedCount = rows.filter((r) => r.appraisal.mpmcRecommendation).length;

  return (
    <div className="p-4 md:p-6 print:p-0">
      <div className="print:hidden space-y-4 mb-6">
        <Link href="/performance" className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-county-blue transition-colors">
          <ChevronLeft size={16} className="mr-1" /> Back to Performance
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#202b5d] flex items-center gap-2">
              <FileSpreadsheet size={20} /> CIPMC Reports
            </h1>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mt-1">Annex VII &amp; CG/SPA Form 4</p>
          </div>
          <button
            onClick={() => window.print()}
            className="h-9 px-4 text-[12px] font-bold border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 flex items-center transition-colors"
          >
            <Printer size={14} className="mr-2" /> Print
          </button>
        </div>

        <div className="bg-white border border-paper-200 shadow-sm rounded-xl p-4 flex flex-wrap items-end gap-4">
          <div className="w-56">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Cycle</label>
            <Select
              value={effectiveCycle}
              onChange={setCycleLabel}
              placeholder="Select a cycle"
              options={cycleOptions.map((c) => ({ value: c, label: c }))}
            />
          </div>
          <div className="w-64">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Department</label>
            <Select
              value={departmentId}
              onChange={setDepartmentId}
              options={[
                { value: "", label: "All Departments" },
                ...departments.map((d) => ({ value: d._id, label: d.name })),
              ]}
            />
          </div>
        </div>
      </div>

      {!effectiveCycle ? (
        <p className="text-[13px] text-slate-400">No appraisal cycles yet — initiate one from the Performance page.</p>
      ) : (
        <div className="space-y-8 text-black">
          {/* Annex VII — Departmental Summary of SPAS Reports to CIPMC */}
          <section className="bg-white border border-paper-200 shadow-sm rounded-xl p-6 print:border-0 print:shadow-none print:rounded-none">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Annex VII · CG/SPA Form 3</p>
            <h2 className="text-base font-bold mb-3">Departmental Summary of SPAS Reports to CIPMC</h2>
            <table className="w-full text-xs mb-4">
              <tbody>
                <tr><td className="py-1 pr-4 font-bold w-1/4">Department</td><td className="py-1">{department?.name ?? "All Departments"}</td></tr>
                <tr><td className="py-1 pr-4 font-bold">Period of Reporting</td><td className="py-1">{effectiveCycle}</td></tr>
              </tbody>
            </table>

            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="border border-black p-1.5 text-left w-10">S/No.</th>
                  <th className="border border-black p-1.5 text-left">Personal No.</th>
                  <th className="border border-black p-1.5 text-left">Name of Officer</th>
                  <th className="border border-black p-1.5 text-left">Designation</th>
                  <th className="border border-black p-1.5 text-left">Scale / Pay Grade</th>
                  <th className="border border-black p-1.5 text-left">Name of Supervisor</th>
                  <th className="border border-black p-1.5 text-left">Designation of Supervisor</th>
                  <th className="border border-black p-1.5 text-left">Rating %</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={8} className="border border-black p-3 text-center text-slate-400">No appraisals for this selection</td></tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={r.appraisal._id}>
                      <td className="border border-black p-1.5 align-top">{i + 1}</td>
                      <td className="border border-black p-1.5 align-top">{r.employee!.pfNumber}</td>
                      <td className="border border-black p-1.5 align-top">{r.employee!.fullName}</td>
                      <td className="border border-black p-1.5 align-top">{r.employee!.designation}</td>
                      <td className="border border-black p-1.5 align-top">{r.employee!.jobGroup ?? "—"}</td>
                      <td className="border border-black p-1.5 align-top">{r.supervisor?.fullName ?? "—"}</td>
                      <td className="border border-black p-1.5 align-top">{r.supervisor?.designation ?? "—"}</td>
                      <td className="border border-black p-1.5 align-top">{r.appraisal.score !== undefined ? r.appraisal.score.toFixed(1) : "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <table className="w-full text-xs mt-8">
              <tbody>
                <tr><td className="py-4">Head of Directorate Remarks: ___________________________________________</td></tr>
                <tr><td className="py-4">Name: ___________________________ Signature: ___________________ Date: ___________</td></tr>
              </tbody>
            </table>
          </section>

          {/* CG/SPA Form 4 — Recommendation to the County Executive Committee by CIPMC */}
          <section className="bg-white border border-paper-200 shadow-sm rounded-xl p-6 print:border-0 print:shadow-none print:rounded-none">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Annex VIII · CG/SPA Form 4</p>
            <h2 className="text-base font-bold mb-3">Recommendation to the County Executive Committee by CIPMC</h2>
            <table className="w-full text-xs mb-4">
              <tbody>
                <tr><td className="py-1 pr-4 font-bold w-1/3">Period of Reporting</td><td className="py-1">{effectiveCycle}</td></tr>
                <tr><td className="py-1 pr-4 font-bold">Total Number of Staff</td><td className="py-1">{deptStaffCount}</td></tr>
                <tr><td className="py-1 pr-4 font-bold">Number of Officers Appraised</td><td className="py-1">{appraisedCount}</td></tr>
                <tr><td className="py-1 pr-4 font-bold">Number with a Recommendation Recorded</td><td className="py-1">{recommendedCount}</td></tr>
              </tbody>
            </table>

            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="border border-black p-1.5 text-left w-10">S/No.</th>
                  <th className="border border-black p-1.5 text-left">Name of Officer &amp; Personal No.</th>
                  <th className="border border-black p-1.5 text-left">Designation</th>
                  <th className="border border-black p-1.5 text-left">Salary Scale</th>
                  <th className="border border-black p-1.5 text-left">Directorate</th>
                  <th className="border border-black p-1.5 text-left">Score (%)</th>
                  <th className="border border-black p-1.5 text-left">Recommendation by the MPMC</th>
                  <th className="border border-black p-1.5 text-left">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={8} className="border border-black p-3 text-center text-slate-400">No appraisals for this selection</td></tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={r.appraisal._id}>
                      <td className="border border-black p-1.5 align-top">{i + 1}</td>
                      <td className="border border-black p-1.5 align-top">{r.employee!.fullName} ({r.employee!.pfNumber})</td>
                      <td className="border border-black p-1.5 align-top">{r.employee!.designation}</td>
                      <td className="border border-black p-1.5 align-top">{r.employee!.jobGroup ?? "—"}</td>
                      <td className="border border-black p-1.5 align-top">{department?.name ?? "—"}</td>
                      <td className="border border-black p-1.5 align-top">{r.appraisal.score !== undefined ? r.appraisal.score.toFixed(1) : "—"}</td>
                      <td className="border border-black p-1.5 align-top">{r.appraisal.mpmcRecommendation ?? "—"}</td>
                      <td className="border border-black p-1.5 align-top">{r.appraisal.mpmcRemarks ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <p className="text-xs mt-3 italic">(Attach copy of the Staff Performance Appraisal Forms)</p>

            <table className="w-full text-xs mt-6">
              <tbody>
                <tr><td className="py-4">CIPMC Chairperson</td></tr>
                <tr><td className="py-4">Name: ___________________________ Signature: ___________________ Date: ___________</td></tr>
              </tbody>
            </table>
          </section>
        </div>
      )}
    </div>
  );
}
