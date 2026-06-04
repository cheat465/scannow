"use client";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useRouter } from "next/navigation";
import { useRef, useEffect } from "react";
import { getStoredUser } from "@/lib/api";

export default function Home() {
  const howitworkRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (getStoredUser()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleCreateMenu = () => {
    if (getStoredUser()) {
      router.replace("/dashboard");
    } else {
      router.push("/auth/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#EFFFFF]">
      <div>
        <Navbar />
      </div>

      {/* HERO */}
      <section className="relative z-10 flex flex-col md:flex-row items-start gap-8 mt-10 px-6 md:px-8">
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900">
            Effortless Digital Menus
          </h1>
          <p className="text-gray-900 mt-4">
            Simple Digides for your restaurant, Fast and convince.
          </p>

          {/* Button Container */}
          <div className="relative z-10 flex flex-col items-center mt-8 w-full md:w-fit md:ml-auto">
            <button
              onClick={handleCreateMenu}
              className="bg-[#61A9E5] text-white px-8 h-14 py-3 rounded-full font-bold shadow-md hover:bg-[#2e9be0] transition-colors w-full md:w-auto"
            >
              Create Your Free QR Menu
            </button>

            <button
              className="mt-4 underline decoration-double text-gray-700 cursor-pointer hover:text-gray-900"
              onClick={() => {
                howitworkRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              See how it work
            </button>
          </div>
        </div>

        <div className="flex-shrink-0 flex justify-center w-full md:w-auto mt-6 md:mt-9">
          <img
            src="/logo/qrandphone.png"
            alt="QR Icon"
            className="w-48 md:w-70 md:mr-40"
          />
        </div>
      </section>

      {/* FEATURE CARDS */}
      <section className="relative z-10 flex justify-center gap-6 mt-8 px-6 md:px-8 flex-wrap">
        {[
          {
            icon: "/logo/qr.png",
            title: "Create your QR",
            text: "Create QR Code For Customer Ordering, Easy and fast.",
          },
          {
            icon: "/logo/list.png",
            title: "Add your menu",
            text: "Add Your dished to the menu.",
          },
          {
            icon: "/logo/share.png",
            title: "Customize & Share",
            text: "Customize and share with friend.",
          },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-white w-full sm:w-72 md:w-80 rounded-xl shadow-md p-5 text-left hover:shadow-lg transition"
          >
            <img src={card.icon} alt="" className="w-10 mb-3" />
            <h3 className="font-semibold text-gray-800">{card.title}</h3>
            <p className="text-xs text-gray-800 mt-1">{card.text}</p>
          </div>
        ))}
      </section>

      {/* HOW IT WORKS */}
      <div
        ref={howitworkRef}
        id="howitwork"
        className="flex justify-center mt-8 px-6 md:px-8"
      >
        <h1 className="relative z-10 font-semibold text-[#61A9E5] text-3xl md:text-4xl mt-8 text-center">
          How it work!!!
        </h1>
      </div>
      <section className="bg-[#EFFFFF] py-16 px-6 flex justify-center">
        <div className="z-10 relative bg-white shadow-lg rounded-2xl w-full max-w-4xl flex flex-col md:flex-row items-center p-6 md:p-10 overflow-hidden">
          {/* Decorative flowers — hidden on mobile to avoid overflow */}
          <img
            src="/logo/romdoul.png"
            alt="flower left"
            className="hidden lg:block absolute left-[-180px] bottom-[170px] w-50"
          />
          <img
            src="/logo/romdoul.png"
            alt="flower right"
            className="hidden lg:block absolute right-[-140px] top-[200px] w-50"
          />

          {/* Video */}
          <div className="bg-black w-full md:w-80 aspect-video flex justify-center items-center rounded-xl overflow-hidden mb-6 md:mb-0 md:mr-8 flex-shrink-0">
            <button className="bg-white rounded-full p-5 shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-black"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>

          {/* Steps */}
          <div className="w-full md:w-1/2 text-gray-800">
            <ol className="text-base md:text-xl list-decimal pl-5 space-y-2">
              <li>
                <span className="font-semibold">Create QR Code</span> – Generate
                your unique QR for your restaurant.
              </li>
              <li>
                <span className="font-semibold">Add Menu</span> – Upload your
                dishes, prices, and details easily.
              </li>
              <li>
                <span className="font-semibold">Customize</span> – Add your logo
                and colors to match your brand.
              </li>
              <li>
                <span className="font-semibold">Share</span> – Print or display
                the QR so customers can scan and order instantly.
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <div className="relative z-10 flex flex-col items-center px-6 py-10">
        <h2 className="text-2xl md:text-4xl font-semibold text-[#61A9E5] mb-8 text-center">
          Why Choosing Us?
        </h2>

        {/* Content Card */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-5 w-full max-w-6xl">
          {/* Side icons — hidden on mobile */}
          <div className="hidden md:flex flex-col space-y-6 flex-shrink-0">
            <img src="/logo/light.png" alt="Light bulb" className="mt-5 w-36 h-36" />
            <img src="/logo/thinking.png" alt="Thinking" className="w-36 h-36" />
          </div>

          {/* White box */}
          <div className="bg-white shadow-md rounded-xl p-4 md:p-7 flex-1">
            <div className="text-gray-800 font-sans leading-relaxed text-sm md:text-base lg:text-lg">
              <p className="mb-2">
                We believe going digital should be simple, fast, and stress-free.
                That's why we've built an easy way for restaurants to create and
                share beautiful QR code menus — no apps, no tech skills, no hassle.
              </p>
              <p className="mb-2">
                With our platform, you can turn your menu into a digital experience
                in just minutes. Upload your menu, customize your colors and logo,
                and get a QR code that's ready to print or share online. It's that easy.
              </p>
              <p className="mb-2">
                Your customers will love it too. They can scan the QR code and view
                your menu instantly on their phone — contactless, convenient, and
                always up to date. No more outdated paper menus or reprints when
                prices change.
              </p>
              <p className="mb-2">
                You'll save time, cut printing costs, and boost sales by giving your
                customers a smoother experience. Whether you run a small café or a
                busy restaurant, our system helps you look more professional and modern.
              </p>
              <p className="mb-2">
                Plus, you get insights that help your business grow — see how often
                your QR codes are scanned and understand what's working best.
              </p>
              <p>
                Simple to set up, easy to manage, and designed to impress — we help
                you bring your menu into the digital age while keeping things effortless.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info row */}
        <div className="w-full flex flex-col sm:flex-row items-center sm:justify-between gap-8 mt-16 px-2">
          {/* Social + links */}
          <div className="flex flex-col space-y-2 items-center sm:items-start">
            <div className="flex space-x-4">
              <img src="/logo/fb.png" className="w-10 h-10" />
              <img src="/logo/yt.png" className="w-10 h-10" />
            </div>
            <p className="text-xs text-black">@ Scan_now</p>
            <p className="text-xs text-black underline decoration-double">
              Private Policy
            </p>
          </div>

          {/* Thank you image */}
          <div className="text-center">
            <img src="/logo/ty.png" className="h-24 md:h-30 mx-auto" />
          </div>

          {/* Lang / Help */}
          <div className="flex items-center space-x-4 text-xs text-black">
            <p>English</p>
            <p>Help</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}   