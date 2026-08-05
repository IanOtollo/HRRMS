"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Send, KeyRound, CheckCircle2, Loader2, Mail, Phone, User, MessageCircle, PhoneCall } from "lucide-react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import Select from "@/components/Select";

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const STATUS_STYLES: Record<string, string> = {
  open: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-100 text-slate-600",
};

const CONTACT_META: Record<string, { label: string; icon: any }> = {
  in_app: { label: "Prefers in-app chat", icon: MessageCircle },
  whatsapp: { label: "Prefers WhatsApp", icon: MessageCircle },
  sms: { label: "Prefers text/SMS", icon: Phone },
  phone_call: { label: "Prefers a phone call", icon: PhoneCall },
};

function PasswordResetPanel({ email }: { email: string }) {
  const lookup = useQuery(api.users.lookupByEmail, { email });
  const forcePasswordReset = useAction(api.users.forcePasswordReset);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");
  const [tempPasswordShown, setTempPasswordShown] = useState("");

  if (lookup === undefined) return null;
  if (lookup === null) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-[12px] text-amber-700">
        No account found for <strong>{email}</strong> — nothing to reset.
      </div>
    );
  }

  const handleReset = async () => {
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    setError("");
    setResetting(true);
    try {
      await forcePasswordReset({ userId: lookup._id, newPassword });
      setTempPasswordShown(newPassword);
      setNewPassword("");
    } catch (err: any) {
      setError(err?.data ?? err?.message ?? "Reset failed");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <h3 className="text-[12px] font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1.5 mb-3">
        <KeyRound size={13} /> Reset Password — {lookup.name}
      </h3>

      {tempPasswordShown ? (
        <div className="bg-white border border-purple-200 rounded p-3">
          <p className="text-[11px] text-slate-500 mb-1">Relay this to {lookup.name} by phone or in person:</p>
          <p className="text-[16px] font-mono font-bold text-[#202b5d]">{tempPasswordShown}</p>
          <p className="text-[11px] text-emerald-600 mt-1.5 flex items-center gap-1">
            <CheckCircle2 size={12} /> They'll be prompted to set their own password on next login.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New temporary password"
            className="flex-1 h-9 px-3 text-[13px] border border-purple-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
          />
          <button
            onClick={handleReset}
            disabled={resetting || !newPassword}
            className="h-9 px-4 text-[12px] font-bold bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 shrink-0"
          >
            {resetting ? <Loader2 size={14} className="animate-spin" /> : "Reset"}
          </button>
        </div>
      )}
      {error && <p className="text-[11px] text-rust-700 mt-2">{error}</p>}
    </div>
  );
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as Id<"supportTickets">;

  const currentUser = useQuery(api.users.me);
  const data = useQuery(api.tickets.getTicket, { ticketId });
  const sendMessage = useMutation(api.tickets.sendMessage);
  const updateStatus = useMutation(api.tickets.updateStatus);

  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  if (currentUser === undefined || data === undefined) return null;
  if (data === null) {
    return (
      <div className="p-4 md:p-6 text-center text-slate-400 text-sm">
        Ticket not found, or you don't have access to it.
      </div>
    );
  }

  const { ticket, messages } = data;
  // Ticket handling is ICT Support's job — everyone else, including
  // super_admin/hr_director, only ever sees the tickets they submitted.
  const isStaff = currentUser?.role === "ict_support";

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      await sendMessage({ ticketId, body: reply });
      setReply("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <Link href="/support" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-[#202b5d] mb-4 transition-colors">
        <ArrowLeft size={13} /> Back to {isStaff ? "Queue" : "My Tickets"}
      </Link>

      <div className="bg-white border border-paper-200 shadow-sm rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h1 className="text-[16px] font-bold text-[#202b5d]">{ticket.subject}</h1>
          {isStaff ? (
            <div className="w-40 shrink-0">
              <Select
                value={ticket.status}
                onChange={(v) => updateStatus({ ticketId, status: v as any })}
                options={STATUS_OPTIONS}
              />
            </div>
          ) : (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${STATUS_STYLES[ticket.status]}`}>
              {ticket.status.replace("_", " ")}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] text-slate-500">
          <span className="flex items-center gap-1.5"><User size={12} /> {ticket.submitterName}</span>
          <span className="flex items-center gap-1.5"><Mail size={12} /> {ticket.submitterEmail}</span>
          {ticket.submitterPhone && <span className="flex items-center gap-1.5"><Phone size={12} /> {ticket.submitterPhone}</span>}
          {ticket.preferredContact && CONTACT_META[ticket.preferredContact] && (
            <span className="flex items-center gap-1.5 font-semibold text-[#202b5d]">
              {(() => {
                const Icon = CONTACT_META[ticket.preferredContact].icon;
                return <Icon size={12} />;
              })()}
              {CONTACT_META[ticket.preferredContact].label}
            </span>
          )}
        </div>
      </div>

      {isStaff && ticket.type === "password_reset" && (
        <div className="mb-4">
          <PasswordResetPanel email={ticket.submitterEmail} />
        </div>
      )}

      <div className="bg-white border border-paper-200 shadow-sm rounded-xl overflow-hidden">
        <div className="p-4 space-y-3 max-h-[420px] overflow-y-auto">
          {messages.map((m, i) => {
            const isMine = m.senderUserId === currentUser?._id;
            return (
              <motion.div
                key={m._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: Math.min(i, 10) * 0.02 }}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[75%] rounded-lg px-3.5 py-2.5 ${isMine ? "bg-[#202b5d] text-white" : "bg-slate-100 text-slate-700"}`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">{m.senderName}</p>
                  <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{m.body}</p>
                  <p className={`text-[10px] mt-1.5 ${isMine ? "text-white/50" : "text-slate-400"}`}>
                    {new Date(m.createdAt).toLocaleString()}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <form onSubmit={handleSend} className="flex items-center gap-2 p-3 border-t border-paper-200 bg-slate-50">
          <input
            type="text"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type a reply..."
            className="flex-1 h-10 px-3 text-[13px] border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#202b5d]"
          />
          <button
            type="submit"
            disabled={sending || !reply.trim()}
            className="h-10 px-4 bg-[#202b5d] text-white rounded-md hover:bg-[#161f47] transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </form>
      </div>
    </div>
  );
}
