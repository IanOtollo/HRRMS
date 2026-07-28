"use client";

import { useState } from "react";
import { Scale, Filter, Download, Plus, X, AlertTriangle } from "lucide-react";

export default function DisciplinaryPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-6 relative h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#202b5d]">Disciplinary Module</h1>
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mt-1">Confidential Records Pipeline</p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="h-8 px-3 text-[12px] font-bold border border-slate-300 rounded text-slate-600 hover:bg-slate-50 flex items-center transition-colors">
            <Filter size={14} className="mr-2" /> Filter
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="h-8 px-3 text-[12px] font-bold bg-red-700 text-white rounded hover:bg-red-800 flex items-center transition-colors shadow-sm"
          >
            <Plus size={14} className="mr-2" /> Log Action
          </button>
        </div>
      </div>

      <div className="bg-white border border-paper-200 shadow-sm rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-paper-200">
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Employee</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Case Type</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Date Issued</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Status</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-100">
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <Scale size={32} className="text-slate-300 mb-3" />
                    <span className="text-[14px] font-bold text-slate-600">No disciplinary records</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Action Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-slate-900/40 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-md shadow-xl w-[500px] overflow-hidden border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-red-50">
              <h2 className="text-[14px] font-bold text-red-800 flex items-center">
                <AlertTriangle size={16} className="mr-2" /> Log Disciplinary Incident
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-red-400 hover:text-red-600">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Select Employee (P/F Number)</label>
                <input type="text" className="w-full border border-slate-300 rounded h-8 px-3 text-[13px] focus:ring-1 focus:ring-red-700 focus:outline-none" placeholder="Search by P/F or Name..." />
              </div>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Incident Stage</label>
                  <select className="w-full border border-slate-300 rounded h-8 px-3 text-[13px] focus:ring-1 focus:ring-red-700 focus:outline-none bg-white">
                    <option value="">Select Stage...</option>
                    <option value="warning">Warning Letter</option>
                    <option value="show_cause">Show Cause Letter</option>
                    <option value="suspension">Interdiction / Suspension</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Date Issued</label>
                  <input type="date" className="w-full border border-slate-300 rounded h-8 px-3 text-[13px] focus:ring-1 focus:ring-red-700 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Incident Summary</label>
                <textarea className="w-full border border-slate-300 rounded p-3 text-[13px] focus:ring-1 focus:ring-red-700 focus:outline-none h-24 resize-none" placeholder="Describe the incident securely..."></textarea>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex justify-end space-x-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 h-8 text-[12px] font-bold text-slate-600 hover:bg-slate-200 rounded transition-colors">Cancel</button>
              <button onClick={() => setIsModalOpen(false)} className="px-4 h-8 text-[12px] font-bold bg-red-700 text-white hover:bg-red-800 rounded transition-colors shadow-sm">Save Confidential Record</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
