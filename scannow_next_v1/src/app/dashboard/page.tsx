"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  Bar, BarChart, CartesianGrid, XAxis, YAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";
import {
  Bell, DollarSign, LogOut, ShoppingBag,
  TrendingUp, X, UtensilsCrossed, ChevronDown,
} from "lucide-react";
import {
  apiRequest, clearSession, getStoredRestaurantId, getStoredUser,
  ListResponse, MenuItem, Order, resolveAssetUrl, Restaurant, storeRestaurant,
} from "@/lib/api";
import { useLanguage } from "@/app/contexts/LanguageContext";

type OrdersResponse = ListResponse<Order> & {
  summary: { total: number; pending: number; accepted: number; completed: number; cancelled: number; };
};

const emptySummary = { total: 0, pending: 0, accepted: 0, completed: 0, cancelled: 0 };

export default function Dashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [summary, setSummary] = useState(emptySummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartReady, setChartReady] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);
  const [timeRange, setTimeRange] = useState<"hourly" | "daily" | "monthly" | "yearly" | "custom">("monthly");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [hourlyDate, setHourlyDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [monthlyDate, setMonthlyDate] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
  const [yearlyDate, setYearlyDate] = useState(new Date().getFullYear().toString());

  // Refs to avoid infinite loops
  const ordersRef = useRef<Order[]>([]);
  useEffect(() => { ordersRef.current = orders; }, [orders]);

  const handleLogout = () => { clearSession(); router.push("/auth/login"); };

  const loadDashboard = useCallback(async (isAutoRefresh = false, fetchCustomDateOrders = false) => {
    if (!isAutoRefresh && !fetchCustomDateOrders && ordersRef.current.length > 0) {
      // silent
    } else if (!isAutoRefresh) {
      setLoading(true);
    }
    setError(null);
    try {
      let restaurantId = getStoredRestaurantId();
      if (!restaurantId) {
        const user = getStoredUser();
        const queryParams = user ? `?user_id=${user.id}` : "";
        const restaurants = await apiRequest<ListResponse<Restaurant>>(`/restaurants${queryParams}`);
        const firstRestaurant = restaurants.data[0];
        if (firstRestaurant) { restaurantId = firstRestaurant.id; storeRestaurant(firstRestaurant); }
      }
      if (!restaurantId) { setRestaurant(null); setOrders([]); setMenuItems([]); setSummary(emptySummary); return; }
      const dateParams = (fetchCustomDateOrders && timeRange === 'custom' && fromDate && toDate) ? `&from_date=${fromDate}&to_date=${toDate}` : "";
      const [restaurantResponse, menuResponse, ordersResponse] = await Promise.all([
        apiRequest<{ data: Restaurant }>(`/restaurants/${restaurantId}?t=${Date.now()}`, { cache: "no-store" }),
        apiRequest<ListResponse<MenuItem>>(`/restaurants/${restaurantId}/menu-items?t=${Date.now()}`),
        apiRequest<OrdersResponse>(`/restaurants/${restaurantId}/orders?t=${Date.now()}${dateParams}`),
      ]);
      setRestaurant(restaurantResponse.data);
      storeRestaurant(restaurantResponse.data);
      setMenuItems(menuResponse.data);
      if (isAutoRefresh && ordersResponse.data.length > 0) {
        const latestIncoming = ordersResponse.data[0];
        if (latestIncoming.id !== ordersRef.current[0]?.id && latestIncoming.status === 'pending') {
          setNewOrderAlert(latestIncoming);
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode); gainNode.connect(audioCtx.destination);
            oscillator.type = "sine"; oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.5);
          } catch (e) { console.error("Audio alert failed", e); }
          setTimeout(() => setNewOrderAlert(null), 10000);
        }
      }
      setOrders(ordersResponse.data); setSummary(ordersResponse.summary);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not load dashboard.");
    } finally { setLoading(false); }
  }, [timeRange, fromDate, toDate]);

  useEffect(() => {
    setChartReady(true); loadDashboard();
    const pollInterval = setInterval(() => loadDashboard(true), 3000);
    return () => clearInterval(pollInterval);
  }, [loadDashboard]);

  const totalSales = useMemo(() => orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + Number(o.total_amount), 0), [orders]);
  const completedRevenue = useMemo(() => orders.filter(o => o.status === "completed").reduce((s, o) => s + Number(o.total_amount), 0), [orders]);

  const chartData = useMemo(() => {
    if (timeRange === "hourly") {
      const selectedDate = new Date(hourlyDate);
      const hours = Array.from({ length: 24 }, (_, i) => { const d = new Date(selectedDate); d.setHours(i,0,0,0); return { key: i, label: `${i.toString().padStart(2,'0')}:00`, sales: 0 }; });
      const hourIndex = new Map(hours.map(h => [h.key, h]));
      orders.forEach(o => { if (!o.created_at || o.status==="cancelled") return; const d=new Date(o.created_at); if(d.toDateString()===selectedDate.toDateString()){const h=hourIndex.get(d.getHours());if(h)h.sales+=Number(o.total_amount);} });
      return hours;
    }
    if (timeRange === "daily") {
      const selectedDay = new Date(dailyDate);
      const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(selectedDay); d.setDate(d.getDate()-3+i); return { key: d.toDateString(), label: d.toLocaleDateString("en",{weekday:"short",month:"short",day:"numeric"}), sales: 0 }; });
      const dayIndex = new Map(days.map(d => [d.key, d]));
      orders.forEach(o => { if (!o.created_at||o.status==="cancelled") return; const d=new Date(o.created_at); const day=dayIndex.get(d.toDateString()); if(day)day.sales+=Number(o.total_amount); });
      return days;
    }
    if (timeRange === "yearly") {
      const selectedYear = Number(yearlyDate);
      const years = Array.from({ length: 5 }, (_, i) => ({ key: selectedYear-2+i, label: (selectedYear-2+i).toString(), sales: 0 }));
      const yearIndex = new Map(years.map(y => [y.key, y]));
      orders.forEach(o => { if (!o.created_at||o.status==="cancelled") return; const y=yearIndex.get(new Date(o.created_at).getFullYear()); if(y)y.sales+=Number(o.total_amount); });
      return years;
    }
    if (timeRange === "custom" && fromDate && toDate) {
      const start = new Date(fromDate); const end = new Date(toDate);
      const daysCount = Math.min(Math.ceil((end.getTime()-start.getTime())/(1000*3600*24))+1, 31);
      const days = Array.from({ length: daysCount }, (_, i) => { const d=new Date(start); d.setDate(d.getDate()+i); return { key: d.toDateString(), label: d.toLocaleDateString("en",{month:"numeric",day:"numeric"}), sales: 0 }; });
      const dayIndex = new Map(days.map(d => [d.key, d]));
      orders.forEach(o => { if (!o.created_at||o.status==="cancelled") return; const day=dayIndex.get(new Date(o.created_at).toDateString()); if(day)day.sales+=Number(o.total_amount); });
      return days;
    }
    const [year, month] = monthlyDate.split('-').map(Number);
    const formatter = new Intl.DateTimeFormat("en", { month: "short" });
    const months = Array.from({ length: 6 }, (_, i) => { const d=new Date(year,(month-1)-3+i,1); return { key:`${d.getFullYear()}-${d.getMonth()}`, label:formatter.format(d), sales:0 }; });
    const monthIndex = new Map(months.map(m => [m.key, m]));
    orders.forEach(o => { if (!o.created_at||o.status==="cancelled") return; const d=new Date(o.created_at); const m=monthIndex.get(`${d.getFullYear()}-${d.getMonth()}`); if(m)m.sales+=Number(o.total_amount); });
    return months;
  }, [orders, timeRange, hourlyDate, dailyDate, monthlyDate, yearlyDate, fromDate, toDate]);

  const topItems = useMemo(() => {
    const totals = new Map<string, { name: string; quantity: number; revenue: number; image?: string|null; description?: string|null }>();
    const menuItemByName = new Map(menuItems.map(i => [i.name, i]));
    orders.forEach(order => {
      order.items?.forEach(item => {
        const existing = totals.get(item.item_name);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += Number(item.line_total);
        } else {
          const menuItem = menuItemByName.get(item.item_name);
          totals.set(item.item_name, {
            name: item.item_name,
            quantity: item.quantity,
            revenue: Number(item.line_total),
            image: menuItem?.image_url,
            description: menuItem?.description
          });
        }
      });
    });
    return Array.from(totals.values()).sort((a,b) => b.quantity - a.quantity).slice(0,4);
  }, [menuItems, orders]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div
      className="flex flex-col min-h-full"
      style={{ fontFamily: "'DM Sans', sans-serif", background: "#EAF9FF" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }

        .date-input {
          background: white; border: 1.5px solid #dbeafe; border-radius: 8px;
          padding: 5px 10px; font-size: 11px; font-weight: 600; color: #334155;
          font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.15s;
          max-width: 130px;
        }
        .date-input:focus { border-color: #61A9E5; }

        .range-chip {
          padding: 5px 10px; border-radius: 99px; font-size: 11px; font-weight: 600;
          cursor: pointer; border: 1.5px solid #dbeafe; background: white;
          color: #64748b; font-family: 'DM Sans', sans-serif; transition: all 0.15s;
          white-space: nowrap;
        }
        .range-chip.active { background: #61A9E5; border-color: #61A9E5; color: white; }
        .range-chip:hover:not(.active) { border-color: #7dd3fc; color: #0369a1; }

        .stat-card {
          background: white; border-radius: 16px; border: 1px solid #e0f2fe;
          padding: 14px 16px; display: flex; align-items: center; gap: 12px;
          transition: box-shadow 0.15s;
        }
        .stat-card:hover { box-shadow: 0 4px 20px rgba(97,169,229,0.15); }

        .progress-bar {
          height: 5px; border-radius: 99px; background: #f0f9ff; overflow: hidden;
        }
        .progress-fill {
          height: 100%; border-radius: 99px;
          background: linear-gradient(90deg, #61A9E5, #38bdf8);
          transition: width 1s ease;
        }

        .status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

        /* Mobile scrollable chips */
        .chip-scroll { display: flex; gap: 4px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 2px; }
        .chip-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── New Order Alert ── */}
      {newOrderAlert && (
        <div className="fixed right-4 top-4 z-50 left-4 sm:left-auto sm:right-6 sm:top-6 sm:w-80" style={{ animation: "slideIn 0.3s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "white", border: "2px solid #61A9E5", borderRadius: 16, padding: "12px 14px", boxShadow: "0 8px 30px rgba(97,169,229,0.3)" }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Bell size={17} style={{ color: "#61A9E5" }} className="animate-bounce" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0 }}>{t.newOrder}</p>
              <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>#{newOrderAlert.order_number} · Table {newOrderAlert.table_number || "N/A"}</p>
              <p style={{ fontSize: 11, color: "#61A9E5", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {newOrderAlert.items?.map(i => `${i.item_name} ×${i.quantity}`).join(", ")}
              </p>
            </div>
            <button onClick={() => setNewOrderAlert(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}><X size={16} /></button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header style={{ flexShrink: 0, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(186,230,253,0.5)", padding: "10px 16px" }} className="flex items-center justify-between gap-3">
        {/* Title */}
        <div className="min-w-0 flex-1">
          <h1 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }} className="sm:text-[18px]">{t.dashboard}</h1>
          {restaurant && <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{restaurant.name}</p>}
        </div>

        {/* Status badges — hidden on small, visible on md+ */}
        <div className="hidden md:flex items-center gap-2 flex-wrap">
          {[
            { label: t.pending, value: summary.pending, color: "#f59e0b", bg: "#fffbeb" },
            { label: t.accepted, value: summary.accepted, color: "#61A9E5", bg: "#eff6ff" },
            { label: t.completed, value: summary.completed, color: "#22c55e", bg: "#f0fdf4" },
            { label: t.cancelled, value: summary.cancelled, color: "#ef4444", bg: "#fef2f2" },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, background: s.bg, border: `1px solid ${s.color}22` }}>
              <div className="status-dot" style={{ background: s.color }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 500 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Mobile status — compact badges */}
        <div className="flex md:hidden items-center gap-1.5">
          {[
            { value: summary.pending, color: "#f59e0b" },
            { value: summary.completed, color: "#22c55e" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 99, background: `${s.color}18`, border: `1px solid ${s.color}33` }}>
              <div className="status-dot" style={{ background: s.color }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Profile button */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setProfileOpen(v => !v)}
            style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid #dbeafe", background: "#f0f9ff", cursor: "pointer", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {restaurant?.logo_url
              ? <img src={resolveAssetUrl(restaurant.logo_url)} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.currentTarget.style.display = "none"; }} />
              : <UtensilsCrossed size={16} style={{ color: "#61A9E5" }} />
            }
          </button>
          {profileOpen && (
            <>
              {/* Backdrop for mobile */}
              <div className="fixed inset-0 z-10 sm:hidden" onClick={() => setProfileOpen(false)} />
              <div style={{ position: "fixed", right: 12, top: 60, zIndex: 20, width: 260, background: "white", borderRadius: 14, border: "1px solid #dbeafe", padding: 16, boxShadow: "0 8px 30px rgba(97,169,229,0.15)" }} className="sm:absolute sm:top-[46px] sm:right-0 sm:fixed-none">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", border: "1px solid #dbeafe", background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {restaurant?.logo_url ? <img src={resolveAssetUrl(restaurant.logo_url)} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <UtensilsCrossed size={20} style={{ color: "#61A9E5" }} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{restaurant?.name || "Your restaurant"}</p>
                    <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{restaurant?.email || t.noEmail}</p>
                  </div>
                </div>
                <p style={{ fontSize: 11.5, color: "#64748b", marginBottom: 4 }}>{restaurant?.phone || t.noPhone}</p>
                <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{restaurant?.address || t.noAddress}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <Link href="/page/about-restaurant" style={{ borderRadius: 8, border: "1.5px solid #dbeafe", padding: "7px 0", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#334155", textDecoration: "none" }}>{t.viewProfile}</Link>
                  <Link href="/page/about-restaurant" style={{ borderRadius: 8, background: "#61A9E5", padding: "7px 0", textAlign: "center", fontSize: 12, fontWeight: 700, color: "white", textDecoration: "none" }}>{t.editProfile}</Link>
                </div>
                <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "8px 0", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  <LogOut size={13} />{t.signOut}
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ── Errors ── */}
      {error && <div style={{ margin: "8px 16px 0", padding: "10px 14px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 13, color: "#dc2626" }}>{error}</div>}
      {!restaurant && !loading && <div style={{ margin: "8px 16px 0", padding: "10px 14px", borderRadius: 10, background: "white", border: "1px solid #dbeafe", fontSize: 13, color: "#475569" }}>{t.createRestaurantProfile}</div>}

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "12px 14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Stat cards — 1 col mobile, 3 col md+ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ flexShrink: 0 }}>
          {[
            { icon: <DollarSign size={20} />, label: t.totalSales, value: formatCurrency(totalSales), bg: "#dbeafe", color: "#61A9E5" },
            { icon: <ShoppingBag size={20} />, label: t.totalOrders, value: String(summary.total), bg: "#e0f2fe", color: "#0ea5e9" },
            { icon: <TrendingUp size={20} />, label: t.revenue, value: formatCurrency(completedRevenue), bg: "#dcfce7", color: "#22c55e" },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div style={{ width: 42, height: 42, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: s.color }}>
                {s.icon}
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8", margin: 0 }}>{s.label}</p>
                <p style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", margin: 0, lineHeight: 1.2 }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Chart + Top Items — stacked on mobile, side-by-side on lg+ */}
        <div className="flex flex-col lg:flex-row gap-3" style={{ flex: 1, minHeight: 0 }}>

          {/* Chart card */}
          <div style={{ background: "white", borderRadius: 18, border: "1px solid #e0f2fe", padding: "16px", display: "flex", flexDirection: "column", overflow: "hidden", flex: 1, minHeight: 280 }}>
            {/* Chart header */}
            <div style={{ marginBottom: 12, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0 }}>{t.salesOverview}</h3>
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{summary.pending} {t.pendingOrders} · {summary.total} {t.totalOrdersLabel}</p>
                </div>
                {/* Context date pickers */}
                <div>
                  {timeRange === "hourly" && (
                    <input type="date" value={hourlyDate} onChange={e => setHourlyDate(e.target.value)} className="date-input" />
                  )}
                  {timeRange === "daily" && (
                    <input type="date" value={dailyDate} onChange={e => setDailyDate(e.target.value)} className="date-input" />
                  )}
                  {timeRange === "monthly" && (
                    <input type="month" value={monthlyDate} onChange={e => setMonthlyDate(e.target.value)} className="date-input" />
                  )}
                  {timeRange === "yearly" && (
                    <input type="number" value={yearlyDate} onChange={e => setYearlyDate(e.target.value)} min="2020" max="2030" className="date-input" style={{ width: 72 }} />
                  )}
                  {timeRange === "custom" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="date-input" style={{ maxWidth: 110 }} />
                      <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>→</span>
                      <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="date-input" style={{ maxWidth: 110 }} />
                    </div>
                  )}
                </div>
              </div>
              {/* Range chips — horizontally scrollable on mobile */}
              <div className="chip-scroll">
                {(["hourly","daily","monthly","yearly","custom"] as const).map(r => (
                  <button key={r} onClick={() => setTimeRange(r)} className={`range-chip${timeRange === r ? " active" : ""}`}>
                    {r === "hourly" ? t.hourly : r === "daily" ? t.daily : r === "monthly" ? t.monthly : r === "yearly" ? t.yearly : t.custom}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart */}
            <div style={{ flex: 1, minHeight: 180 }}>
              {chartReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 6, right: 4, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f9ff" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `$${v}`} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #dbeafe", boxShadow: "0 4px 20px rgba(97,169,229,0.15)", fontSize: 12 }} formatter={(v: any) => [`$${Number(v).toFixed(2)}`, 'Sales']} />
                    <Bar dataKey="sales" fill="#61A9E5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 13 }}>{t.loadingChart}</div>
              )}
            </div>
          </div>

          {/* Top Items */}
          <div style={{ background: "white", borderRadius: 18, border: "1px solid #e0f2fe", padding: "16px", display: "flex", flexDirection: "column", overflow: "hidden" }} className="lg:w-[340px] xl:w-[380px]">
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: "0 0 12px" }}>{t.topSelling}</h3>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
              {topItems.length === 0 ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94a3b8", gap: 8, textAlign: "center", padding: "24px 0" }}>
                  <UtensilsCrossed size={28} style={{ color: "#dbeafe" }} />
                  <p style={{ fontSize: 13, margin: 0 }}>{t.noOrderData}</p>
                </div>
              ) : topItems.map((item, idx) => (
                <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    {item.image ? (
                      <img
                        src={resolveAssetUrl(item.image)}
                        alt={item.name}
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          position: "absolute",
                          top: 0,
                          left: 0
                        }}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                          const defaultIcon = event.currentTarget.parentElement?.querySelector('[data-default-icon]');
                          if (defaultIcon) {
                            (defaultIcon as HTMLElement).style.display = "flex";
                          }
                        }}
                        onLoad={(event) => {
                          const defaultIcon = event.currentTarget.parentElement?.querySelector('[data-default-icon]');
                          if (defaultIcon) {
                            (defaultIcon as HTMLElement).style.display = "none";
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className="text-2xl"
                      style={{ display: item.image ? "none" : "flex" }}
                      data-default-icon
                    >
                      🍴
                    </div>
                    <div style={{ position: "absolute", top: -3, left: -3, width: 17, height: 17, borderRadius: "50%", background: idx === 0 ? "#f59e0b" : idx === 1 ? "#94a3b8" : idx === 2 ? "#cd7c2f" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}>
                      <span style={{ fontSize: 8, fontWeight: 900, color: idx <= 2 ? "white" : "#64748b" }}>{idx + 1}</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "72%" }}>{item.name}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: "#61A9E5", flexShrink: 0 }}>{item.quantity} {t.sold}</span>
                    </div>
                    {item.description && (
                      <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.description}</p>
                    )}
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min(100, item.quantity * 10)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "12px 14px", gap: 12, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ height: 52, background: "rgba(255,255,255,0.8)", borderRadius: 14, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1,2,3].map(i => <div key={i} style={{ height: 70, background: "white", borderRadius: 16, border: "1px solid #e0f2fe", animation: "pulse 1.5s ease-in-out infinite" }} />)}
      </div>
      <div className="flex flex-col lg:flex-row gap-3" style={{ flex: 1 }}>
        <div style={{ flex: 1, background: "white", borderRadius: 18, border: "1px solid #e0f2fe", animation: "pulse 1.5s ease-in-out infinite", minHeight: 220 }} />
        <div className="lg:w-[340px]" style={{ background: "white", borderRadius: 18, border: "1px solid #e0f2fe", animation: "pulse 1.5s ease-in-out infinite", minHeight: 180 }} />
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.5;}}`}</style>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}