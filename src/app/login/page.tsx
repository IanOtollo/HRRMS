"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCredentialsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signIn("password", { email, password, flow: "signIn" });
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err?.message?.includes("InvalidAccountId") ||
          err?.message?.includes("InvalidSecret")
          ? "Invalid email or password."
          : "Sign in failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center mb-8 text-white"
        >
          <div className="mb-6 flex items-center justify-center">
            <Image src="/logo.png" alt="Busia County Logo" width={148} height={148} className="object-contain" priority />
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-center">HR Master Record</h1>
          <p className="text-sm text-text-secondary mt-1 tracking-wide uppercase font-semibold">Busia County Government</p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-lg shadow-2xl p-8 border border-paper-200"
        >
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-3 bg-rust-700/10 border border-rust-700/20 text-rust-700 text-sm rounded-md font-medium text-center overflow-hidden"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleCredentialsSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">Work Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-paper-50 border border-paper-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-county-blue focus:bg-white transition-all"
                  placeholder="user@busiacounty.go.ke"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-11 bg-paper-50 border border-paper-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-county-blue focus:bg-white transition-all"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-county-blue hover:bg-[#0f345e] text-white font-medium rounded transition-colors flex items-center justify-center mt-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign In"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-text-secondary">
            <ShieldCheck size={13} />
            <span>Accounts are provisioned by your Records Officer or HR Director</span>
          </div>
        </motion.div>

        <p className="mt-8 text-center text-[11px] text-white/40 tracking-wide">
          © 2026 The County Government of Busia | HR Department. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}
