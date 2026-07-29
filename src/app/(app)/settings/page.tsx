"use client";

import { useEffect, useState } from "react";
import { Save, ShieldOff, Mail, Settings as SettingsIcon, KeyRound, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ErrorState from "@/components/ErrorState";
import { motion } from "framer-motion";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="w-full h-9 pl-3 pr-10 border border-slate-300 rounded-lg text-[13px] focus:ring-2 focus:ring-[#202b5d] focus:outline-none transition-colors"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

function ChangePasswordSection() {
  const changePassword = useAction(api.users.changePassword);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.data?.message ?? err?.message ?? "Failed to change password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white border border-paper-200 shadow-sm rounded-xl p-6"
    >
      <h3 className="text-[13px] font-bold text-[#202b5d] mb-1 border-b border-paper-100 pb-2 flex items-center gap-2">
        <KeyRound size={14} /> Change Password
      </h3>
      <p className="text-[11px] text-slate-500 mt-2 mb-4">Update the password used to sign in to your account.</p>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        {error && (
          <div className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div>
        )}
        {success && (
          <div className="text-[12px] text-green-700 bg-green-50 border border-green-200 rounded p-2 flex items-center gap-1.5">
            <CheckCircle2 size={13} /> Password changed successfully.
          </div>
        )}

        <PasswordField label="Current Password" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
        <PasswordField label="New Password" value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
        <PasswordField label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />

        <button
          type="submit"
          disabled={saving || !currentPassword || !newPassword || !confirmPassword}
          className="h-9 px-4 text-[12px] font-bold bg-[#202b5d] text-white rounded-lg hover:bg-[#161f47] transition-colors shadow-sm disabled:opacity-60"
        >
          {saving ? "Updating..." : "Update Password"}
        </button>
      </form>
    </motion.div>
  );
}

export default function SettingsPage() {
  const currentUser = useQuery(api.users.me);
  const isSuperAdmin = currentUser?.role === "super_admin";
  const canViewSystemConfig = currentUser?.role === "super_admin" || currentUser?.role === "hr_director";

  const [activeTab, setActiveTab] = useState<"account" | "system">("account");

  const settings = useQuery(api.settings.get, canViewSystemConfig ? {} : "skip");
  const updateSettings = useMutation(api.settings.update);

  const [enforceMfa, setEnforceMfa] = useState(false);
  const [ipWhitelistEnabled, setIpWhitelistEnabled] = useState(false);
  const [allowedIpRanges, setAllowedIpRanges] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setEnforceMfa(settings.enforceMfa);
      setIpWhitelistEnabled(settings.ipWhitelistEnabled);
      setAllowedIpRanges(settings.allowedIpRanges ?? "");
    }
  }, [settings]);

  if (currentUser === undefined) return null;

  if (!currentUser) {
    return (
      <div className="p-4 md:p-6">
        <ErrorState code={403} icon={ShieldOff} title="Not Signed In" message="You must be signed in to view Settings." />
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({ enforceMfa, ipWhitelistEnabled, allowedIpRanges });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        icon={SettingsIcon}
        title="Settings"
        subtitle="Account & System Configuration"
        action={
          activeTab === "system" && isSuperAdmin ? (
            <div className="flex items-center space-x-2">
              {saved && <span className="text-[12px] font-bold text-green-600">Saved</span>}
              <button
                onClick={handleSave}
                disabled={saving}
                className="h-9 px-4 text-[12px] font-bold bg-[#9ECA3E] text-white rounded-lg hover:bg-[#7A9E2D] flex items-center transition-colors shadow-sm disabled:opacity-60"
              >
                <Save size={14} className="mr-2" /> {saving ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          ) : undefined
        }
      />

      <div className="flex items-center gap-1 border-b border-paper-200 mb-6">
        <button
          onClick={() => setActiveTab("account")}
          className={`px-4 py-2 text-[12px] font-bold border-b-2 transition-colors ${
            activeTab === "account" ? "border-[#202b5d] text-[#202b5d]" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          My Account
        </button>
        {canViewSystemConfig && (
          <button
            onClick={() => setActiveTab("system")}
            className={`px-4 py-2 text-[12px] font-bold border-b-2 transition-colors ${
              activeTab === "system" ? "border-[#202b5d] text-[#202b5d]" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            System Configuration
          </button>
        )}
      </div>

      {activeTab === "account" && <ChangePasswordSection />}

      {activeTab === "system" && canViewSystemConfig && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white border border-paper-200 shadow-sm rounded-xl p-6"
        >
          <h3 className="text-[13px] font-bold text-[#202b5d] mb-4 border-b border-paper-100 pb-2">Authentication & Security</h3>

          <div className="space-y-4 max-w-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-slate-700">Enforce Email OTP (Two-Step Verification)</p>
                <p className="text-[11px] text-slate-500">Requires an SMTP provider to be configured before enabling</p>
              </div>
              <input
                type="checkbox"
                checked={enforceMfa}
                disabled={!isSuperAdmin}
                onChange={(e) => setEnforceMfa(e.target.checked)}
                className="h-4 w-4 text-[#202b5d] rounded border-slate-300"
              />
            </div>

            {enforceMfa && (
              <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-2">
                <Mail size={14} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-[11px] text-amber-800">
                  Two-step verification is set up in code but needs <code className="font-mono">SMTP_USER</code> / <code className="font-mono">SMTP_PASS</code> configured
                  in the Convex deployment before it can actually send codes.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-slate-700">Strict IP Whitelisting</p>
                <p className="text-[11px] text-slate-500">Restrict access to a comma-separated list of allowed IP addresses/ranges</p>
              </div>
              <input
                type="checkbox"
                checked={ipWhitelistEnabled}
                disabled={!isSuperAdmin}
                onChange={(e) => setIpWhitelistEnabled(e.target.checked)}
                className="h-4 w-4 text-[#202b5d] rounded border-slate-300"
              />
            </div>

            {ipWhitelistEnabled && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Allowed IP Ranges</label>
                <input
                  value={allowedIpRanges}
                  disabled={!isSuperAdmin}
                  onChange={(e) => setAllowedIpRanges(e.target.value)}
                  placeholder="e.g. 41.203.0.0/16, 105.20.0.0/16"
                  className="w-full border border-slate-300 rounded h-8 px-3 text-[13px] focus:ring-1 focus:ring-[#202b5d] focus:outline-none disabled:bg-slate-50"
                />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
