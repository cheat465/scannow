"use client";

import React from "react";
import { Wallet, BadgePercent, Crown } from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Image from "next/image";

const plans = [
  {
    id: "basic",
    icon: Wallet,
    name: "Basic",
    price: "$10",
    period: "/ month",
    equiv: null,
    save: null,
    billing: "Billed monthly · Pay as you go",
    featured: false,
  },
  {
    id: "three",
    icon: BadgePercent,
    name: "3 Months",
    price: "$27",
    period: "/ 3 months",
    equiv: "$9 / mo equivalent",
    save: "Save 10%",
    billing: "One-time payment · 3-month access",
    featured: true,
  },
  {
    id: "six",
    icon: Crown,
    name: "6 Months",
    price: "$48",
    period: "/ 6 months",
    equiv: "$8 / mo equivalent",
    save: "Save 20%",
    billing: "One-time payment · 6-month access",
    featured: false,
  },
];

const PricingPage = () => {
  return (
    <div className="min-h-screen bg-[#F0FEFF] flex flex-col font-sans overflow-hidden">
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-4 py-8 relative">
        {/* Background blobs */}
        <div className="absolute top-[-60px] right-[-60px] w-80 h-80 rounded-full bg-[#B9DDF8] blur-[60px] opacity-35 pointer-events-none" />
        <div className="absolute bottom-[-40px] left-[-40px] w-48 h-48 rounded-full bg-[#9ACBE8] blur-[60px] opacity-35 pointer-events-none" />

        <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
          {/* Header */}
          <div className="text-center mb-6 flex flex-col items-center">
            <Image
              src="/logo/main/snblue.webp"
              alt="ScanNow Logo"
              width={80}
              height={80}
              priority
              className="mb-3"
            />
            <h1 className="text-3xl font-serif text-[#1a3a4a] leading-snug font-normal">
              Choose your <span className="text-[#38B6FF]">plan</span>
            </h1>
          </div>

          {/* Cards — stack on mobile, row on md+ */}
          <div className="flex flex-col md:flex-row gap-4 w-full">
            {plans.map((plan) => {
              const Icon = plan.icon;

              return (
                <div
                  key={plan.id}
                  className={`
                    relative flex-1 rounded-[22px] p-6 border flex flex-col items-center
                    cursor-pointer transition-all duration-200
                    hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(56,182,255,0.18)]
                    ${
                      plan.featured
                        ? "bg-gradient-to-br from-[#B9DDF8] to-[#d6edf8] border-[#9ACBE8] hover:shadow-[0_16px_40px_rgba(56,182,255,0.3)]"
                        : "bg-white border-[#d6edf8] hover:border-[#38B6FF]"
                    }
                  `}
                >
                  {plan.featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#38B6FF] text-white text-[10px] font-semibold tracking-wide uppercase px-3.5 py-1 rounded-full whitespace-nowrap">
                      Most Popular
                    </span>
                  )}

                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4
                      ${plan.featured ? "bg-white/60" : "bg-[#e8f5fd]"}`}
                  >
                    <Icon
                      size={24}
                      strokeWidth={2.2}
                      className={plan.featured ? "text-[#1a6a9a]" : "text-[#38B6FF]"}
                    />
                  </div>

                  {/* Plan name */}
                  <p
                    className={`text-[13px] font-semibold tracking-[0.06em] uppercase mb-2.5
                      ${plan.featured ? "text-[#1a6a9a]" : "text-[#4a8fb5]"}`}
                  >
                    {plan.name}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline gap-0.5 mb-1">
                    <span className="text-lg font-medium text-[#1a3a4a] mt-1">$</span>
                    <span className="text-[38px] font-semibold text-[#1a3a4a] leading-none">
                      {plan.price.replace("$", "")}
                    </span>
                  </div>

                  <p className="text-[13px] text-[#7aaec8] mb-1">{plan.period}</p>

                  <p className="text-[12px] text-[#7aaec8] mb-4 min-h-[16px]">
                    {plan.equiv ?? "\u00A0"}
                  </p>

                  {/* Save badge */}
                  {plan.save ? (
                    <span
                      className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-lg mb-4
                        ${
                          plan.featured
                            ? "bg-white/60 text-[#0d6e8a]"
                            : "bg-[#e0f5e0] text-[#2e7d32]"
                        }`}
                    >
                      {plan.save}
                    </span>
                  ) : (
                    <div className="mb-4 h-6" />
                  )}

                  {/* Divider */}
                  <div
                    className={`w-full h-px mb-4 ${
                      plan.featured ? "bg-white/40" : "bg-[#e8f3fa]"
                    }`}
                  />

                  {/* Billing note */}
                  <p className="text-[11px] text-[#9bbfd4] mb-4 text-center">
                    {plan.billing}
                  </p>

                  {/* CTA */}
                  <button
                    className={`w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200
                      ${
                        plan.featured
                          ? "bg-[#38B6FF] text-white border border-[#38B6FF] hover:bg-[#1da8f0]"
                          : "bg-transparent border border-[#b9ddf8] text-[#2a7fa8] hover:bg-[#f0feff] hover:border-[#38B6FF] hover:text-[#1a6a9a]"
                      }`}
                  >
                    Get Started
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PricingPage;