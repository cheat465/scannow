"use client";

import React from "react";
import { Search, SlidersHorizontal, ArrowRight, Flame, UtensilsCrossed, Soup, Coffee } from "lucide-react";
import Image from "next/image";

export default function PhoneScreenPage() {
  return (
    <div className="flex flex-col h-full relative p-8">
      {/* Top Header */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-black">Dashboard</h1>
        <div className="relative w-96">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="search your dished"
            className="w-full pl-12 pr-4 py-3 rounded-full border-none bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100 text-gray-600"
          />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex justify-center items-start relative gap-8">
        
        {/* Create Qr Button - Positioned absolutely or flexed to right */}
        <div className="absolute right-0 top-0">
          <button className="bg-[#38B6FF] hover:bg-[#2da3e6] text-white px-6 py-2 rounded-lg font-medium shadow-md transition-colors">
            Create Qr
          </button>
        </div>

        {/* Phone Screen Preview */}
        <div className="w-[400px] h-[900px] bg-white rounded-xl overflow-hidden shadow-xl border border-gray-100 flex flex-col shrink-0">
          <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          {/* Header Image */}
          <div className="relative h-48 w-full shrink-0">
            <div className="absolute inset-0 bg-gray-200">
              <Image 
                src="/logo/Resturant.jpg" 
                alt="Restaurant Header" 
                layout="fill" 
                objectFit="cover"
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-5 flex flex-col gap-6">
            
            {/* Welcome Section */}
            <div className="flex justify-between items-end">
              <h2 className="text-lg font-medium text-gray-800 w-2/3 leading-tight">
                Welcome to , Ana Resturant
              </h2>
              <button className="text-[#38B6FF] text-xs font-medium flex items-center gap-1">
                more info <ArrowRight size={12} />
              </button>
            </div>

            {/* Categories */}
            <div className="flex justify-between overflow-x-auto gap-4 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <CategoryItem icon={<Flame className="text-orange-500" />} label="Grilled" />
              <CategoryItem icon={<UtensilsCrossed className="text-yellow-500" />} label="Stir-Fried Dishes" />
              <CategoryItem icon={<Soup className="text-green-500" />} label="Soup" />
              <CategoryItem icon={<Coffee className="text-red-500" />} label="Drinks" />
            </div>

            {/* In-Phone Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black" size={20} />
              <input
                type="text"
                placeholder="search your dished"
                className="w-full pl-12 pr-10 py-3 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#38B6FF]"
              />
              <SlidersHorizontal className="absolute right-4 top-1/2 transform -translate-y-1/2 text-black" size={18} />
            </div>

            {/* Recommend Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg text-black">Recommend</h3>
                <button className="text-gray-500 text-xs flex items-center gap-1">
                  see all <ArrowRight size={10} />
                </button>
              </div>


              {/* Food Card 1 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-4 ">
                <div className="relative h-40 w-full rounded-xl overflow-hidden">
                  <Image 
                    src="/logo/beef.jpg" 
                    alt="Beef Lok Lak" 
                    layout="fill" 
                    objectFit="cover" 
                  />
                  {/* <div className="absolute top-4 right-4 rotate-[-12deg]">
                     <span className="text-white font-serif italic text-2xl font-bold drop-shadow-lg">Shaking Beef</span>
                  </div> */}
                </div>
                <div className="pt-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-black text-lg">Beef Lok Lak</h4>
                  </div>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                    it came with : <br />
                    Tender stir-fried beef served with rice, fried egg, fresh vegetables, and lime-pepper sauce.
                  </p>
                  <div className="flex justify-end items-center">
                    <span className="font-bold text-xl text-black">3$</span>
                  </div>
                </div>
              </div>

              {/* Food Card 2 - For Scrolling Demo */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
                <div className="relative h-40 w-full rounded-xl overflow-hidden">
                  <Image 
                    src="/logo/pork.jpg" 
                    alt="Pork Rice" 
                    layout="fill" 
                    objectFit="cover" 
                  />
                </div>
                <div className="pt-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-black text-lg">Pork Rice</h4>
                  </div>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                    Classic breakfast : <br />
                    Grilled pork marinated in coconut milk, served with broken rice and pickled vegetables.
                  </p>
                  <div className="flex justify-end items-center">
                    <span className="font-bold text-xl text-black">2.5$</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 min-w-[70px]">
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <span className="text-[10px] text-gray-600 text-center font-medium leading-tight max-w-[70px]">
        {label}
      </span>
    </div>
  );
}
