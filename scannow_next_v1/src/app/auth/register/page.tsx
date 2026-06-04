"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import {
  apiRequest,
  AuthResponse,
  clearSession,
  getStoredUser,
  storeUser,
} from "@/lib/api";

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (getStoredUser()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!fullName.trim()) {
      setError("Full name is required");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      clearSession();
      const response = await apiRequest<AuthResponse>("/register", {
        method: "POST",
        body: JSON.stringify({
          name: fullName,
          email,
          password,
          password_confirmation: confirmPassword,
        }),
      });

      storeUser(response.user);
      setSuccess(true);

      window.setTimeout(() => {
        router.push("/page/about-restaurant");
      }, 1200);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');

        /* ── Base ── */
        .reg-root {
          font-family: 'DM Sans', sans-serif;
          background: #EFFFFF;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
        }

        .reg-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 80% 20%, rgba(56,182,255,0.13) 0%, transparent 70%),
            radial-gradient(ellipse 50% 60% at 10% 80%, rgba(56,182,255,0.09) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .reg-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px 10px;
          position: relative;
          z-index: 1;
          margin-bottom: 25px;
        }

        /* ── Card ── */
        .reg-card {
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(56,182,255,0.15);
          border-radius: 24px;
          padding: 32px 40px;
          width: 100%;
          max-width: 420px;
          box-shadow:
            0 4px 6px rgba(56,182,255,0.04),
            0 24px 48px rgba(56,182,255,0.08),
            0 1px 0 rgba(255,255,255,0.9) inset;
          animation: cardIn 0.45s cubic-bezier(0.22,1,0.36,1) both;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(18px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Logo ── */
        .reg-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1px;
        }

        .reg-logo-mark {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ── Heading ── */
        .reg-title {
          font-family: 'DM Serif Display', serif;
          font-size: 24px;
          color: #0f1923;
          text-align: center;
          margin: 0 0 4px;
          letter-spacing: -0.3px;
        }

        .reg-subtitle {
          font-size: 13px;
          color: #7a8fa6;
          text-align: center;
          margin: 0 0 18px;
          font-weight: 400;
        }

        /* ── Alerts ── */
        .reg-alert {
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          margin-bottom: 14px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          line-height: 1.4;
        }
        .reg-alert-error   { background: #fff0f0; border: 1px solid #fca5a5; color: #b91c1c; }
        .reg-alert-success { background: #f0fff4; border: 1px solid #86efac; color: #15803d; }

        /* ── Fields ── */
        .reg-field { margin-bottom: 1px; }

        .reg-label {
          display: block;
          font-size: 11.5px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 1px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .reg-input-wrap { position: relative; }

        .reg-input {
          width: 100%;
          padding: 11px 16px;
          border: 1.5px solid #e2eaf2;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #0f1923;
          background: #f8fbff;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          outline: none;
          box-sizing: border-box;
          /* Prevent iOS zoom on focus (font-size must be >= 16px equivalent) */
          -webkit-text-size-adjust: 100%;
        }

        .reg-input::placeholder { color: #b0c0d0; }

        .reg-input:focus {
          border-color: #38B6FF;
          background: #fff;
          box-shadow: 0 0 0 3.5px rgba(56,182,255,0.14);
        }

        .reg-input-pw { padding-right: 44px; }

        /* ── Password toggle ── */
        .pw-toggle {
          position: absolute;
          right: 13px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #94afc5;
          padding: 6px;
          display: flex;
          align-items: center;
          transition: color 0.15s;
          /* Larger tap target on mobile */
          min-width: 36px;
          min-height: 36px;
          justify-content: center;
        }
        .pw-toggle:hover { color: #38B6FF; }

        /* ── Primary button ── */
        .reg-btn-primary {
          width: 100%;
          padding: 10px;
          background: #38B6FF;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          margin-top: 10px;
          transition: filter 0.18s, transform 0.12s, box-shadow 0.18s;
          box-shadow: 0 4px 14px rgba(56,182,255,0.35);
          letter-spacing: 0.01em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .reg-btn-primary:hover:not(:disabled) {
          filter: brightness(1.07);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(56,182,255,0.40);
        }
        .reg-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .reg-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Spinner ── */
        .reg-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Divider ── */
        .reg-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 14px 0;
        }
        .reg-divider-line { flex: 1; height: 1px; background: #e8f0f7; }
        .reg-divider-text {
          font-size: 11px;
          color: #a8becf;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          font-weight: 500;
          white-space: nowrap;
        }

        /* ── Google button ── */
        .reg-btn-google {
          width: 100%;
          padding: 11px;
          background: #fff;
          color: #374151;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          border: 1.5px solid #e2eaf2;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .reg-btn-google:hover {
          background: #f4faff;
          border-color: #38B6FF;
          box-shadow: 0 2px 10px rgba(56,182,255,0.10);
        }

        /* ── Bottom links ── */
        .reg-bottom {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
          margin-top: 1px;
          font-size: 13px;
          color: #7a8fa6;
          flex-wrap: wrap;
          text-align: center;
        }
        .reg-bottom a { color: #38B6FF; font-weight: 600; text-decoration: none; }
        .reg-bottom a:hover { text-decoration: underline; }

        .reg-terms {
          margin-top: 1px;
          font-size: 10.5px;
          color: #a8becf;
          text-align: center;
          line-height: 1.6;
        }
        .reg-terms a { color: #7abcda; text-decoration: underline; }

        .reg-nav    { position: relative; z-index: 1; }
        .reg-footer { position: relative; z-index: 1; }

        /* ════════════════════════════════
           MOBILE  ≤ 480px
        ════════════════════════════════ */
        @media (max-width: 480px) {
          .reg-main {
            padding: 10px 10px 20px;
            align-items: flex-start;
          }

          .reg-card {
            padding: 24px 20px 28px;
            border-radius: 20px;
            /* On very small screens, remove the card frame entirely and go edge-to-edge */
            box-shadow: 0 8px 32px rgba(56,182,255,0.10);
          }

          .reg-logo { margin-bottom: 10px; }

          .reg-title { font-size: 21px; }

          .reg-subtitle {
            font-size: 12.5px;
            margin-bottom: 14px;
          }

          .reg-label { font-size: 11px; margin-bottom: 4px; }

          .reg-input {
            padding: 12px 14px;
            font-size: 16px; /* 16px prevents iOS auto-zoom on focus */
            border-radius: 10px;
          }

          .reg-input-pw { padding-right: 46px; }

          .reg-field { margin-bottom: 10px; }

          .reg-btn-primary {
            padding: 1px;
            font-size: 15px;
            border-radius: 10px;
            margin-top: 1px;
          }

          .reg-btn-google {
            padding: 12px;
            font-size: 14px;
            border-radius: 10px;
          }

          .reg-divider { margin: 12px 0; }

          .reg-bottom { font-size: 13px; margin-top: 14px; }

          .reg-terms { font-size: 10px; margin-top: 8px; }
        }

        /* ════════════════════════════════
           VERY SMALL  ≤ 360px
        ════════════════════════════════ */
        @media (max-width: 360px) {
          .reg-card { padding: 20px 16px 24px; }
          .reg-title { font-size: 19px; }
        }

        /* ════════════════════════════════
           TALL DESKTOP — keep it centered
        ════════════════════════════════ */
        @media (min-width: 481px) {
          .reg-root {
            height: 100dvh;
            overflow: hidden;
          }
          .reg-main {
            align-items: center;
            overflow: hidden;
          }
        }
      `}</style>

      <div className="reg-root">
        <div className="reg-nav"><Navbar /></div>

        <main className="reg-main">
          <div className="reg-card">

            <div className="reg-logo">
              <div className="reg-logo-mark">
                <Image
                  src="/logo/main/snblue.webp"
                  alt="Logo"
                  width={40}
                  height={40}
                  priority
                  style={{ objectFit: "contain" }}
                />
              </div>
            </div>

            <h1 className="reg-title">Create your account</h1>
            

            {error && (
              <div className="reg-alert reg-alert-error">
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none" style={{ marginTop: 1, flexShrink: 0 }}>
                  <circle cx="10" cy="10" r="9" stroke="#ef4444" strokeWidth="1.5" />
                  <path d="M10 6v5M10 14h.01" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div className="reg-alert reg-alert-success">
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none" style={{ marginTop: 1, flexShrink: 0 }}>
                  <circle cx="10" cy="10" r="9" stroke="#16a34a" strokeWidth="1.5" />
                  <path d="M6.5 10l2.5 2.5 4.5-4.5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Registration successful! Redirecting…
              </div>
            )}

            <form onSubmit={handleRegister}>

              <div className="reg-field">
                <label htmlFor="fullName" className="reg-label">Full Name</label>
                <div className="reg-input-wrap">
                  <input
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    autoComplete="name"
                    className="reg-input"
                  />
                </div>
              </div>

              <div className="reg-field">
                <label htmlFor="email" className="reg-label">Email</label>
                <div className="reg-input-wrap">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    inputMode="email"
                    className="reg-input"
                  />
                </div>
              </div>

              <div className="reg-field">
                <label htmlFor="password" className="reg-label">Password</label>
                <div className="reg-input-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="reg-input reg-input-pw"
                  />
                  <button
                    type="button"
                    className="pw-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="reg-field">
                <label htmlFor="confirmPassword" className="reg-label">Confirm Password</label>
                <div className="reg-input-wrap">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="reg-input reg-input-pw"
                  />
                  <button
                    type="button"
                    className="pw-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading || success} className="reg-btn-primary">
                {loading && <span className="reg-spinner" />}
                {loading ? "Creating account…" : success ? "Account created!" : "Create Account"}
              </button>

              <div className="reg-divider">
                <div className="reg-divider-line" />
                <span className="reg-divider-text">or continue with</span>
                <div className="reg-divider-line" />
              </div>

              <button
                type="button"
                className="reg-btn-google"
                onClick={() => {
                  const apiUrl =
                    process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
                    "http://localhost:8000";
                  window.location.href = `${apiUrl}/auth/google`;
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <div className="reg-bottom">
                <span>Already have an account?</span>
                <Link href="/auth/login">Sign in</Link>
              </div>

              <p className="reg-terms">
                By registering, you agree to our{" "}
                <Link href="https://policies.google.com/privacy">Privacy Policy</Link> &{" "}
                <Link href="https://policies.google.com/terms">Terms of Service</Link>
              </p>

            </form>
          </div>
        </main>

        <div className="reg-footer"><Footer /></div>
      </div>
    </>
  );
};

export default RegisterPage;