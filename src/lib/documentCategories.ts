// The 18 official physical folders (per the HR checklist), grouped into 6 visual clusters.
export const DOCUMENT_CLUSTERS = [
  {
    id: "personal",
    label: "Personal & Identity",
    color: "bg-county-blue",
    text: "text-county-blue",
    docs: [
      { key: "02_Birth_Certificate", name: "02. Birth Certificate" },
      { key: "05_National_ID", name: "05. National ID Card" },
      { key: "07_KRA_PIN", name: "07. KRA PIN Certificate" },
      { key: "14_Passport_Photos", name: "14. Passport Photographs" },
    ],
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
      { key: "08_Deployment_Redesignation", name: "08. Deployment/Redesignation" },
    ],
  },
  {
    id: "qualifications",
    label: "Qualifications",
    color: "bg-seal-bronze",
    text: "text-seal-bronze",
    docs: [
      { key: "10_Highest_Qualification", name: "10. Highest Academic Qualification" },
      { key: "11_Other_Qualifications", name: "11. Other Professional Qualifications" },
    ],
  },
  {
    id: "performance",
    label: "Performance & Training",
    color: "bg-slate-teal",
    text: "text-slate-teal",
    docs: [
      { key: "09_Appraisals", name: "09. Signed Appraisals" },
      { key: "12_Leave_Records", name: "12. Leave Documents" },
      { key: "13_Training_Records", name: "13. Training Records & Certificates" },
    ],
  },
  {
    id: "disciplinary",
    label: "Disciplinary & Conduct",
    color: "bg-rust-700",
    text: "text-rust-700",
    docs: [
      { key: "15_Disciplinary_Records", name: "15. Disciplinary Memos/Letters" },
      { key: "18_Code_of_Conduct", name: "18. Signed Code of Conduct" },
    ],
  },
  {
    id: "exit",
    label: "Retirement & Pension",
    color: "bg-ink-900",
    text: "text-ink-900",
    docs: [
      { key: "16_Retirement_Exit", name: "16. Retirement / Resignation / Clearance" },
      { key: "17_Pension_Documents", name: "17. Pension Scheme Documents" },
    ],
  },
];

export const ALL_DOCUMENT_CATEGORIES = DOCUMENT_CLUSTERS.flatMap((cluster) =>
  cluster.docs.map((doc) => ({ ...doc, clusterId: cluster.id }))
);

// These categories hold one canonical document per employee — once a file
// is on record, the upload controls are hidden rather than allowing more.
export const SINGLE_UPLOAD_CATEGORIES = ["02_Birth_Certificate", "05_National_ID", "07_KRA_PIN", "06_Confirmation_PandP"];

export function categoryName(key: string): string {
  return ALL_DOCUMENT_CATEGORIES.find((d) => d.key === key)?.name ?? key;
}
