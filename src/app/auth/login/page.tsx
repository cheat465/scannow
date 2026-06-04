"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase/client";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Redirect to dashboard or welcome page after successful login
        router.push("/page/welcome/welcome_back");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#EFFFFF]">
      <Navbar />
      <div className=" flex items-center justify-center min-h-screen">
        <div className="relative z-10 max-w-md bg-white rounded-lg shadow-lg p-8 mt-[-100] mb-[-20] ">
          <h2 className="text-sm font-bold font-sans text-center text-black mb-5">
            Sign In to Your Account
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-black mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Your Email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#38B6FF] focus:border-transparent"
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-black mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Your Password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#38B6FF] focus:border-transparent"
              />
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-[#38B6FF] 
              text-white font-bold rounded-lg shadow-md hover:brightness-95 transition mt-1 translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
            
            <h3 className="underline font-light text-black font-sans mt-1">
              <Link href="/auth/verify_email">Forgot Password?</Link>
            </h3>
            <p className="font-sans font-light  text-black text-xs">Our Term of Service you can find by this <Link href="/page/terms">link</Link>. THis site is protected by reCAPTCHA and the Google <Link href="https://policies.google.com/privacy">Privacy Policy</Link> and <Link href="https://policies.google.com/terms">Terms of Service</Link> apply.
            </p>
            </form>
        </div>
        <Footer />
    </div>
    </div>
  );
}
