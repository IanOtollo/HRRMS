"use client";

import { useState } from "react";
import { ShieldAlert, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

// Shown instead of the app shell when ICT Support has reset this account's
// password — no current-password field, since the whole point is that it
// was forgotten. Disappears on its own once the mutation clears the flag
// and the reactive currentUser query picks that up.
export default function ForcePasswordChangeScreen() {
  const completeForcedPasswordChange = useAction(api.users.completeForcedPasswordChange);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      await completeForcedPasswordChange({ newPassword });
    } catch (err: any) {
      setError(err?.data ?? err?.message ?? "Could not set new password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-ink-900 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl p-8 border border-paper-200">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-3">
            <ShieldAlert size={22} />
          </div>
          <h1 className="font-serif text-xl font-bold text-text-primary">Set a New Password</h1>
          <p className="text-sm text-text-secondary mt-1.5">
            ICT Support reset your password. Choose a new one to continue — you won't need your old password.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-rust-700/10 border border-rust-700/20 text-rust-700 text-sm rounded-md font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-11 bg-paper-50 border border-paper-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-county-blue focus:bg-white transition-all"
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-paper-50 border border-paper-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-county-blue focus:bg-white transition-all"
                placeholder="Re-enter the new password"
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 bg-county-blue hover:bg-[#0f345e] text-white font-medium rounded transition-colors flex items-center justify-center mt-2 disabled:opacity-70"
          >
            {submitting ? <Loader2 className="animate-spin" size={20} /> : "Set Password & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
