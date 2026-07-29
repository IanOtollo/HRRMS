"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/50 z-[60] flex items-center justify-center backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="bg-white rounded-md shadow-xl w-full max-w-sm overflow-hidden border border-slate-200"
          >
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold text-text-primary">{title}</h2>
                  <p className="text-[12px] text-slate-500 mt-1">{message}</p>
                </div>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button onClick={onCancel} className="px-4 h-8 text-[12px] font-bold text-slate-600 hover:bg-slate-200 rounded transition-colors">
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-4 h-8 text-[12px] font-bold bg-[#202b5d] text-white hover:bg-[#161f47] rounded transition-colors shadow-sm"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
