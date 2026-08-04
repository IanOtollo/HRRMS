import type { Metadata } from "next";

export const metadata: Metadata = { title: "Performance Reports" };

export default function PerformanceReportsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
