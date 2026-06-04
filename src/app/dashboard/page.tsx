"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, TrendingUp, DollarSign, ShoppingBag, ChevronDown } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ah ng example data
const data = [
  { month: "Jan", sales: 1200 },
  { month: "Feb", sales: 1300 },
  { month: "Mar", sales: 1550 },
  { month: "Apr", sales: 2100 },
  { month: "May", sales: 2700 },
  { month: "Jun", sales: 3800 },
  { month: "Jul", sales: 3200 },
  { month: "Aug", sales: 2600 },
  { month: "Dec", sales: 2300 },
];


export default function Dashboard() {
  return (
    
    <div className="flex min-h-screen bg-[#EFFFFF]">
      {/* Sidebar */}
      {/* <aside className="w-64 bg-[#EFFFFF] border shadow-black shadow-xs text-slate-400 flex flex-col shrink-0">
        <div className="p-8 flex flex-col items-center">
          <a href="/page">
            <div className=" mb-1 mt-[-15] ">
              <Image src="/logo/logo.png" alt="Logo" width={40} height={40} />
            </div>
          </a>
          <span className="font-bold text-[#61A9E5] tracking-wide">
            Scan Now
          </span>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavItem
            href="/page" // Add this
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            active
          />
          <NavItem
            href="/page/addtomenu"
            icon={<UtensilsCrossed size={20} />}
            label="Add Menu"
          />
          <NavItem
            href="/orders" // Add this
            icon={<ShoppingBag size={20} />}
            label="Orders"
          />
        </nav>

        <div className="p-4 border-t border-slate-700/50">
          <NavItem icon={<Settings size={20} />} label="Settings" />
        </div>
      </aside> */}

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-4 mt-[-10]">
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
          <StatCard
            icon={<DollarSign size={22} />}
            label="Total Sales"
            value="$1,250"
            color="bg-blue-50 text-blue-500"
          />
          <StatCard
            icon={<ShoppingBag size={22} />}
            label="Orders"
            value="153"
            color="bg-sky-50 text-sky-400"
          />
          <StatCard
            icon={<TrendingUp size={22} />}
            label="Revenue"
            value="$8,734"
            color="bg-blue-50 text-blue-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 mb-[-10] gap-6">
          {/* Sales Chart Container */}
          <div className="lg:col-span-2 bg-white p-7 rounded-[24px] shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-slate-800 text-lg">
                Sales Overview
              </h3>
              <button className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600">
                Monthly <ChevronDown size={14} />
              </button>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value: number | undefined) => [
                      `$${value?.toLocaleString() ?? "0"}`,
                      "Sales",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                    dot={{
                      r: 4,
                      fill: "#3b82f6",
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <span className="text-green-500 font-bold text-sm">↑ 17%</span>
              <span className="text-slate-400 text-sm font-medium">
                vs last month
              </span>
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="bg-white p-7 rounded-[24px] shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 text-lg mb-8">
              Top Selling Items
            </h3>
            <div className="space-y-7">
              <FoodItem
                img="/logo/bay srob.jpg"
                name="Cheeseburger"
                sales={120}
                progress={90}
              />
              <FoodItem
                img="/logo/bay srob.jpg"
                name="Pepperoni Pizza"
                sales={98}
                progress={75}
              />
              <FoodItem
                img="/logo/bay srob.jpg"
                name="Caesar Salad"
                sales={86}
                progress={65}
              />
              <FoodItem
                img="/logo/bay srob.jpg"
                name="Grilled Salmon"
                sales={74}
                progress={55}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Sub-components for cleaner code
function NavItem({
  icon,
  label,
  href = "#", // Add href here
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;      // Add type here
  active?: boolean;
}) {
  return (
    <Link href={href} className="block no-underline">
      <div
        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-200 ${
          active
            ? "bg-[#61A9E5] text-white shadow-lg shadow-blue-600/20"
            : "hover:bg-slate-200 text-slate-500 hover:text-[#61A9E5]"
        }`}
      >
        {icon}
        <span className="font-semibold text-sm">{label}</span>
      </div>
    </Link>
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
    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-shadow">
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

function FoodItem({
  img,
  name,
  sales,
  progress,
}: {
  img: string;
  name: string;
  sales: number;
  progress: number;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-2xl overflow-hidden relative shadow-sm shrink-0">
        <Image src={img} alt={name} fill className="object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[15px] font-bold text-slate-800 truncate">
            {name}
          </span>
          <span className="text-[15px] font-black text-slate-800">{sales}</span>
        </div>
        <p className="text-xs text-slate-400 font-medium mb-3">{sales} sales</p>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-blue-400 h-full rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
