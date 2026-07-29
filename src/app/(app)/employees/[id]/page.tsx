"use client";

import { useState, useRef, use, Suspense } from "react";
import { ChevronLeft, Edit2, Printer, FileText, CheckCircle2, AlertCircle, X, Upload, Eye, ShieldCheck, Camera, PhoneCall, User2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { DOCUMENT_CLUSTERS } from "@/lib/documentCategories";

function DocumentSlot({
  employeeId,
  docKey,
  docName,
  clusterId,
  canVerify,
  canUpload,
}: {
  employeeId: Id<"employees">;
  docKey: string;
  docName: string;
  clusterId: string;
  canVerify: boolean;
  canUpload: boolean;
}) {
  const documents = useQuery(api.documents.listByEmployee, { employeeId }) || [];
  const doc = documents.find((d) => d.category === docKey);
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const finalizeUpload = useMutation(api.documents.finalizeUpload);
  const verifyDoc = useMutation(api.documents.verify);
  const fileUrl = useQuery(api.documents.getUrl, doc?.storageId ? { storageId: doc.storageId } : "skip");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const state = doc?.status ?? "missing";

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      await finalizeUpload({
        employeeId,
        category: docKey,
        clusterTab: clusterId,
        storageId,
        originalFilename: file.name,
      });
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  return (
    <div className="border border-paper-200 rounded p-4 flex flex-col hover:border-county-blue transition-colors group bg-paper-50/30">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded bg-white border border-paper-200 text-text-secondary group-hover:text-county-blue group-hover:border-county-blue/30 transition-colors shadow-sm">
          <FileText size={20} />
        </div>
        <StatusBadge state={state} />
      </div>

      <h3 className="text-sm font-bold text-text-primary leading-snug mb-1">{docName}</h3>
      {doc && <p className="text-[11px] text-text-secondary truncate mb-2">{doc.originalFilename}</p>}

      <div className="mt-auto pt-3 flex gap-2">
        {!doc && canUpload && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-1 py-1.5 text-xs font-semibold text-county-blue bg-white hover:bg-paper-50 border border-county-blue/30 rounded transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <Upload size={13} /> {uploading ? "Uploading..." : "Upload"}
            </button>
            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploading}
              title="Scan with phone camera"
              className="py-1.5 px-3 text-xs font-semibold text-county-blue bg-white hover:bg-paper-50 border border-county-blue/30 rounded transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <Camera size={13} /> Scan
            </button>
          </>
        )}
        {doc && fileUrl && (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-1.5 text-xs font-semibold text-text-primary bg-white hover:bg-paper-50 border border-paper-200 rounded transition-colors shadow-sm flex items-center justify-center gap-1.5"
          >
            <Eye size={13} /> View
          </a>
        )}
        {doc && doc.status === "uploaded" && canVerify && (
          <button
            onClick={() => verifyDoc({ documentId: doc._id })}
            className="flex-1 py-1.5 text-xs font-semibold text-white bg-county-green hover:bg-county-green-dark rounded transition-colors shadow-sm flex items-center justify-center gap-1.5"
          >
            <ShieldCheck size={13} /> Verify
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFileSelect} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
      </div>
    </div>
  );
}

const EDITABLE_FIELDS = [
  { key: "designation", label: "Designation" },
  { key: "jobGroup", label: "Job Group" },
  { key: "phoneNumber", label: "Phone Number" },
  { key: "emailAddress", label: "Email Address" },
  { key: "stationLocation", label: "Station / Location" },
] as const;

function EditModal({
  employee,
  onClose,
}: {
  employee: any;
  onClose: () => void;
}) {
  const updateField = useMutation(api.employees.updateField);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(EDITABLE_FIELDS.map((f) => [f.key, employee[f.key] ?? ""]))
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const field of EDITABLE_FIELDS) {
        if (values[field.key] !== (employee[field.key] ?? "")) {
          await updateField({ id: employee._id, field: field.key, value: values[field.key] });
        }
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-md shadow-xl w-[440px] overflow-hidden border border-slate-200"
      >
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-[14px] font-bold text-[#202b5d] flex items-center"><Edit2 size={15} className="mr-2" /> Edit Profile</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          {EDITABLE_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">{field.label}</label>
              <input
                value={values[field.key]}
                onChange={(e) => {
                  const raw = field.key === "jobGroup" ? e.target.value.toUpperCase() : e.target.value;
                  setValues((prev) => ({ ...prev, [field.key]: raw }));
                }}
                className="w-full border border-slate-300 rounded h-8 px-3 text-[13px] focus:ring-1 focus:ring-[#202b5d] focus:outline-none"
              />
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 h-8 text-[12px] font-bold text-slate-600 hover:bg-slate-200 rounded transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 h-8 text-[12px] font-bold bg-[#202b5d] text-white hover:bg-[#161f47] rounded transition-colors shadow-sm disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function EmergencyContactsModal({
  contacts,
  onClose,
}: {
  contacts: { name: string; relationship: string; phoneNumber: string }[];
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-md shadow-xl w-[420px] overflow-hidden border border-slate-200"
      >
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-rust-700/5">
          <h2 className="text-[14px] font-bold text-rust-700 flex items-center">
            <PhoneCall size={15} className="mr-2" /> Emergency Contacts
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {contacts.length === 0 ? (
            <p className="text-[12px] text-slate-400 text-center py-4">No next of kin on record</p>
          ) : (
            contacts.map((contact, i) => (
              <div key={i} className="border border-paper-200 rounded-lg p-3 flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-rust-700/10 flex items-center justify-center text-rust-700 shrink-0">
                  <User2 size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-text-primary truncate">{contact.name}</p>
                  <p className="text-[11px] text-slate-500">{contact.relationship}</p>
                  <a href={`tel:${contact.phoneNumber}`} className="text-[13px] font-mono text-county-blue hover:underline">
                    {contact.phoneNumber}
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function MasterRecordPageInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const employeeId = id as Id<"employees">;
  const searchParams = useSearchParams();
  const requestedCluster = searchParams.get("cluster");
  const [activeTab, setActiveTab] = useState(
    DOCUMENT_CLUSTERS.some((c) => c.id === requestedCluster) ? requestedCluster! : DOCUMENT_CLUSTERS[0].id
  );
  const [editOpen, setEditOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  const employee = useQuery(api.employees.get, { id: employeeId });
  const currentUser = useQuery(api.users.me);
  const departments = useQuery(api.departments.list) || [];
  const photoUrl = useQuery(
    api.documents.getUrl,
    employee?.passportPhotoId ? { storageId: employee.passportPhotoId } : "skip"
  );
  const allDocuments = useQuery(api.documents.listByEmployee, { employeeId }) || [];
  const generatePhotoUploadUrl = useMutation(api.documents.generateUploadUrl);
  const updateEmployeeField = useMutation(api.employees.updateField);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const canVerify = currentUser?.role === "super_admin" || currentUser?.role === "hr_director";
  const canUpload =
    currentUser?.role === "super_admin" || currentUser?.role === "hr_director" || currentUser?.role === "records_officer";
  const canEdit = canUpload;

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      const uploadUrl = await generatePhotoUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      await updateEmployeeField({ id: employeeId, field: "passportPhotoId", value: storageId });
    } catch (err) {
      console.error("Photo upload failed", err);
    } finally {
      setPhotoUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const activeCluster = DOCUMENT_CLUSTERS.find((c) => c.id === activeTab)!;

  if (employee === undefined || currentUser === undefined) {
    return <div className="p-8 text-center text-slate-400 text-sm">Loading employee record...</div>;
  }

  if (employee === null) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        Employee not found. <Link href="/employees" className="text-county-blue underline">Back to directory</Link>
      </div>
    );
  }

  const departmentName = departments.find((d) => d._id === employee.departmentId)?.name ?? "—";
  const initials = employee.fullName.split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6 pb-20 print:p-0 print:max-w-none print:m-0">
    <div className="print:hidden space-y-6">
      <Link href="/employees" className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-county-blue transition-colors">
        <ChevronLeft size={16} className="mr-1" />
        Back to Directory
      </Link>

      {/* Header Band */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded p-8 border border-paper-200 shadow-flat flex flex-col md:flex-row md:items-start justify-between gap-6"
      >
        <div className="flex gap-6">
          <div
            onClick={() => canEdit && photoInputRef.current?.click()}
            className={`relative w-32 h-32 rounded bg-paper-200 flex items-center justify-center font-serif text-display-xl font-bold text-text-secondary shrink-0 border border-paper-200 shadow-inner overflow-hidden group ${canEdit ? "cursor-pointer" : ""}`}
          >
            {photoUrl ? (
              <img src={photoUrl} alt={employee.fullName} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
            {canEdit && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Camera size={20} className="text-white" />
              </div>
            )}
            {photoUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-[11px] font-bold">
                Uploading...
              </div>
            )}
            {canEdit && (
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
            )}
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="font-serif text-display-xl font-semibold text-text-primary mb-1">{employee.fullName}</h1>
            <div className="text-body-l text-text-secondary mb-3">{employee.designation} · {departmentName}</div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-sm bg-paper-100 px-2 py-1 rounded text-text-primary border border-paper-200 shadow-sm">
                P/F: {employee.pfNumber}
              </span>
              <span className="font-mono text-sm bg-paper-100 px-2 py-1 rounded text-text-primary border border-paper-200 shadow-sm">
                ID: {employee.nationalId}
              </span>
              {employee.payrollNumber && (
                <span className="font-mono text-sm bg-paper-100 px-2 py-1 rounded text-text-primary border border-paper-200 shadow-sm">
                  Payroll: {employee.payrollNumber}
                </span>
              )}
              {employee.jobGroup && (
                <span className="font-mono text-sm bg-paper-100 px-2 py-1 rounded text-text-primary border border-paper-200 shadow-sm">
                  Job Group {employee.jobGroup}
                </span>
              )}
              <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-bold uppercase tracking-wider bg-county-green/10 text-county-green-dark border border-county-green/20">
                {employee.employmentStatus.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 min-w-[240px]">
          <div className="bg-paper-50 p-3 rounded border border-paper-200 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-text-secondary">Station:</span>
              <span className="font-medium text-text-primary">{employee.stationLocation}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-text-secondary">Appointed:</span>
              <span className="font-medium text-text-primary">{employee.firstAppointmentDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Contact:</span>
              <span className="font-medium text-county-blue truncate max-w-[120px]">{employee.phoneNumber ?? "—"}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <button
                onClick={() => setEditOpen(true)}
                className="flex-1 px-4 py-2 bg-white border border-paper-200 hover:bg-paper-50 text-text-primary text-sm font-medium rounded flex items-center justify-center transition-colors shadow-sm"
              >
                <Edit2 size={16} className="mr-2" /> Edit
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="flex-1 px-4 py-2 bg-county-blue hover:bg-county-blue-dark text-white text-sm font-medium rounded flex items-center justify-center transition-colors shadow-sm"
            >
              <Printer size={16} className="mr-2" /> Print
            </button>
          </div>
          {employee.nextOfKin && employee.nextOfKin.length > 0 && (
            <button
              onClick={() => setEmergencyOpen(true)}
              className="px-4 py-2 bg-rust-700/10 hover:bg-rust-700/20 text-rust-700 text-sm font-medium rounded flex items-center justify-center transition-colors border border-rust-700/20"
            >
              <PhoneCall size={16} className="mr-2" /> Emergency Contacts
            </button>
          )}
        </div>
      </motion.div>

      {/* Folder Tabs Dossier */}
      <div className="mt-8">
        <div className="flex space-x-1 pl-4 relative z-10 overflow-x-auto hide-scrollbar">
          {DOCUMENT_CLUSTERS.map((cluster) => {
            const isActive = activeTab === cluster.id;
            return (
              <button
                key={cluster.id}
                onClick={() => setActiveTab(cluster.id)}
                className={`
                  relative px-6 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200 ease-out flex-shrink-0
                  ${isActive ? "bg-white text-text-primary shadow-[0_-4px_12px_rgba(0,0,0,0.05)] translate-y-0" : "bg-paper-100 text-text-secondary hover:bg-paper-200 hover:text-text-primary translate-y-1 opacity-80"}
                `}
                style={{
                  clipPath: "polygon(10px 0, calc(100% - 10px) 0, 100% 100%, 0 100%)",
                  borderTopLeftRadius: "8px",
                  borderTopRightRadius: "8px",
                  marginBottom: "-1px",
                }}
              >
                <div className={`w-full h-1 absolute top-0 left-0 ${isActive ? cluster.color : "bg-transparent"}`} />
                <span className="relative z-10">{cluster.label}</span>
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-lg rounded-tl-none border border-paper-200 shadow-[0_4px_24px_rgba(15,27,44,0.04)] min-h-[500px] relative z-0">
          <div className={`h-1 w-full absolute top-0 left-0 ${activeCluster.color}`} />

          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className={`font-serif text-display-l font-medium ${activeCluster.text}`}>
                {activeCluster.label}
              </h2>
            </div>

            <motion.div
              key={activeTab}
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {activeCluster.docs.map((doc) => (
                <motion.div
                  key={doc.key}
                  variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                >
                  <DocumentSlot
                    employeeId={employeeId}
                    docKey={doc.key}
                    docName={doc.name}
                    clusterId={activeCluster.id}
                    canVerify={canVerify}
                    canUpload={canUpload}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {editOpen && <EditModal employee={employee} onClose={() => setEditOpen(false)} />}
        {emergencyOpen && (
          <EmergencyContactsModal contacts={employee.nextOfKin ?? []} onClose={() => setEmergencyOpen(false)} />
        )}
      </AnimatePresence>
    </div>

      {/* Print-only summary — the interactive dossier above is hidden on print */}
      <div className="hidden print:block text-black">
        <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
          <div>
            <h1 className="text-lg font-bold">Employee Master Record</h1>
            <p className="text-xs">Busia County Government · HR Record Management System</p>
          </div>
          <p className="text-xs">Printed {new Date().toLocaleDateString()}</p>
        </div>

        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-base font-bold">{employee.fullName}</h2>
            <p className="text-sm">{employee.designation} · {departmentName}</p>
          </div>
          {photoUrl && (
            <img src={photoUrl} alt={employee.fullName} className="w-20 h-20 object-cover border border-black" />
          )}
        </div>

        <table className="w-full text-xs border-collapse mb-4">
          <tbody>
            <PrintRow label="P/F Number" value={employee.pfNumber} />
            <PrintRow label="National ID" value={employee.nationalId} />
            {employee.payrollNumber && <PrintRow label="Payroll Number" value={employee.payrollNumber} />}
            {employee.jobGroup && <PrintRow label="Job Group" value={employee.jobGroup} />}
            <PrintRow label="Employment Status" value={employee.employmentStatus.replace("_", " ")} />
            <PrintRow label="Terms of Service" value={employee.termsOfService} />
            <PrintRow label="Station / Location" value={employee.stationLocation} />
            <PrintRow label="Date of Appointment" value={employee.firstAppointmentDate} />
            <PrintRow label="Retirement Date" value={employee.retirementDate} />
            {employee.dateOfBirth && <PrintRow label="Date of Birth" value={employee.dateOfBirth} />}
            {employee.gender && <PrintRow label="Gender" value={employee.gender} />}
            {employee.phoneNumber && <PrintRow label="Phone Number" value={employee.phoneNumber} />}
            {employee.emailAddress && <PrintRow label="Email Address" value={employee.emailAddress} />}
            {employee.shifNhifNumber && <PrintRow label="SHIF/NHIF Number" value={employee.shifNhifNumber} />}
            {employee.nssfNumber && <PrintRow label="NSSF Number" value={employee.nssfNumber} />}
            {employee.nextOfKin?.map((kin, i) => (
              <PrintRow key={i} label={i === 0 ? "Next of Kin" : ""} value={`${kin.name} (${kin.relationship}) — ${kin.phoneNumber}`} />
            ))}
          </tbody>
        </table>

        <h3 className="text-sm font-bold border-b border-black pb-1 mb-2">Document Repository Status</h3>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="text-left border-b border-black py-1">Document</th>
              <th className="text-left border-b border-black py-1">Status</th>
            </tr>
          </thead>
          <tbody>
            {DOCUMENT_CLUSTERS.flatMap((cluster) => cluster.docs).map((doc) => {
              const record = allDocuments.find((d) => d.category === doc.key);
              const status = record?.status === "verified" ? "Verified" : record?.status === "uploaded" ? "Pending Review" : "Missing";
              return (
                <tr key={doc.key}>
                  <td className="py-0.5 border-b border-dotted border-slate-400">{doc.name}</td>
                  <td className="py-0.5 border-b border-dotted border-slate-400">{status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function MasterRecordPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <MasterRecordPageInner params={params} />
    </Suspense>
  );
}

function PrintRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-1 pr-4 font-bold w-1/3 align-top">{label}</td>
      <td className="py-1 align-top">{value}</td>
    </tr>
  );
}

function StatusBadge({ state }: { state: string }) {
  if (state === "verified") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-seal-bronze/10 text-seal-bronze border border-seal-bronze/20">
        <CheckCircle2 size={12} /> Verified
      </span>
    );
  }
  if (state === "uploaded") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-county-blue/10 text-county-blue border border-county-blue/20">
        <FileText size={12} /> Pending Review
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-paper-100 text-text-secondary border border-paper-200">
      <AlertCircle size={12} /> Missing
    </span>
  );
}
