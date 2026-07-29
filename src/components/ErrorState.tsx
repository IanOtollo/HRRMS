"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

export default function ErrorState({
  code,
  icon: Icon,
  title,
  message,
  actionLabel = "Back to Dashboard",
  actionHref = "/dashboard",
  onAction,
  accentClass = "text-[#202b5d]",
  accentBgClass = "bg-[#202b5d]/5",
}: {
  code?: string | number;
  icon: LucideIcon;
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  accentClass?: string;
  accentBgClass?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center text-center px-6 py-16 min-h-[60vh]"
    >
      <div className={`relative w-24 h-24 rounded-2xl ${accentBgClass} border ${accentClass.replace("text-", "border-")}/20 flex items-center justify-center mb-6`}>
        <Icon size={38} className={accentClass} strokeWidth={1.5} />
        {code && (
          <span className={`absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-white border border-paper-200 shadow-sm text-[11px] font-bold ${accentClass}`}>
            {code}
          </span>
        )}
      </div>

      <h1 className="font-serif text-2xl font-bold text-text-primary mb-2">{title}</h1>
      <p className="text-sm text-text-secondary max-w-sm mb-6">{message}</p>

      {onAction ? (
        <button
          onClick={onAction}
          className="h-10 px-5 bg-county-blue hover:bg-[#0f345e] text-white text-sm font-medium rounded transition-colors shadow-sm"
        >
          {actionLabel}
        </button>
      ) : (
        <Link
          href={actionHref}
          className="h-10 px-5 bg-county-blue hover:bg-[#0f345e] text-white text-sm font-medium rounded transition-colors shadow-sm inline-flex items-center"
        >
          {actionLabel}
        </Link>
      )}
    </motion.div>
  );
}
