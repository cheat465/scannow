"use client";
import React from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const PricingPage = () => {
  return (
    <div className="min-h-screen bg-[#F0FEFF] flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-grow flex justify-center items-center py-16 px-4">
        <div className="relative z-10 w-full max-w-md md:max-w-2xl lg:max-w-xl border border-[#38B6FF]/30 rounded-[30px] p-8 md:p-12 bg-white/50 backdrop-blur-sm shadow-sm">
          
          <div className="space-y-6">
            {/* Basic Plan */}
            <div className="bg-[#B9DDF8] rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow cursor-pointer border border-[#9ACBE8]">
              <h3 className="text-2xl font-bold text-black mb-2">Basic Plan</h3>
              <div className="text-3xl font-bold text-black mb-4">$10 / month</div>
              <p className="text-gray-700 mb-6">Billed monthly</p>
              <p className="text-gray-700">Pay as you go</p>
            </div>

            {/* 3 Months Prepay */}
            <div className="bg-[#B9DDF8] rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow cursor-pointer border border-[#9ACBE8]">
              <h3 className="text-2xl font-bold text-black mb-2">3 Months Prepay</h3>
              <div className="text-3xl font-bold text-black mb-4">$27 / 3 months</div>
              <p className="text-gray-800 font-medium mb-2">Save 10%!</p>
              <p className="text-gray-700">Equivalent to $9 / Month</p>
            </div>

            {/* 6 Months Prepay */}
            <div className="bg-[#B9DDF8] rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow cursor-pointer border border-[#9ACBE8]">
              <h3 className="text-2xl font-bold text-black mb-2">6 Months Prepay</h3>
              <div className="text-3xl font-bold text-black mb-4">$48 / 6 months</div>
              <p className="text-gray-800 font-medium mb-2">Save 20%!</p>
              <p className="text-gray-700">Equivalent to $9 / Month</p>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PricingPage;
