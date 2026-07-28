"use client";

import { FileBarChart, Download, Calendar } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#202b5d]">Analytics & Reports</h1>
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mt-1">HR Intelligence Dashboard</p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="h-8 px-3 text-[12px] font-bold border border-slate-300 rounded text-slate-600 hover:bg-slate-50 flex items-center transition-colors">
            <Calendar size={14} className="mr-2" /> Select Period
          </button>
          <button className="h-8 px-3 text-[12px] font-bold bg-[#9ECA3E] text-white rounded hover:bg-[#7A9E2D] flex items-center transition-colors shadow-sm">
            <Download size={14} className="mr-2" /> Generate Master Report
          </button>
        </div>
      </div>

      <div className="bg-white border border-paper-200 shadow-sm rounded p-8 flex flex-col items-center justify-center text-slate-400 min-h-[300px]">
        <FileBarChart size={32} className="mb-3 text-slate-300" />
        <h3 className="text-[14px] font-bold text-slate-600 mb-1">Select a report module</h3>
        <p className="text-[12px]">Choose from the sidebar filters to generate specific workforce analytics.</p>
      </div>
    </div>
  );
}
