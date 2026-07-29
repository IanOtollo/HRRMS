"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { Search, Filter, Plus, UsersRound, X, Check } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import Select from "@/components/Select";

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On Leave" },
  { value: "suspended", label: "Suspended" },
  { value: "retired", label: "Retired" },
  { value: "terminated", label: "Terminated" },
];

function EmployeesPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchParam = searchParams.get("search") ?? "";
  const departmentParam = searchParams.get("department") as Id<"departments"> | null;
  const [searchTerm, setSearchTerm] = useState(searchParam);
  const [statusFilter, setStatusFilter] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Header's navbar search sets ?search= on this same route — since Next.js
  // doesn't remount the page for a query-param-only navigation, re-sync local
  // state whenever it changes so the navbar search actually takes effect here.
  useEffect(() => {
    setSearchTerm(searchParam);
  }, [searchParam]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const employees = useQuery(api.employees.list, {
    searchTerm,
    departmentId: departmentParam ?? undefined,
    employmentStatus: statusFilter || undefined,
  }) || [];
  const departments = useQuery(api.departments.list) || [];
  const departmentName = (id: string) => departments.find((d) => d._id === id)?.name ?? "—";
  const activeDepartmentName = departmentParam ? departmentName(departmentParam) : null;

  const clearDepartmentFilter = () => router.push("/employees");
  const setDepartmentFilter = (id: string) => {
    router.push(id ? `/employees?department=${id}` : "/employees");
  };

  const activeFilterCount = (departmentParam ? 1 : 0) + (statusFilter ? 1 : 0);

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#202b5d]">Employees</h1>
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

      {(activeDepartmentName || statusFilter) && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          {activeDepartmentName && (
            <span className="inline-flex items-center gap-1.5 pl-3 pr-2 h-7 bg-[#202b5d]/5 border border-[#202b5d]/15 text-[#202b5d] text-[12px] font-bold rounded-full">
              {activeDepartmentName}
              <button onClick={clearDepartmentFilter} className="hover:bg-[#202b5d]/10 rounded-full p-0.5 transition-colors">
                <X size={12} />
              </button>
            </span>
          )}
          {statusFilter && (
            <span className="inline-flex items-center gap-1.5 pl-3 pr-2 h-7 bg-[#202b5d]/5 border border-[#202b5d]/15 text-[#202b5d] text-[12px] font-bold rounded-full capitalize">
              {STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label}
              <button onClick={() => setStatusFilter("")} className="hover:bg-[#202b5d]/10 rounded-full p-0.5 transition-colors">
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-paper-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)]">
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

          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen((o) => !o)}
              className="flex items-center h-8 px-3 border border-slate-300 bg-white hover:bg-slate-100 rounded text-[12px] font-bold text-slate-600 transition-colors relative"
            >
              <Filter size={14} className="mr-2" />
              Filter
              {activeFilterCount > 0 && (
                <span className="ml-1.5 w-4 h-4 rounded-full bg-[#202b5d] text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-xl z-20 p-4 space-y-4"
                >
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Department</label>
                    <Select
                      value={departmentParam ?? ""}
                      onChange={setDepartmentFilter}
                      options={[
                        { value: "", label: "All Departments" },
                        ...departments.map((d) => ({ value: d._id, label: d.name })),
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Employment Status</label>
                    <div className="space-y-1">
                      {STATUS_OPTIONS.map((s) => (
                        <button
                          key={s.value}
                          onClick={() => setStatusFilter(statusFilter === s.value ? "" : s.value)}
                          className={`w-full flex items-center justify-between px-2.5 h-7 rounded text-[12px] font-medium transition-colors ${
                            statusFilter === s.value ? "bg-[#202b5d]/5 text-[#202b5d] font-bold" : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {s.label}
                          {statusFilter === s.value && <Check size={13} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => { setStatusFilter(""); clearDepartmentFilter(); }}
                      className="w-full h-7 text-[11px] font-bold text-rust-700 hover:bg-rust-700/5 rounded transition-colors"
                    >
                      Clear All Filters
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
                {employees.map((emp, i) => (
                  <motion.tr
                    key={emp._id}
                    variants={rowVariants}
                    initial="hidden"
                    animate="show"
                    transition={{ duration: 0.25, delay: Math.min(i, 12) * 0.02 }}
                    onClick={() => (window.location.href = `/employees/${emp._id}`)}
                    className="hover:bg-slate-50 group transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-2.5 text-[12px] font-medium text-slate-700">{emp.pfNumber}</td>
                    <td className="px-4 py-2.5 text-[13px] font-bold text-[#202b5d]">{emp.fullName}</td>
                    <td className="px-4 py-2.5 text-[12px] text-slate-600">{departmentName(emp.departmentId)}</td>
                    <td className="px-4 py-2.5 text-[12px] text-slate-600">{emp.designation}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wider">
                        {emp.employmentStatus}
                      </span>
                    </td>
                  </motion.tr>
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

export default function EmployeesPage() {
  return (
    <Suspense fallback={null}>
      <EmployeesPageInner />
    </Suspense>
  );
}
