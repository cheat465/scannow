"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import {
  ChefHat, CircleCheck, CircleX, Eye, ReceiptText,
  Search, Timer, Trash2, X, User, MapPin, Clock,
  CreditCard, Notebook, LogOut, UtensilsCrossed, Bell,
} from "lucide-react";
import {
  apiRequest, getStoredRestaurantId, ListResponse, Order,
  resolveAssetUrl, Restaurant, storeRestaurant, clearSession,
  MenuItem,
} from "@/lib/api";
import { useLanguage } from "@/app/contexts/LanguageContext";

type OrderStatus = "all" | "pending" | "accepted" | "completed" | "cancelled";
type OrdersResponse = ListResponse<Order> & {
  summary: { total: number; pending: number; accepted: number; completed: number; cancelled: number; };
};
const emptySummary = { total: 0, pending: 0, accepted: 0, completed: 0, cancelled: 0 };

const getStatusConfig = (t: any) => ({
  pending:   { label: t.pending,   bg: "#fffbeb", color: "#f59e0b", dot: "#f59e0b" },
  accepted:  { label: t.accepted,  bg: "#eff6ff", color: "#61A9E5", dot: "#61A9E5" },
  completed: { label: t.completed, bg: "#f0fdf4", color: "#22c55e", dot: "#22c55e" },
  cancelled: { label: t.cancelled, bg: "#fef2f2", color: "#ef4444", dot: "#ef4444" },
}) as const;

export default function OrdersPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [summary, setSummary] = useState(emptySummary);
  const [status, setStatus] = useState<OrderStatus>("all");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isRequesting = useRef(false);

  const menuItemDescriptionMap = useMemo(() => {
    const map = new Map<string, string | null | undefined>();
    menuItems.forEach(item => map.set(item.name, item.description));
    return map;
  }, [menuItems]);

  const handleLogout = () => { clearSession(); router.push("/auth/login"); };

  const loadOrders = useCallback(async (isAutoRefresh = false) => {
    if (isRequesting.current) return;
    if (!isAutoRefresh) setLoading(true);
    isRequesting.current = true;
    setError(null);
    try {
      let restaurantId = getStoredRestaurantId();
      if (!restaurant || menuItems.length === 0) {
        if (!restaurantId) {
          const restaurants = await apiRequest<ListResponse<Restaurant>>("/restaurants");
          const first = restaurants.data[0];
          if (first) { storeRestaurant(first); restaurantId = first.id; setRestaurant(first); }
        }
        if (!restaurantId) { setOrders([]); setSummary(emptySummary); setRestaurant(null); return; }
        if (!restaurant) {
          const restaurantResponse = await apiRequest<{ data: Restaurant }>(`/restaurants/${restaurantId}?t=${Date.now()}`);
          setRestaurant(restaurantResponse.data);
        }
        if (menuItems.length === 0) {
          const menuItemsResponse = await apiRequest<ListResponse<MenuItem>>(`/restaurants/${restaurantId}/menu-items?t=${Date.now()}`);
          setMenuItems(menuItemsResponse.data);
        }
      }
      restaurantId = restaurantId || getStoredRestaurantId();
      if (!restaurantId) return;
      const response = await apiRequest<OrdersResponse>(`/restaurants/${restaurantId}/orders?t=${Date.now()}`);
      setSummary(response.summary);
      if (isAutoRefresh && response.data.length > 0) {
        const latest = response.data[0];
        setOrders(currentOrders => {
          if (currentOrders[0]?.id && latest.id !== currentOrders[0].id && latest.status === "pending") {
            setNewOrderAlert(latest);
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator(); const gain = ctx.createGain();
              osc.connect(gain); gain.connect(ctx.destination);
              osc.type = "sine"; osc.frequency.setValueAtTime(880, ctx.currentTime);
              gain.gain.setValueAtTime(0.1, ctx.currentTime);
              osc.start(); osc.stop(ctx.currentTime + 0.5);
            } catch {}
            setTimeout(() => setNewOrderAlert(null), 10000);
          }
          return response.data;
        });
      } else {
        setOrders(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.couldNotLoadOrders);
    } finally {
      setLoading(false);
      isRequesting.current = false;
    }
  }, [restaurant, menuItems.length, t]);

  useEffect(() => {
    loadOrders();
    const poll = setInterval(() => loadOrders(true), 15000);
    return () => clearInterval(poll);
  }, [loadOrders]);

  const visibleOrders = orders.filter(order => {
    const matchesStatus = status === "all" || order.status === status;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q ||
      [order.order_number, order.table_number, order.total_amount, order.customer_name]
        .filter(Boolean).some(v => String(v).toLowerCase().includes(q)) ||
      (order.items && order.items.some(item => {
        const itemName = item.item_name?.toLowerCase() || "";
        const specialInstructions = item.special_instructions?.toLowerCase() || "";
        const menuDescription = menuItemDescriptionMap.get(item.item_name || "")?.toLowerCase() || "";
        return itemName.includes(q) || specialInstructions.includes(q) || menuDescription.includes(q);
      }));
    return matchesStatus && matchesSearch;
  });

  const updateStatus = async (orderId: number, nextStatus: string) => {
    try {
      const response = await apiRequest<{ data: Order }>(`/orders/${orderId}/status`, {
        method: "PATCH", body: JSON.stringify({ status: nextStatus }),
      });
      setOrders(curr => curr.map(o => o.id === orderId ? response.data : o));
      loadOrders();
    } catch (err) { setError(err instanceof Error ? err.message : t.couldNotUpdateOrder); }
  };

  const deleteOrder = async (orderId: number) => {
    if (!window.confirm(t.deleteOrderConfirm)) return;
    try {
      await apiRequest(`/orders/${orderId}`, { method: "DELETE" });
      setOrders(curr => curr.filter(o => o.id !== orderId));
      loadOrders();
    } catch (err) { setError(err instanceof Error ? err.message : t.couldNotDeleteOrder); }
  };

  const statusConfig = getStatusConfig(t);

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "#EAF9FF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }

        .status-chip {
          padding: 6px 13px; border-radius: 99px; font-size: 12px; font-weight: 600;
          cursor: pointer; border: 1.5px solid #dbeafe; background: white; color: #64748b;
          font-family: 'DM Sans', sans-serif; transition: all .15s; white-space: nowrap;
        }
        .status-chip.active { background: #61A9E5; border-color: #61A9E5; color: white; }
        .status-chip:hover:not(.active) { border-color: #7dd3fc; color: #0369a1; }

        .stat-card {
          background: white; border-radius: 14px; border: 1px solid #e0f2fe;
          padding: 12px 14px; display: flex; align-items: center; gap: 10px;
          transition: box-shadow .15s;
        }
        .stat-card:hover { box-shadow: 0 4px 16px rgba(97,169,229,.15); }

        /* Desktop table rows */
        .tbl-row { border-bottom: 1px solid #f0f9ff; transition: background .1s; }
        .tbl-row:hover { background: #f8feff; }
        .tbl-row:last-child { border-bottom: none; }

        .action-btn {
          width: 32px; height: 32px; border-radius: 9px; display: flex;
          align-items: center; justify-content: center; cursor: pointer;
          border: none; transition: background .15s;
        }

        /* Mobile order card */
        .order-card {
          background: white; border-radius: 16px; border: 1px solid #e0f2fe;
          padding: 14px 14px 12px; display: flex; flex-direction: column; gap: 10px;
          transition: box-shadow .15s;
        }
        .order-card:active { box-shadow: 0 2px 12px rgba(97,169,229,.2); }

        .status-select-wrap { position: relative; display: inline-flex; align-items: center; }
        .status-select {
          appearance: none; border: none; outline: none; background: transparent;
          padding: 5px 24px 5px 10px; font-size: 12px; font-weight: 700;
          font-family: 'DM Sans', sans-serif; cursor: pointer; border-radius: 99px;
        }
        .status-chevron { position: absolute; right: 7px; pointer-events: none; top: 50%; transform: translateY(-50%); }

        /* Modal — full screen on mobile, centered card on sm+ */
        .modal-overlay {
          position: fixed; inset: 0; z-index: 50;
          display: flex; align-items: flex-end; justify-content: center;
          background: rgba(15,23,42,.45); backdrop-filter: blur(4px);
          animation: fadeIn .2s ease;
        }
        @media (min-width: 640px) {
          .modal-overlay { align-items: center; padding: 16px; }
        }
        .modal-card {
          width: 100%; max-height: 92dvh;
          background: white; border-radius: 24px 24px 0 0;
          box-shadow: 0 -8px 40px rgba(0,0,0,.15);
          display: flex; flex-direction: column; overflow: hidden;
          animation: slideUpModal .25s ease;
        }
        @media (min-width: 640px) {
          .modal-card { max-width: 600px; border-radius: 24px; max-height: 90vh; box-shadow: 0 24px 60px rgba(0,0,0,.15); }
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUpModal { from { transform: translateY(32px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }

        .info-block {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 11px 12px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;
        }
        .info-icon { width: 30px; height: 30px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

        .spin { animation: spin .8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .no-sb::-webkit-scrollbar { display: none; }
        .no-sb { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ── New Order Alert ── */}
      {newOrderAlert && (
        <div style={{ position: "fixed", top: 16, right: 12, left: 12, zIndex: 60, background: "white", borderRadius: 18, border: "2px solid #61A9E5", padding: "12px 14px", boxShadow: "0 8px 32px rgba(97,169,229,.3)", display: "flex", alignItems: "flex-start", gap: 10, animation: "slideUpModal .3s ease" }}
          className="sm:left-auto sm:w-[320px] sm:right-5 sm:top-5">
          <div style={{ width: 38, height: 38, borderRadius: 11, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Bell size={17} style={{ color: "#61A9E5" }} className="animate-bounce" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0 }}>{t.newOrder}</p>
            <p style={{ fontSize: 11.5, color: "#64748b", margin: "2px 0" }}>#{newOrderAlert.order_number} · Table {newOrderAlert.table_number || "N/A"}</p>
            <p style={{ fontSize: 11, color: "#61A9E5", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {newOrderAlert.items?.map(i => `${i.item_name} ×${i.quantity}`).join(", ")}
            </p>
          </div>
          <button onClick={() => setNewOrderAlert(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 2, flexShrink: 0 }}><X size={15} /></button>
        </div>
      )}

      {/* ── Sticky top area ── */}
      <div style={{ background: "#EAF9FF", flexShrink: 0, position: "sticky", top: 0, zIndex: 10, paddingBottom: 0 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "14px 14px 0" }} className="sm:px-7 sm:pt-6">

          {/* ── Header ── */}
          <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
            {/* Title */}
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", margin: 0 }} className="sm:text-[22px]">{t.orders}</h1>
              {restaurant && <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{restaurant.name}</p>}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>

              {/* Search — desktop always visible, mobile expandable */}
              <div className="hidden sm:block" style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t.searchOrders}
                  style={{ background: "white", border: "1.5px solid #dbeafe", borderRadius: 12, padding: "8px 14px 8px 34px", fontSize: 13, color: "#0f172a", fontFamily: "'DM Sans', sans-serif", outline: "none", width: 220, transition: "border-color .15s" }}
                  onFocus={e => e.target.style.borderColor = "#61A9E5"} onBlur={e => e.target.style.borderColor = "#dbeafe"} />
              </div>

              {/* Mobile search button */}
              {!searchOpen && (
                <button className="sm:hidden" onClick={() => setSearchOpen(true)} style={{ width: 34, height: 34, borderRadius: 10, border: "1.5px solid #dbeafe", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Search size={15} style={{ color: "#61A9E5" }} />
                </button>
              )}

              {/* Kitchen link */}
              <Link href="/dashboard/kitchen" style={{ display: "flex", alignItems: "center", gap: 6, background: "#61A9E5", color: "white", padding: "8px 14px", borderRadius: 11, fontSize: 13, fontWeight: 700, textDecoration: "none", boxShadow: "0 3px 10px rgba(97,169,229,.3)" }}>
                <ChefHat size={15} />
                <span className="hidden sm:inline">{t.kitchen}</span>
              </Link>

              {/* Profile */}
              <div style={{ position: "relative" }}>
                <button type="button" onClick={() => setProfileOpen(v => !v)} style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid #dbeafe", background: "#f0f9ff", overflow: "hidden", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {restaurant?.logo_url
                    ? <img src={resolveAssetUrl(restaurant.logo_url)} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.currentTarget.style.display = "none"; }} />
                    : <UtensilsCrossed size={15} style={{ color: "#61A9E5" }} />}
                </button>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10 sm:hidden" onClick={() => setProfileOpen(false)} />
                    <div style={{ position: "fixed", right: 12, top: 60, zIndex: 20, width: 240, background: "white", borderRadius: 16, border: "1px solid #dbeafe", padding: 14, boxShadow: "0 8px 30px rgba(97,169,229,.15)" }}
                      className="sm:absolute sm:right-0 sm:top-[46px] sm:fixed-none">
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", border: "1px solid #dbeafe", background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {restaurant?.logo_url ? <img src={resolveAssetUrl(restaurant.logo_url)} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <UtensilsCrossed size={16} style={{ color: "#61A9E5" }} />}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{restaurant?.name || t.yourRestaurant}</p>
                          <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{restaurant?.email || t.noEmail}</p>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 8 }}>
                        <Link href="/page/about-restaurant" style={{ borderRadius: 9, border: "1.5px solid #dbeafe", padding: "6px 0", textAlign: "center", fontSize: 11.5, fontWeight: 600, color: "#334155", textDecoration: "none" }}>{t.view}</Link>
                        <Link href="/page/about-restaurant" style={{ borderRadius: 9, background: "#61A9E5", padding: "6px 0", textAlign: "center", fontSize: 11.5, fontWeight: 700, color: "white", textDecoration: "none" }}>{t.edit}</Link>
                      </div>
                      <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "7px 0", borderRadius: 9, border: "1px solid #fecaca", background: "#fef2f2", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                        <LogOut size={13} />{t.signOut}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Mobile expanding search bar */}
          {searchOpen && (
            <div className="flex sm:hidden" style={{ alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                <input autoFocus type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t.searchOrders}
                  style={{ width: "100%", background: "white", border: "1.5px solid #61A9E5", borderRadius: 12, padding: "9px 14px 9px 34px", fontSize: 13.5, color: "#0f172a", fontFamily: "'DM Sans', sans-serif", outline: "none", boxShadow: "0 0 0 3px rgba(97,169,229,.12)" }} />
              </div>
              <button onClick={() => { setSearchOpen(false); setSearch(""); }} style={{ padding: 8, background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
            </div>
          )}

          {/* ── Stat Cards — 2-col on mobile, 5-col on sm+ ── */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3" style={{ marginBottom: 14 }}>
            {[
              { id: "total",     icon: <ReceiptText size={17} />, label: t.total,     value: summary.total,     iconBg: "#dbeafe", iconColor: "#61A9E5" },
              { id: "pending",   icon: <Timer size={17} />,       label: t.pending,   value: summary.pending,   iconBg: "#fef9c3", iconColor: "#f59e0b" },
              { id: "accepted",  icon: <CircleCheck size={17} />, label: t.accepted,  value: summary.accepted,  iconBg: "#dbeafe", iconColor: "#61A9E5" },
              { id: "completed", icon: <CircleCheck size={17} />, label: t.completed, value: summary.completed, iconBg: "#dcfce7", iconColor: "#22c55e" },
              { id: "cancelled", icon: <CircleX size={17} />,     label: t.cancelled, value: summary.cancelled, iconBg: "#fee2e2", iconColor: "#ef4444" },
            ].map((s, i) => (
              /* "Total" card spans 2 cols on mobile so it sits alone on top row */
              <div key={s.id} className={`stat-card${i === 0 ? " col-span-2 sm:col-span-1" : ""}`}
                style={{ cursor: "pointer" }}
                onClick={() => setStatus(s.id === "total" ? "all" : s.id as OrderStatus)}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: s.iconBg, color: s.iconColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</div>
                <div>
                  <p style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#94a3b8", margin: 0 }}>{s.label}</p>
                  <p style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", margin: 0, lineHeight: 1.2 }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Table toolbar (status chips + count) ── */}
          <div style={{ background: "white", borderRadius: "18px 18px 0 0", border: "1px solid #e0f2fe", borderBottom: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "12px 14px" }} className="sm:px-5 sm:py-4">
              <div style={{ flexShrink: 0 }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", margin: 0 }} className="sm:text-[15px]">{t.orderOverview}</h3>
                <p style={{ fontSize: 10.5, color: "#94a3b8", margin: 0 }}>{visibleOrders.length} {t.order}{visibleOrders.length !== 1 ? "s" : ""} {t.shown}</p>
              </div>
              {/* Horizontally scrollable chips */}
              <div className="no-sb" style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 2 }}>
                {(["all", "pending", "accepted", "completed", "cancelled"] as const).map(s => (
                  <button key={s} onClick={() => setStatus(s)} className={`status-chip${status === s ? " active" : ""}`}>
                    {s === "all" ? t.all : t[s as keyof typeof t]}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 14px 24px" }} className="sm:px-7">
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>

          {/* Error */}
          {error && (
            <div style={{ margin: "8px 0", padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 13, color: "#dc2626", display: "flex", gap: 8 }}>
              <X size={14} style={{ flexShrink: 0 }} />{error}
            </div>
          )}

          {/* ════ DESKTOP TABLE (md+) ════ */}
          <div className="hidden md:block" style={{ background: "white", borderRadius: "0 0 18px 18px", border: "1px solid #e0f2fe", borderTop: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", minWidth: 800, borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, background: "#f8feff", zIndex: 5 }}>
                  <tr>
                    {[t.order, t.items, t.total, t.status, t.date, t.actions].map((h, i) => (
                      <th key={i} style={{ padding: "11px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#94a3b8", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!restaurant && !loading ? (
                    <tr><td colSpan={6} style={{ padding: "48px 0", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>{t.createRestaurantToViewOrders}</td></tr>
                  ) : loading ? (
                    <tr><td colSpan={6} style={{ padding: "48px 0", textAlign: "center" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 10, color: "#61A9E5", fontSize: 14 }}>
                        <span style={{ width: 18, height: 18, border: "2.5px solid #dbeafe", borderTopColor: "#61A9E5", borderRadius: "50%", display: "inline-block" }} className="spin" />
                        {t.loadingOrders}
                      </div>
                    </td></tr>
                  ) : visibleOrders.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: "48px 0", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>{t.noOrdersFound}</td></tr>
                  ) : visibleOrders.map(order => {
                    const cfg = statusConfig[order.status as keyof typeof statusConfig] ?? statusConfig.pending;
                    return (
                      <tr key={order.id} className="tbl-row">
                        <td style={{ padding: "12px 16px" }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0 }}>Table {order.table_number || "—"}</p>
                          <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>#{order.order_number}</p>
                        </td>
                        <td style={{ padding: "12px 16px", maxWidth: 200 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#475569", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {order.items?.length ? order.items.map(i => `${i.item_name} ×${i.quantity}`).join(", ") : t.noItems}
                          </p>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <p style={{ fontSize: 14, fontWeight: 800, color: "#61A9E5", margin: 0 }}>${Number(order.total_amount).toFixed(2)}</p>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div className="status-select-wrap" style={{ background: cfg.bg, borderRadius: 99 }}>
                            <select value={order.status} onChange={e => updateStatus(order.id, e.target.value)} className="status-select" style={{ color: cfg.color }}>
                              <option value="pending">{t.pending}</option>
                              <option value="accepted">{t.accepted}</option>
                              <option value="completed">{t.completed}</option>
                              <option value="cancelled">{t.cancelled}</option>
                            </select>
                            <svg className="status-chevron" width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke={cfg.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <p style={{ fontSize: 12, color: "#334155", margin: 0 }}>{order.created_at ? new Date(order.created_at).toLocaleDateString() : "—"}</p>
                          <p style={{ fontSize: 10.5, color: "#94a3b8", margin: 0 }}>{order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</p>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button type="button" onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }} className="action-btn" style={{ background: "#f0f9ff", color: "#61A9E5" }} title="View">
                              <Eye size={15} />
                            </button>
                            <button type="button" onClick={() => deleteOrder(order.id)} className="action-btn" style={{ background: "#fef2f2", color: "#ef4444" }} title="Delete">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ════ MOBILE CARDS (< md) ════ */}
          <div className="flex md:hidden flex-col gap-3 pt-1" style={{ paddingBottom: 16 }}>
            {!restaurant && !loading ? (
              <div style={{ textAlign: "center", padding: "48px 16px", color: "#94a3b8", fontSize: 14 }}>{t.createRestaurantToViewOrders}</div>
            ) : loading ? (
              <div style={{ textAlign: "center", padding: "48px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#61A9E5", fontSize: 14 }}>
                <span style={{ width: 18, height: 18, border: "2.5px solid #dbeafe", borderTopColor: "#61A9E5", borderRadius: "50%", display: "inline-block" }} className="spin" />
                {t.loadingOrders}
              </div>
            ) : visibleOrders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8", fontSize: 14 }}>{t.noOrdersFound}</div>
            ) : visibleOrders.map(order => {
              const cfg = statusConfig[order.status as keyof typeof statusConfig] ?? statusConfig.pending;
              return (
                <div key={order.id} className="order-card">
                  {/* Card top row: table + order# + status pill */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0 }}>Table {order.table_number || "—"}</p>
                      <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>#{order.order_number}</p>
                    </div>
                    {/* Inline status select */}
                    <div className="status-select-wrap" style={{ background: cfg.bg, borderRadius: 99 }}>
                      <select value={order.status} onChange={e => updateStatus(order.id, e.target.value)} className="status-select" style={{ color: cfg.color }}>
                        <option value="pending">{t.pending}</option>
                        <option value="accepted">{t.accepted}</option>
                        <option value="completed">{t.completed}</option>
                        <option value="cancelled">{t.cancelled}</option>
                      </select>
                      <svg className="status-chevron" width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke={cfg.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                  </div>

                  {/* Items */}
                  <p style={{ fontSize: 12.5, fontWeight: 600, color: "#475569", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {order.items?.length ? order.items.map(i => `${i.item_name} ×${i.quantity}`).join(", ") : t.noItems}
                  </p>

                  {/* Bottom row: total + date + actions */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, paddingTop: 8, borderTop: "1px solid #f0f9ff" }}>
                    <div>
                      <span style={{ fontSize: 16, fontWeight: 900, color: "#61A9E5" }}>${Number(order.total_amount).toFixed(2)}</span>
                      <span style={{ fontSize: 10.5, color: "#94a3b8", marginLeft: 8 }}>
                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : "—"}
                        {" · "}
                        {order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button type="button" onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }} className="action-btn" style={{ background: "#f0f9ff", color: "#61A9E5" }} title="View">
                        <Eye size={15} />
                      </button>
                      <button type="button" onClick={() => deleteOrder(order.id)} className="action-btn" style={{ background: "#fef2f2", color: "#ef4444" }} title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* ── Order Detail Modal ── */}
      {isModalOpen && selectedOrder && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="modal-card">
            {/* Drag handle (mobile) */}
            <div className="flex sm:hidden justify-center pt-3 pb-1">
              <div style={{ width: 36, height: 4, borderRadius: 99, background: "#e2e8f0" }} />
            </div>

            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px 12px", borderBottom: "1px solid #f0f9ff", flexShrink: 0 }} className="sm:px-6 sm:pt-5 sm:pb-4">
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }} className="sm:text-[18px]">{t.orderDetails}</h2>
                <p style={{ fontSize: 11.5, color: "#94a3b8", margin: "2px 0 0" }}>#{selectedOrder.order_number}</p>
              </div>
              {(() => {
                const cfg = statusConfig[selectedOrder.status as keyof typeof statusConfig] ?? statusConfig.pending;
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ padding: "3px 12px", borderRadius: 99, background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 700, textTransform: "capitalize" }}>{cfg.label}</span>
                    <button onClick={() => setIsModalOpen(false)} style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #dbeafe", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}><X size={15} /></button>
                  </div>
                );
              })()}
            </div>

            {/* Modal body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }} className="sm:px-6 sm:py-5">

              {/* Info grid — 1 col on tiny screens, 2 col on sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3" style={{ marginBottom: 16 }}>
                {[
                  { icon: <User size={15} style={{ color: "#61A9E5" }} />, bg: "#eff6ff", label: t.customer, value: selectedOrder.customer_name || t.guest },
                  { icon: <MapPin size={15} style={{ color: "#38bdf8" }} />, bg: "#f0f9ff", label: t.table, value: selectedOrder.table_number || t.takeaway },
                  { icon: <Clock size={15} style={{ color: "#22c55e" }} />, bg: "#f0fdf4", label: t.orderTime, value: selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString() : "—" },
                  { icon: <ReceiptText size={15} style={{ color: "#f59e0b" }} />, bg: "#fffbeb", label: t.itemsCount, value: `${selectedOrder.items?.length ?? 0} ${t.item}${selectedOrder.items?.length !== 1 ? "s" : ""}` },
                ].map((b, i) => (
                  <div key={i} className="info-block">
                    <div className="info-icon" style={{ background: b.bg }}>{b.icon}</div>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", margin: 0 }}>{b.label}</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "2px 0 0" }}>{b.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Items list — card-style on mobile instead of table */}
              <div style={{ borderRadius: 14, border: "1px solid #e0f2fe", overflow: "hidden", marginBottom: 14 }}>
                <div style={{ padding: "10px 14px", background: "#f8feff", borderBottom: "1px solid #e0f2fe" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".06em" }}>{t.orderItems}</span>
                </div>

                {/* Desktop: table; Mobile: stacked rows */}
                <table className="hidden sm:table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8feff" }}>
                      {[t.item, t.qty, t.unitPrice, t.total].map((h, i) => (
                        <th key={i} style={{ padding: "9px 14px", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em", textAlign: i === 0 ? "left" : "right" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, idx) => (
                      <tr key={idx} style={{ borderTop: "1px solid #f0f9ff" }}>
                        <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{item.item_name}</td>
                        <td style={{ padding: "10px 14px", fontSize: 12.5, color: "#475569", textAlign: "right" }}>×{item.quantity}</td>
                        <td style={{ padding: "10px 14px", fontSize: 12.5, color: "#475569", textAlign: "right" }}>${Number(item.unit_price).toFixed(2)}</td>
                        <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: "#0f172a", textAlign: "right" }}>${Number(item.line_total).toFixed(2)}</td>
                      </tr>
                    ))}
                    {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                      <tr><td colSpan={4} style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: 13, fontStyle: "italic" }}>{t.noItems}</td></tr>
                    )}
                  </tbody>
                </table>

                {/* Mobile item rows */}
                <div className="flex flex-col sm:hidden">
                  {(!selectedOrder.items || selectedOrder.items.length === 0) ? (
                    <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, padding: "20px 0", fontStyle: "italic" }}>{t.noItems}</p>
                  ) : selectedOrder.items.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderTop: idx === 0 ? "none" : "1px solid #f0f9ff" }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: 0 }}>{item.item_name}</p>
                        <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>×{item.quantity} · ${Number(item.unit_price).toFixed(2)} each</p>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", flexShrink: 0, marginLeft: 12 }}>${Number(item.line_total).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div style={{ padding: "10px 14px", background: "#fffbeb", border: "1px solid #fef08a", borderRadius: 12, marginBottom: 14, display: "flex", gap: 10 }}>
                  <Notebook size={14} style={{ color: "#f59e0b", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 3px" }}>{t.notes}</p>
                    <p style={{ fontSize: 13, color: "#78350f", margin: 0 }}>{selectedOrder.notes}</p>
                  </div>
                </div>
              )}

              {/* Total */}
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, padding: "12px 0 0", borderTop: "1px solid #f0f9ff" }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "#475569" }}>{t.totalAmount}</span>
                <span style={{ fontSize: 24, fontWeight: 900, color: "#61A9E5" }}>${Number(selectedOrder.total_amount).toFixed(2)}</span>
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ padding: "12px 18px 16px", borderTop: "1px solid #f0f9ff", background: "#f8feff", display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0 }} className="sm:px-6 sm:py-4">
              <button onClick={() => setIsModalOpen(false)} style={{ padding: "10px 18px", borderRadius: 12, border: "1.5px solid #dbeafe", background: "white", fontSize: 13, fontWeight: 700, color: "#475569", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{t.close}</button>
              <button onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 12, background: "#61A9E5", border: "none", fontSize: 13, fontWeight: 700, color: "white", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 12px rgba(97,169,229,.3)" }}>
                <CreditCard size={14} />{t.printReceipt}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}