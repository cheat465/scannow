"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Store,
  DollarSign,
  CheckCircle2,
  TrendingUp,
  UsersRound,
  ArrowUpRight,
  Sparkles,
  LayoutDashboard,
  Bell,
  ChevronDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { apiRequest } from "@/lib/api";

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  trend: string;
  iconBg: string;
  iconColor: string;
}

interface Restaurant {
  name: string;
  orders: number;
  revenue: number;
}

interface UserLogin {
  id: string | number;
  name: string;
  role: string;
  status: string;
  email: string;
  last_login: string;
}

/* ─────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, trend, iconBg, iconColor }: StatCardProps) => (
  <div className="bg-white rounded-2xl p-4 border border-[#c8eef9] flex flex-col gap-3 shadow-[0_2px_12px_rgba(56,182,255,0.10)] active:scale-[0.98] transition-all duration-200 cursor-pointer">
    <div className="flex items-center justify-between">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={17} color={iconColor} />
      </div>
      <span className="text-[10.5px] font-bold text-[#1a9e5f] flex items-center gap-0.5 bg-[#e3faf1] px-2 py-0.5 rounded-full whitespace-nowrap">
        <TrendingUp size={10} />
        {trend}
      </span>
    </div>
    <div>
      <p className="text-xl font-extrabold text-[#0d2d45] m-0 tracking-tight leading-none">
        {value}
      </p>
      <p className="text-[10px] font-semibold text-[#7db8d4] mt-1 mb-0 uppercase tracking-wider leading-none">
        {label}
      </p>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl p-2.5 border border-[#c8eef9] shadow-[0_8px_24px_rgba(56,182,255,0.18)] text-xs">
      <p className="font-extrabold text-[#0d2d45] mb-1.5 mt-0 text-[11px]">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className={`my-0.5 font-semibold text-[11px] ${i === 0 ? "text-[#38B6FF]" : "text-[#61A9E5]"}`}>
          {p.name}: {p.name === "Revenue" ? `$${Number(p.value).toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
};

const RestaurantRow = ({ restaurant, index }: { restaurant: Restaurant; index: number }) => {
  const getRankStyle = (i: number) => {
    if (i === 0) return { bg: "bg-[#fff4e0]", text: "text-[#f5a623]" };
    if (i === 1) return { bg: "bg-[#EAF9FF]", text: "text-[#7db8d4]" };
    if (i === 2) return { bg: "bg-[#fdf0e8]", text: "text-[#b87333]" };
    return { bg: "bg-[#EAF9FF]", text: "text-[#7db8d4]" };
  };
  const rank = getRankStyle(index);

  return (
    <div
      className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-colors active:bg-[#daf3ff] ${
        index === 0
          ? "bg-[#EAF9FF] border border-[#c8eef9]"
          : "bg-transparent border border-transparent"
      }`}
    >
      <div
        className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[11px] font-extrabold ${rank.bg} ${rank.text}`}
      >
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#0d2d45] m-0 truncate">{restaurant.name}</p>
        <p className="text-[10.5px] text-[#7db8d4] m-0 font-medium">{restaurant.orders} orders</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-extrabold text-[#0d2d45] m-0">
          ${Number(restaurant.revenue).toLocaleString()}
        </p>
        <p className="text-[10px] font-bold text-[#1a9e5f] m-0">+12%</p>
      </div>
    </div>
  );
};

const UserRow = ({ user }: { user: UserLogin }) => {
  const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "active" || s === "online") return "bg-[#e3faf1] text-[#1a9e5f]";
    if (s === "away") return "bg-[#daf3ff] text-[#61A9E5]";
    return "bg-[#EAF9FF] text-[#7db8d4]";
  };

  const initials = user.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    /* Mobile card view */
    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[#e0f5fd] hover:border-[#c8eef9] hover:shadow-[0_2px_12px_rgba(56,182,255,0.08)] transition-all">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-xl bg-[#daf3ff] flex items-center justify-center text-[#38B6FF] text-[11px] font-extrabold flex-shrink-0">
        {initials}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-[#0d2d45] m-0 truncate">{user.name}</p>
          <span
            className={`text-[9.5px] font-bold tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ${getStatusStyle(user.status)}`}
          >
            {user.status}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-[10.5px] text-[#3a6f8f] m-0 truncate">{user.email}</p>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-[10px] text-[#7db8d4] m-0">{user.role}</p>
          <p className="text-[10px] text-[#7db8d4] m-0">
            {user.last_login}
          </p>
        </div>
      </div>
    </div>
  );
};

/* Desktop table row — only visible on lg+ */
const UserTableRow = ({ user }: { user: UserLogin }) => {
  const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "active" || s === "online") return "bg-[#e3faf1] text-[#1a9e5f]";
    if (s === "away") return "bg-[#daf3ff] text-[#61A9E5]";
    return "bg-[#EAF9FF] text-[#7db8d4]";
  };

  return (
    <tr className="border-t border-[#e0f5fd] transition-colors hover:bg-[#EAF9FF]">
      <td className="px-5 py-3 text-xs font-bold text-[#38B6FF]">#{user.id}</td>
      <td className="px-5 py-3 text-sm font-bold text-[#0d2d45]">{user.name}</td>
      <td className="px-5 py-3 text-xs text-[#3a6f8f]">{user.role}</td>
      <td className="px-5 py-3">
        <span className={`text-[10.5px] font-bold tracking-wider px-2.5 py-1 rounded-full ${getStatusStyle(user.status)}`}>
          {user.status}
        </span>
      </td>
      <td className="px-5 py-3 text-xs text-[#3a6f8f]">{user.email}</td>
      <td className="px-5 py-3 text-[11.5px] text-[#7db8d4]">{user.last_login}</td>
    </tr>
  );
};

/* ─────────────────────────────────────────
   MAIN DASHBOARD COMPONENT
───────────────────────────────────────── */
export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAllUsers, setShowAllUsers] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiRequest<any>("/admin/stats");
        setData(response);
      } catch (error) {
        console.error("Failed to fetch admin stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !data) {
    return (
      <div className="h-full bg-[#EFFFFF] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#38B6FF] to-[#61A9E5] flex items-center justify-center shadow-[0_8px_24px_rgba(56,182,255,0.18)]">
          <Sparkles size={18} color="#fff" />
        </div>
        <p className="text-[#7db8d4] text-xs font-bold tracking-widest uppercase m-0">
          Loading data…
        </p>
      </div>
    );
  }

  const chartData = data.top_restaurants.map((r: Restaurant) => ({
    name: r.name.length > 8 ? r.name.slice(0, 8) + "…" : r.name,
    orders: r.orders,
    revenue: Number(r.revenue),
  }));

  const statCards = [
    { icon: Users, label: "Total Users", value: data.stats.total_users.toLocaleString(), trend: "+12.5%", iconBg: "#daf3ff", iconColor: "#38B6FF" },
    { icon: UsersRound, label: "Total Visitors", value: data.stats.total_visitors.toLocaleString(), trend: "+20%", iconBg: "#e8f3ff", iconColor: "#61A9E5" },
    { icon: Store, label: "Restaurants", value: data.stats.total_restaurants.toLocaleString(), trend: "+8.2%", iconBg: "#e3faf1", iconColor: "#22c97a" },
    { icon: DollarSign, label: "Total Revenue", value: `$${data.stats.total_revenue.toLocaleString()}`, trend: "+15.3%", iconBg: "#fff4e0", iconColor: "#f5a623" },
    { icon: CheckCircle2, label: "Active Restaurants", value: data.stats.active_restaurants.toLocaleString(), trend: "+5.1%", iconBg: "#daf3ff", iconColor: "#38B6FF" },
  ];

  const displayedUsers = showAllUsers ? data.recent_users : data.recent_users?.slice(0, 5);

  return (
    <div className="flex-1 overflow-auto bg-[#EFFFFF] font-sans">
      
      {/* ── Mobile Top Bar ── */}
      <div className="sticky top-0 z-20 bg-[#EFFFFF]/90 backdrop-blur-md border-b border-[#c8eef9] px-4 py-3 flex items-center justify-between lg:hidden">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#38B6FF] to-[#61A9E5] flex items-center justify-center shadow-sm">
            <LayoutDashboard size={14} color="#fff" />
          </div>
          <span className="text-[15px] font-extrabold text-[#0d2d45] tracking-tight">Dashboard</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#e3faf1] border border-[#22c97a]/20 rounded-full px-2.5 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#22c97a] shadow-[0_0_0_3px_rgba(34,201,122,0.2)]" />
            <span className="text-[9.5px] font-bold text-[#1a9e5f] tracking-wider">LIVE</span>
          </div>
          <button className="w-8 h-8 rounded-xl bg-white border border-[#c8eef9] flex items-center justify-center relative">
            <Bell size={15} color="#38B6FF" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#f5a623] rounded-full" />
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-4 md:p-5 lg:p-7 flex flex-col gap-4">

        {/* Desktop Page Header — hidden on mobile */}
        <div className="hidden lg:flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0d2d45] m-0 tracking-tight">Dashboard</h1>
            <p className="text-sm text-[#7db8d4] mt-1 mb-0 font-medium">
              Welcome back — here's what's happening today.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#e3faf1] border border-[#22c97a]/20 rounded-xl px-3.5 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#22c97a] shadow-[0_0_0_3px_rgba(34,201,122,0.2)]" />
            <span className="text-[11px] font-bold text-[#1a9e5f] tracking-wider">LIVE</span>
          </div>
        </div>

        {/* ── Mobile greeting ── */}
        <div className="lg:hidden">
          <p className="text-[11.5px] text-[#7db8d4] font-medium m-0">
            Welcome back — here's what's happening today.
          </p>
        </div>

        {/* ── Stat Cards ──
            Mobile: 2-col grid (last card full width if odd)
            Desktop: 5-col grid
        */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 flex-shrink-0">
          {statCards.map((s, i) => (
            <div
              key={i}
              className={
                /* Make last card full-width on 2-col if count is odd */
                i === statCards.length - 1 && statCards.length % 2 !== 0
                  ? "col-span-2 sm:col-span-1"
                  : ""
              }
            >
              <StatCard {...s} />
            </div>
          ))}
        </div>

        {/* ── Analytics Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3.5 min-h-0">

          {/* Chart */}
          <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#c8eef9] flex flex-col shadow-[0_2px_12px_rgba(56,182,255,0.10)]">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-4 flex-shrink-0">
              <div>
                <p className="text-sm font-extrabold text-[#0d2d45] m-0">Restaurant Overview</p>
                <p className="text-[11px] text-[#7db8d4] mt-0.5 mb-0">
                  Top restaurants by orders & revenue
                </p>
              </div>
              <div className="flex gap-3.5 items-center flex-shrink-0">
                {[{ color: "#38B6FF", label: "Orders" }, { color: "#61A9E5", label: "Revenue" }].map((l, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
                    <span className="text-[11px] text-[#3a6f8f] font-semibold">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 min-h-[200px] md:min-h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={3} barCategoryGap="30%">
                  <CartesianGrid vertical={false} stroke="#e0f5fd" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#7db8d4", fontWeight: 600 }}
                    dy={8}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#daf3ff", radius: 6 }} />
                  <Bar dataKey="orders" fill="#38B6FF" radius={[6, 6, 0, 0]} name="Orders" />
                  <Bar dataKey="revenue" fill="#61A9E5" radius={[6, 6, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sidebar Leaders */}
          <div className="bg-white rounded-2xl p-4 md:p-5 border border-[#c8eef9] flex flex-col shadow-[0_2px_12px_rgba(56,182,255,0.10)]">
            <div className="flex justify-between items-center mb-3 flex-shrink-0">
              <p className="text-sm font-extrabold text-[#0d2d45] m-0">Top Restaurants</p>
              <button className="text-[11px] font-bold text-[#38B6FF] bg-[#daf3ff] border-none cursor-pointer px-2.5 py-1 rounded-lg flex items-center gap-1 active:scale-95 transition-transform">
                View All <ArrowUpRight size={11} />
              </button>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              {data.top_restaurants.map((r: Restaurant, i: number) => (
                <RestaurantRow key={i} restaurant={r} index={i} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Recent Users ── */}
        {data.recent_users && data.recent_users.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#c8eef9] shadow-[0_2px_12px_rgba(56,182,255,0.10)] overflow-hidden">

            {/* Section header */}
            <div className="flex items-center justify-between px-4 md:px-5 py-3.5 border-b border-[#e0f5fd]">
              <div>
                <p className="text-sm font-extrabold text-[#0d2d45] m-0">Recent Users</p>
                <p className="text-[11px] text-[#7db8d4] mt-0.5 m-0">
                  Latest logins &amp; activity
                </p>
              </div>
              <button className="text-[11px] font-bold text-[#38B6FF] bg-[#daf3ff] border-none cursor-pointer px-2.5 py-1 rounded-lg flex items-center gap-1 active:scale-95 transition-transform">
                Export <ArrowUpRight size={11} />
              </button>
            </div>

            {/* Mobile card list */}
            <div className="lg:hidden flex flex-col gap-2.5 p-4">
              {displayedUsers?.map((user: UserLogin) => (
                <UserRow key={user.id} user={user} />
              ))}

              {data.recent_users.length > 5 && (
                <button
                  onClick={() => setShowAllUsers(!showAllUsers)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-bold text-[#38B6FF] bg-[#EAF9FF] rounded-xl border border-[#c8eef9] active:scale-[0.98] transition-transform mt-1"
                >
                  {showAllUsers ? "Show less" : `Show all ${data.recent_users.length} users`}
                  <ChevronDown
                    size={13}
                    className={`transition-transform duration-200 ${showAllUsers ? "rotate-180" : ""}`}
                  />
                </button>
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f5fcff]">
                    {["ID", "Name", "Role", "Status", "Email", "Last Login"].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-[10.5px] font-bold text-[#7db8d4] uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.recent_users.map((user: UserLogin) => (
                    <UserTableRow key={user.id} user={user} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>{/* /content */}
    </div>
  );
}