"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { DoorOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ink-900 flex flex-col items-center justify-center p-4">
      <Image src="/logo.png" alt="Busia County Logo" width={100} height={100} className="object-contain mb-6" priority />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-lg shadow-2xl w-full max-w-md border border-paper-200 flex flex-col items-center text-center px-8 py-10"
      >
        <DoorOpen size={104} className="text-county-blue" strokeWidth={1.25} />
        <p className="text-[13px] font-bold text-county-blue uppercase tracking-widest mt-5">Error 404</p>
        <h1 className="font-serif text-2xl font-bold text-text-primary mt-1 mb-2">Page Not Found</h1>
        <p className="text-sm text-text-secondary max-w-xs mb-6">
          The page you're looking for doesn't exist, or may have been moved.
        </p>
        <Link
          href="/dashboard"
          className="h-10 px-5 bg-county-blue hover:bg-[#0f345e] text-white text-sm font-medium rounded transition-colors shadow-sm inline-flex items-center"
        >
          Back to Dashboard
        </Link>
      </motion.div>
      <p className="mt-8 text-center text-[11px] text-white/40 tracking-wide">
        © 2026 The County Government of Busia | HR Department. All Rights Reserved.
      </p>
    </div>
  );
}
