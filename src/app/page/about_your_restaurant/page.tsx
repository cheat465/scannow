import React from "react";
import Navbar1 from "../../components/Navbar1";
import Footer from "../../components/Footer";
import Link from "next/link";

export default function AboutYourRestaurant() {
  return (
    <div className="bg-[#EFFFFF] ">
      <Navbar1 />
      <div className="relative z-10 flex flex-col items-center justify-center mt-1 min-h-screen">  
        <div className="w-full max-w-md bg-[#EFFFFF] rounded-lg shadow-[0_0_50px_-12px_rgba(0,0,0,0.25)] p-8 -translate-y-12">
          <h2 className="text-md font-bold font-sans text-center text-black mb-5 mb-[-100] mt-[-30]">
            About Your Restaurant
          </h2>

  
            <div className="flex h-screen w-full items-center mt-[-290] mb-[-290] justify-center ">
            <div className=" w-25 h-25 bg-[#61A9E5] rounded-full flex items-center justify-center">
                {/* You can put an <img> here or an Icon */}
                <img src="/logo/camera.png" className="w-10 h-10 "/>
   

  
                </div>
            </div>

          <form className="space-y-5">
            <div>
              <label
                htmlFor="country"
                className="block text-sm font-sans font-light text-black mb-1"
              >
                Place name:
              </label>
              <input 
                type="country"
                id="country"
                placeholder="Value"
                className="w-full px-4 py-3 border h-8 text-black border-gray-300 rounded-md mb-[-20] focus:outline-none bg-white
                focus:ring-2 focus:ring-[#38B6FF] focus:border-transparent placeholder-gray-300 font-sans placeholder-opacity-100"
                />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-sans font-light text-black mb-1 "
              >
                Description (optional):
              </label>
              <input
                type="description"
                id="description"
                placeholder="Value"
                className="w-full px-4 py-3 border h-8 text-black border-gray-300 rounded-md focus:outline-none bg-white
                focus:ring-2 focus:ring-[#38B6FF] focus:border-transparent placeholder-gray-300 font-sans placeholder-opacity-100"
                />
            </div>
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-sans font-light text-black mb-1"
              >
                Location name:
              </label>
              <input 
                type="location"
                id="location"
                placeholder="Value"
                className="w-full px-4 py-3 border h-8 text-black border-gray-300 rounded-md focus:outline-none bg-white
                focus:ring-2 focus:ring-[#38B6FF] focus:border-transparent placeholder-gray-300 font-sans placeholder-opacity-100"
                />
            </div>
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-sans font-light text-black mb-1"
              >
                Location Link (optional):
              </label>
              <input 
                type="location"
                id="location"
                placeholder="Value"
                className="w-full px-4 py-3 border h-8 text-black border-gray-300 rounded-md focus:outline-none bg-white
                focus:ring-2 focus:ring-[#38B6FF] focus:border-transparent placeholder-gray-300 font-sans placeholder-opacity-100"
                />
            </div>
            <div>
              <label
                htmlFor="number"
                className="block text-sm font-sans font-light text-black mb-1"
              >
                Phone Number:
              </label>
              <input 
                type="phone number"
                id="phone number"
                placeholder="Value"
                className="w-full px-4 py-3 border h-8 text-black border-gray-300 rounded-md focus:outline-none bg-white
                focus:ring-2 focus:ring-[#38B6FF] focus:border-transparent placeholder-gray-300 font-sans placeholder-opacity-100"
                />
            </div>
            
            <div className="flex items-center justify-center">
  <Link href="/dashboard">
    <button
      type="button"
      className="flex flex-col justify-center w-80 h-10 py-4 px-6 bg-[#38B6FF] mt-[-10] mb-[-10]
      text-white font-bold rounded-lg shadow-md hover:brightness-95 transition translate-y-[2px]"
    >
      Update
    </button>
  </Link>
</div>
            
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
