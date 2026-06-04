"use client";

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  apiRequest, getStoredRestaurantId, Restaurant,
  ListResponse, MenuItem, getStoredUser, storeRestaurant
} from "@/lib/api";
import {
  ChefHat, Clock, ReceiptText, CheckCircle2,
  Printer, Utensils, AlertCircle, RefreshCw, ArrowLeft
} from "lucide-react";
import { useLanguage } from "@/app/contexts/LanguageContext";
import Link from "next/link";

type KitchenItem = {
  name: string; quantity: number; unit_price: number;
  unit_price_khr: number; status: "pending" | "accepted" | "completed";
  special_instructions: string | null; order_id: number;
};

type KitchenSession = {
  session_id: string; table_number: string; status: string;
  total_bill: number; total_bill_khr: number; order_ids: number[];
  items: KitchenItem[]; created_at: string;
};

const getItemStatus = (status: string, t: any) => {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    pending:   { label: t.pending,   bg: "#fef9c3", color: "#f59e0b" },
    accepted:  { label: t.accepted,  bg: "#dbeafe", color: "#61A9E5" },
    completed: { label: t.completed, bg: "#dcfce7", color: "#22c55e" },
  };
  return map[status] || { label: status, bg: "#f0f9ff", color: "#64748b" };
};

export default function KitchenDashboard() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"active" | "archive">("active");
  const [sessions, setSessions] = useState<KitchenSession[]>([]);
  const [archivedSessions, setArchivedSessions] = useState<KitchenSession[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingOrderId, setProcessingOrderId] = useState<number | null>(null);
  const [openDropdownOrderId, setOpenDropdownOrderId] = useState<number | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    setError(null);
    try {
      let restaurantId = getStoredRestaurantId();
      if (!restaurantId) {
        const user = getStoredUser();
        const q = user ? `?user_id=${user.id}` : "";
        const restaurants = await apiRequest<ListResponse<Restaurant>>(`/restaurants${q}`);
        const first = restaurants.data[0];
        if (first) { restaurantId = first.id; storeRestaurant(first); }
      }
      if (!restaurantId) return;
      const [res, menuRes, activeRes, archiveRes] = await Promise.all([
        apiRequest<{ data: Restaurant }>(`/restaurants/${restaurantId}`),
        apiRequest<ListResponse<MenuItem>>(`/restaurants/${restaurantId}/menu-items`),
        apiRequest<KitchenSession[] | ListResponse<KitchenSession>>(`/admin/kitchen/orders?restaurant_id=${restaurantId}`),
        apiRequest<KitchenSession[] | ListResponse<KitchenSession>>(`/admin/kitchen/archive?restaurant_id=${restaurantId}`),
      ]);
      setRestaurant(res.data);
      setMenuItems(menuRes.data);
      setSessions(Array.isArray(activeRes) ? activeRes : activeRes.data || []);
      setArchivedSessions(Array.isArray(archiveRes) ? archiveRes : archiveRes.data || []);
    } catch {
      setError("Failed to load kitchen sessions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const handleVisibility = () => { if (document.visibilityState === "visible") fetchOrders(true); };
    document.addEventListener("visibilitychange", handleVisibility);
    let interval: ReturnType<typeof setInterval> | null = null;
    if (document.visibilityState === "visible") interval = setInterval(() => fetchOrders(true), 10000);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (interval) clearInterval(interval);
    };
  }, [fetchOrders]);

  const menuDescMap = useMemo(() => {
    const m = new Map<string, string | null | undefined>();
    menuItems.forEach(i => m.set(i.name, i.description));
    return m;
  }, [menuItems]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setOpenDropdownOrderId(null);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleUpdateStatus = async (orderId: number, newStatus: "pending" | "accepted" | "completed") => {
    setProcessingOrderId(orderId);
    setOpenDropdownOrderId(null);
    try {
      await apiRequest(`/admin/kitchen/orders/${orderId}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchOrders(true);
    } catch { alert("Failed to update status."); }
    finally { setProcessingOrderId(null); }
  };

  const handleComplete = async (session: KitchenSession) => {
    if (!confirm(`Complete Table ${session.table_number} and print invoice?`)) return;
    setProcessingId(session.session_id);
    try {
      await apiRequest(`/admin/kitchen/sessions/${session.session_id}/complete`, { method: "POST" });
      printInvoice(session);
      await fetchOrders(true);
    } catch { alert("Failed to complete session."); }
    finally { setProcessingId(null); }
  };

  const printInvoice = (session: KitchenSession) => {
    const win = window.open("", "_blank");
    if (!win) return;
    const rate = restaurant?.usd_to_khr_rate || 4000;
    const itemsHtml = (session.items || []).map(item => {
      const usdUnit = item.unit_price || 0;
      const khrUnit = item.unit_price_khr || (usdUnit * rate);
      return `<tr style="border-bottom:1px dotted #ccc;">
        <td style="padding:8px 0;vertical-align:top;"><div style="font-weight:bold;font-size:13px;">${item.name}</div>${item.special_instructions ? `<div style="font-size:11px;color:#666;font-style:italic;">* ${item.special_instructions}</div>` : ""}</td>
        <td style="padding:8px 0;text-align:center;font-size:13px;">${item.quantity}</td>
        <td style="padding:8px 0;text-align:right;"><div style="font-size:12px;">$${usdUnit.toFixed(2)}</div><div style="font-size:10px;color:#666;">${khrUnit.toLocaleString()}៛</div></td>
        <td style="padding:8px 0;text-align:right;"><div style="font-size:12px;font-weight:bold;">$${(usdUnit * item.quantity).toFixed(2)}</div><div style="font-size:10px;color:#666;">${(khrUnit * item.quantity).toLocaleString()}៛</div></td>
      </tr>`;
    }).join("");
    const totalKhr = session.total_bill_khr || (session.total_bill * rate);
    win.document.write(`<html><head><title>Invoice - Table ${session.table_number}</title><style>@page{margin:0;size:80mm auto;}body{font-family:'Inter','Noto Sans Khmer',sans-serif;width:80mm;margin:0;padding:4mm;color:#000;}.header{text-align:center;margin-bottom:10px;}.header h1{margin:0;font-size:20px;font-weight:900;text-transform:uppercase;}.divider{border-top:1.5px dashed #000;margin:10px 0;}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px;font-size:12px;margin:15px 0;font-weight:600;}table{width:100%;border-collapse:collapse;table-layout:fixed;}th{font-size:11px;font-weight:800;text-transform:uppercase;border-bottom:1.5px dashed #000;padding-bottom:8px;}.grand-total{border-top:1.5px dashed #000;margin-top:10px;padding-top:10px;}.footer{text-align:center;margin-top:15px;font-size:12px;font-weight:800;}</style></head><body>
    <div class="header"><h1>${restaurant?.name || "SCANNOW"}</h1><p style="margin:2px 0;font-size:12px;">${restaurant?.location_name || ""}</p>${restaurant?.phone ? `<p style="margin:2px 0;font-size:12px;">Tel: ${restaurant.phone}</p>` : ""}</div>
    <div class="divider"></div>
    <div class="info-grid"><div>Table: <b>${session.table_number}</b></div><div style="text-align:right;">Date: ${new Date().toLocaleDateString()}</div><div>Time: ${new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div><div style="text-align:right;">ID: #${session.session_id.substring(0,8)}</div></div>
    <table><thead><tr><th style="text-align:left;width:40%;">Description</th><th style="text-align:center;width:10%;">QTY</th><th style="text-align:right;width:25%;">Unit</th><th style="text-align:right;width:25%;">Amount</th></tr></thead><tbody>${itemsHtml}</tbody></table>
    <div class="divider"></div>
    <div class="grand-total" style="display:flex;justify-content:space-between;align-items:flex-start;"><span style="font-size:16px;font-weight:900;">GRAND TOTAL</span><div style="text-align:right;"><div style="font-size:18px;font-weight:900;">$${session.total_bill.toFixed(2)}</div><div style="font-size:13px;font-weight:800;">${totalKhr.toLocaleString()}៛</div></div></div>
    <div style="text-align:center;font-size:11px;font-style:italic;margin-top:20px;color:#555;">Exchange Rate: $1 = ${rate.toLocaleString()}៛</div>
    <div class="footer"><p>Thank you for your visit!</p><p>សូមអរគុណ និង សូមអញ្ជើញមកម្តងទៀត</p></div>
    <script>window.onload=function(){window.print();setTimeout(function(){window.close();},500);}<\/script></body></html>`);
    win.document.close();
  };

  if (loading) return (
    <div style={{ height: "100dvh", background: "#EAF9FF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <ChefHat size={26} style={{ color: "#61A9E5" }} />
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#64748b" }}>{t.loading}</p>
      </div>
    </div>
  );

  const displaySessions = activeTab === "active" ? sessions : archivedSessions;
  const isArchive = activeTab === "archive";

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "#EAF9FF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }

        .session-card {
          background: white; border-radius: 20px; border: 1px solid #e0f2fe;
          overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .2s, transform .15s;
          box-shadow: 0 2px 12px rgba(97,169,229,.06);
        }
        .session-card:hover { box-shadow: 0 8px 28px rgba(97,169,229,.16); transform: translateY(-2px); }

        .item-row { padding: 10px 0; border-bottom: 1px solid #f0f9ff; }
        .item-row:last-child { border-bottom: none; padding-bottom: 0; }

        .status-pill {
          font-size: 11px; font-weight: 700; padding: 4px 11px;
          border-radius: 99px; cursor: pointer; border: none;
          font-family: 'DM Sans', sans-serif; white-space: nowrap;
          transition: opacity .15s; line-height: 1.4;
        }
        .status-pill:hover:not(:disabled) { opacity: .8; }
        .status-pill:disabled { cursor: not-allowed; opacity: .6; }

        .dropdown-menu {
          position: absolute; right: 0; top: calc(100% + 6px); z-index: 30;
          background: white; border: 1px solid #dbeafe; border-radius: 12px;
          overflow: hidden; box-shadow: 0 8px 24px rgba(97,169,229,.2);
          min-width: 130px; animation: fadeDown .15s ease;
        }
        @keyframes fadeDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

        .drop-option {
          display: block; width: 100%; text-align: left; padding: 10px 14px;
          font-size: 12.5px; font-weight: 700; border: none; background: white;
          cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background .12s;
        }
        .drop-option:hover { background: #f0f9ff; }

        .complete-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 11px; border-radius: 12px;
          font-size: 13px; font-weight: 700; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: opacity .15s, transform .1s;
          border: none;
        }
        .complete-btn:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
        .complete-btn:disabled { opacity: .55; cursor: not-allowed; transform: none; }

        .tab-btn {
          flex: 1; padding: 9px 16px; border-radius: 10px; font-size: 13px; font-weight: 700;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .15s;
        }
        .tab-btn.active { background: #61A9E5; color: white; box-shadow: 0 4px 12px rgba(97,169,229,.3); }
        .tab-btn.inactive { background: transparent; color: #64748b; }
        .tab-btn.inactive:hover { background: #f0f9ff; color: #0369a1; }

        .spin { animation: spin .7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .live-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; flex-shrink: 0;
          animation: livePulse 1.5s ease-in-out infinite; }
        @keyframes livePulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .5; transform: scale(.85); } }

        /* Pending glow animation for urgent cards */
        @keyframes pendingGlow {
          0%,100% { box-shadow: 0 2px 12px rgba(245,158,11,.08); }
          50% { box-shadow: 0 4px 20px rgba(245,158,11,.22); }
        }
        .card-pending { animation: pendingGlow 2.5s ease-in-out infinite; }

        .no-sb::-webkit-scrollbar { display: none; }
        .no-sb { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ── Sticky Header ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 30,
        background: "rgba(234,249,255,.94)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(186,230,253,.5)",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "12px 14px" }} className="sm:px-7 sm:py-4">

          {/* ── Desktop header (sm+): title | tabs | live+refresh ── */}
          <div className="hidden sm:flex" style={{ alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            {/* Title */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              <Link href="/dashboard/menu/order" style={{ width: 34, height: 34, borderRadius: "50%", background: "#f0f9ff", border: "1.5px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center", color: "#61A9E5", textDecoration: "none" }}>
                <ArrowLeft size={16} />
              </Link>
              <div style={{ width: 42, height: 42, borderRadius: 13, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChefHat size={21} style={{ color: "#61A9E5" }} />
              </div>
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", margin: 0 }}>{t.kitchen}</h1>
                {restaurant && <p style={{ fontSize: 11.5, color: "#94a3b8", margin: 0 }}>{restaurant.name}</p>}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", background: "white", borderRadius: 13, border: "1px solid #dbeafe", padding: 4, gap: 4, flex: 1, maxWidth: 360 }}>
              <button className={`tab-btn ${activeTab === "active" ? "active" : "inactive"}`} onClick={() => setActiveTab("active")}>
                <Utensils size={14} />
                {t.orders}
                {sessions.length > 0 && (
                  <span style={{ background: activeTab === "active" ? "rgba(255,255,255,.3)" : "#dbeafe", color: activeTab === "active" ? "white" : "#61A9E5", fontSize: 11, fontWeight: 800, padding: "1px 7px", borderRadius: 99 }}>
                    {sessions.length}
                  </span>
                )}
              </button>
              <button className={`tab-btn ${activeTab === "archive" ? "active" : "inactive"}`} onClick={() => setActiveTab("archive")}>
                <ReceiptText size={14} />
                {t.archive}
                {archivedSessions.length > 0 && (
                  <span style={{ background: activeTab === "archive" ? "rgba(255,255,255,.3)" : "#f0f9ff", color: activeTab === "archive" ? "white" : "#94a3b8", fontSize: 11, fontWeight: 800, padding: "1px 7px", borderRadius: 99 }}>
                    {archivedSessions.length}
                  </span>
                )}
              </button>
            </div>

            {/* Live + Refresh */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 13px", borderRadius: 99, background: "white", border: "1px solid #dbeafe" }}>
                <div className="live-dot" />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#22c55e" }}>Live</span>
              </div>
              <button onClick={() => fetchOrders(true)} style={{ width: 36, height: 36, borderRadius: "50%", border: "1.5px solid #dbeafe", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#61A9E5" }}>
                <RefreshCw size={15} className={refreshing ? "spin" : ""} />
              </button>
            </div>
          </div>

          {/* ── Mobile header: 2 rows ── */}
          <div className="flex flex-col sm:hidden" style={{ gap: 10 }}>
            {/* Row 1: back + title + live dot + refresh */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Link href="/dashboard/menu/order" style={{ width: 32, height: 32, borderRadius: "50%", background: "#f0f9ff", border: "1.5px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center", color: "#61A9E5", textDecoration: "none", flexShrink: 0 }}>
                <ArrowLeft size={15} />
              </Link>
              <div style={{ width: 34, height: 34, borderRadius: 11, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ChefHat size={17} style={{ color: "#61A9E5" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: 0 }}>{t.kitchen}</h1>
                {restaurant && <p style={{ fontSize: 10, color: "#94a3b8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{restaurant.name}</p>}
              </div>
              {/* Live pill */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 99, background: "white", border: "1px solid #dbeafe", flexShrink: 0 }}>
                <div className="live-dot" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#22c55e" }}>Live</span>
              </div>
              {/* Refresh */}
              <button onClick={() => fetchOrders(true)} style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #dbeafe", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#61A9E5", flexShrink: 0 }}>
                <RefreshCw size={14} className={refreshing ? "spin" : ""} />
              </button>
            </div>

            {/* Row 2: tabs full width */}
            <div style={{ display: "flex", background: "white", borderRadius: 12, border: "1px solid #dbeafe", padding: 3, gap: 3 }}>
              <button className={`tab-btn ${activeTab === "active" ? "active" : "inactive"}`} onClick={() => setActiveTab("active")} style={{ fontSize: 12, padding: "8px 12px" }}>
                <Utensils size={13} />
                {t.orders}
                {sessions.length > 0 && (
                  <span style={{ background: activeTab === "active" ? "rgba(255,255,255,.3)" : "#dbeafe", color: activeTab === "active" ? "white" : "#61A9E5", fontSize: 10.5, fontWeight: 800, padding: "1px 6px", borderRadius: 99 }}>
                    {sessions.length}
                  </span>
                )}
              </button>
              <button className={`tab-btn ${activeTab === "archive" ? "active" : "inactive"}`} onClick={() => setActiveTab("archive")} style={{ fontSize: 12, padding: "8px 12px" }}>
                <ReceiptText size={13} />
                {t.archive}
                {archivedSessions.length > 0 && (
                  <span style={{ background: activeTab === "archive" ? "rgba(255,255,255,.3)" : "#f0f9ff", color: activeTab === "archive" ? "white" : "#94a3b8", fontSize: 10.5, fontWeight: 800, padding: "1px 6px", borderRadius: 99 }}>
                    {archivedSessions.length}
                  </span>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "16px 14px 40px" }} className="sm:px-7 sm:pt-6" ref={dropdownRef}>

        {/* Error */}
        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, marginBottom: 16, fontSize: 13, color: "#dc2626" }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Empty state */}
        {displaySessions.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 16px", background: "white", borderRadius: 24, border: "2px dashed #dbeafe", textAlign: "center" }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              {isArchive ? <ReceiptText size={26} style={{ color: "#bae6fd" }} /> : <Utensils size={26} style={{ color: "#bae6fd" }} />}
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
              {isArchive ? "No archived orders" : "No active orders"}
            </h3>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
              {isArchive ? "Completed sessions will appear here." : "New orders will appear here automatically."}
            </p>
          </div>
        ) : (
          /*
            Grid: 1 col on mobile, 2 col on md, 3 col on xl
            Cards adapt their inner layout for narrower widths via inline styles
          */
          <div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
            style={{ gap: 14 }}
          >
            {displaySessions.map(session => {
              const pendingCount = session.items?.filter(i => i.status === "pending").length ?? 0;
              const hasPending = !isArchive && pendingCount > 0;

              return (
                <div key={session.session_id} className={`session-card${hasPending ? " card-pending" : ""}`}>

                  {/* ── Card Header ── */}
                  <div style={{
                    background: isArchive
                      ? "linear-gradient(135deg, #64748b, #475569)"
                      : "linear-gradient(135deg, #61A9E5, #0ea5e9)",
                    padding: "15px 18px",
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12,
                  }}>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "rgba(255,255,255,.7)", margin: "0 0 1px" }}>Table</p>
                      <p style={{ fontSize: 30, fontWeight: 900, color: "white", margin: 0, lineHeight: 1 }}>{session.table_number}</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,.65)", margin: "5px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                        {isArchive
                          ? <><CheckCircle2 size={11} />Done · {new Date(session.created_at).toLocaleString()}</>
                          : <><Clock size={11} />Since {new Date(session.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</>
                        }
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "rgba(255,255,255,.7)", margin: "0 0 1px" }}>Bill Total</p>
                      <p style={{ fontSize: 22, fontWeight: 900, color: "white", margin: 0, lineHeight: 1 }}>${session.total_bill.toFixed(2)}</p>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,.65)", margin: "3px 0 0" }}>≈ {(session.total_bill_khr || session.total_bill * 4000).toLocaleString()}៛</p>
                    </div>
                  </div>

                  {/* ── Item count + pending badge ── */}
                  <div style={{ padding: "10px 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "#94a3b8" }}>
                      {session.items?.length ?? 0} item{session.items?.length !== 1 ? "s" : ""}
                    </span>
                    {hasPending && (
                      <span style={{ padding: "2px 9px", borderRadius: 99, background: "#fef9c3", color: "#f59e0b", fontSize: 10.5, fontWeight: 800 }}>
                        {pendingCount} pending
                      </span>
                    )}
                  </div>

                  {/* ── Items list ── */}
                  <div style={{ padding: "10px 16px 14px", flex: 1 }}>
                    {session.items?.map((item, idx) => (
                      <div key={`${item.name}-${idx}`} className="item-row">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>

                          {/* Left: qty badge + name + desc + special instructions */}
                          <div style={{ display: "flex", gap: 10, flex: 1, minWidth: 0 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 800, fontSize: 13, color: "#61A9E5" }}>
                              {item.quantity}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                              {menuDescMap.get(item.name) && (
                                <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {menuDescMap.get(item.name)}
                                </p>
                              )}
                              {item.special_instructions && (
                                <p style={{ fontSize: 11, color: "#ef4444", margin: "3px 0 0", fontStyle: "italic", lineHeight: 1.4 }}>
                                  ⚠ {item.special_instructions}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right: status pill / dropdown */}
                          {!isArchive ? (
                            <div style={{ position: "relative", flexShrink: 0 }}>
                              <button
                                onClick={e => { e.stopPropagation(); setOpenDropdownOrderId(openDropdownOrderId === item.order_id ? null : item.order_id); }}
                                disabled={processingOrderId === item.order_id}
                                className="status-pill"
                                style={{ background: getItemStatus(item.status, t).bg, color: getItemStatus(item.status, t).color }}
                              >
                                {processingOrderId === item.order_id ? (
                                  <span style={{ display: "inline-block", width: 11, height: 11, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%" }} className="spin" />
                                ) : (
                                  <>{getItemStatus(item.status, t).label} ▾</>
                                )}
                              </button>

                              {openDropdownOrderId === item.order_id && (
                                <div className="dropdown-menu">
                                  {(["pending", "accepted", "completed"] as const).map(s => (
                                    <button key={s} className="drop-option" style={{ color: getItemStatus(s, t).color }}
                                      onClick={() => handleUpdateStatus(item.order_id, s)}>
                                      <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: getItemStatus(s, t).color, marginRight: 7 }} />
                                      {getItemStatus(s, t).label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="status-pill" style={{ background: getItemStatus("completed", t).bg, color: getItemStatus("completed", t).color, cursor: "default" }}>
                              {getItemStatus("completed", t).label}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── Card Footer ── */}
                  <div style={{ padding: "12px 14px", borderTop: "1px solid #f0f9ff", background: "#f8feff" }}>
                    {isArchive ? (
                      <button onClick={() => printInvoice(session)} className="complete-btn" style={{ background: "white", color: "#475569", border: "1.5px solid #dbeafe" }}>
                        <Printer size={15} style={{ color: "#61A9E5" }} />
                        Print Invoice
                      </button>
                    ) : (
                      <button onClick={() => handleComplete(session)} disabled={processingId === session.session_id} className="complete-btn"
                        style={{ background: "linear-gradient(135deg, #61A9E5, #0ea5e9)", color: "white", boxShadow: "0 4px 12px rgba(97,169,229,.3)" }}>
                        {processingId === session.session_id ? (
                          <><span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "white", borderRadius: "50%", display: "inline-block" }} className="spin" />Processing…</>
                        ) : (
                          <><Printer size={15} />{t.completeAndPrintInvoice}</>
                        )}
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}