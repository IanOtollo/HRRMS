"use client";

import { useState, use } from "react";
import { ChevronLeft, Edit2, Download, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
// import { useQuery } from "convex/react";
// import { api } from "../../../../../convex/_generated/api";

// The 18 official physical folders mapped into 6 visual clusters
const clusters = [
  { 
    id: "personal", 
    label: "Personal & Identity", 
    color: "bg-county-blue", 
    text: "text-county-blue", 
    docs: [
      { key: "02_Birth_Certificate", name: "02. Birth Certificate" },
      { key: "05_National_ID", name: "05. National ID Card" },
      { key: "07_KRA_PIN", name: "07. KRA PIN Certificate" },
      { key: "14_Passport_Photos", name: "14. Passport Photographs" }
    ] 
  },
  { 
    id: "appointment", 
    label: "Appointment & Career", 
    color: "bg-county-green", 
    text: "text-county-green", 
    docs: [
      { key: "01_Appointment_and_Reporting", name: "01. Appointment & Reporting" },
      { key: "03_Promotion_Letters", name: "03. Promotion Letters" },
      { key: "04_HRIS_IPPD_Documents", name: "04. HRIS / IPPD Capture Sheet" },
      { key: "06_Confirmation_PandP", name: "06. Confirmation for P&P Terms" },
      { key: "08_Deployment_Redesignation", name: "08. Deployment/Redesignation" }
    ] 
  },
  { 
    id: "qualifications", 
    label: "Qualifications", 
    color: "bg-seal-bronze", 
    text: "text-seal-bronze", 
    docs: [
      { key: "10_Highest_Qualification", name: "10. Highest Academic Qualification" },
      { key: "11_Other_Qualifications", name: "11. Other Professional Qualifications" }
    ] 
  },
  { 
    id: "performance", 
    label: "Performance & Training", 
    color: "bg-slate-teal", 
    text: "text-slate-teal", 
    docs: [
      { key: "09_Appraisals", name: "09. Signed Appraisals" },
      { key: "12_Leave_Records", name: "12. Leave Documents" },
      { key: "13_Training_Records", name: "13. Training Records & Certificates" }
    ] 
  },
  { 
    id: "disciplinary", 
    label: "Disciplinary & Conduct", 
    color: "bg-rust-700", 
    text: "text-rust-700", 
    docs: [
      { key: "15_Disciplinary_Records", name: "15. Disciplinary Memos/Letters" },
      { key: "18_Code_of_Conduct", name: "18. Signed Code of Conduct" }
    ] 
  },
  { 
    id: "exit", 
    label: "Retirement & Pension", 
    color: "bg-ink-900", 
    text: "text-ink-900", 
    docs: [
      { key: "16_Retirement_Exit", name: "16. Retirement / Resignation / Clearance" },
      { key: "17_Pension_Documents", name: "17. Pension Scheme Documents" }
    ] 
  },
];

export default function MasterRecordPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState(clusters[0].id);

  // Mock employee reflecting expanded fields (To be wired to Convex)
  const employee = {
    fullName: "Jane Achieng",
    pfNumber: "PF-48291",
    nationalId: "28394012",
    department: "Health Services",
    designation: "Clinical Officer",
    status: "active",
    // Expanded Fields
    payrollNumber: "PR-89912",
    dateOfBirth: "1985-06-12",
    gender: "Female",
    phoneNumber: "0712345678",
    emailAddress: "jane.achieng@busiacounty.go.ke",
    dateOfFirstAppointment: "2018-04-12",
    supervisor: "Dr. Peter Omondi",
    stationLocation: "Busia County Referral Hospital",
    // Statutory
    shifNhifNumber: "NH-992183",
    nssfNumber: "NS-182910",
  };

  const activeCluster = clusters.find(c => c.id === activeTab)!;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <Link href="/employees" className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-county-blue transition-colors">
        <ChevronLeft size={16} className="mr-1" />
        Back to Directory
      </Link>

      {/* Header Band */}
      <div className="bg-white rounded p-8 border border-paper-200 shadow-flat flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex gap-6">
          <div className="w-32 h-32 rounded bg-paper-200 flex items-center justify-center font-serif text-display-xl font-bold text-text-secondary shrink-0 border border-paper-200 shadow-inner">
            JA
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="font-serif text-display-xl font-semibold text-text-primary mb-1">{employee.fullName}</h1>
            <div className="text-body-l text-text-secondary mb-3">{employee.designation} · {employee.department}</div>
            
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-sm bg-paper-100 px-2 py-1 rounded text-text-primary border border-paper-200 shadow-sm">
                P/F: {employee.pfNumber}
              </span>
              <span className="font-mono text-sm bg-paper-100 px-2 py-1 rounded text-text-primary border border-paper-200 shadow-sm">
                ID: ***{employee.nationalId.slice(-4)}
              </span>
              <span className="font-mono text-sm bg-paper-100 px-2 py-1 rounded text-text-primary border border-paper-200 shadow-sm">
                Payroll: {employee.payrollNumber}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-bold uppercase tracking-wider bg-county-green/10 text-county-green-dark border border-county-green/20">
                {employee.status}
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
              <span className="font-medium text-text-primary">{employee.dateOfFirstAppointment}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Contact:</span>
              <span className="font-medium text-county-blue truncate max-w-[120px]">{employee.phoneNumber}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 px-4 py-2 bg-white border border-paper-200 hover:bg-paper-50 text-text-primary text-sm font-medium rounded flex items-center justify-center transition-colors shadow-sm">
              <Edit2 size={16} className="mr-2" /> Edit
            </button>
            <button className="flex-1 px-4 py-2 bg-county-blue hover:bg-county-blue-dark text-white text-sm font-medium rounded flex items-center justify-center transition-colors shadow-sm">
              <Download size={16} className="mr-2" /> Export
            </button>
          </div>
        </div>
      </div>

      {/* Folder Tabs Dossier */}
      <div className="mt-8">
        {/* Tabs Row */}
        <div className="flex space-x-1 pl-4 relative z-10 overflow-x-auto hide-scrollbar">
          {clusters.map((cluster) => {
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
                  marginBottom: "-1px"
                }}
              >
                <div className={`w-full h-1 absolute top-0 left-0 ${isActive ? cluster.color : "bg-transparent"}`} />
                <span className="relative z-10">{cluster.label}</span>
              </button>
            );
          })}
        </div>

        {/* Folder Content Area */}
        <div className="bg-white rounded-lg rounded-tl-none border border-paper-200 shadow-[0_4px_24px_rgba(15,27,44,0.04)] min-h-[500px] relative z-0">
          {/* Accent Line matching active tab */}
          <div className={`h-1 w-full absolute top-0 left-0 ${activeCluster.color}`} />
          
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className={`font-serif text-display-l font-medium ${activeCluster.text}`}>
                {activeCluster.label}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {activeCluster.docs.map((doc, idx) => {
                // Completely empty state representing an unpopulated document repository
                const state = "missing"; 
                
                return (
                  <div key={doc.key} className="border border-paper-200 rounded p-4 flex flex-col hover:border-county-blue transition-colors group bg-paper-50/30">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded bg-white border border-paper-200 text-text-secondary group-hover:text-county-blue group-hover:border-county-blue/30 transition-colors shadow-sm">
                        <FileText size={20} />
                      </div>
                      <StatusBadge state={state} />
                    </div>
                    
                    <h3 className="text-sm font-bold text-text-primary leading-snug mb-2">{doc.name}</h3>
                    
                    <div className="mt-auto pt-4 flex gap-2">
                      <button className="w-full py-1.5 text-xs font-semibold text-county-blue bg-white hover:bg-paper-50 border border-county-blue/30 rounded transition-colors shadow-sm">
                        Upload Document
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
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
