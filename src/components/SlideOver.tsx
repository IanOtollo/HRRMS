"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, LucideIcon } from "lucide-react";

export default function SlideOver({
  open,
  onClose,
  title,
  icon: Icon,
  children,
  footer,
  accentClass = "bg-[#202b5d]",
  headerClass = "",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  footer?: React.ReactNode;
  accentClass?: string;
  headerClass?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
          >
            <div className={`h-1 w-full shrink-0 ${accentClass}`} />
            <div className={`px-5 py-4 border-b border-paper-100 flex items-center justify-between shrink-0 ${headerClass}`}>
              <h2 className="text-[15px] font-bold text-[#202b5d] flex items-center gap-2">
                {Icon && <Icon size={17} />} {title}
              </h2>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">{children}</div>
            {footer && <div className="px-5 py-4 border-t border-paper-100 bg-slate-50 flex justify-end gap-2 shrink-0">{footer}</div>}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
