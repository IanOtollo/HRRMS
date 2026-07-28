"use client";

import { Database, Filter, Download } from "lucide-react";

export default function AuditLogPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#202b5d]">System Audit Log</h1>
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mt-1">Immutable Security Trail</p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="h-8 px-3 text-[12px] font-bold border border-slate-300 rounded text-slate-600 hover:bg-slate-50 flex items-center transition-colors">
            <Filter size={14} className="mr-2" /> Filter
          </button>
          <button className="h-8 px-3 text-[12px] font-bold bg-[#202b5d] text-white rounded hover:bg-[#161f47] flex items-center transition-colors shadow-sm">
            <Download size={14} className="mr-2" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white border border-paper-200 shadow-sm rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-paper-200">
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Timestamp</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">User</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Action</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Resource</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-100">
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <Database size={24} className="text-slate-300 mb-2" />
                    <span className="text-[13px] font-medium">No recent audit logs available</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
