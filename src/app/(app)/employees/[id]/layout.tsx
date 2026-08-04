import type { Metadata } from "next";

export const metadata: Metadata = { title: "Employee Profile" };

export default function EmployeeProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
