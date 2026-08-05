"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LifeBuoy, Plus, AlertCircle, Bug, Lightbulb, KeyRound } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import PageHeader from "@/components/PageHeader";
import Select from "@/components/Select";

const TYPE_META: Record<string, { label: string; icon: any; className: string }> = {
  inquiry: { label: "Inquiry", icon: LifeBuoy, className: "bg-blue-100 text-blue-700" },
  problem: { label: "Problem", icon: Bug, className: "bg-rust-700/10 text-rust-700" },
  suggestion: { label: "Suggestion", icon: Lightbulb, className: "bg-amber-100 text-amber-700" },
  password_reset: { label: "Password Reset", icon: KeyRound, className: "bg-purple-100 text-purple-700" },
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-100 text-slate-600",
};

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

function TicketRow({ ticket, index }: { ticket: any; index: number }) {
  const meta = TYPE_META[ticket.type] ?? TYPE_META.inquiry;
  const Icon = meta.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: Math.min(index, 10) * 0.02 }}>
      <Link
        href={`/support/${ticket._id}`}
        className="flex items-center gap-3 px-4 py-3 bg-white border border-paper-200 rounded-lg hover:shadow-sm hover:border-[#202b5d]/20 transition-all"
      >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.className}`}>
          <Icon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-[#202b5d] truncate">{ticket.subject}</p>
          <p className="text-[11px] text-slate-500 truncate">
            {ticket.submitterName} · {new Date(ticket.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${STATUS_STYLES[ticket.status]}`}>
          {ticket.status.replace("_", " ")}
        </span>
      </Link>
    </motion.div>
  );
}

export default function SupportPage() {
  const currentUser = useQuery(api.users.me);
  // Ticket handling is ICT Support's job — everyone else, including
  // super_admin/hr_director, only ever sees the tickets they submitted.
  const isStaff = currentUser?.role === "ict_support";
  const [statusFilter, setStatusFilter] = useState("");

  const myTickets = useQuery(api.tickets.myTickets, !isStaff && currentUser ? {} : "skip") || [];
  const staffTickets = useQuery(
    api.tickets.listForSupport,
    isStaff ? { status: statusFilter ? (statusFilter as any) : undefined } : "skip"
  ) || [];

  if (currentUser === undefined) return null;

  const tickets = isStaff ? staffTickets : myTickets;

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        icon={LifeBuoy}
        title={isStaff ? "ICT Support Queue" : "Need Help?"}
        subtitle={isStaff ? "Tickets & Requests" : "Your Support Tickets"}
        action={
          <Link
            href="/support/new"
            className="h-9 px-4 text-[12px] font-bold bg-[#202b5d] text-white rounded-lg hover:bg-[#161f47] flex items-center transition-colors shadow-sm"
          >
            <Plus size={14} className="mr-2" /> New Ticket
          </Link>
        }
      />

      {isStaff && (
        <div className="mb-4 w-48">
          <Select value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="bg-white border border-paper-200 shadow-sm rounded-xl px-4 py-12 text-center text-slate-400">
          <div className="flex flex-col items-center justify-center">
            <AlertCircle size={28} className="text-slate-300 mb-3" />
            <span className="text-[14px] font-bold text-slate-600">No tickets</span>
            <span className="text-[12px] mt-1">
              {isStaff ? "Nothing in the queue right now." : "Submit a ticket if you need help with anything."}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((t: any, i: number) => (
            <TicketRow key={t._id} ticket={t} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
