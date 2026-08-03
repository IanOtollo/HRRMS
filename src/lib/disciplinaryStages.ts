// Mirrors the County Public Service Board disciplinary procedure — shared
// between the Disciplinary page and any other view (e.g. the dashboard)
// that needs to label a case's stage.
export const STAGE_LABELS: Record<string, string> = {
  preliminary_inquiry: "Preliminary Inquiry",
  investigation: "Investigation",
  show_cause: "Show Cause & Hearing",
  interdiction_suspension: "Interdiction / Suspension",
  board_determination: "Board Determination",
  closed: "Closed",
};

export const STAGE_ORDER = [
  "preliminary_inquiry",
  "investigation",
  "show_cause",
  "interdiction_suspension",
  "board_determination",
  "closed",
];

export const STAGE_STYLES: Record<string, string> = {
  preliminary_inquiry: "bg-amber-100 text-amber-700",
  investigation: "bg-sky-100 text-sky-700",
  show_cause: "bg-orange-100 text-orange-700",
  interdiction_suspension: "bg-red-100 text-red-700",
  board_determination: "bg-purple-100 text-purple-700",
  closed: "bg-slate-100 text-slate-600",
};

export const INTERDICTION_TYPE_LABELS: Record<string, string> = {
  interdiction: "Interdiction (half pay, pending investigation)",
  suspension: "Suspension (no pay, pending dismissal)",
};

export const OUTCOME_LABELS: Record<string, string> = {
  no_further_action: "No Further Action",
  reprimand: "Reprimand",
  salary_stoppage: "Salary Stoppage",
  dismissal: "Dismissal",
  retirement_public_interest: "Retirement in the Public Interest",
};
