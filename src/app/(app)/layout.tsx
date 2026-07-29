"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import GlobalFooter from "@/components/GlobalFooter";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Loader2 } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const currentUser = useQuery(api.users.me);
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (currentUser === null) {
      router.replace("/login");
    }
  }, [currentUser, router]);

  if (currentUser === undefined || currentUser === null) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-paper-50">
        <Loader2 className="animate-spin text-county-blue" size={28} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-paper-50 overflow-hidden print:block print:h-auto print:overflow-visible">
      <Sidebar currentUser={currentUser} mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 print:block">
        <Header currentUser={currentUser} onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden print:overflow-visible print:h-auto">
          <div className="min-h-full flex flex-col print:block">
            <div className="flex-1">{children}</div>
            <GlobalFooter />
          </div>
        </main>
      </div>
    </div>
  );
}
