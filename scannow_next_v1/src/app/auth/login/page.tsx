"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import Link from "next/link";
import Image from "next/image";
import {
  apiRequest,
  AuthResponse,
  clearSession,
  getStoredUser,      // <-- It looks like it's here...
  storeUser,
  storeRestaurant,
  ListResponse,
  Restaurant,
} from "@/lib/api";

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (getStoredUser()) {
      router.replace("/dashboard");
      return;
    }
    const socialEmail = searchParams.get("social_login_email");
    if (socialEmail) handleSocialLogin(socialEmail);
  }, [searchParams, router]);

  const handleSocialLogin = async (socialEmail: string) => {
    setLoading(true);
    setError(null);
    try {
      clearSession();
      const response = await apiRequest<AuthResponse>("/auth/social-complete", {
        method: "POST",
        body: JSON.stringify({ email: socialEmail }),
      });
      storeUser(response.user);
      if (response.user.restaurant) {
        storeRestaurant(response.user.restaurant);
      } else if (response.user.id && response.user.role === "owner") {
        try {
          const restaurantResponse = await apiRequest<ListResponse<Restaurant>>(
            `/restaurants?user_id=${response.user.id}`
          );
          if (restaurantResponse.data && restaurantResponse.data.length > 0) {
            storeRestaurant(restaurantResponse.data[0]);
          }
        } catch (err) {
          console.error("Failed to fetch restaurant after login:", err);
        }
      }
      router.push("/page/welcome/welcome-back");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Social login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      clearSession();
      const response = await apiRequest<AuthResponse>("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      storeUser(response.user);
      if (response.user.restaurant) {
        storeRestaurant(response.user.restaurant);
      } else if (response.user.id && response.user.role === "owner") {
        try {
          const restaurantResponse = await apiRequest<ListResponse<Restaurant>>(
            `/restaurants?user_id=${response.user.id}`
          );
          if (restaurantResponse.data && restaurantResponse.data.length > 0) {
            storeRestaurant(restaurantResponse.data[0]);
          }
        } catch (err) {
          console.error("Failed to fetch restaurant after login:", err);
        }
      }
      router.push("/page/welcome/welcome-back");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');

        .login-root {
          font-family: 'DM Sans', sans-serif;
          background: #EFFFFF;
          height: 100dvh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .login-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 80% 20%, rgba(56,182,255,0.13) 0%, transparent 70%),
            radial-gradient(ellipse 50% 60% at 10% 80%, rgba(56,182,255,0.09) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .login-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 16px;
          position: relative;
          z-index: 1;
          min-height: 0;
        }

        .login-card {
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(56,182,255,0.15);
          border-radius: 24px;
          padding: 36px 44px;
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

        .login-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 22px;
        }

        /* Blue background gradient and shadow deleted from here */
        .login-logo-mark {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-title {
          font-family: 'DM Serif Display', serif;
          font-size: 24px;
          color: #0f1923;
          text-align: center;
          margin: 0 0 4px;
          letter-spacing: -0.3px;
        }

        .login-subtitle {
          font-size: 13px;
          color: #7a8fa6;
          text-align: center;
          margin: 0 0 24px;
          font-weight: 400;
        }

        .login-error {
          background: #fff0f0;
          border: 1px solid #fca5a5;
          color: #b91c1c;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          margin-bottom: 16px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .login-field {
          margin-bottom: 14px;
        }

        .login-label {
          display: block;
          font-size: 11.5px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 6px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .login-input-wrap {
          position: relative;
        }

        .login-input {
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
        }

        .login-input::placeholder { color: #b0c0d0; }

        .login-input:focus {
          border-color: #38B6FF;
          background: #fff;
          box-shadow: 0 0 0 3.5px rgba(56,182,255,0.14);
        }

        .login-input-pw { padding-right: 44px; }

        .pw-toggle {
          position: absolute;
          right: 13px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #94afc5;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }
        .pw-toggle:hover { color: #38B6FF; }

        .login-forgot {
          display: flex;
          justify-content: flex-end;
          margin-top: 5px;
        }
        .login-forgot a {
          font-size: 12px;
          color: #38B6FF;
          text-decoration: none;
          font-weight: 500;
        }
        .login-forgot a:hover { text-decoration: underline; }

        .login-btn-primary {
          width: 100%;
          padding: 12px;
          background: #38B6FF;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          margin-top: 18px;
          transition: filter 0.18s, transform 0.12s, box-shadow 0.18s;
          box-shadow: 0 4px 14px rgba(56,182,255,0.35);
          letter-spacing: 0.01em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .login-btn-primary:hover:not(:disabled) {
          filter: brightness(1.07);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(56,182,255,0.40);
        }
        .login-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .login-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .login-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .login-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 16px 0;
        }
        .login-divider-line {
          flex: 1;
          height: 1px;
          background: #e8f0f7;
        }
        .login-divider-text {
          font-size: 11px;
          color: #a8becf;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          font-weight: 500;
          white-space: nowrap;
        }

        .login-btn-google {
          width: 100%;
          padding: 10px;
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
        .login-btn-google:hover {
          background: #f4faff;
          border-color: #38B6FF;
          box-shadow: 0 2px 10px rgba(56,182,255,0.10);
        }

        .login-bottom {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
          margin-top: 18px;
          font-size: 13px;
          color: #7a8fa6;
        }
        .login-bottom a {
          color: #38B6FF;
          font-weight: 600;
          text-decoration: none;
        }
        .login-bottom a:hover { text-decoration: underline; }

        .login-terms {
          margin-top: 14px;
          font-size: 10.5px;
          color: #a8becf;
          text-align: center;
          line-height: 1.6;
        }
        .login-terms a { color: #7abcda; text-decoration: underline; }

        .login-nav { position: relative; z-index: 1; }
        .login-footer { position: relative; z-index: 1; }
      `}</style>

      <div className="login-root">
        <div className="login-nav"><Navbar /></div>

        <main className="login-main">
          <div className="login-card">
            <div className="login-logo">
              <div className="login-logo-mark">
                <Image 
                  src="/logo/main/snblue.webp" 
                  alt="Logo" 
                  width={40} 
                  height={40}
                  priority 
                  style={{ objectFit: 'contain' }} // Changed to contain so it renders gracefully background-free
                />
              </div>
            </div>

            <h1 className="login-title">Welcome back</h1>
          
            {error && (
              <div className="login-error">
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none" style={{marginTop:1,flexShrink:0}}>
                  <circle cx="10" cy="10" r="9" stroke="#ef4444" strokeWidth="1.5"/>
                  <path d="M10 6v5M10 14h.01" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="login-field">
                <label htmlFor="email" className="login-label">Email</label>
                <div className="login-input-wrap">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="login-input"
                  />
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="password" className="login-label">Password</label>
                <div className="login-input-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="login-input login-input-pw"
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
                <div className="login-forgot">
                  <Link href="/auth/verify_email">Forgot password?</Link>
                </div>
              </div>

              <button type="submit" disabled={loading} className="login-btn-primary">
                {loading && <span className="login-spinner" />}
                {loading ? "Signing in…" : "Sign in"}
              </button>

              <div className="login-divider">
                <div className="login-divider-line" />
                <span className="login-divider-text">or continue with</span>
                <div className="login-divider-line" />
              </div>

              <button
                type="button"
                className="login-btn-google"
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

              <div className="login-bottom">
                <span>Don't have an account?</span>
                <Link href="/auth/register">Create one</Link>
              </div>

              <p className="login-terms">
                <Link href="https://policies.google.com/privacy">Privacy</Link> &{" "}
                <Link href="https://policies.google.com/terms">Terms</Link>
              </p>
            </form>
          </div>
        </main>

        <div className="login-footer"><Footer /></div>
      </div>
    </>
  );
}