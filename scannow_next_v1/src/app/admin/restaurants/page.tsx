"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Store, CheckCircle2, AlertCircle, Eye, Trash2,
  MapPin, Users, X, Snowflake, Check, LogIn, Search, TrendingUp,
} from "lucide-react";
import {
  apiRequest, resolveAssetUrl, storeUser, storeRestaurant,
  getStoredAdminUser, storeImpersonatingAdmin,
} from "@/lib/api";

const P = {
  navy:"#0e3a52", blue:"#38B6FF", blueMid:"#61A9E5", blueLight:"#a8d8f0",
  bluePale:"#c8eef7", bgBase:"#EFFFFF", bgSurf:"#EAF9FF", white:"#ffffff",
  border:"#daf2fb", green:"#22c55e", greenBg:"#f0fdf4", greenText:"#15803d",
  cyanBg:"#ecfeff", cyanText:"#0891b2", redBg:"#fff0f0", redText:"#dc2626",
};

const StatCard = ({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) => (
  <div style={{ background: P.white, borderRadius: 16, border: `1.5px solid ${P.border}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 6px rgba(56,182,255,0.06)" }}>
    <div style={{ width: 42, height: 42, borderRadius: 12, background: P.bgSurf, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: accent }}>
      {icon}
    </div>
    <div>
      <p style={{ fontSize: 22, fontWeight: 800, color: P.navy, margin: 0, lineHeight: 1, letterSpacing: "-0.5px" }}>{value}</p>
      <p style={{ fontSize: 9, fontWeight: 700, color: P.blueMid, margin: "4px 0 0", textTransform: "uppercase", letterSpacing: "0.12em" }}>{label}</p>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = status === "active" ? { bg: P.greenBg, color: P.greenText, label: "Active" }
    : status === "frozen" ? { bg: P.cyanBg, color: P.cyanText, label: "Frozen" }
    : { bg: P.redBg, color: P.redText, label: status };
  return (
    <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
};

const ActionBtn = ({ onClick, title, disabled, color, children }: { onClick: () => void; title: string; disabled?: boolean; color: string; children: React.ReactNode }) => (
  <button onClick={onClick} disabled={disabled} title={title} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 9, border: `1.5px solid ${P.border}`, background: P.white, color, fontSize: 11, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, transition: "all 0.15s", fontFamily: "inherit", flexShrink: 0 }}>
    {children}<span>{title}</span>
  </button>
);

const Spin = () => (
  <div style={{ width: 13, height: 13, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
);

function MetaPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: P.bgSurf, border: `1px solid ${P.border}` }}>
      {icon}
      <span style={{ fontSize: 11, fontWeight: 600, color: P.navy }}>{label}</span>
    </div>
  );
}

function DeskIconBtn({ onClick, title, disabled, hoverColor, hoverBg, children }: { onClick: () => void; title: string; disabled?: boolean; hoverColor: string; hoverBg: string; children: React.ReactNode }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled} title={title} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: hov ? hoverBg : "transparent", color: hov ? hoverColor : P.blueLight, display: "flex", alignItems: "center", justifyContent: "center", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, transition: "all 0.15s", flexShrink: 0 }}>
      {children}
    </button>
  );
}

export default function RestaurantsAdmin() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [viewingRestaurant, setViewingRestaurant] = useState<any>(null);
  const [impersonatingId, setImpersonatingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const fetchRestaurants = async () => {
    try {
      const response = await apiRequest<any>("/admin/restaurants");
      setRestaurants(response.data);
    } catch (error) { console.error("Failed to fetch restaurants", error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRestaurants(); }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this restaurant? All menu items and data will be lost.")) return;
    setDeletingId(id);
    try {
      await apiRequest(`/admin/restaurants/${id}`, { method: "DELETE" });
      setRestaurants(restaurants.filter((r) => r.id !== id));
    } catch { alert("Failed to delete restaurant"); }
    finally { setDeletingId(null); }
  };

  const handleFreeze = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "frozen" : "active";
    if (!window.confirm(currentStatus === "active" ? "Freeze this restaurant? It will be temporarily suspended." : "Unfreeze this restaurant? It will become active again.")) return;
    setUpdatingStatusId(id);
    try {
      await apiRequest(`/admin/restaurants/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) });
      setRestaurants(restaurants.map((r) => r.id === id ? { ...r, status: newStatus } : r));
    } catch { alert("Failed to update restaurant status"); }
    finally { setUpdatingStatusId(null); }
  };

  const handleView = async (id: number) => {
    try {
      const response = await apiRequest<any>(`/admin/restaurants/${id}`);
      setViewingRestaurant(response.data);
    } catch { alert("Failed to load restaurant details"); }
  };

  const handleLoginAs = async (id: number) => {
    if (!confirm("Impersonate this restaurant owner?")) return;
    setImpersonatingId(id);
    try {
      const adminUser = getStoredAdminUser();
      if (adminUser) storeImpersonatingAdmin(adminUser);
      const response = await apiRequest<any>(`/admin/restaurants/${id}/impersonate`, { method: "POST" });
      storeUser(response.user);
      storeRestaurant(response.restaurant);
      router.push("/dashboard");
    } catch { alert("Failed to impersonate user"); }
    finally { setImpersonatingId(null); }
  };

  const filtered = restaurants.filter(
    (r) => r.name?.toLowerCase().includes(search.toLowerCase()) || r.owner?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: P.bgBase, fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif", fontSize: 13, fontWeight: 700, color: P.blueMid, gap: 12, flexDirection: "column" }}>
        <div style={{ width: 30, height: 30, border: `3px solid ${P.bluePale}`, borderTopColor: P.blue, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        Loading restaurants…
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans','DM Sans','Segoe UI',sans-serif", background: P.bgBase, minHeight: "100vh", boxSizing: "border-box" }}>

      {/* ── Sticky Header ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: P.bgBase, borderBottom: `1px solid ${P.border}`, padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: P.navy, margin: 0, letterSpacing: "-0.4px" }}>Restaurants</h1>
            <p style={{ fontSize: 12, color: P.blueMid, margin: "2px 0 0", fontWeight: 500 }}>Manage all restaurants on your platform</p>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: `linear-gradient(135deg, ${P.navy}, ${P.blue})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Store size={19} color={P.white} />
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: P.blueLight, pointerEvents: "none" }} />
          <input type="text" placeholder="Search by name or owner…" value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", paddingLeft: 36, paddingRight: 14, paddingTop: 10, paddingBottom: 10, background: P.white, border: `1.5px solid ${P.border}`, borderRadius: 12, fontSize: 13, fontWeight: 500, color: P.navy, outline: "none", fontFamily: "inherit", WebkitAppearance: "none" }} />
        </div>
      </div>

      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ── Stat cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <StatCard icon={<Store size={18} />}        label="Total"     value={restaurants.length.toString()}                                    accent={P.blue} />
          <StatCard icon={<CheckCircle2 size={18} />} label="Active"    value={restaurants.filter(r => r.status === "active").length.toString()} accent={P.green} />
          <StatCard icon={<Snowflake size={18} />}    label="Frozen"    value={restaurants.filter(r => r.status === "frozen").length.toString()} accent={P.blueMid} />
          <StatCard icon={<AlertCircle size={18} />}  label="Suspended" value="0"                                                                accent="#ef4444" />
        </div>

        {/* ── List/Table card ── */}
        <div style={{ background: P.white, borderRadius: 20, border: `1.5px solid ${P.border}`, overflow: "hidden", boxShadow: "0 2px 16px rgba(56,182,255,0.07)" }}>
          <div style={{ height: 3, background: `linear-gradient(90deg, ${P.navy}, ${P.blue}, ${P.blueMid})` }} />

          {/* MOBILE: card list */}
          <div className="mobile-list">
            {filtered.map((res, idx) => (
              <div key={res.id} style={{ padding: "14px 16px", borderTop: idx > 0 ? `1px solid ${P.border}` : "none", opacity: deletingId === res.id ? 0.4 : 1, pointerEvents: deletingId === res.id ? "none" : "auto", transition: "opacity 0.2s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 13, background: P.blue, display: "flex", alignItems: "center", justifyContent: "center", color: P.white, flexShrink: 0, boxShadow: "0 2px 8px rgba(56,182,255,0.3)" }}>
                    <Store size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: P.navy, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{res.name}</p>
                    <p style={{ fontSize: 10, fontWeight: 600, color: P.blueLight, margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.06em" }}>{res.joined}</p>
                  </div>
                  <StatusBadge status={res.status} />
                </div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
                  <MetaPill icon={<Users size={11} color={P.blueMid} />} label={res.owner} />
                  <MetaPill icon={<TrendingUp size={11} color={P.green} />} label={`${res.orders} orders`} />
                  <MetaPill icon={<span style={{ fontSize: 11, fontWeight: 800, color: P.blue }}>$</span>} label={`${Number(res.revenue).toLocaleString()}`} />
                </div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  <ActionBtn onClick={() => handleView(res.id)} title="View" color={P.blue}>
                    <Eye size={13} />
                  </ActionBtn>
                  <ActionBtn onClick={() => handleFreeze(res.id, res.status)} disabled={updatingStatusId === res.id} title={res.status === "active" ? "Freeze" : "Unfreeze"} color={res.status === "active" ? P.cyanText : P.greenText}>
                    {updatingStatusId === res.id ? <Spin /> : res.status === "active" ? <Snowflake size={13} /> : <Check size={13} />}
                  </ActionBtn>
                  {res.user && (
                    <ActionBtn onClick={() => handleLoginAs(res.id)} disabled={impersonatingId === res.id} title="Login As" color={P.greenText}>
                      {impersonatingId === res.id ? <Spin /> : <LogIn size={13} />}
                    </ActionBtn>
                  )}
                  <ActionBtn onClick={() => handleDelete(res.id)} title="Delete" color={P.redText}>
                    <Trash2 size={13} />
                  </ActionBtn>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: P.bgSurf, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: P.blueLight }}>
                  <Store size={24} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: P.blueLight, margin: 0 }}>No restaurants found.</p>
                <p style={{ fontSize: 12, color: P.bluePale, margin: "6px 0 0" }}>Try adjusting your search.</p>
              </div>
            )}
          </div>

          {/* DESKTOP: table */}
          <div className="desktop-table" style={{ display: "none" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: P.bgSurf }}>
                  {["Restaurant", "Owner", "Status", "Orders", "Revenue", "Actions"].map((h, i) => (
                    <th key={h} style={{ padding: "10px 16px", fontSize: 8.5, fontWeight: 800, color: P.blueMid, textTransform: "uppercase", letterSpacing: "0.14em", textAlign: i === 0 || i === 1 ? "left" : i === 5 ? "right" : "center", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((res) => (
                  <tr key={res.id} style={{ borderTop: `1px solid ${P.border}`, opacity: deletingId === res.id ? 0.4 : 1, transition: "background 0.12s" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = P.bgSurf)}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                  >
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: P.blue, display: "flex", alignItems: "center", justifyContent: "center", color: P.white, flexShrink: 0 }}><Store size={16} /></div>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 800, color: P.navy, margin: 0 }}>{res.name}</p>
                          <p style={{ fontSize: 9, fontWeight: 700, color: P.blueLight, margin: "1px 0 0", textTransform: "uppercase", letterSpacing: "0.08em" }}>{res.joined}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: 11.5, fontWeight: 600, color: P.navy }}>{res.owner}</td>
                    <td style={{ padding: "10px 16px", textAlign: "center" }}><StatusBadge status={res.status} /></td>
                    <td style={{ padding: "10px 16px", textAlign: "center", fontSize: 12, fontWeight: 700, color: P.navy }}>{res.orders}</td>
                    <td style={{ padding: "10px 16px", textAlign: "center", fontSize: 12, fontWeight: 800, color: P.navy }}>${Number(res.revenue).toLocaleString()}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
                        <DeskIconBtn onClick={() => handleView(res.id)} title="View Details" hoverColor={P.blue} hoverBg={P.bgSurf}><Eye size={14} /></DeskIconBtn>
                        <DeskIconBtn onClick={() => handleFreeze(res.id, res.status)} disabled={updatingStatusId === res.id} title={res.status === "active" ? "Freeze" : "Unfreeze"} hoverColor={res.status === "active" ? P.blueMid : P.green} hoverBg={res.status === "active" ? P.cyanBg : P.greenBg}>
                          {updatingStatusId === res.id ? <Spin /> : res.status === "active" ? <Snowflake size={14} /> : <Check size={14} />}
                        </DeskIconBtn>
                        {res.user && (
                          <DeskIconBtn onClick={() => handleLoginAs(res.id)} disabled={impersonatingId === res.id} title="Login As Owner" hoverColor={P.green} hoverBg={P.greenBg}>
                            {impersonatingId === res.id ? <Spin /> : <LogIn size={14} />}
                          </DeskIconBtn>
                        )}
                        <DeskIconBtn onClick={() => handleDelete(res.id)} title="Delete" hoverColor="#dc2626" hoverBg={P.redBg}><Trash2 size={14} /></DeskIconBtn>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", fontSize: 12, fontWeight: 600, color: P.blueLight }}>No restaurants found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── View Modal — bottom sheet on mobile, centered on desktop ── */}
      {viewingRestaurant && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", background: "rgba(14,58,82,0.4)", backdropFilter: "blur(4px)" }}>
          <div className="modal-sheet" style={{ background: P.white, width: "100%", borderRadius: "22px 22px 0 0", overflow: "hidden", boxShadow: "0 -8px 40px rgba(14,58,82,0.18)", border: `1.5px solid ${P.border}`, display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
            <div style={{ height: 3, background: `linear-gradient(90deg, ${P.navy}, ${P.blue}, ${P.blueMid})`, flexShrink: 0 }} />
            <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: P.bluePale }} />
            </div>
            <div style={{ padding: "10px 20px 14px", borderBottom: `1.5px solid ${P.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: P.blue, display: "flex", alignItems: "center", justifyContent: "center", color: P.white, boxShadow: "0 2px 8px rgba(56,182,255,0.3)" }}><Store size={19} /></div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: P.navy, margin: 0, letterSpacing: "-0.3px" }}>{viewingRestaurant.name}</h2>
                  <p style={{ fontSize: 9, fontWeight: 700, color: P.blueMid, margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.1em" }}>Restaurant Details</p>
                </div>
              </div>
              <button onClick={() => setViewingRestaurant(null)} style={{ width: 34, height: 34, borderRadius: 10, border: `1.5px solid ${P.border}`, background: P.bgSurf, color: P.blueMid, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={15} />
              </button>
            </div>
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", flex: 1, WebkitOverflowScrolling: "touch" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "Owner",    value: viewingRestaurant.user?.name,                         icon: <Users size={12} color={P.blue} /> },
                  { label: "Email",    value: viewingRestaurant.email || viewingRestaurant.user?.email },
                  { label: "Phone",    value: viewingRestaurant.phone || "No phone provided" },
                  { label: "Location", value: viewingRestaurant.address || "N/A",                    icon: <MapPin size={12} color="#ef4444" /> },
                ].map((f) => (
                  <div key={f.label} style={{ background: P.bgSurf, borderRadius: 12, padding: "11px 13px", border: `1.5px solid ${P.border}` }}>
                    <p style={{ fontSize: 9, fontWeight: 800, color: P.blueMid, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 5px" }}>{f.label}</p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: P.navy, margin: 0, display: "flex", alignItems: "center", gap: 5, wordBreak: "break-word" }}>{f.icon}{f.value}</p>
                  </div>
                ))}
              </div>
              <div>
                <p style={{ fontSize: 9, fontWeight: 800, color: P.blueMid, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 8px" }}>Description</p>
                <p style={{ fontSize: 13, color: P.navy, background: P.bgSurf, padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${P.border}`, margin: 0, fontStyle: "italic", lineHeight: 1.6 }}>
                  "{viewingRestaurant.description || "No description provided."}"
                </p>
              </div>
              {viewingRestaurant.menu_items?.length > 0 && (
                <div>
                  <p style={{ fontSize: 9, fontWeight: 800, color: P.blueMid, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 8px" }}>Menu Items ({viewingRestaurant.menu_items.length})</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {viewingRestaurant.menu_items.slice(0, 4).map((item: any, i: number) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: P.bgSurf, borderRadius: 12, border: `1.5px solid ${P.border}` }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: P.bluePale, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {item.image_url ? <img src={resolveAssetUrl(item.image_url)} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : <Store size={14} color={P.blueLight} />}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 11, fontWeight: 800, color: P.navy, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                          <p style={{ fontSize: 11, fontWeight: 700, color: P.blue, margin: "2px 0 0" }}>${item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding: "13px 20px", borderTop: `1.5px solid ${P.border}`, background: P.bgSurf, flexShrink: 0 }}>
              <button onClick={() => setViewingRestaurant(null)} style={{ width: "100%", padding: "13px", background: P.white, color: P.blueMid, border: `1.5px solid ${P.bluePale}`, borderRadius: 13, fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: ${P.blueLight}; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${P.bluePale}; border-radius: 99px; }

        /* Mobile default: card list visible, table hidden */
        .mobile-list   { display: block; }
        .desktop-table { display: none !important; }

        /* Desktop ≥768px: table visible, cards hidden */
        @media (min-width: 768px) {
          .mobile-list   { display: none !important; }
          .desktop-table { display: block !important; }
          .modal-overlay { align-items: center !important; padding: 24px; }
          .modal-sheet   {
            border-radius: 22px !important;
            max-width: 580px !important;
            margin: 0 auto;
            max-height: 88vh !important;
          }
        }
      `}</style>
    </div>
  );
}