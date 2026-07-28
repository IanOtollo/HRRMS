"use client";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Auto-authenticate as the single Super Admin
    localStorage.setItem("hrrms_authenticated", "true");
  }, [router]);

  return (
    <div className="flex h-screen bg-paper-50 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
