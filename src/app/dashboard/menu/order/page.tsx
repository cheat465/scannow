"use client";

import React from "react";
import Navbar from "@/app/components/Navbar";
import {
  Search,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  ChevronDown,
  Soup,
  UtensilsCrossed,
  HandPlatter,
  Tag,
  Layers,
  CookingPot,
  Pencil,
  Eye,
  Trash2,
  ReceiptIcon,
  Clipboard,
  Package,
  Receipt,
  ReceiptText,
  Timer,
  CheckCheck,
  Check,
  PartyPopper,
  BadgeCheck,
  CircleCheck,
  Cross,
  X,
  Ban,
  Undo2,
  Undo,
  Trash,
  CircleX,
} from "lucide-react";
import { Camera, Clock, Utensils, Wine, IceCream } from "lucide-react";
import { useState } from "react";
import { Layer } from "recharts";

export default function Menu() {
  const [available, setAvailable] = useState(true);
  return (
    <div className="flex-1 h-screen overflow-y-auto">
      <div className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-4 mt-[-10]">
          <h1 className="text-2xl font-bold text-slate-800">Order</h1>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search..."
                className="text-black pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-72 shadow-sm transition-all"
              />
            </div>
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform">
              {/* Using food1 as a placeholder for profile as requested */}
              <img
                src="https://easydrawingguides.com/wp-content/uploads/2024/06/how-to-draw-an-easy-spider-man-featured-image-1200.png"
                alt="Profile"
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-5">
          <StatCard
            icon={<ReceiptText size={25} />}
            label="Total Orders"
            value="10"
            color="bg-blue-50 text-blue-500 text-black-300"
          />
          <StatCard
            icon={<Timer size={30} />}
            label="Pending Order"
            value="30"
            color="bg-sky-50 text-sky-400 text-yellow-400"
          />
          <StatCard
            icon={<CircleCheck size={25} />}
            label="Completed"
            value="67"
            color="bg-blue-50 text-blue-600 text-green-500"
          />
          <StatCard
            icon={<CircleX size={25} />}
            label="Cancel"
            value="67"
            color="bg-blue-50 text-blue-500 text-red-400"
          />
        </div>
        <div className="flex justify-between">
          <h3 className="font-bold text-slate-800 text-lg">Order Overview</h3>
        </div>
        <div className="bigwhitebox w-full h-109   mt-2 mb-[-30] bg-white shadow-sm border border-slate-100 rounded-xs ">
          <div className="all-to-addsish mt-2 ml-2 flex justify-between">
            <div className="all-to-filter flex gap-2 ">
              <div className="flex items-center justify-center all  w-20 h-8 text-sm text-white bg-[#61A9E5] hover:bg-[#2e9be0] rounded cursor-pointer">
                All
              </div>
              <div className="flex items-center justify-center all  w-25 h-8 text-sm text-black bg-sky-100 hover:shadow rounded cursor-pointer">
                Pending
              </div>
              <div className="flex items-center justify-center all  w-25 h-8 text-sm text-black bg-sky-100 hover:shadow rounded cursor-pointer">
                Completed
              </div>
              <div className="flex items-center justify-center all  w-25 h-8 text-sm text-black bg-sky-100 hover:shadow rounded cursor-pointer">
                Cancelled
              </div>
              {/* <div className="flex items-center justify-center appetizer w-20 h-6 text-xs text-black bg-sky-100 hover:shadow-md rounded cursor-pointer">
              Appetizer
            </div> */}
              <div className="relative flex items-center w-35 h-8 bg-sky-100 rounded hover:shadow-md cursor-pointer px-1 ">
                {/* The Icon stays on the left */}
                <ChevronDown
                  size={16}
                  className="text-black pointer-events-none"
                />

                <select className=" absolute inset-0 w-full h-full bg-transparent appearance-none pl-6 text-sm text-black cursor-pointer outline-none">
                  <option value="day">sat/17/jan/2026</option>
                  <option value="day">mon/18/jan/2026</option>
                  <option value="day">tue/19/jan/2026</option>
                </select>
              </div>
            </div>
          </div>
          <div className="DISHIMAGE-ACTION ml-12 mt-1 dishname-action flex gap-33 cursor-pointer ">
            <div className="dishname text-md text-black font-bold text-slate-800 ">
              Order ID
            </div>
            <div className="dishname ml-8 text-md text-black font-bold text-slate-800 ">
              Customer
            </div>
            <div className="dishname ml-11 text-md text-black font-bold text-slate-800">
              Items
            </div>
            <div className="dishname ml-1 text-md text-black font-bold text-slate-800">
              Status
            </div>
            <div className="dishname ml- text-md text-black font-bold text-slate-800">
              Date
            </div>
            <div className="dishname ml- text-md text-black font-bold text-slate-800">
              Action
            </div>
          </div>
          <div className="WHITEFOODBOX ml-3 w-294 h-80 border-2 rounded-xl cursor-pointer ">
            <div className="food1-action border-x border-b h-22 w-full rounded  flex ">
              <div className=" flex ml-8 ">
                <div>
                  <h1 className="text-black mt-4 ">Table 01</h1>
                  <h4 className="text-gray-400" >#table-01</h4>
                </div>
                <div className="ml-41">
                  <h1 className="text-black mt-4">Jonny</h1>
                  <h4 className="text-gray-400" >jan/17/2026</h4>
                </div>
                <div className="ml-41">
                <h1 className="text-black mt-4">Burgaar</h1>
                <h4 className="text-gray-400" >10$</h4>
                </div>
                <div className="mt-5 ml-22 filter relative flex items-center w-30 h-7 bg-green-300 rounded-xl hover:shadow-md cursor-pointer px-1 ">
                <ChevronDown
                  size={16}
                  className="text-black pointer-events-none"
                />

                <select className=" absolute inset-0 w-full h-full bg-transparent appearance-none pl-6 text-xs text-black cursor-pointer outline-none">
                  <option value="available">Avalaible</option>
                  <option value="pending">Pending</option>
                  <option value="cancel">Cancel</option>
                </select>
              </div>
                <div className="ml-20">
                <h1 className="text-black mt-4">jan/17/2026</h1>
                <h4 className="text-gray-400" >11:43am</h4>
                </div>
                <div className="ACTION ml-20 flex gap-2 items-center">
                  {/* VIEW BUTTON */}
                  <div
                    className="VIEW flex items-center justify-center h-10 w-10 bg-slate-50 text-slate-600 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                    title="View"
                  >
                    <Eye size={18} />
                  </div>

                  {/* DELETE BUTTON */}
                  <div
                    className="DELETE flex items-center justify-center h-10 w-10 bg-red-50 text-red-500 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
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

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white p-6 rounded-[12px] shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-shadow">
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className="text-2xl font-black text-slate-800">{value}</p>
      </div>
    </div>
  );
}
