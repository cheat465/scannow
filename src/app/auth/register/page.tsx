"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { supabase } from "@/app/lib/supabase/client";

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/verify_email`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        setSuccess(true);
        // Redirect to email verification page
        setTimeout(() => {
          router.push("/auth/verify_email");
        }, 2000);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#EFFFFF] overflow-hidden">
      {/* Navbar stays normal */}
      <Navbar />

      {/* Main content ABOVE footer */}
      <main className="relative z-10 flex flex-col mb-[-100] items-center justify-center min-h-screen">
        {/* Logo */}
        {/* <div className=""> */}
          {/* <div className="flex justify-center mb-8">
            <img
              src="/logo/logo.png"
              alt="Menu QR"
              className="h-30 w-auto"
            />
          </div> */}
        {/* </div> */}

        {/* Register Card */}
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg  p-8 -translate-y-12">
          <h2 className="text-2xl font-bold text-center text-black mb-8">
            Register Your Account
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
              Registration successful! Please check your email to verify your account. Redirecting...
            </div>
          )}

          <form className="space-y-6" onSubmit={handleRegister}>
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter Your Full Name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-[#38B6FF]"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Your Email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-[#38B6FF]"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Your Password"
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-[#38B6FF]"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Confirm Your Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Your Password"
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-[#38B6FF]"
              />
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-4 bg-[#38B6FF] text-white font-bold rounded-lg
                         shadow-md hover:brightness-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Registering..." : success ? "Registration Successful!" : "Register"}
            </button>
          </form>
        </div>
      </main>

      {/* Footer is BACKGROUND layer */}
      <Footer />
    </div>
  );
};

export default RegisterPage;
