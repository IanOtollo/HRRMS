"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { LifeBuoy, ArrowLeft, CheckCircle2, Loader2, KeyRound } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Select from "@/components/Select";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import PageHeader from "@/components/PageHeader";
import { useIdleLogout } from "@/hooks/useIdleLogout";

// "Forgot Password" is intentionally not selectable here — it's only
// reachable via the dedicated "Forgot password?" link on the login page,
// which locks this form into a strictly password-reset flow (see
// isLockedPasswordReset below). This picker is for everything else.
const TYPE_OPTIONS = [
  { value: "inquiry", label: "General Inquiry" },
  { value: "problem", label: "Report a Problem" },
  { value: "suggestion", label: "Suggestion" },
];

// Not offered on the password-reset flow — that one always resolves through
// ICT setting a temp password directly, not back-and-forth contact.
const CONTACT_OPTIONS = [
  { value: "in_app", label: "In-App Notifications (Chat)" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "sms", label: "Text / SMS" },
  { value: "phone_call", label: "Phone Call" },
];

function NewTicketForm() {
  const searchParams = useSearchParams();
  // Locked, not just pre-selected: arriving via "Forgot password?" commits
  // this page to strictly a password-reset request — no switching to a
  // general inquiry once here.
  const isLockedPasswordReset = searchParams.get("type") === "password_reset";

  const currentUser = useQuery(api.users.me);
  const submitTicket = useMutation(api.tickets.submit);
  useIdleLogout(!!currentUser);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [type, setType] = useState(isLockedPasswordReset ? "password_reset" : "inquiry");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [phone, setPhone] = useState("");
  const [preferredContact, setPreferredContact] = useState("in_app");
  const [subject, setSubject] = useState(isLockedPasswordReset ? "Forgot my password" : "");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const isPasswordReset = isLockedPasswordReset;
  const loggedIn = !!currentUser;
  // Whether a phone number is on-screen at all — identity block (locked
  // reset or logged-out) or because the chosen contact method needs one.
  const needsPhoneForContact = !isLockedPasswordReset && preferredContact !== "in_app";
  const showPhoneField = isLockedPasswordReset || !loggedIn || needsPhoneForContact;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if ((isLockedPasswordReset || !loggedIn) && (!name.trim() || !email.trim())) {
      setError("Name and email are required");
      return;
    }
    if (needsPhoneForContact && !phone.trim()) {
      setError("A phone number is required for that contact method");
      return;
    }
    if (!subject.trim() || (!isPasswordReset && !description.trim())) {
      setError("Please describe what you need help with");
      return;
    }

    setSubmitting(true);
    try {
      await submitTicket({
        type: type as "inquiry" | "problem" | "suggestion" | "password_reset",
        subject,
        description: description.trim() || "(no additional details provided)",
        submitterName: name,
        submitterEmail: email,
        submitterPhone: phone || undefined,
        preferredContact: isLockedPasswordReset ? undefined : (preferredContact as "in_app" | "whatsapp" | "sms" | "phone_call"),
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.data ?? err?.message ?? "Could not submit — try again in a moment");
    } finally {
      setSubmitting(false);
    }
  };

  if (currentUser === undefined) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-paper-50">
        <Loader2 className="animate-spin text-county-blue" size={28} />
      </div>
    );
  }

  const formBody = submitted ? (
    <div className="text-center py-4">
      <CheckCircle2 size={40} className="mx-auto text-emerald-600 mb-4" />
      <h2 className="text-lg font-bold text-text-primary mb-2">
        {isPasswordReset ? "Request received" : "Ticket submitted"}
      </h2>
      <p className="text-sm text-text-secondary leading-relaxed">
        {isPasswordReset
          ? "ICT Support will verify your identity and reach out with a new temporary password."
          : "ICT Support will get back to you shortly."}
      </p>
      <Link
        href={loggedIn ? "/support" : "/login"}
        className="inline-block mt-6 text-sm font-semibold text-county-blue hover:underline"
      >
        {loggedIn ? "View My Tickets" : "Back to Sign In"}
      </Link>
    </div>
  ) : (
    <>
      {!loggedIn && (
        <Link href="/login" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-text-secondary hover:text-county-blue mb-3 transition-colors">
          <ArrowLeft size={13} /> Back to Sign In
        </Link>
      )}

      {error && (
        <div className="mb-3 p-2.5 bg-rust-700/10 border border-rust-700/20 text-rust-700 text-sm rounded-md font-medium text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Two columns on wider screens so all ~7 fields lay out side by
            side instead of stacking into a tall, internally-scrolling
            card — left is "who/what", right is "how to reach & details". */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
          <div className="space-y-2.5">
            {!isLockedPasswordReset && (
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-1">What do you need?</label>
                <Select value={type} onChange={setType} options={TYPE_OPTIONS} />
              </div>
            )}

            {isLockedPasswordReset && (
              <p className="text-[12px] text-text-secondary leading-snug">
                Tell ICT Support who you are so they can verify your identity and get you a new temporary password.
              </p>
            )}

            {/* Password reset always asks who this is for, even if the browser
                still has a logged-in session — resetting your own password
                isn't the same thing as being signed in as yourself right now.
                The general ticket form only asks when there's no session to
                identify the submitter from. */}
            {(isLockedPasswordReset || !loggedIn) && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 px-3.5 bg-paper-50 border border-paper-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-county-blue focus:bg-white transition-all"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-1">Work Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 px-3.5 bg-paper-50 border border-paper-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-county-blue focus:bg-white transition-all"
                    placeholder="user@busiacounty.go.ke"
                  />
                </div>
              </>
            )}

            {!isLockedPasswordReset && (
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-1">How should we reach you?</label>
                <Select value={preferredContact} onChange={setPreferredContact} options={CONTACT_OPTIONS} />
              </div>
            )}
          </div>

          <div className="space-y-2.5 flex flex-col">
            {showPhoneField && (
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-1">
                  Phone Number{needsPhoneForContact ? "" : " (optional)"}
                </label>
                <input
                  type="tel"
                  required={needsPhoneForContact}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-10 px-3.5 bg-paper-50 border border-paper-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-county-blue focus:bg-white transition-all"
                  placeholder="+254 7XX XXX XXX"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full h-10 px-3.5 bg-paper-50 border border-paper-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-county-blue focus:bg-white transition-all"
                placeholder="Short summary"
              />
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block text-sm font-semibold text-text-primary mb-1">
                {isPasswordReset ? "Anything ICT should know (optional)" : "Details"}
              </label>
              <textarea
                required={!isPasswordReset}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full flex-1 min-h-[84px] px-3.5 py-2 bg-paper-50 border border-paper-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-county-blue focus:bg-white transition-all resize-none"
                placeholder={isPasswordReset ? "e.g. best way/time to reach you" : "Describe the issue or your question"}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-10 bg-county-blue hover:bg-[#0f345e] text-white font-medium rounded transition-colors flex items-center justify-center mt-2 disabled:opacity-70"
        >
          {submitting ? <Loader2 className="animate-spin" size={20} /> : "Submit"}
        </button>
      </form>
    </>
  );

  // Logged in: stay inside the normal app shell (Sidebar + Header), like
  // every other authenticated page — a signed-in user clicking "Need Help?"
  // shouldn't get dropped onto a separate login-styled screen that then
  // tells them to "Back to Sign In".
  if (loggedIn) {
    return (
      <div className="flex h-screen bg-paper-50 overflow-hidden">
        <Sidebar currentUser={currentUser} mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
        <div className="flex flex-col flex-1 min-w-0">
          <Header currentUser={currentUser} onMenuClick={() => setMobileNavOpen(true)} />
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="p-4 md:p-6 max-w-2xl mx-auto">
              <PageHeader
                icon={isLockedPasswordReset ? KeyRound : LifeBuoy}
                title={isLockedPasswordReset ? "Reset Your Password" : "Contact ICT Support"}
                subtitle="Submit a request"
              />
              <div className="bg-white border border-paper-200 shadow-sm rounded-xl p-5">{formBody}</div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Logged out: the login-styled standalone screen — this is the only path
  // that has to work with no session at all (public inquiries, and the
  // "Forgot password?" link off the login page).
  return (
    <div className="h-screen bg-ink-900 flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center mb-3 text-white"
        >
          <div className="w-10 h-10 rounded-full bg-[#9ECA3E]/10 border border-[#9ECA3E]/30 flex items-center justify-center text-[#9ECA3E] mb-2">
            {isLockedPasswordReset ? <KeyRound size={18} /> : <LifeBuoy size={20} />}
          </div>
          <h1 className="font-serif text-xl font-bold tracking-tight text-center">
            {isLockedPasswordReset ? "Reset Your Password" : "ICT Support"}
          </h1>
          <p className="text-[11px] text-text-inverse/80 mt-0.5 tracking-wide uppercase font-semibold">Busia County HRRMS</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-lg shadow-2xl p-5 border border-paper-200 max-h-[calc(100vh-140px)] overflow-y-auto"
        >
          {formBody}
        </motion.div>
      </div>
    </div>
  );
}

export default function NewTicketPage() {
  return (
    <Suspense fallback={null}>
      <NewTicketForm />
    </Suspense>
  );
}
