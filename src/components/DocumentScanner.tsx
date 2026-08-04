"use client";

import { useRef, useState } from "react";
import { ScanLine, X, AlertTriangle, CheckCircle2, Loader2, Camera, ImageUp, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";
import EmployeePicker from "@/components/EmployeePicker";
import Select from "@/components/Select";
import { ALL_DOCUMENT_CATEGORIES, SINGLE_UPLOAD_CATEGORIES } from "@/lib/documentCategories";
import { extractFields, crossCheckAgainstEmployee, ExtractedField, FieldMismatch } from "@/lib/ocrExtraction";
import { runOcr } from "@/lib/runOcr";

type Step = "setup" | "scanning" | "review";

function confidenceStyle(confidence: number) {
  if (confidence >= 85) return "bg-emerald-100 text-emerald-700";
  if (confidence >= 60) return "bg-amber-100 text-amber-700";
  return "bg-rust-700/10 text-rust-700";
}

export default function DocumentScanner({ open, onClose }: { open: boolean; onClose: () => void }) {
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const finalizeUpload = useMutation(api.documents.finalizeUpload);

  const [step, setStep] = useState<Step>("setup");
  const [selectedEmployee, setSelectedEmployee] = useState<Doc<"employees"> | null>(null);
  const [categoryKey, setCategoryKey] = useState(ALL_DOCUMENT_CATEGORIES[0].key);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [fields, setFields] = useState<ExtractedField[]>([]);
  const [mismatches, setMismatches] = useState<FieldMismatch[]>([]);
  const [rawText, setRawText] = useState("");
  const [showRawText, setShowRawText] = useState(false);
  const [filing, setFiling] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const isSingleUploadCategory = SINGLE_UPLOAD_CATEGORIES.includes(categoryKey);

  function reset() {
    setStep("setup");
    setSelectedEmployee(null);
    setCategoryKey(ALL_DOCUMENT_CATEGORIES[0].key);
    setImageFile(null);
    setProgress(0);
    setFields([]);
    setMismatches([]);
    setRawText("");
    setShowRawText(false);
    setError("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleScan() {
    if (!selectedEmployee || !imageFile) {
      setError("Select an employee and a document image to scan");
      return;
    }
    setError("");
    setStep("scanning");
    setProgress(0);
    try {
      const { text, words } = await runOcr(imageFile, setProgress);
      setRawText(text);
      const extracted = extractFields(categoryKey, text, words);
      setFields(extracted);
      setMismatches(
        crossCheckAgainstEmployee(extracted, {
          fullName: selectedEmployee.fullName,
          nationalId: selectedEmployee.nationalId,
          dateOfBirth: selectedEmployee.dateOfBirth,
        })
      );
      setStep("review");
    } catch (err: any) {
      setError(err?.message ?? "Scan failed — try a clearer image, or use Upload Document instead.");
      setStep("setup");
    }
  }

  function updateField(key: string, value: string) {
    setFields((prev) => prev.map((f) => (f.key === key ? { ...f, value } : f)));
  }

  async function handleConfirmFile() {
    if (!selectedEmployee || !imageFile) return;
    setFiling(true);
    setError("");
    try {
      const category = ALL_DOCUMENT_CATEGORIES.find((c) => c.key === categoryKey)!;
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": imageFile.type },
        body: imageFile,
      });
      const { storageId } = await result.json();

      await finalizeUpload({
        employeeId: selectedEmployee._id,
        category: category.key,
        clusterTab: category.clusterId,
        storageId,
        originalFilename: imageFile.name,
      });

      handleClose();
    } catch (err: any) {
      setError(err?.data?.message ?? err?.message ?? "Filing failed");
    } finally {
      setFiling(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
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
            className="bg-white rounded-md shadow-xl w-[560px] max-h-[85vh] overflow-hidden border border-slate-200 flex flex-col"
          >
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h2 className="text-[14px] font-bold text-[#202b5d] flex items-center">
                <ScanLine size={16} className="mr-2" /> Scan Document
              </h2>
              <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {error && (
                <div className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div>
              )}

              {step === "setup" && (
                <>
                  <p className="text-[12px] text-slate-500 bg-slate-50 border border-slate-200 rounded p-2.5">
                    Runs entirely in your browser — the scanned image is never sent to a server for reading. Pick the
                    employee and category first, so the scan can be checked against their record.
                  </p>

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
                    {isSingleUploadCategory && (
                      <p className="text-[11px] mt-1.5 text-slate-500">Single document only — one upload per employee for this category.</p>
                    )}
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-md p-6 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <ImageUp size={28} className="mx-auto text-slate-400 mb-2" />
                    {imageFile ? (
                      <p className="text-[13px] font-bold text-[#202b5d]">{imageFile.name}</p>
                    ) : (
                      <>
                        <p className="text-[13px] font-bold text-slate-700">Click to select a document image</p>
                        <p className="text-[11px] text-slate-500 mt-1">JPG or PNG — clear, well-lit scans read best</p>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
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
                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  />
                </>
              )}

              {step === "scanning" && (
                <div className="py-10 flex flex-col items-center justify-center text-center">
                  <Loader2 size={28} className="animate-spin text-[#202b5d] mb-3" />
                  <p className="text-[13px] font-bold text-slate-700">Reading document...</p>
                  <div className="w-48 h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-[#202b5d] transition-all duration-200" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">{progress}%</p>
                </div>
              )}

              {step === "review" && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] text-slate-500">
                      Review the extracted fields below, correct anything wrong, then confirm to file the scan.
                    </p>
                    <button
                      onClick={() => setStep("setup")}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 shrink-0 ml-2"
                    >
                      <ArrowLeft size={12} /> Rescan
                    </button>
                  </div>

                  {mismatches.length > 0 && (
                    <div className="bg-rust-700/5 border border-rust-700/30 rounded p-2.5 space-y-1">
                      {mismatches.map((m) => (
                        <p key={m.key} className="text-[12px] text-rust-700 flex items-start gap-1.5">
                          <AlertTriangle size={13} className="shrink-0 mt-0.5" /> {m.message}
                        </p>
                      ))}
                    </div>
                  )}

                  {fields.length === 0 ? (
                    <p className="text-[12px] text-slate-500 bg-slate-50 border border-slate-200 rounded p-2.5">
                      No structured fields could be picked out automatically for this category — the scan will still be
                      filed as-is. Check the raw text below if you want to verify content.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {fields.map((f) => (
                        <div key={f.key}>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{f.label}</label>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${confidenceStyle(f.confidence)}`}>
                              {f.confidence}% confidence
                            </span>
                          </div>
                          <input
                            type="text"
                            value={f.value}
                            onChange={(e) => updateField(f.key, e.target.value)}
                            className="w-full h-9 px-3 text-[13px] border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#202b5d]"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setShowRawText((v) => !v)}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-700"
                  >
                    {showRawText ? "Hide" : "Show"} raw scanned text
                  </button>
                  {showRawText && (
                    <pre className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded p-2.5 max-h-32 overflow-y-auto whitespace-pre-wrap">
                      {rawText || "(no text detected)"}
                    </pre>
                  )}
                </>
              )}
            </div>

            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex justify-end space-x-2 shrink-0">
              <button onClick={handleClose} className="px-4 h-8 text-[12px] font-bold text-slate-600 hover:bg-slate-200 rounded transition-colors">
                Cancel
              </button>
              {step === "setup" && (
                <button
                  onClick={handleScan}
                  disabled={!selectedEmployee || !imageFile}
                  className="px-4 h-8 text-[12px] font-bold bg-[#202b5d] text-white hover:bg-[#161f47] rounded transition-colors shadow-sm disabled:opacity-60 flex items-center gap-1.5"
                >
                  <ScanLine size={13} /> Scan
                </button>
              )}
              {step === "review" && (
                <button
                  onClick={handleConfirmFile}
                  disabled={filing}
                  className="px-4 h-8 text-[12px] font-bold bg-[#202b5d] text-white hover:bg-[#161f47] rounded transition-colors shadow-sm disabled:opacity-60 flex items-center gap-1.5"
                >
                  {filing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  {filing ? "Filing..." : "Confirm & File"}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
