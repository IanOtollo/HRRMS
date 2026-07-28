"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Download, Plus, Users, LayoutGrid, List, UsersRound, Eye, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  
  const employees = useQuery(api.employees.list, { searchTerm }) || [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#202b5d]">Employee Master Record Module</h1>
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mt-1">Master Employee Index</p>
        </div>
        <Link
          href="/employees/add"
          className="h-8 px-3 text-[12px] font-bold bg-[#202b5d] text-white rounded hover:bg-[#161f47] flex items-center transition-colors shadow-sm"
        >
          <Plus size={14} className="mr-2" />
          Add Employee
        </Link>
      </div>

      <div className="bg-white rounded border border-paper-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)]">
        {/* Toolbar */}
        <div className="p-3 border-b border-paper-200 flex items-center justify-between bg-slate-50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by name, P/F number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-8 pl-9 pr-3 bg-white border border-slate-300 rounded text-[13px] focus:outline-none focus:ring-2 focus:ring-[#202b5d] focus:border-transparent transition-all"
            />
          </div>
          
          <button className="flex items-center h-8 px-3 border border-slate-300 bg-white hover:bg-slate-100 rounded text-[12px] font-bold text-slate-600 transition-colors">
            <Filter size={14} className="mr-2" />
            Filter
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-white flex flex-col relative">
          {employees.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10 shadow-[0_1px_0_theme(colors.paper.200)]">
                <tr className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-4 py-2">P/F Number</th>
                  <th className="px-4 py-2">Employee Name</th>
                  <th className="px-4 py-2">Department</th>
                  <th className="px-4 py-2">Designation</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-100 bg-white">
                {employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50 group transition-colors">
                    <td className="px-4 py-2.5 text-[12px] font-medium text-slate-700">{emp.pfNumber}</td>
                    <td className="px-4 py-2.5 text-[13px] font-bold text-[#202b5d]">{emp.fullName}</td>
                    <td className="px-4 py-2.5 text-[12px] text-slate-600">{emp.departmentId}</td>
                    <td className="px-4 py-2.5 text-[12px] text-slate-600">{emp.designation}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wider">
                        {emp.employmentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <UsersRound size={32} className="mb-3 opacity-20" />
              <p className="text-[14px] font-bold text-slate-600 mb-1">Directory is Empty</p>
              <p className="text-[12px] mb-4 text-center max-w-sm">
                No records match your search, or the directory is empty.
              </p>
              <Link
                href="/employees/add"
                className="h-8 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-bold border border-slate-300 rounded flex items-center transition-colors"
              >
                <Plus size={14} className="mr-2" />
                Add First Employee
              </Link>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {employees.length > 0 && (
          <div className="p-3 border-t border-paper-200 flex items-center justify-between text-[11px] text-slate-500 bg-white font-medium">
            <div>Showing {employees.length} records</div>
          </div>
        )}
      </div>
    </div>
  );
}
