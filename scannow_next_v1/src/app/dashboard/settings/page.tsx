"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Settings, QrCode, MapPin, Navigation, Save, Loader2,
  ShieldCheck, AlertCircle, LocateFixed, Store, Clock,
  LayoutGrid, ChevronDown, Globe, Phone, LinkIcon, Plus,
  Trash2, Download, Info, X, LogOut, UtensilsCrossed,
  MessageSquare, Camera,
} from "lucide-react";
import QRCode from "qrcode";
import {
  apiRequest, getStoredRestaurant, ItemResponse, Restaurant,
  storeRestaurant, resolveAssetUrl, ListResponse, clearSession,
  ApiError, getStoredUser,
} from "@/lib/api";
import { useLanguage } from "@/app/contexts/LanguageContext";

type TabType = "profile" | "geofencing" | "operating" | "tables" | "telegram";
type KitchenSession = { session_id: string; table_number: string; status: string; total_bill: number; total_bill_khr: number; order_ids: number[]; items: any[]; created_at: string; };

/* ─── sub-components ─── */
function Fi({ label, value, onChange, icon, placeholder, type = "text" }: { label: string; value: any; onChange: (v: any) => void; icon?: React.ReactNode; placeholder?: string; type?: string }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{label}</label>
      <div style={{ position: "relative" }}>
        {icon && <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none", display: "flex" }}>{icon}</span>}
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: "100%", background: "white", border: "1.5px solid #dbeafe", borderRadius: 12, padding: icon ? "11px 14px 11px 40px" : "11px 14px", fontSize: 14, color: "#0f172a", fontFamily: "'DM Sans',sans-serif", outline: "none" }}
          onFocus={e => e.target.style.borderColor = "#61A9E5"}
          onBlur={e => e.target.style.borderColor = "#dbeafe"}
        />
      </div>
    </div>
  );
}

function Toggle({ enabled, setEnabled, label, desc }: { enabled: boolean; setEnabled: (v: boolean) => void; label: string; desc: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 14px", background: "#f8feff", borderRadius: 14, border: "1px solid #e0f2fe", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", margin: 0 }}>{label}</p>
        <p style={{ fontSize: 11.5, color: "#94a3b8", margin: "4px 0 0", lineHeight: "1.4" }}>{desc}</p>
      </div>
      <button type="button" onClick={() => setEnabled(!enabled)}
        style={{ width: 48, height: 26, borderRadius: 99, background: enabled ? "#61A9E5" : "#cbd5e1", border: "none", cursor: "pointer", position: "relative", flexShrink: 0, transition: "background .2s" }}>
        <div style={{ position: "absolute", top: 3, left: enabled ? 25 : 3, width: 20, height: 20, borderRadius: "50%", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,.2)", transition: "left .2s" }} />
      </button>
    </div>
  );
}

export default function UnifiedSettings() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [activeTables, setActiveTables] = useState<Set<string>>(new Set());
  const [profileOpen, setProfileOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [telegramQrCodeUrl, setTelegramQrCodeUrl] = useState<string | null>(null);

  // Profile
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationLink, setLocationLink] = useState("");
  const [phone, setPhone] = useState("");
  const [extraPhones, setExtraPhones] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [usdToKhrRate, setUsdToKhrRate] = useState("4100");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [telegramChatId, setTelegramChatId] = useState("");

  // Geo
  const [geoEnabled, setGeoEnabled] = useState(false);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState("100");

  // Operating
  const [autoClose, setAutoClose] = useState(false);
  const [openTime, setOpenTime] = useState("08:00");
  const [closeTime, setCloseTime] = useState("21:00");

  // Tables
  const [tables, setTables] = useState<{ id: string; x: number; y: number; name: string }[]>([]);
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTable, setSelectedTable] = useState<{ id: string; x: number; y: number; name: string } | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => { setIsLoggingOut(true); clearSession(); router.push("/auth/login"); };

  const handleDelete = async () => {
    if (!restaurant) return;
    setDeleting(true); setIsLoggingOut(true);
    try { await apiRequest(`/restaurants/${restaurant.id}`, { method: "DELETE" }); clearSession(); router.push("/auth/login"); }
    catch (err) { setIsLoggingOut(false); setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to delete" }); }
    finally { setDeleting(false); setShowDeleteConfirm(false); setDeleteConfirmText(""); }
  };

  const fetchActiveSessions = useCallback(async () => {
    if (isLoggingOut || !restaurant?.id) return;
    const storedUser = getStoredUser();
    if (!storedUser) { clearSession(); router.push("/auth/login"); return; }
    try {
      const res = await apiRequest<KitchenSession[] | ListResponse<KitchenSession>>(`/admin/kitchen/orders?restaurant_id=${restaurant.id}`);
      const sessions = Array.isArray(res) ? res : res.data;
      const active = new Set<string>();
      if (Array.isArray(sessions)) sessions.forEach(s => { if (s.table_number) { active.add(s.table_number); active.add(`Table ${s.table_number}`); } });
      setActiveTables(active);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) { clearSession(); router.push("/auth/login"); }
    }
  }, [restaurant?.id, router, isLoggingOut]);

  useEffect(() => {
    const res = getStoredRestaurant();
    if (res) {
      setRestaurant(res); setName(res.name || ""); setDescription(res.description || "");
      setLocationName(res.location_name || ""); setLocationLink(res.location_link || "");
      setPhone(res.phone || ""); setExtraPhones(res.phones || []);
      setSelectedLanguage(res.language || "en");
      if (res.language) setLanguage(res.language as "en" | "kh");
      setUsdToKhrRate(res.usd_to_khr_rate?.toString() || "4100");
      setLogoPreview(resolveAssetUrl(res.logo_url));
      setTelegramChatId(res.telegram_chat_id || "");
      setGeoEnabled(res.is_geofencing_enabled ?? false);
      setLat(res.latitude?.toString() ?? ""); setLng(res.longitude?.toString() ?? ""); setRadius(res.radius_meters?.toString() ?? "100");
      setAutoClose(res.is_auto_close_enabled ?? false);
      setOpenTime(res.open_time?.substring(0, 5) ?? "08:00"); setCloseTime(res.close_time?.substring(0, 5) ?? "21:00");
      setTables(res.table_map_data || []);
    }
  }, []);

  useEffect(() => {
    QRCode.toDataURL("https://t.me/scannowverification_bot", { width: 200, margin: 2 }).then(setTelegramQrCodeUrl).catch(() => {});
  }, []);

  useEffect(() => {
    fetchActiveSessions();
    const onVis = () => { if (document.visibilityState === "visible") fetchActiveSessions(); };
    document.addEventListener("visibilitychange", onVis);
    let iv: ReturnType<typeof setInterval> | null = null;
    if (document.visibilityState === "visible") iv = setInterval(fetchActiveSessions, 10000);
    return () => { document.removeEventListener("visibilitychange", onVis); if (iv) clearInterval(iv); };
  }, [fetchActiveSessions, isLoggingOut]);

  const handleSave = async () => {
    if (!restaurant) return;
    setLoading(true); setMessage(null);
    const fd = new FormData();
    fd.append("_method", "PATCH"); fd.append("name", name); fd.append("description", description);
    fd.append("location_name", locationName); fd.append("location_link", locationLink);
    fd.append("phone", phone); fd.append("phones", JSON.stringify(extraPhones));
    fd.append("telegram_chat_id", telegramChatId); fd.append("language", selectedLanguage);
    fd.append("usd_to_khr_rate", usdToKhrRate); fd.append("is_geofencing_enabled", geoEnabled ? "1" : "0");
    fd.append("latitude", lat || ""); fd.append("longitude", lng || ""); fd.append("radius_meters", radius);
    fd.append("is_auto_close_enabled", autoClose ? "1" : "0"); fd.append("open_time", openTime); fd.append("close_time", closeTime);
    fd.append("table_map_data", JSON.stringify(tables));
    if (logo) fd.append("logo", logo);
    try {
      const resp = await apiRequest<ItemResponse<Restaurant>>(`/restaurants/${restaurant.id}`, { method: "POST", body: fd });
      storeRestaurant(resp.data); setRestaurant(resp.data);
      setMessage({ type: "success", text: "All settings updated successfully!" });
    } catch (err) { setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save settings" }); }
    finally { setLoading(false); }
  };

  const addTable = () => setTables([...tables, { id: `table-${Date.now()}`, x: 50, y: 50, name: `Table ${tables.length + 1}` }]);

  const handleTableClick = async (table: { id: string; x: number; y: number; name: string }) => {
    if (isDragging) return;
    setSelectedTable(table);
    const tableNum = table.name.replace(/[^0-9]/g, "");
    const qrData = `${window.location.origin}/page/menu?restaurant_id=${restaurant?.id}&table=${encodeURIComponent(tableNum)}`;
    try { const url = await QRCode.toDataURL(qrData, { width: 300, margin: 2 }); setQrCodeUrl(url); setShowQrModal(true); } catch {}
  };

  const downloadQrCode = () => {
    if (!qrCodeUrl || !selectedTable) return;
    const a = document.createElement("a"); a.download = `table-${selectedTable.name}-qr.png`; a.href = qrCodeUrl; a.click();
  };

  useEffect(() => {
    let moveCount = 0;
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!draggingTableId || !canvasRef.current) return;
      moveCount++; if (moveCount > 3) setIsDragging(true);
      const rect = canvasRef.current.getBoundingClientRect();
      const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
      const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
      const x = Math.max(0, Math.min(90, ((cx - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(90, ((cy - rect.top) / rect.height) * 100));
      setTables(prev => prev.map(t => t.id === draggingTableId ? { ...t, x, y } : t));
    };
    const handleStop = () => { setDraggingTableId(null); setTimeout(() => { moveCount = 0; setIsDragging(false); }, 100); };
    if (draggingTableId) {
      window.addEventListener("mousemove", handleMove); window.addEventListener("mouseup", handleStop);
      window.addEventListener("touchmove", handleMove); window.addEventListener("touchend", handleStop);
    }
    return () => {
      window.removeEventListener("mousemove", handleMove); window.removeEventListener("mouseup", handleStop);
      window.removeEventListener("touchmove", handleMove); window.removeEventListener("touchend", handleStop);
    };
  }, [draggingTableId]);

  const TABS: { id: TabType; icon: React.ReactNode; label: string }[] = [
    { id: "profile",    icon: <Store size={16} />,        label: t.shopProfile || "Profile" },
    { id: "geofencing", icon: <ShieldCheck size={16} />,  label: t.geofencing || "Geofencing" },
    { id: "operating",  icon: <Clock size={16} />,         label: t.operatingHours || "Hours" },
    { id: "tables",     icon: <LayoutGrid size={16} />,   label: t.tableMapQR || "Tables" },
    { id: "telegram",   icon: <MessageSquare size={16} />, label: "Telegram" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", fontFamily: "'DM Sans',sans-serif", background: "#EAF9FF" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }

        .tab-btn { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 10px; border: none; cursor: pointer; font-size: 13px; font-weight: 600; font-family: 'DM Sans',sans-serif; transition: all .15s; text-align: center; white-space: nowrap; }
        .tab-btn.active { background: #61A9E5; color: white; box-shadow: 0 4px 12px rgba(97,169,229,.3); }
        .tab-btn.inactive { background: transparent; color: #64748b; }
        .tab-btn.inactive:hover { background: #f0f9ff; color: #0369a1; }

        .save-btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 12px; background: linear-gradient(135deg,#61A9E5,#2e9be0); color: white; font-weight: 800; font-size: 13px; border: none; cursor: pointer; font-family: 'DM Sans',sans-serif; box-shadow: 0 4px 14px rgba(97,169,229,.3); transition: opacity .15s; }
        .save-btn:hover:not(:disabled) { opacity: .9; }
        .save-btn:disabled { opacity: .5; cursor: not-allowed; }

        .content-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .content-body { flex: 1; overflow-y: auto; padding: 20px 24px 24px; }

        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }

        .modal-overlay { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; background: rgba(15,23,42,.45); backdrop-filter: blur(4px); padding: 16px; animation: fIn .2s ease; }
        .modal-card { width: 100%; max-width: 400px; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,.12); animation: sUp .2s ease; }
        @keyframes fIn { from{opacity:0} to{opacity:1} }
        @keyframes sUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

        .danger-btn { padding: 9px 18px; border-radius: 11px; background: #fef2f2; border: 1.5px solid #fecaca; color: #ef4444; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'DM Sans',sans-serif; transition: background .15s; }
        .danger-btn:hover { background: #fee2e2; }

        .add-phone-btn { display: flex; align-items: center; justify-content: center; gap: 7px; width: 100%; padding: 9px; border-radius: 11px; border: 1.5px dashed #bae6fd; background: transparent; color: #61A9E5; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans',sans-serif; transition: background .15s; }
        .add-phone-btn:hover { background: #f0f9ff; }

        .spin { animation: spin .7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Mobile */
        @media (max-width: 768px) {
          .tabs-container { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; gap: 6px; }
          .tabs-container::-webkit-scrollbar { display: none; }
          .tab-btn { padding: 8px 12px; font-size: 11px; gap: 6px; }
          .tab-btn svg { width: 16px; height: 16px; }
          .save-btn-text { display: none !important; }
          .save-btn { padding: 10px 12px !important; }
          .two-col { grid-template-columns: 1fr !important; }
          .three-col { grid-template-columns: 1fr 1fr !important; }
          .content-body { padding: 16px 16px 24px; }
          .logo-section { flex-direction: column; align-items: center; gap: 12px; }
          .danger-zone { flex-direction: column !important; align-items: flex-start !important; gap: 12px; }
          .danger-btn { width: 100%; }
          .table-canvas { min-height: 320px !important; }
        }
      `}</style>

      {/* ══ TOP HEADER ══ */}
      <div style={{ background: "white", borderBottom: "1px solid #e0f2fe", padding: "16px 24px", boxShadow: "0 2px 16px rgba(97,169,229,.06)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Settings size={17} style={{ color: "#61A9E5" }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: 0, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Settings</p>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Restaurant</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {/* Profile mini */}
            <div style={{ position: "relative" }}>
              <button onClick={() => setProfileOpen(v => !v)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 11, border: "1.5px solid #dbeafe", background: "#f8feff", cursor: "pointer" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", overflow: "hidden", background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid #dbeafe" }}>
                  {restaurant?.logo_url ? <img src={resolveAssetUrl(restaurant.logo_url)} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.currentTarget.style.display = "none"; }} /> : <UtensilsCrossed size={14} style={{ color: "#61A9E5" }} />}
                </div>
              </button>
              {profileOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 20, background: "white", borderRadius: 14, border: "1px solid #dbeafe", padding: 12, boxShadow: "0 8px 30px rgba(97,169,229,.15)", minWidth: 200, width: "90vw", maxWidth: 280 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", margin: "0 0 2px" }}>{restaurant?.name || "Your restaurant"}</p>
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 10px" }}>{restaurant?.email || "No email"}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                    <Link href="/page/about-restaurant" style={{ borderRadius: 8, border: "1.5px solid #dbeafe", padding: "6px 0", textAlign: "center", fontSize: 11, fontWeight: 600, color: "#334155", textDecoration: "none" }}>View</Link>
                    <Link href="/page/about-restaurant" style={{ borderRadius: 8, background: "#61A9E5", padding: "6px 0", textAlign: "center", fontSize: 11, fontWeight: 700, color: "white", textDecoration: "none" }}>Edit</Link>
                  </div>
                  <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, width: "100%", padding: "7px 0", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                    <LogOut size={12} />Sign Out
                  </button>
                </div>
              )}
            </div>

            <button onClick={handleSave} disabled={loading} className="save-btn">
              {loading ? (
                <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.35)", borderTopColor: "white", borderRadius: "50%", display: "inline-block" }} className="spin" /><span style={{ display: "inline", marginLeft: 8, whiteSpace: "nowrap" }} className="save-btn-text">Saving…</span></>
              ) : (
                <><Save size={15} /><span style={{ display: "inline", marginLeft: 8, whiteSpace: "nowrap" }} className="save-btn-text">Save Changes</span></>
              )}
            </button>
          </div>
        </div>

        {/* Tab nav */}
        <div className="tabs-container" style={{ display: "flex", gap: 8, flexWrap: "nowrap" }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`tab-btn ${activeTab === tab.id ? "active" : "inactive"}`}>
              {tab.icon}
              <span style={{ display: "inline" }}>{tab.label}</span>
            </button>
          ))}
        </div>

        {message && (
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 600, background: message.type === "success" ? "#f0fdf4" : "#fef2f2", color: message.type === "success" ? "#22c55e" : "#ef4444", border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}` }}>
            {message.type === "success" ? <ShieldCheck size={14} /> : <AlertCircle size={14} />}
            {message.text}
          </div>
        )}
      </div>
      <style>{`
        @media (max-width: 768px) {
          .top-header { padding: 14px 16px; }
          .save-btn-text { display: none; }
          .profile-text { display: none; }
        }
      `}</style>

      {/* ══ CONTENT ══ */}
      <div className="content-area">
        {/* Scrollable body */}
        <div className="content-body">

          {/* Tab header */}
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", color: "#61A9E5" }}>
              {TABS.find(t => t.id === activeTab)?.icon}
            </div>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: 0 }}>{TABS.find(t => t.id === activeTab)?.label}</h1>
              {restaurant && <p style={{ fontSize: 11.5, color: "#94a3b8", margin: 0 }}>{restaurant.name}</p>}
            </div>
          </div>

          {/* ──── PROFILE TAB ──── */}
          {activeTab === "profile" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Logo + name */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px", background: "white", borderRadius: 16, border: "1px solid #e0f2fe" }} className="logo-section">
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ width: 80, height: 80, borderRadius: 20, overflow: "hidden", background: "#f0f9ff", border: "2px dashed #bae6fd", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    {logoPreview ? <img src={logoPreview} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Camera size={22} style={{ color: "#61A9E5" }} />}
                    <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { setLogo(f); const r = new FileReader(); r.onloadend = () => setLogoPreview(r.result as string); r.readAsDataURL(f); } }} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
                  </div>
                  <div style={{ position: "absolute", bottom: -3, right: -3, width: 22, height: 22, borderRadius: 7, background: "#61A9E5", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(97,169,229,.4)" }}>
                    <Camera size={11} style={{ color: "white" }} />
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 3px" }}>{name || "Your restaurant name"}</p>
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Click the photo to update your logo</p>
                </div>
              </div>

              <div className="two-col">
                <Fi label={language === "kh" ? "ឈ្មោះហាង" : "Place Name"} value={name} onChange={setName} icon={<Store size={15} />} placeholder="e.g. Pkay Restaurant" />
                <Fi label={language === "kh" ? "លេខទូរស័ព្ទ" : "Phone Number"} value={phone} onChange={setPhone} icon={<Phone size={15} />} placeholder="+855..." />
              </div>

              {extraPhones.map((ep, idx) => (
                <div key={idx} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <Fi label={`Extra Phone ${idx + 1}`} value={ep} onChange={v => { const n = [...extraPhones]; n[idx] = v; setExtraPhones(n); }} icon={<Phone size={15} />} placeholder="+855..." />
                  </div>
                  <button onClick={() => setExtraPhones(extraPhones.filter((_, i) => i !== idx))} style={{ width: 38, height: 38, borderRadius: 10, border: "1.5px solid #fecaca", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#ef4444" }}><Trash2 size={15} /></button>
                </div>
              ))}

              <button onClick={() => setExtraPhones([...extraPhones, ""])} className="add-phone-btn"><Plus size={14} />Add Extra Number</button>

              <Fi label={language === "kh" ? "ការពិពណ៌នា" : "Description"} value={description} onChange={setDescription} icon={<Info size={15} />} placeholder="Short bio about your restaurant..." />

              <div className="two-col">
                <Fi label={language === "kh" ? "ឈ្មោះទីតាំង" : "Location Name"} value={locationName} onChange={setLocationName} icon={<MapPin size={15} />} placeholder="e.g. Phnom Penh" />
                <Fi label={language === "kh" ? "តំណភ្ជាប់ទីតាំង" : "Location Link"} value={locationLink} onChange={setLocationLink} icon={<LinkIcon size={15} />} placeholder="Google Maps URL" />
                <Fi label={language === "kh" ? "អត្រាប្តូរប្រាក់" : "Exchange Rate (USD→KHR)"} value={usdToKhrRate} onChange={setUsdToKhrRate} icon={<Globe size={15} />} placeholder="4100" type="number" />
                <div>
                  <label style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>{t.language || "Language"}</label>
                  <div style={{ position: "relative" }}>
                    <select value={selectedLanguage} onChange={e => { setSelectedLanguage(e.target.value); setLanguage(e.target.value as "en" | "kh"); }} style={{ width: "100%", background: "white", border: "1.5px solid #dbeafe", borderRadius: 11, padding: "9px 36px 9px 12px", fontSize: 13.5, color: "#0f172a", fontFamily: "'DM Sans',sans-serif", appearance: "none", outline: "none", cursor: "pointer" }}>
                      <option value="en">English (US)</option>
                      <option value="kh">ភាសាខ្មែរ (KH)</option>
                    </select>
                    <ChevronDown size={15} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="danger-zone" style={{ marginTop: 4, padding: "14px 14px", background: "#fef2f2", borderRadius: 14, border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: "#ef4444", margin: "0 0 3px" }}>{language === "kh" ? "តំបន់គ្រោះថ្នាក់" : "Danger Zone"}</p>
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>{language === "kh" ? "ការលុបគណនីរបស់អ្នកនឹងលុបទិន្នន័យទាំងអស់ជាអចិន្ត្រៃយ៍។" : "Permanently deletes all restaurant data."}</p>
                </div>
                <button onClick={() => setShowDeleteConfirm(true)} className="danger-btn" style={{ flexShrink: 0 }}>{language === "kh" ? "លុបគណនី" : "Delete Account"}</button>
              </div>
            </div>
          )}

          {/* ──── GEOFENCING TAB ──── */}
          {activeTab === "geofencing" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Toggle enabled={geoEnabled} setEnabled={setGeoEnabled} label={language === "kh" ? "បើកការកំណត់ Geofencing" : "Enable Geofencing"} desc={language === "kh" ? "នៅពេលបើក អតិថិជនត្រូវតែនៅជិតហាង។" : "When enabled, customers must be near your shop to order."} />
              <div style={{ opacity: geoEnabled ? 1 : .4, pointerEvents: geoEnabled ? "all" : "none", display: "flex", flexDirection: "column", gap: 14, transition: "opacity .2s" }}>
                <div className="two-col">
                  <Fi label={language === "kh" ? "រយៈទទឹង" : "Latitude"} value={lat} onChange={setLat} icon={<MapPin size={15} />} placeholder="e.g. 11.5564" />
                  <Fi label={language === "kh" ? "រយៈបណ្ដោយ" : "Longitude"} value={lng} onChange={setLng} icon={<Navigation size={15} />} placeholder="e.g. 104.9282" />
                </div>
                <Fi label={language === "kh" ? "កាំ (ម៉ែត្រ)" : "Radius (meters)"} value={radius} onChange={setRadius} icon={<LocateFixed size={15} />} placeholder="e.g. 100" type="number" />
                <button onClick={async () => {
                  setDetecting(true);
                  navigator.geolocation?.getCurrentPosition(
                    p => { setLat(p.coords.latitude.toFixed(8)); setLng(p.coords.longitude.toFixed(8)); setDetecting(false); setMessage({ type: "success", text: "Location detected!" }); },
                    async () => {
                      try { const r = await fetch("https://ipapi.co/json/"); const d = await r.json(); if (d.latitude) { setLat(d.latitude.toFixed(8)); setLng(d.longitude.toFixed(8)); setDetecting(false); setMessage({ type: "success", text: "Location via IP." }); return; } } catch {}
                      setDetecting(false); setMessage({ type: "error", text: "Could not detect location." });
                    },
                    { timeout: 10000 }
                  );
                }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 20px", borderRadius: 12, background: "#f0f9ff", border: "1.5px solid #dbeafe", color: "#61A9E5", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                  {detecting ? <span style={{ width: 15, height: 15, border: "2px solid #dbeafe", borderTopColor: "#61A9E5", borderRadius: "50%", display: "inline-block" }} className="spin" /> : <LocateFixed size={15} />}
                  {language === "kh" ? "រកទីតាំងដោយស្វ័យប្រវត្តិ" : "Auto-Detect Location"}
                </button>
                <div style={{ padding: "12px 14px", background: "#f0f9ff", borderRadius: 12, border: "1px solid #dbeafe", display: "flex", gap: 8, fontSize: 12, color: "#334155" }}>
                  <Info size={14} style={{ color: "#61A9E5", flexShrink: 0, marginTop: 1 }} />
                  {language === "kh" ? "ប្រើ Google Maps ដើម្បីស្វែងរកកូអរដោនេរបស់អ្នក។" : "Use Google Maps to find your exact coordinates, then paste them above."}
                </div>
              </div>
            </div>
          )}

          {/* ──── OPERATING HOURS TAB ──── */}
          {activeTab === "operating" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Toggle enabled={autoClose} setEnabled={setAutoClose} label={language === "kh" ? "ម៉ោងធ្វើការ" : "Enable Operating Hours"} desc={language === "kh" ? "ម៉ឺនុយនឹងបិទដោយស្វ័យប្រវត្តិ" : "Menu switches to view-only outside these hours."} />
              <div style={{ opacity: autoClose ? 1 : .4, pointerEvents: autoClose ? "all" : "none", display: "flex", flexDirection: "column", gap: 14, transition: "opacity .2s" }}>
                <div className="two-col">
                  <Fi label={language === "kh" ? "ម៉ោងបើក" : "Opening Time"} value={openTime} onChange={setOpenTime} icon={<Clock size={15} />} type="time" />
                  <Fi label={language === "kh" ? "ម៉ោងបិទ" : "Closing Time"} value={closeTime} onChange={setCloseTime} icon={<Clock size={15} />} type="time" />
                </div>
                <div style={{ padding: "12px 14px", background: "#f0f9ff", borderRadius: 12, border: "1px solid #dbeafe", display: "flex", gap: 8, fontSize: 12, color: "#334155" }}>
                  <Info size={14} style={{ color: "#61A9E5", flexShrink: 0, marginTop: 1 }} />
                  {language === "kh"
                    ? "ម៉ឺនុយនឹងប្តូរទៅរបៀប \"មើលតែ\" ដោយស្វ័យប្រវត្តិ"
                    : `Menu will automatically switch to "View Only" outside ${openTime} – ${closeTime}.`}
                </div>
              </div>
            </div>
          )}

          {/* ──── TABLES TAB ──── */}
          {activeTab === "tables" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>{language === "kh" ? "ផែនទីតុ" : "Table Map & QR Builder"}</p>
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>{language === "kh" ? "ចុចលើតុដើម្បីទទួល QR Code" : "Click a table to get its QR code. Drag to rearrange."}</p>
                </div>
                <button onClick={addTable} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 11, background: "#61A9E5", color: "white", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                  <Plus size={15} />{language === "kh" ? "បន្ថែមតុ" : "Add Table"}
                </button>
              </div>

              <div ref={canvasRef} className="table-canvas" style={{ flex: 1, minHeight: 280, background: "white", borderRadius: 18, border: "2px dashed #bae6fd", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {tables.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#94a3b8" }}>
                    <LayoutGrid size={40} style={{ color: "#dbeafe", margin: "0 auto 10px", display: "block" }} />
                    <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{language === "kh" ? "មិនទាន់មានតុ" : "No tables yet. Click Add Table."}</p>
                  </div>
                ) : (
                  <div style={{ position: "absolute", inset: 0 }}>
                    {tables.map(table => {
                      const isActive = activeTables.has(table.name);
                      return (
                        <div key={table.id}
                          onMouseDown={e => { e.preventDefault(); setDraggingTableId(table.id); setIsDragging(false); }}
                          onTouchStart={e => { e.preventDefault(); setDraggingTableId(table.id); setIsDragging(false); }}
                          onMouseUp={() => handleTableClick(table)}
                          onTouchEnd={() => handleTableClick(table)}
                          style={{ position: "absolute", left: `${table.x}%`, top: `${table.y}%`, width: 80, height: 80, borderRadius: 16, background: isActive ? "#f0fdf4" : "white", border: `2px solid ${draggingTableId === table.id ? "#61A9E5" : isActive ? "#22c55e" : "#dbeafe"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "move", userSelect: "none", touchAction: "none", boxShadow: "0 2px 10px rgba(97,169,229,.1)", zIndex: draggingTableId === table.id ? 50 : 1, transform: draggingTableId === table.id ? "scale(1.06)" : "scale(1)", transition: "transform .1s, border-color .15s" }}>
                          {isActive && <div style={{ position: "absolute", top: -4, left: -4, width: 12, height: 12, borderRadius: "50%", background: "#22c55e", border: "2px solid white", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />}
                          <span style={{ fontSize: 10, fontWeight: 800, color: isActive ? "#166534" : "#0f172a", marginBottom: 4 }}>{table.name}</span>
                          <QrCode size={26} style={{ color: isActive ? "#22c55e" : "#bae6fd" }} />
                          <button onClick={e => { e.stopPropagation(); setTables(tables.filter(t => t.id !== table.id)); }} style={{ position: "absolute", top: -8, right: -8, width: 20, height: 20, borderRadius: "50%", background: "#ef4444", color: "white", border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: 0.85 }}>
                            <X size={10} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#94a3b8" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />Active order
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#dbeafe", marginLeft: 8 }} />Available
              </div>
            </div>
          )}

          {/* ──── TELEGRAM TAB ──── */}
          {activeTab === "telegram" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px", background: "white", borderRadius: 16, border: "1px solid #e0f2fe" }}>
                <div style={{ width: 60, height: 60, borderRadius: 18, background: "linear-gradient(135deg,#60a5fa,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <MessageSquare size={28} style={{ color: "white" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 3px" }}>{language === "kh" ? "តភ្ជាប់ជាមួយ Telegram" : "Connect with Telegram"}</p>
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>{language === "kh" ? "ទទួលបានវិក្កយបត្រតាម Telegram" : "Receive invoices via Telegram when orders complete."}</p>
                </div>
                {telegramQrCodeUrl && (
                  <a href="https://t.me/scannowverification_bot" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                    <div style={{ padding: "10px", background: "#f8fafc", borderRadius: 14, border: "1px solid #e2e8f0", textAlign: "center" }}>
                      <img src={telegramQrCodeUrl} alt="Telegram QR" style={{ width: 80, height: 80, display: "block" }} />
                      <p style={{ fontSize: 10, color: "#94a3b8", margin: "5px 0 0", fontWeight: 600 }}>{language === "kh" ? "ស្កេន Telegram" : "Scan to open bot"}</p>
                    </div>
                  </a>
                )}
              </div>

              <Fi label="Telegram Chat ID" value={telegramChatId} onChange={setTelegramChatId} icon={<MessageSquare size={15} />} placeholder="e.g. 123456789" />

              <div style={{ padding: "12px 14px", background: "#eff6ff", borderRadius: 12, border: "1px solid #dbeafe", display: "flex", gap: 8, fontSize: 12, color: "#1d4ed8" }}>
                <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                {language === "kh"
                  ? "សូមចាប់ផ្តើមជជែកជាមួយ @scannowverification_bot ហើយ Bot នឹងផ្ញើ Chat ID!"
                  : "Chat with @scannowverification_bot and the bot will send you your Chat ID!"}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ════ QR CODE MODAL ════ */}
      {showQrModal && selectedTable && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowQrModal(false); }}>
          <div className="modal-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px 14px", borderBottom: "1px solid #f0f9ff" }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: 0 }}>{selectedTable.name} QR Code</h2>
                <p style={{ fontSize: 11.5, color: "#94a3b8", margin: "2px 0 0" }}>Scan to order from this table</p>
              </div>
              <button onClick={() => setShowQrModal(false)} style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #dbeafe", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}><X size={15} /></button>
            </div>
            <div style={{ padding: "20px 22px 22px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              {qrCodeUrl && <img src={qrCodeUrl} alt="QR" style={{ width: 200, height: 200, borderRadius: 16, border: "1px solid #dbeafe", padding: 10, background: "white" }} />}
              <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0 }}>{selectedTable.name}</p>
              <button onClick={downloadQrCode} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "12px", borderRadius: 13, background: "linear-gradient(135deg,#61A9E5,#2e9be0)", color: "white", fontWeight: 700, fontSize: 13.5, border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                <Download size={16} />Download QR Code
              </button>
              <button onClick={() => setShowQrModal(false)} style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ════ DELETE CONFIRM MODAL ════ */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setShowDeleteConfirm(false); setDeleteConfirmText(""); } }}>
          <div className="modal-card">
            <div style={{ padding: "28px 24px 24px", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <AlertCircle size={26} style={{ color: "#ef4444" }} />
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 900, color: "#0f172a", margin: "0 0 6px" }}>{language === "kh" ? "តើអ្នកប្រាកដ?" : "Delete Account?"}</h2>
              <p style={{ fontSize: 12.5, color: "#94a3b8", margin: "0 0 16px" }}>{language === "kh" ? "នេះមិនអាចត្រឡប់វិញបានទេ។" : "This action cannot be undone."}</p>
              <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 10px" }}>{language === "kh" ? "វាយ \"លុបគណនី\" ដើម្បីបញ្ជាក់" : `Type "delete account" to confirm`}</p>
              <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder={language === "kh" ? "លុបគណនី" : "delete account"} autoFocus
                style={{ width: "100%", border: "1.5px solid #fecaca", borderRadius: 11, padding: "9px 12px", fontSize: 13, marginBottom: 16, fontFamily: "'DM Sans',sans-serif", outline: "none" }} />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }} style={{ flex: 1, height: 44, borderRadius: 12, border: "1.5px solid #dbeafe", background: "white", color: "#475569", fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Cancel</button>
                <button onClick={handleDelete} disabled={deleting || deleteConfirmText.toLowerCase() !== (language === "kh" ? "លុបគណនី" : "delete account")} style={{ flex: 1, height: 44, borderRadius: 12, background: "#ef4444", color: "white", fontWeight: 800, fontSize: 13.5, border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", opacity: (deleting || deleteConfirmText.toLowerCase() !== (language === "kh" ? "លុបគណនី" : "delete account")) ? .5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {deleting && <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "white", borderRadius: "50%", display: "inline-block" }} className="spin" />}
                  {language === "kh" ? "លុបឥឡូវ" : "Delete Now"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}