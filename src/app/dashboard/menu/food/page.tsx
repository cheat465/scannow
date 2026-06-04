"use client";

import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { Camera, Clock, Utensils, Wine, IceCream } from "lucide-react";
import { useState } from "react";

export default function AddFoodPage() {
  const [available, setAvailable] = useState(true);

  return (
    
    <div className="bg-[#EFFFFF]">
           <div className="flex items-center justify-center text-center h-20 bg-[#EFFFFF] border-b-2 border-slate-200 shadow-xl">
  <h1 className="text-3xl font-semibold text-sky-500">
    Add Food Item To Menu
  </h1>
</div>

    <div className=" bg-[#F2FFFD] flex justify-center py-10">

      <div className="w-full ml-[-200] max-w-4xl px-6">

        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Food Name */}
          <div>
            <label className="block font-medium text-black mb-2">Food Name</label>
            <input
              type="text"
              placeholder="e.g classic cheeseburger..."
              className="w-full border  text-black rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-black font-medium mb-2">Category</label>
            <div className="flex gap-4">
              <CategoryIcon icon={<Utensils />} active />
              <a href="/dashboard/menu/drinks"><CategoryIcon icon={<Wine />} /></a>
              <a href="/dashboard/menu/desert"><CategoryIcon icon={<IceCream />} /></a>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-black font-medium mb-2">Description</label>
            <textarea
              rows={4}
              placeholder="e.g juicy beef patty with cheddar..."
              className="w-full text-black border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-black font-medium mb-2">Price (USD)</label>
            <div className="flex items-center border rounded-lg px-4 py-3 border-black">
              <input
                type="number"
                placeholder="...."
                className="w-full text-black focus:outline-none "
              />
              <span className="ml-2 text-gray-500">$</span>
            </div>

            <div>
            <label className="block text-black font-medium mb-2">
              Preparation Time (Minute)
            </label>
            <div className="flex items-center border rounded-lg px-4 py-3 border-black">
              <input
                type="number"
                placeholder="...."
                className="w-full text-black focus:outline-none"
              />
              <Clock className="ml-2 text-gray-500" size={18} />
            </div>
          </div>
          </div>

          {/* Ingredients Image */}
          <div>
            <label className="block text-black font-medium mb-2">Food Image</label>
            <div className="border-2 border-dashed rounded-xl h-40 flex items-center justify-center text-gray-400 cursor-pointer hover:border-sky-400">
              <Camera size={36} />
            </div>
          </div>

          {/* Preparation Time */}
          

          {/* Customs */}
          <div>
            <a href="/dashboard/menu">
            <div className="mt-38 flex justify-center hover-black font-bold items-center w-40 h-10 bg-[#61A9E5] mt-3 rounded-xl">
                <h1>Cancel</h1>
            </div>
            </a>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

/* Category Button */
function CategoryIcon({
  icon,
  active = false,
}: {
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <div
      className={`w-16 h-16 flex items-center justify-center rounded-full border cursor-pointer transition
      ${
        active
          ? "border-sky-400 text-sky-500 bg-white shadow"
          : "border-gray-300 text-gray-400"
      }`}
    >
      {icon}
    </div>
  );
}
