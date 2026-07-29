"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Check } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";

type Employee = Doc<"employees">;

export default function EmployeePicker({
  value,
  onChange,
  placeholder = "Search by name, ID, or P/F number...",
}: {
  value: Employee | null;
  onChange: (employee: Employee | null) => void;
  placeholder?: string;
}) {
  const employees = useQuery(api.employees.list, {}) || [];
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = employees.filter(
    (e) =>
      e.fullName.toLowerCase().includes(search.toLowerCase()) ||
      e.pfNumber.toLowerCase().includes(search.toLowerCase()) ||
      e.nationalId.includes(search)
  );

  return (
    <div className="relative" ref={ref}>
      <div
        className="w-full border border-slate-300 rounded h-8 px-3 text-[13px] bg-white flex items-center justify-between cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <span className={value ? "text-slate-700 truncate" : "text-slate-400 truncate"}>
          {value ? `${value.fullName} — ${value.pfNumber}` : "Select employee..."}
        </span>
        <Search size={14} className="text-slate-400 shrink-0" />
      </div>

      {open && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-100 bg-slate-50">
            <input
              type="text"
              className="w-full border border-slate-300 rounded h-8 px-3 text-[12px] focus:outline-none focus:border-county-blue"
              placeholder={placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-[12px] text-slate-400">No employees found</div>
            ) : (
              filtered.map((emp) => (
                <div
                  key={emp._id}
                  className={`px-3 py-2 text-[12px] cursor-pointer hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 ${
                    value?._id === emp._id ? "bg-county-blue/5 text-[#202b5d]" : "text-slate-700"
                  }`}
                  onClick={() => {
                    onChange(emp);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">{emp.fullName}</span>
                    <span className="text-[10px] text-slate-400">ID: {emp.nationalId} | P/F: {emp.pfNumber}</span>
                  </div>
                  {value?._id === emp._id && <Check size={14} className="text-county-blue" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
