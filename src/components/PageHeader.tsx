"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

export type StatChip = {
  label: string;
  value: string | number;
  accentClass?: string;
};

export default function PageHeader({
  icon: Icon,
  title,
  subtitle,
  action,
  stats,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  stats?: StatChip[];
}) {
  return (
    <div className="mb-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-between mb-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#202b5d]/5 border border-[#202b5d]/10 flex items-center justify-center text-[#202b5d] shrink-0">
            <Icon size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#202b5d] leading-tight">{title}</h1>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mt-0.5">{subtitle}</p>
          </div>
        </div>
        {action}
      </motion.div>

      {stats && stats.length > 0 && (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {stats.map((s) => (
            <motion.div
              key={s.label}
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-lg border border-paper-200 shadow-sm p-3.5"
            >
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1 truncate">{s.label}</p>
              <p className={`text-xl font-bold ${s.accentClass ?? "text-[#202b5d]"}`}>{s.value}</p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
