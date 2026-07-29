"use client";

import { useEffect, useState } from "react";
import { Save, ShieldOff, Mail, Settings as SettingsIcon } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ErrorState from "@/components/ErrorState";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export default function SettingsPage() {
  const currentUser = useQuery(api.users.me);
  const isSuperAdmin = currentUser?.role === "super_admin";
  const canView = currentUser?.role === "super_admin" || currentUser?.role === "hr_director";

  const settings = useQuery(api.settings.get, canView ? {} : "skip");
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

  if (!canView) {
    return (
      <div className="p-4 md:p-6">
        <ErrorState
          code={403}
          icon={ShieldOff}
          title="Access Restricted"
          message="Global settings are only available to Super Administrators and HR Directors."
        />
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
        subtitle="System Configuration"
        action={
          isSuperAdmin ? (
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
    </div>
  );
}
