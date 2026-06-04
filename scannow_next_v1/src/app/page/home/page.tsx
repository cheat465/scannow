"use client";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import Link from "next/link";
import React from "react";
// HI1

export default function Home() {
  return (
    <div className="min-h-screen bg-[#EFFFFF]">
      <div className="relative">
        <Navbar />
        <div className="absolute right-8 top-1/2 transform -translate-y-1/2 flex space-x-4">
          <button className="border-2 border-black px-13 py-3 h-14 rounded-xl hover:bg-gray-100 text-lg text-[#2e9be0] font-sans font-bold">
            Sign in
          </button>
          {/* <button  className="bg-[#61A9E5] text-white px-10 py-2 rounded-xl hover:bg-[#2e9be0] text-lg text-white foont-sans font-bold">
            Get Start
          </button> */}
          <Link
          href="/auth/register"
          className="bg-[#61A9E5] text-white px-10 py-2 rounded-xl hover:bg-[#2e9be0] text-lg text-white foont-sans font-bold"
          >
          Get Start
          </Link>
        </div>
      </div>

      <section className="flex items-start gap-8 mt-10 px-8">
        <div className="flex-1 text-left">
          <h1 className="text-5xl ml-30 font-bold text-gray-900">
            Effortless Digital Menus
          </h1>
          <p className="text-gray-900 ml-30 mt-4">
            Simple Digides for your restaurant, Fast and convince.
          </p>​​

          <div className="text-center ml-110 mt-8">
            <button className="bg-[#61A9E5] text-white px-8 h-14 py-3 rounded-full font-bold shadow-md hover:bg-[#2e9be0]">
              Create Your Free QR Menu
            </button>
            <p className="mt-4 underline decoration-double text-gray-700 cursor-pointer hover:text-gray-900">
              See how it work
            </p>
          </div>
        </div>

        <div className="flex-shrink-0 mt-9">
          <img src="/logo/qrandphone.png" alt="QR Icon" className="w-70  mr-40" />
        </div>
      </section>

      <section className="flex justify-center gap-15 mt-8 px-8 flex-wrap">
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
            className="bg-white w-80 rounded-xl shadow-md p-5 text-left hover:shadow-lg transition"
          >
            <img src={card.icon} alt="" className=" w-10 mb-3" />
            <h3 className="font-semibold text-gray-800">{card.title}</h3>
            <p className="text-xs text-gray-800 mt-1">{card.text}</p>
          </div>
        ))}
      </section>

      {/* part2 */}
      <div className="flex justify-left gap-15 mt-8 px-8 flex-wrap" >
        <h1 className="font-semibold text-[#61A9E5] flex justify-center gap-15 text-4xl mt-8 px-30 flex-wrap">How it work!!!</h1>
      </div>
       <section className="bg-[#EFFFFF] py-16 px-6 flex justify-center">
      <div className="relative bg-white shadow-lg rounded-2xl max-w-270 w-full h-90 flex flex-col md:flex-row items-center p-8 md:p-10">
        
        {/* Left decorative flowers */}
        <img
          src="/logo/romdoul.png"
          alt="flower left"
          className="absolute left-[-180px] bottom-[170px] w-50 "
        />
        <img
          src="/logo/romdoul.png"
          alt="flower right"
          className="absolute right-[-140px] top-[200px] w-50 "
        />

        {/* Video thumbnail / play button */}
        <div className="bg-black w-full md:w-90 h-60 aspect-video flex justify-center items-center rounded-xl overflow-hidden mb-6 md:mb-0 md:mr-8">
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
        

        {/* Text section */}
        <div className="md:w-1/2 text-gray-800">
          <ol className="text-xl list-decimal pl-5 space-y-2">
            <li>
              <span className="font-semibold">Create QR Code</span> – Generate your unique QR for your restaurant.
            </li>
            <li>
              <span className="font-semibold">Add Menu</span> – Upload your dishes, prices, and details easily.
            </li>
            <li>
              <span className="font-semibold">Customize</span> – Add your logo and colors to match your brand.
            </li>
            <li>
              <span className="font-semibold">Share</span> – Print or display the QR so customers can scan and order instantly.
            </li>
          </ol>
        </div>
      </div>
    </section>

{/* PART3                                                       PART3*/}
    <div className=" min-h-screen flex flex-col items-center justify-center px-6 py-10">
      
      <h2 className=" md:text-4xl mr-225 font-semibold text-[#61A9E5] mb-13 text-center">
        Why Choosing Us?
      </h2>

      {/* Content Card */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-5 max-w-6xl">
        {/* Left side - icons (outside the box) */}
        <div className="flex  flex-col space-y-6 flex-shrink-0">
          <img src="/logo/light.png" alt="Light bulb" className="mt-5 w-45 h-45" />
          <img src="/logo/thinking.png" alt="Thinking" className="w-45 h-45" />
        </div>

        {/* White box with text */}
        <div className="bg-white shadow-md rounded-xl p-3 md:p-7 flex-1">
          <div className="text-gray-800 font-sans leading-relaxed text-base md:text-lg">
          <p className="mb-1 ">
            We believe going digital should be simple, fast, and stress-free. That’s why we’ve
            built an easy way for restaurants to create and share beautiful QR code menus — no apps,
            no tech skills, no hassle.
          </p>
          <p className="mb-1">
            With our platform, you can turn your menu into a digital experience in just minutes.
            Upload your menu, customize your colors and logo, and get a QR code that’s ready to
            print or share online. It’s that easy.
          </p>
          <p className="mb-1">
            Your customers will love it too. They can scan the QR code and view your menu instantly
            on their phone — contactless, convenient, and always up to date. No more outdated paper
            menus or reprints when prices change.
          </p>
          <p className="mb-1">
            You’ll save time, cut printing costs, and boost sales by giving your customers a
            smoother experience. Whether you run a small café or a busy restaurant, our system helps
            you look more professional and modern.
          </p>
          <p className="mb-1">
            Plus, you get insights that help your business grow — see how often your QR codes are
            scanned and understand what’s working best.
          </p>
          <p>
            Simple to set up, easy to manage, and designed to impress — we help you bring your menu
            into the digital age while keeping things effortless.
          </p>
          </div>
        </div>
      </div>

      {/* Thank You Section */}
      <div className="mt-30 text-center">
        <img src="/logo/ty.png" className="h-30" />
        
        <div className="flex justify-center mb-6">
          <div className="w-16 border-t-2 border-gray-400"></div>
        </div>
      </div>

      
    </div>

      <Footer />
    </div>
  );
}
