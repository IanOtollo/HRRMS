"use client";

import { useState } from "react";
import { GraduationCap, Filter, Download, Plus, X, Award } from "lucide-react";

export default function TrainingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-6 relative h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#202b5d]">Training Module</h1>
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mt-1">Professional Development Records</p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="h-8 px-3 text-[12px] font-bold border border-slate-300 rounded text-slate-600 hover:bg-slate-50 flex items-center transition-colors">
            <Filter size={14} className="mr-2" /> Filter
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="h-8 px-3 text-[12px] font-bold bg-[#202b5d] text-white rounded hover:bg-[#161f47] flex items-center transition-colors shadow-sm"
          >
            <Plus size={14} className="mr-2" /> Log Training
          </button>
        </div>
      </div>

      <div className="bg-white border border-paper-200 shadow-sm rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-paper-200">
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Employee</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Course / Certification</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Institution</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Completion Date</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-100">
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <GraduationCap size={32} className="text-slate-300 mb-3" />
                    <span className="text-[14px] font-bold text-slate-600">No training records found</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Training Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-slate-900/40 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-md shadow-xl w-[450px] overflow-hidden border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-[14px] font-bold text-[#202b5d] flex items-center">
                <Award size={16} className="mr-2" /> Log Employee Training
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Select Employee (P/F Number)</label>
                <input type="text" className="w-full border border-slate-300 rounded h-8 px-3 text-[13px] focus:ring-1 focus:ring-[#202b5d] focus:outline-none" placeholder="Search by P/F or Name..." />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Course / Certification Name</label>
                <input type="text" className="w-full border border-slate-300 rounded h-8 px-3 text-[13px] focus:ring-1 focus:ring-[#202b5d] focus:outline-none" placeholder="e.g. Senior Management Course (SMC)" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Institution</label>
                <input type="text" className="w-full border border-slate-300 rounded h-8 px-3 text-[13px] focus:ring-1 focus:ring-[#202b5d] focus:outline-none" placeholder="e.g. Kenya School of Government" />
              </div>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Completion Date</label>
                  <input type="date" className="w-full border border-slate-300 rounded h-8 px-3 text-[13px] focus:ring-1 focus:ring-[#202b5d] focus:outline-none" />
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex justify-end space-x-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 h-8 text-[12px] font-bold text-slate-600 hover:bg-slate-200 rounded transition-colors">Cancel</button>
              <button onClick={() => setIsModalOpen(false)} className="px-4 h-8 text-[12px] font-bold bg-[#202b5d] text-white hover:bg-[#161f47] rounded transition-colors shadow-sm">Save Record</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
