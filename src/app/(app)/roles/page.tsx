"use client";

import { ShieldAlert, Plus, Filter } from "lucide-react";

export default function RolesPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#202b5d]">RBAC & Permissions</h1>
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mt-1">Role-Based Access Control</p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="h-8 px-3 text-[12px] font-bold bg-[#202b5d] text-white rounded hover:bg-[#161f47] flex items-center transition-colors shadow-sm">
            <Plus size={14} className="mr-2" /> Create Role
          </button>
        </div>
      </div>

      <div className="bg-white border border-paper-200 shadow-sm rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-paper-200">
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Role Name</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Assigned Users</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Permissions Level</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Last Modified</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-100">
              <tr>
                <td className="px-4 py-3 text-[12px] font-bold text-[#202b5d]">Super Administrator</td>
                <td className="px-4 py-3 text-[12px]">1 User</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold">Unrestricted</span></td>
                <td className="px-4 py-3 text-[12px] text-slate-500">System Default</td>
                <td className="px-4 py-3 text-[12px] text-slate-400">Locked</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
