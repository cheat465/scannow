"use client";

import React from "react";
import Link from "next/link";
import Navbar1 from "../../components/Navbar1";
import Footer from "../../components/Footer";

export default function WelcomePage() {
  return (
     <div className="min-h-screen bg-[#EFFFFF] flex flex-col font-sans relative">
        <Navbar1 />

      {/* Logo Section */}
      <div className="flex-1 flex items-center justify-center mt-[-70] px-4 relative">
        <div className="w-full max-w-sm mx-auto">
        <div className="flex flex-col items-center mb-8">
        <img src="/logo/logo.png" alt="Logo" className="h-25 w-auto " />
      </div>

      {/* Welcome Card */}
      <div className="relative z-10 bg-white w-full max-w-md rounded-lg shadow-md p-8 text-center border border-gray-300">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome, Ana!</h2>
        <p className="text-gray-600 mb-6">Your account is ready!</p>

        {/* Wallet Icon */}
        <div className="flex justify-center mb-6">
          <svg
            className="w-12 h-12 text-[#38B6FF]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>

        {/* Get Started Button */}
        <Link href="/page/about_your_restaurant">
        <button className="w-full py-3 px-6 bg-[#38B6FF] text-white font-medium rounded-lg shadow-md hover:brightness-95 transition">
          Get Started
        </button>
        </Link>
      </div>
    </div>
    </div>
      <Footer />
    </div>
  );
}
