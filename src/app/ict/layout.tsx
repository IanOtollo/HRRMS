import type { Metadata } from "next";

export const metadata: Metadata = { title: "ICT Support" };

export default function IctLayout({ children }: { children: React.ReactNode }) {
  return children;
}
