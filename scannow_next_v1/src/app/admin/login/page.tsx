"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  apiRequest,
  AuthResponse,
  clearSession,
  storeAdminUser,
} from "@/lib/api";
import { Lock, Mail, Loader2, ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<AuthResponse>("/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      storeAdminUser(response.user);
      router.push("/admin");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#EFFFFF] flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col w-[420px] flex-shrink-0 bg-[#38B6FF] relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-[-80px] left-[-80px] w-[320px] h-[320px] rounded-full bg-[#61A9E5]/40" />
          <div className="absolute bottom-[-60px] right-[-60px] w-[280px] h-[280px] rounded-full bg-[#61A9E5]/50" />
          <div className="absolute top-[40%] left-[10%] w-[180px] h-[180px] rounded-full bg-[#38B6FF]/15" />
          {/* Grid dots pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10 justify-between">
          {/* Logo */}
          <div>
            <img
              src="/logo/main/snblue.webp"
              alt="Scan Now Logo"
              className="h-30 w-auto brightness-0 invert"
            />
          </div>

          {/* Middle copy */}
          <div className="space-y-5">
            <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <ShieldCheck size={28} className="text-white" />
            </div>
            <h2 className="text-3xl font-black text-white leading-tight tracking-tight">
              Welcome back<br />to your portal
            </h2>
            {/* <p className="text-[#EAF9FF] text-sm font-medium leading-relaxed max-w-[260px]">
              Manage your QR campaigns, track analytics, and stay in control — all from one place.
            </p> */}
          </div>

          {/* Bottom badge */}
          <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 backdrop-blur-sm w-fit">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white text-xs font-bold tracking-wide uppercase">System Online</span>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Mobile logo (shown only on small screens) */}
        <div className="lg:hidden absolute top-6 left-6">
          <img
            src="/logo/main/snblue.webp"
            alt="Scan Now Logo"
            className="h-15 w-auto mt-13 ml-2.5"
          />
        </div>

        <div className="w-full max-w-[400px] space-y-7">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Sign in</h1>
            {/* <p className="text-slate-500 text-sm font-medium">
              Enter your administrator credentials to continue
            </p> */}
          </div>

          {/* Card */}
          <div className="bg-white rounded-[28px] shadow-xl shadow-[#EAF9FF] border border-slate-100 p-8 space-y-5">

            {/* Error */}
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-[10px] font-black">!</span>
                </div>
                <p className="text-red-600 text-xs font-semibold leading-relaxed">{error}</p>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleLogin}>
              {/* Email field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
                  Email Address
                </label>
                <div
                  className={`flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3.5 transition-all duration-200 border-2 ${
                    focusedField === "email"
                      ? "border-[#38B6FF] bg-white shadow-md shadow-[#EAF9FF]"
                      : "border-transparent"
                  }`}
                >
                  <Mail
                    size={17}
                    className={`flex-shrink-0 transition-colors duration-200 ${
                      focusedField === "email" ? "text-[#38B6FF]" : "text-slate-400"
                    }`}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="admin@example.com"
                    required
                    className="flex-1 bg-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-300 outline-none"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
                  Password
                </label>
                <div
                  className={`flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3.5 transition-all duration-200 border-2 ${
                    focusedField === "password"
                      ? "border-[#38B6FF] bg-white shadow-md shadow-[#EAF9FF]"
                      : "border-transparent"
                  }`}
                >
                  <Lock
                    size={17}
                    className={`flex-shrink-0 transition-colors duration-200 ${
                      focusedField === "password" ? "text-[#38B6FF]" : "text-slate-400"
                    }`}
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    required
                    className="flex-1 bg-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-300 outline-none"
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-4 bg-[#38B6FF] hover:bg-[#61A9E5] active:scale-[0.98] text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-[#38B6FF]/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={17} />
                    <span>Signing In...</span>
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-slate-400 text-[11px] font-bold uppercase tracking-widest">
            &copy; 2026 Scan Now Platform
          </p>
        </div>
      </div>
    </div>
  );
}