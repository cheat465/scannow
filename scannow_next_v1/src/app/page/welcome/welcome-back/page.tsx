"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import { getStoredUser } from "@/lib/api";

export default function WelcomePage() {
  const [userName, setUserName] = useState<string>("there");

  useEffect(() => {
    const user = getStoredUser();
    if (user && user.name) {
      // Get first name or full name
      setUserName(user.name.split(" ")[0]);
    }
  }, []);

  return (
     <div className="min-h-screen bg-[#EFFFFF] flex flex-col font-sans relative">
        <Navbar />

      {/* Logo Section */}
      <div className="flex-1 flex items-center justify-center px-4 relative ">
        <div className="w-full max-w-sm mx-auto">
        <div className="flex flex-col items-center mb-8">
        <img src="/logo/main/snblue.webp" alt="Logo" className="h-30 w-auto mt-2 mb-3" />
                <h1 className="text-3xl font-bold text-[#61A9E5]">Welcome back, {userName}!</h1>
      </div>
      

      {/* Welcome Card */}
      <div className="bg-white w-full max-w-md rounded-lg shadow-md p-8 text-center border border-gray-300">
        <h2 className="text-md font-bold text-gray-900 mt-[-20] mb-[1] mb-4">You are now signed in</h2>
        <p className="text-xs text-gray-600 mb-6">Your dashboard awaits!</p>

        {/* Wallet Icon */}
        <div className="flex justify-center mb-6">
  <div 
    className="h-12 w-12 bg-[#61A9E5]" // This sets the actual color
    style={{
      maskImage: 'url(/logo/tick-circle.svg)',
      WebkitMaskImage: 'url(/logo/tick-circle.svg)',
      maskRepeat: 'no-repeat',
      maskSize: 'contain'
    }}
  />
</div>

        {/* Get Started Button */}
        <Link href="/dashboard"> 
        <button className="font-bold w-full py-3 px-6 bg-[#38B6FF] text-white font-medium rounded-lg shadow-md hover:brightness-95 transition">
          Go to Dashboard
        </button></Link>
      </div>
    </div>
    </div>
      <Footer />
    </div>
  );
}
