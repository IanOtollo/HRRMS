"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldOff, LockKeyhole, LifeBuoy, Activity, ServerCrash, Loader2, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../convex/_generated/api";
import ErrorState from "@/components/ErrorState";
import PageHeader from "@/components/PageHeader";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useIdleLogout } from "@/hooks/useIdleLogout";

const PIN_SESSION_KEY = "ict_pin_unlocked";
const ease = [0.16, 1, 0.3, 1] as const;

function PinGate({ onUnlocked }: { onUnlocked: () => void }) {
  const verifyIctPin = useMutation(api.settings.verifyIctPin);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setChecking(true);
    try {
      const ok = await verifyIctPin({ pin });
      if (ok) {
        sessionStorage.setItem(PIN_SESSION_KEY, "true");
        onUnlocked();
      } else {
        setError("Incorrect code");
        setPin("");
      }
    } catch (err: any) {
      setError(err?.data ?? err?.message ?? "Could not verify code");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-900 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="flex flex-col items-center mb-8 text-white"
      >
        <div className="mb-5 flex items-center justify-center">
          <Image src="/logo.png" alt="Busia County Logo" width={110} height={110} className="object-contain" priority />
        </div>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-center">ICT Support Console</h1>
        <p className="text-sm text-text-inverse/80 mt-1 tracking-wide uppercase font-semibold">Busia County HRRMS</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease }}
        className="w-full max-w-sm bg-white rounded-lg shadow-2xl p-8 border border-paper-200 text-center"
      >
        <div className="w-14 h-14 rounded-full bg-[#202b5d]/5 border border-[#202b5d]/10 flex items-center justify-center text-[#202b5d] mx-auto mb-4">
          <LockKeyhole size={24} />
        </div>
        <h2 className="font-serif text-lg font-bold text-text-primary mb-1.5">Session Access Code</h2>
        <p className="text-sm text-text-secondary mb-6">Enter the 4-digit code to unlock this session.</p>

        {error && (
          <div className="mb-4 p-2.5 bg-rust-700/10 border border-rust-700/20 text-rust-700 text-sm rounded-md font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            required
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className="w-full h-14 text-center text-2xl tracking-[0.5em] font-mono bg-paper-50 border border-paper-200 rounded focus:outline-none focus:ring-2 focus:ring-county-blue focus:bg-white transition-all"
            placeholder="••••"
          />
          <button
            type="submit"
            disabled={checking || pin.length !== 4}
            className="w-full h-11 bg-county-blue hover:bg-[#0f345e] text-white font-medium rounded transition-colors flex items-center justify-center disabled:opacity-60"
          >
            {checking ? <Loader2 className="animate-spin" size={20} /> : "Unlock"}
          </button>
        </form>
      </motion.div>

      <p className="mt-8 text-center text-[11px] text-white/40 tracking-wide">
        © 2026 The County Government of Busia | HR Department. All Rights Reserved.
      </p>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  accentClass,
  children,
  delay = 0,
  className = "",
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accentClass: string;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease }}
      className={`bg-white border border-paper-200 shadow-sm rounded-xl p-6 ${className}`}
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${accentClass}`}>
          <Icon size={16} />
        </div>
        <h2 className="text-[13px] font-bold text-[#202b5d] uppercase tracking-wider">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

function SiteBlockPanel() {
  const status = useQuery(api.settings.getSiteBlockStatus);
  const setSiteBlock = useMutation(api.settings.setSiteBlock);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <Panel title="Site Maintenance Switch" icon={ServerCrash} accentClass="bg-rust-700/10 text-rust-700">
      {status === undefined ? (
        <div className="h-24 flex items-center justify-center">
          <Loader2 className="animate-spin text-slate-300" size={20} />
        </div>
      ) : (
        <>
          <div
            className={`flex items-center gap-2.5 mb-4 px-3.5 py-3 rounded-lg border ${
              status.blocked ? "bg-rust-700/5 border-rust-700/20 text-rust-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}
          >
            {status.blocked ? <AlertTriangle size={16} className="shrink-0" /> : <CheckCircle2 size={16} className="shrink-0" />}
            <span className="text-[13px] font-bold">{status.blocked ? "Site is currently blocked" : "Site is live"}</span>
          </div>

          {status.blocked && status.reason && (
            <p className="text-[12px] text-slate-500 mb-4 italic">Shown to visitors: "{status.reason}"</p>
          )}

          {!status.blocked && (
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Reason to show visitors while blocked (optional)"
              className="w-full px-3.5 py-2.5 text-[13px] border border-slate-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-[#202b5d]/20 focus:border-[#202b5d] resize-none transition-all"
            />
          )}

          <button
            onClick={async () => {
              setSubmitting(true);
              try {
                await setSiteBlock({ blocked: !status.blocked, reason: !status.blocked ? reason : undefined });
                setReason("");
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={submitting}
            className={`w-full h-10 text-[13px] font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 ${
              status.blocked ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-rust-700 text-white hover:bg-rust-800"
            }`}
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : status.blocked ? "Unblock Site" : "Block Site"}
          </button>
        </>
      )}
    </Panel>
  );
}

function TicketQueuePanel() {
  const openTickets = useQuery(api.tickets.listForSupport, { status: "open" }) || [];

  return (
    <Panel title="Ticket Queue" icon={LifeBuoy} accentClass="bg-blue-100 text-blue-700" delay={0.08} className="flex flex-col">
      <p className="text-4xl font-bold text-[#202b5d] mb-1 leading-none">{openTickets.length}</p>
      <p className="text-[12px] text-slate-500 mb-5">open ticket{openTickets.length === 1 ? "" : "s"} awaiting a response</p>
      <Link
        href="/support"
        className="mt-auto h-10 px-4 text-[13px] font-bold bg-[#202b5d] text-white rounded-lg hover:bg-[#161f47] flex items-center justify-center gap-1.5 transition-colors shadow-sm"
      >
        Open Ticket Queue <ArrowRight size={14} />
      </Link>
    </Panel>
  );
}

function SystemHealthPanel() {
  const stats = useQuery(api.auditLog.stats);
  const recentErrors = useQuery(api.auditLog.list, {
    status: "error",
    paginationOpts: { numItems: 5, cursor: null },
  });

  const hasErrors = (stats?.errors30d ?? 0) > 0;

  return (
    <Panel title="System Health" icon={Activity} accentClass="bg-emerald-100 text-emerald-700" delay={0.16} className="lg:col-span-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <div>
          <p className="text-2xl font-bold text-[#202b5d] leading-none">{stats?.today ?? "—"}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-1">Actions Today</p>
        </div>
        <div>
          <p className={`text-2xl font-bold leading-none ${hasErrors ? "text-rust-700" : "text-emerald-600"}`}>{stats?.errors30d ?? "—"}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-1">Errors (30d)</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-[#202b5d] leading-none">{stats?.total30d ?? "—"}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-1">Actions (30d)</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-[#202b5d] leading-none">{stats?.uniqueUsers30d ?? "—"}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-1">Active Users (30d)</p>
        </div>
      </div>

      <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Recent Issues</h3>
      {recentErrors === undefined ? (
        <div className="h-16 flex items-center justify-center">
          <Loader2 className="animate-spin text-slate-300" size={18} />
        </div>
      ) : recentErrors.page.length === 0 ? (
        <p className="text-[13px] text-emerald-600 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-3.5 py-2.5">
          <CheckCircle2 size={14} className="shrink-0" /> No errors recorded in the last 30 days.
        </p>
      ) : (
        <div className="space-y-2">
          {recentErrors.page.map((e: any) => (
            <div key={e._id} className="flex items-start gap-2.5 p-2.5 bg-rust-700/5 border border-rust-700/10 rounded-lg">
              <AlertTriangle size={13} className="text-rust-700 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-slate-700 truncate">
                  {e.action} <span className="font-normal text-slate-500">— {e.userName}</span>
                </p>
                {e.errorMessage && <p className="text-[11px] text-slate-500 truncate">{e.errorMessage}</p>}
                <p className="text-[10px] text-slate-400 mt-0.5">{new Date(e.timestamp).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/audit-log"
        className="inline-flex h-9 px-3.5 mt-4 text-[12px] font-bold text-[#202b5d] border border-[#202b5d]/20 rounded-lg hover:bg-[#202b5d]/5 items-center gap-1.5 transition-colors"
      >
        Full Audit Log <ArrowRight size={13} />
      </Link>
    </Panel>
  );
}

function IctDashboard({ currentUser }: { currentUser: { _id: string; name?: string; email?: string; role?: string } }) {
  const { signOut } = useAuthActions();
  const recordLogout = useMutation(api.users.recordLogout);
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleSignOut = async () => {
    sessionStorage.removeItem(PIN_SESSION_KEY);
    await recordLogout({}).catch(() => {});
    await signOut();
    router.push("/login");
  };

  // Same shell as every other page in the app (Sidebar + Header) — /ict is
  // its own top-level route (for the PIN gate + site-block bypass to work
  // independently of the (app) group's auth flow), but it should still look
  // and navigate like the rest of the site, not a bolted-on separate tool.
  return (
    <div className="flex h-screen bg-paper-50 overflow-hidden">
      <Sidebar currentUser={currentUser} mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0">
        <Header currentUser={currentUser} onMenuClick={() => setMobileNavOpen(true)} onSignOut={handleSignOut} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-4 md:p-6">
            <PageHeader icon={LifeBuoy} title="ICT Support" subtitle="Tickets, Security & Site Access" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <SiteBlockPanel />
              <TicketQueuePanel />
              <SystemHealthPanel />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function IctPage() {
  const currentUser = useQuery(api.users.me);
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(false);
  const [checkedSession, setCheckedSession] = useState(false);
  useIdleLogout(!!currentUser);

  useEffect(() => {
    if (currentUser === null) {
      router.replace("/login");
    }
  }, [currentUser, router]);

  useEffect(() => {
    if (sessionStorage.getItem(PIN_SESSION_KEY) === "true") {
      setUnlocked(true);
    }
    setCheckedSession(true);
  }, []);

  if (currentUser === undefined || currentUser === null || !checkedSession) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-paper-50">
        <Loader2 className="animate-spin text-county-blue" size={28} />
      </div>
    );
  }

  if (currentUser.role !== "ict_support") {
    return (
      <div className="p-4 md:p-6">
        <ErrorState
          code={403}
          icon={ShieldOff}
          title="Access Restricted"
          message="This area is only available to ICT Support."
        />
      </div>
    );
  }

  if (!unlocked) {
    return <PinGate onUnlocked={() => setUnlocked(true)} />;
  }

  return <IctDashboard currentUser={currentUser} />;
}
