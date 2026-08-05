"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ServerCrash } from "lucide-react";

function MaintenanceContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  return (
    <div className="min-h-screen bg-ink-900 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-full bg-rust-700/10 border border-rust-700/30 flex items-center justify-center text-rust-700 mb-6">
        <ServerCrash size={28} />
      </div>
      <p className="text-[13px] font-mono text-white/40 tracking-widest uppercase mb-2">Error 503</p>
      <h1 className="font-serif text-2xl font-bold text-white mb-3">Site Under Maintenance</h1>
      <p className="text-white/60 max-w-md text-sm leading-relaxed">
        {reason || "This system is temporarily unavailable while ICT Support performs maintenance. Please check back shortly."}
      </p>
      <p className="mt-8 text-[11px] text-white/30 tracking-wide">
        © 2026 The County Government of Busia | HR Department
      </p>
    </div>
  );
}

export default function MaintenancePage() {
  return (
    <Suspense fallback={null}>
      <MaintenanceContent />
    </Suspense>
  );
}
