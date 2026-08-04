import type { Metadata } from "next";

export const metadata: Metadata = { title: "Leave" };

export default function LeaveLayout({ children }: { children: React.ReactNode }) {
  return children;
}
