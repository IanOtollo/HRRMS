"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ShieldCheck, Mail, Lock, Loader2 } from "lucide-react";
// import { useAuthActions } from "@convex-dev/auth/react";
// import { useMutation } from "convex/react";
// import { api } from "../../../../convex/_generated/api";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Simulate credential check & OTP send
      await new Promise(r => setTimeout(r, 1000));
      if (email && password.length >= 12) {
        setStep("otp");
      } else {
        setError("Invalid email or password (min 12 chars)");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Simulate OTP verify
      await new Promise(r => setTimeout(r, 1000));
      if (otp.length === 6) {
        localStorage.setItem("hrrms_authenticated", "true");
        router.push("/dashboard");
      } else {
        setError("Invalid 6-digit code");
      }
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Branding */}
        <div className="flex flex-col items-center mb-8 text-white">
          <div className="mb-6 flex items-center justify-center">
            <Image src="/logo.png" alt="Busia County Logo" width={80} height={80} className="object-contain" priority />
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-center">HR Master Record</h1>
          <p className="text-sm text-text-secondary mt-1 tracking-wide uppercase font-semibold">Busia County Government</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-2xl p-8 border border-paper-200">
          
          {error && (
            <div className="mb-6 p-3 bg-rust-700/10 border border-rust-700/20 text-rust-700 text-sm rounded-md font-medium text-center">
              {error}
            </div>
          )}

          {step === "credentials" ? (
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
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-text-primary">Password</label>
                  <a href="#" className="text-xs font-medium text-county-blue hover:underline">Forgot password?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                  <input
                    type="password"
                    required
                    minLength={12}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-paper-50 border border-paper-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-county-blue focus:bg-white transition-all"
                    placeholder="Min. 12 characters"
                  />
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
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-text-primary mb-2">Two-Step Verification</h2>
                <p className="text-sm text-text-secondary">
                  We've sent a 6-digit code to <strong>{email}</strong>. Enter it below to continue.
                </p>
              </div>

              <div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-14 bg-paper-50 border border-paper-200 rounded text-center text-display-l font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-county-blue focus:bg-white transition-all"
                  placeholder="------"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full h-11 bg-county-green hover:bg-county-green-dark text-white font-medium rounded transition-colors flex items-center justify-center mt-2 disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : "Verify & Continue"}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setStep("credentials")}
                  className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  Back to login
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-text-secondary font-medium space-x-4">
          <span>&copy; {new Date().getFullYear()} Busia County</span>
          <span className="text-ink-700">|</span>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <span className="text-ink-700">|</span>
          <a href="#" className="hover:text-white transition-colors">Help Desk</a>
        </div>
      </div>
    </div>
  );
}
