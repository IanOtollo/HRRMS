"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import GlobalFooter from "@/components/GlobalFooter";
import ForcePasswordChangeScreen from "@/components/ForcePasswordChangeScreen";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Loader2 } from "lucide-react";
import { useIdleLogout } from "@/hooks/useIdleLogout";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const currentUser = useQuery(api.users.me);
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  useIdleLogout(!!currentUser);
  // ICT Support works from its own PIN-gated /ict area, except the shared
  // ticket queue/chat — that page already knows how to show them the right
  // (staff) view, so it's exempt from the redirect.
  const isIctAllowedRoute =
    pathname === "/support" || pathname.startsWith("/support/") || pathname === "/audit-log";

  useEffect(() => {
    if (currentUser === null) {
      router.replace("/login");
    }
    if (currentUser && currentUser.role === "ict_support" && !isIctAllowedRoute) {
      router.replace("/ict");
    }
  }, [currentUser, router, isIctAllowedRoute]);

  if (currentUser === undefined || currentUser === null || (currentUser.role === "ict_support" && !isIctAllowedRoute)) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-paper-50">
        <Loader2 className="animate-spin text-county-blue" size={28} />
      </div>
    );
  }

  if (currentUser.mustChangePassword) {
    return <ForcePasswordChangeScreen />;
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
