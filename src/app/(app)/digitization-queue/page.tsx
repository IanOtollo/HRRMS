"use client";

import { useMemo, useState, useRef } from "react";
import { FileDigit, Folder, ChevronDown, Plus, X, UploadCloud, CheckCircle2, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc } from "../../../../convex/_generated/dataModel";
import EmployeePicker from "@/components/EmployeePicker";
import { ALL_DOCUMENT_CATEGORIES, categoryName } from "@/lib/documentCategories";
import Select from "@/components/Select";

export default function DigitizationPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pendingDocs = useQuery(api.documents.listPending) || [];
  const currentUser = useQuery(api.users.me);
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const finalizeUpload = useMutation(api.documents.finalizeUpload);
  const verifyDoc = useMutation(api.documents.verify);

  const [selectedEmployee, setSelectedEmployee] = useState<Doc<"employees"> | null>(null);
  const [categoryKey, setCategoryKey] = useState(ALL_DOCUMENT_CATEGORIES[0].key);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [actionError, setActionError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const canVerify = currentUser?.role === "super_admin" || currentUser?.role === "hr_director";

  const employeeFolders = useMemo(() => {
    const byEmployee = new Map<string, { employeeId: string; employeeName: string; docs: typeof pendingDocs }>();
    for (const doc of pendingDocs) {
      const key = doc.employeeId as unknown as string;
      const folder = byEmployee.get(key);
      if (folder) {
        folder.docs.push(doc);
      } else {
        byEmployee.set(key, { employeeId: key, employeeName: doc.employeeName, docs: [doc] });
      }
    }
    return Array.from(byEmployee.values()).sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  }, [pendingDocs]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const toggleFolder = (employeeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(employeeId)) next.delete(employeeId);
      else next.add(employeeId);
      return next;
    });
  };

  const resetForm = () => {
    setSelectedEmployee(null);
    setCategoryKey(ALL_DOCUMENT_CATEGORIES[0].key);
    setFile(null);
    setActionError("");
  };

  const handleUpload = async () => {
    if (!selectedEmployee || !file) {
      setActionError("Select an employee and a file to upload");
      return;
    }
    setUploading(true);
    try {
      const category = ALL_DOCUMENT_CATEGORIES.find((c) => c.key === categoryKey)!;
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();

      await finalizeUpload({
        employeeId: selectedEmployee._id,
        category: category.key,
        clusterTab: category.clusterId,
        storageId,
        originalFilename: file.name,
      });

      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      setActionError(err?.data?.message ?? err?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 relative h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#202b5d]">Documents</h1>
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mt-1">Digitization & Verification Queue</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="h-8 px-3 text-[12px] font-bold bg-[#202b5d] text-white rounded hover:bg-[#161f47] flex items-center transition-colors shadow-sm"
        >
          <Plus size={14} className="mr-2" /> Upload Document
        </button>
      </div>

      {employeeFolders.length === 0 ? (
        <div className="bg-white border border-paper-200 shadow-sm rounded-xl px-4 py-12 text-center text-slate-400">
          <div className="flex flex-col items-center justify-center">
            <FileDigit size={32} className="text-slate-300 mb-3" />
            <span className="text-[14px] font-bold text-slate-600">No documents awaiting verification</span>
            <span className="text-[12px] mt-1 max-w-sm">Use Upload Document to add scans from the physical registry.</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {employeeFolders.map((folder, i) => {
            const isOpen = expandedIds.has(folder.employeeId);
            return (
              <motion.div
                key={folder.employeeId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i, 10) * 0.02 }}
                className="bg-white border border-paper-200 shadow-sm rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleFolder(folder.employeeId)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Folder size={16} className="text-[#202b5d] shrink-0" />
                    <span className="text-[13px] font-bold text-[#202b5d] truncate">{folder.employeeName}</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5 shrink-0">
                      {folder.docs.length} {folder.docs.length === 1 ? "document" : "documents"}
                    </span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-paper-100"
                    >
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-paper-200">
                              <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Category</th>
                              <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Filename</th>
                              <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Uploaded</th>
                              {canVerify && <th className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">Actions</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-paper-100">
                            {folder.docs.map((doc) => (
                              <tr key={doc._id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-2.5 text-[12px] text-slate-600">{categoryName(doc.category)}</td>
                                <td className="px-4 py-2.5 text-[12px] text-slate-600 truncate max-w-[200px]">{doc.originalFilename}</td>
                                <td className="px-4 py-2.5 text-[12px] text-slate-600">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                                {canVerify && (
                                  <td className="px-4 py-2.5">
                                    <button
                                      onClick={() => verifyDoc({ documentId: doc._id })}
                                      className="h-7 px-2.5 flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-[11px] font-bold transition-colors"
                                    >
                                      <CheckCircle2 size={12} /> Verify
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 z-50 flex items-center justify-center backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-md shadow-xl w-[500px] overflow-hidden border border-slate-200"
            >
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h2 className="text-[14px] font-bold text-[#202b5d] flex items-center">
                  <UploadCloud size={16} className="mr-2" /> Upload Document
                </h2>
                <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                {actionError && (
                  <div className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded p-2">{actionError}</div>
                )}

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-md p-6 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <UploadCloud size={28} className="mx-auto text-slate-400 mb-2" />
                  {file ? (
                    <p className="text-[13px] font-bold text-[#202b5d]">{file.name}</p>
                  ) : (
                    <>
                      <p className="text-[13px] font-bold text-slate-700">Click to select a scanned file</p>
                      <p className="text-[11px] text-slate-500 mt-1">PDF, JPG, or PNG</p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,image/*"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full py-2 text-[12px] font-bold text-county-blue bg-white hover:bg-slate-50 border border-county-blue/30 rounded-md transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Camera size={14} /> Scan with Phone Camera
                </button>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Employee</label>
                  <EmployeePicker value={selectedEmployee} onChange={setSelectedEmployee} />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Document Category</label>
                  <Select
                    value={categoryKey}
                    onChange={setCategoryKey}
                    options={ALL_DOCUMENT_CATEGORIES.map((c) => ({ value: c.key, label: c.name }))}
                  />
                </div>
              </div>
              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex justify-end space-x-2">
                <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="px-4 h-8 text-[12px] font-bold text-slate-600 hover:bg-slate-200 rounded transition-colors">Cancel</button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-4 h-8 text-[12px] font-bold bg-[#202b5d] text-white hover:bg-[#161f47] rounded transition-colors shadow-sm disabled:opacity-60"
                >
                  {uploading ? "Uploading..." : "Upload & Save"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
