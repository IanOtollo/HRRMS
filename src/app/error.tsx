"use client";

import { useEffect } from "react";
import Image from "next/image";
import { AlertTriangle } from "lucide-react";
import ErrorState from "@/components/ErrorState";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-ink-900 flex flex-col items-center justify-center p-4">
      <Image src="/logo.png" alt="Busia County Logo" width={64} height={64} className="object-contain mb-6" priority />
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md border border-paper-200">
        <ErrorState
          code={500}
          icon={AlertTriangle}
          title="Something Went Wrong"
          message="An unexpected error occurred. Try again, and if it keeps happening, let your Records Officer know."
          actionLabel="Try Again"
          onAction={reset}
          accentClass="text-rust-700"
          accentBgClass="bg-rust-700/5"
        />
      </div>
    </div>
  );
}
