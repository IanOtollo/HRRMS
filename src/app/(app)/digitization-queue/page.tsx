"use client";

import { useState, useEffect, useRef } from "react";
import { FileDigit, Filter, Download, Plus, X, UploadCloud, Search, Check } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export default function DigitizationPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const employees = useQuery(api.employees.list, {}) || [];
  const [searchEmp, setSearchEmp] = useState("");
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowEmpDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredEmployees = employees.filter(e => 
    e.fullName.toLowerCase().includes(searchEmp.toLowerCase()) || 
    e.pfNumber.toLowerCase().includes(searchEmp.toLowerCase()) ||
    e.nationalId.includes(searchEmp)
  );

  return (
    <div className="p-6 relative h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#202b5d]">Document Management Module</h1>
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mt-1">Scanner & OCR Indexing Pipeline</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative w-64 mr-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Deep OCR Search..."
              className="w-full h-8 pl-8 pr-3 bg-white border border-slate-300 rounded text-[12px] focus:outline-none focus:ring-1 focus:ring-[#202b5d] transition-all"
            />
          </div>
          <button className="h-8 px-3 text-[12px] font-bold border border-slate-300 rounded text-slate-600 hover:bg-slate-50 flex items-center transition-colors">
            <Filter size={14} className="mr-2" /> Filter
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="h-8 px-3 text-[12px] font-bold bg-[#202b5d] text-white rounded hover:bg-[#161f47] flex items-center transition-colors shadow-sm"
          >
            <Plus size={14} className="mr-2" /> Upload Batch
          </button>
        </div>
      </div>

      <div className="bg-white border border-paper-200 shadow-sm rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-paper-200">
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Document / Batch ID</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Upload Date</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Version</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">OCR Status</th>
                <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Audit Trail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-100">
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <FileDigit size={32} className="text-slate-300 mb-3" />
                    <span className="text-[14px] font-bold text-slate-600">No documents indexed</span>
                    <span className="text-[12px] mt-1 max-w-sm">Use the Upload Batch button to import scans from the physical registry.</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal Overlay */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-slate-900/40 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-md shadow-xl w-[500px] overflow-hidden border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-[14px] font-bold text-[#202b5d] flex items-center">
                <UploadCloud size={16} className="mr-2" /> Upload Document Batch
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <div className="p-5">
              <div className="border-2 border-dashed border-slate-300 rounded-md p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer mb-4">
                <UploadCloud size={32} className="mx-auto text-slate-400 mb-2" />
                <p className="text-[13px] font-bold text-slate-700">Drag & Drop Scanner Files Here</p>
                <p className="text-[11px] text-slate-500 mt-1">Supports multi-page PDF up to 50MB</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Batch Name / Reference</label>
                  <input type="text" className="w-full border border-slate-300 rounded h-8 px-3 text-[13px] focus:ring-1 focus:ring-[#202b5d] focus:outline-none" placeholder="e.g. Health_Dept_1990_2000_A" />
                </div>
                
                {/* Searchable Target Employee Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Select Target Employee (Optional)</label>
                  
                  <div 
                    className="w-full border border-slate-300 rounded h-8 px-3 text-[13px] bg-white flex items-center justify-between cursor-pointer"
                    onClick={() => setShowEmpDropdown(!showEmpDropdown)}
                  >
                    <span className="text-slate-700 truncate">
                      {selectedEmp ? `${selectedEmp.fullName} - ${selectedEmp.pfNumber}` : "Bulk Queue (Index Later)"}
                    </span>
                    <Search size={14} className="text-slate-400" />
                  </div>

                  {showEmpDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-60 overflow-hidden flex flex-col">
                      <div className="p-2 border-b border-slate-100 bg-slate-50">
                        <input
                          type="text"
                          className="w-full border border-slate-300 rounded h-8 px-3 text-[12px] focus:outline-none focus:border-county-blue"
                          placeholder="Search by name, ID, or P/F number..."
                          value={searchEmp}
                          onChange={(e) => setSearchEmp(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="overflow-y-auto flex-1">
                        <div 
                          className={`px-3 py-2 text-[12px] cursor-pointer hover:bg-slate-50 border-b border-slate-50 ${!selectedEmp ? 'bg-county-blue/5 font-bold text-county-blue' : 'text-slate-600'}`}
                          onClick={() => { setSelectedEmp(null); setShowEmpDropdown(false); setSearchEmp(""); }}
                        >
                          Bulk Queue (Index Later)
                        </div>
                        {filteredEmployees.length === 0 ? (
                          <div className="px-3 py-4 text-center text-[12px] text-slate-400">No employees found</div>
                        ) : (
                          filteredEmployees.map(emp => (
                            <div 
                              key={emp._id}
                              className={`px-3 py-2 text-[12px] cursor-pointer hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 ${selectedEmp?._id === emp._id ? 'bg-county-blue/5 text-[#202b5d]' : 'text-slate-700'}`}
                              onClick={() => { setSelectedEmp(emp); setShowEmpDropdown(false); setSearchEmp(""); }}
                            >
                              <div className="flex flex-col">
                                <span className="font-semibold">{emp.fullName}</span>
                                <span className="text-[10px] text-slate-400">ID: {emp.nationalId} | P/F: {emp.pfNumber}</span>
                              </div>
                              {selectedEmp?._id === emp._id && <Check size={14} className="text-county-blue" />}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex justify-end space-x-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 h-8 text-[12px] font-bold text-slate-600 hover:bg-slate-200 rounded transition-colors">Cancel</button>
              <button onClick={() => setIsModalOpen(false)} className="px-4 h-8 text-[12px] font-bold bg-[#202b5d] text-white hover:bg-[#161f47] rounded transition-colors shadow-sm">Start Upload & OCR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
