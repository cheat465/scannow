"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users, UserPlus, Search, ShieldCheck, Mail, Trash2,
  Pencil, UserCircle, X, Lock, LogOut,
  UtensilsCrossed, Eye, AlertCircle, Crown, ChefHat,
} from "lucide-react";
import {
  apiRequest, ListResponse, ApiUser, getStoredRestaurantId,
  ItemResponse, getStoredRestaurant, Restaurant, resolveAssetUrl, clearSession,
} from "@/lib/api";

const ROLE_CONFIG = {
  owner:   { label: "Owner",   bg: "#f5f3ff", color: "#7c3aed", icon: <Crown size={11} /> },
  manager: { label: "Manager", bg: "#eff6ff", color: "#61A9E5", icon: <ShieldCheck size={11} /> },
  staff:   { label: "Staff",   bg: "#f0fdf4", color: "#22c55e", icon: <ChefHat size={11} /> },
} as const;

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role?.toLowerCase() as keyof typeof ROLE_CONFIG] ?? { label: role || "—", bg: "#f8fafc", color: "#64748b", icon: null };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 99, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700, textTransform: "capitalize" }}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function Avatar({ name, size = 38 }: { name: string; size?: number }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  const hue = name.charCodeAt(0) * 37 % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `hsl(${hue},55%,88%)`, color: `hsl(${hue},55%,40%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 800, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

/* ── Shared Modal Shell ── */
function ModalShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-card">
        {/* Mobile drag handle */}
        <div className="flex sm:hidden justify-center pt-3 pb-1">
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "#e2e8f0" }} />
        </div>
        {children}
      </div>
    </div>
  );
}

export default function UsersManagement() {
  const router = useRouter();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "staff" });
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: "", email: "", password: "", role: "staff" });
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);

  const handleLogout = () => { clearSession(); router.push("/auth/login"); };

  useEffect(() => { setRestaurant(getStoredRestaurant()); }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const restaurantId = getStoredRestaurantId();
      const url = restaurantId ? `/admin/restaurant-users?restaurant_id=${restaurantId}` : "/admin/restaurant-users";
      const response = await apiRequest<ListResponse<ApiUser>>(url);
      setUsers(response.data);
    } catch { setError("Failed to load users. Please ensure you have owner permissions."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setIsSaving(true);
    try {
      const restaurantId = getStoredRestaurantId();
      if (!restaurantId) throw new Error("No restaurant context found.");
      await apiRequest<ItemResponse<ApiUser>>("/admin/restaurant-users", { method: "POST", body: JSON.stringify({ ...formData, restaurant_id: restaurantId }) });
      setFormData({ name: "", email: "", password: "", role: "staff" });
      setIsModalOpen(false); fetchUsers();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to create user."); }
    finally { setIsSaving(false); }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setIsSaving(true);
    try {
      if (!editUserId) return;
      const body: Record<string, string> = { name: editFormData.name, email: editFormData.email, role: editFormData.role };
      if (editFormData.password) body.password = editFormData.password;
      await apiRequest<ItemResponse<ApiUser>>(`/admin/restaurant-users/${editUserId}`, { method: "PATCH", body: JSON.stringify(body) });
      setEditModalOpen(false); setEditUserId(null); fetchUsers();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to update user."); }
    finally { setIsSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteUserId) return; setIsSaving(true);
    try {
      await apiRequest(`/admin/restaurant-users/${deleteUserId}`, { method: "DELETE" });
      setDeleteConfirmOpen(false); setDeleteUserId(null); fetchUsers();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to delete user."); }
    finally { setIsSaving(false); }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ownerCount   = users.filter(u => u.role === "owner").length;
  const managerCount = users.filter(u => u.role === "manager").length;
  const staffCount   = users.filter(u => u.role === "staff").length;

  const ROLE_OPTS = [
    { value: "owner",   label: "Owner",         color: "#7c3aed", activeBg: "#f5f3ff" },
    { value: "manager", label: "Manager",        color: "#61A9E5", activeBg: "#eff6ff" },
    { value: "staff",   label: "Kitchen Staff",  color: "#22c55e", activeBg: "#f0fdf4" },
  ];

  return (
    <div style={{ minHeight: "100dvh", background: "#EAF9FF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }

        .fi {
          width: 100%; background: white; border: 1.5px solid #dbeafe;
          border-radius: 11px; padding: 10px 14px; color: #0f172a;
          font-size: 13.5px; font-family: 'DM Sans', sans-serif; outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .fi:focus { border-color: #61A9E5; box-shadow: 0 0 0 3px rgba(97,169,229,.12); }
        .fi::placeholder { color: #94a3b8; }
        .fi-icon-wrap { position: relative; }
        .fi-icon-wrap .fi { padding-left: 38px; }
        .fi-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }

        .flbl { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 6px; display: block; }

        .stat-card {
          background: white; border-radius: 16px; border: 1px solid #e0f2fe;
          padding: 13px 14px; display: flex; align-items: center; gap: 11px;
          transition: box-shadow .15s, transform .15s;
        }
        .stat-card:hover { box-shadow: 0 4px 20px rgba(97,169,229,.13); transform: translateY(-1px); }

        /* Desktop table rows */
        .tbl-row { border-bottom: 1px solid #f0f9ff; transition: background .1s; }
        .tbl-row:hover { background: #f8feff; }
        .tbl-row:last-child { border-bottom: none; }

        /* Mobile user card */
        .user-card {
          background: white; border-radius: 16px; border: 1px solid #e0f2fe;
          padding: 14px; transition: box-shadow .15s;
          box-shadow: 0 1px 8px rgba(97,169,229,.05);
        }
        .user-card:active { box-shadow: 0 3px 14px rgba(97,169,229,.15); }

        .act-btn {
          width: 34px; height: 34px; border-radius: 9px; display: flex;
          align-items: center; justify-content: center; border: none; cursor: pointer;
          transition: background .15s, transform .1s; flex-shrink: 0;
        }
        .act-btn:hover { transform: translateY(-1px); }

        .primary-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: linear-gradient(135deg, #61A9E5, #2e9be0); color: white;
          font-weight: 800; font-size: 14px; border: none; border-radius: 13px;
          padding: 12px 24px; cursor: pointer; font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 14px rgba(97,169,229,.3); transition: opacity .15s, transform .1s; width: 100%;
        }
        .primary-btn:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
        .primary-btn:disabled { opacity: .5; cursor: not-allowed; transform: none; }

        .ghost-btn {
          display: flex; align-items: center; justify-content: center;
          border: 1.5px solid #dbeafe; background: white; color: #475569;
          font-weight: 700; font-size: 14px; border-radius: 13px;
          padding: 12px 24px; cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: background .15s; width: 100%;
        }
        .ghost-btn:hover { background: #f0f9ff; }

        /* Modal: bottom sheet on mobile, centered card on sm+ */
        .modal-overlay {
          position: fixed; inset: 0; z-index: 50;
          display: flex; align-items: flex-end; justify-content: center;
          background: rgba(15,23,42,.4); backdrop-filter: blur(4px);
          animation: fIn .2s ease;
        }
        @media (min-width: 640px) {
          .modal-overlay { align-items: center; padding: 16px; }
        }
        .modal-card {
          width: 100%; max-height: 92dvh; background: white;
          border-radius: 24px 24px 0 0; overflow: hidden;
          box-shadow: 0 -8px 40px rgba(0,0,0,.12);
          display: flex; flex-direction: column;
          animation: sUp .22s ease;
        }
        @media (min-width: 640px) {
          .modal-card { max-width: 460px; border-radius: 24px; max-height: 90vh; box-shadow: 0 24px 60px rgba(0,0,0,.12); }
        }
        @keyframes fIn { from{opacity:0} to{opacity:1} }
        @keyframes sUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }

        /* FAB */
        .fab {
          position: fixed; bottom: 20px; right: 16px; z-index: 30;
          width: 52px; height: 52px; border-radius: 50%;
          background: linear-gradient(135deg, #61A9E5, #2e9be0);
          color: white; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 6px 20px rgba(97,169,229,.45);
          transition: transform .15s;
        }
        .fab:active { transform: scale(.94); }

        .spin { animation: spin .7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
        .pulse { animation: pulse 1.5s ease-in-out infinite; }

        .no-sb::-webkit-scrollbar { display: none; }
        .no-sb { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 14px 80px" }} className="sm:px-7 sm:py-6 sm:pb-12">

        {/* ── Sticky Header ── */}
        <header style={{
          position: "sticky", top: 0, zIndex: 20,
          background: "rgba(234,249,255,.94)", backdropFilter: "blur(10px)",
          marginLeft: -14, marginRight: -14, padding: "12px 14px",
          marginBottom: 16, borderBottom: "1px solid rgba(186,230,253,.5)"
        }} className="sm:static sm:mb-6 sm:border-0 sm:backdrop-blur-none sm:bg-transparent sm:px-0 sm:py-0">

          {/* Desktop header */}
          <div className="hidden sm:flex" style={{ alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Users size={20} style={{ color: "#61A9E5" }} />
              </div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", margin: 0 }}>User Management</h1>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Manage restaurant roles and team permissions.</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setIsModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: 7, background: "linear-gradient(135deg,#61A9E5,#2e9be0)", color: "white", padding: "9px 18px", borderRadius: 12, fontSize: 13.5, fontWeight: 700, border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(97,169,229,.3)", fontFamily: "'DM Sans',sans-serif" }}>
                <UserPlus size={16} />Add User
              </button>
              {/* Profile */}
              <div style={{ position: "relative" }}>
                <button type="button" onClick={() => setProfileOpen(v => !v)} style={{ width: 38, height: 38, borderRadius: "50%", border: "2px solid #dbeafe", background: "#f0f9ff", overflow: "hidden", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {restaurant?.logo_url ? <img src={resolveAssetUrl(restaurant.logo_url)} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.currentTarget.style.display = "none"; }} /> : <UtensilsCrossed size={18} style={{ color: "#61A9E5" }} />}
                </button>
                {profileOpen && (
                  <div style={{ position: "absolute", right: 0, top: 46, zIndex: 30, width: 250, background: "white", borderRadius: 16, border: "1px solid #dbeafe", padding: 16, boxShadow: "0 8px 30px rgba(97,169,229,.15)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: "50%", overflow: "hidden", border: "1px solid #dbeafe", background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {restaurant?.logo_url ? <img src={resolveAssetUrl(restaurant.logo_url)} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <UtensilsCrossed size={18} style={{ color: "#61A9E5" }} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{restaurant?.name || "Your restaurant"}</p>
                        <p style={{ fontSize: 11.5, color: "#94a3b8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{restaurant?.email || "No email"}</p>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                      <Link href="/page/about-restaurant" style={{ borderRadius: 9, border: "1.5px solid #dbeafe", padding: "7px 0", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#334155", textDecoration: "none" }}>View</Link>
                      <Link href="/page/about-restaurant" style={{ borderRadius: 9, background: "#61A9E5", padding: "7px 0", textAlign: "center", fontSize: 12, fontWeight: 700, color: "white", textDecoration: "none" }}>Edit</Link>
                    </div>
                    <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "8px 0", borderRadius: 9, border: "1px solid #fecaca", background: "#fef2f2", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                      <LogOut size={13} />Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile header */}
          <div className="flex sm:hidden" style={{ alignItems: "center", gap: 8 }}>
            {searchOpen ? (
              /* Expanded search */
              <>
                <div style={{ flex: 1, position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                  <input autoFocus type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search name or email…"
                    style={{ width: "100%", background: "white", border: "1.5px solid #61A9E5", borderRadius: 12, padding: "9px 14px 9px 34px", fontSize: 13.5, color: "#0f172a", fontFamily: "'DM Sans',sans-serif", outline: "none", boxShadow: "0 0 0 3px rgba(97,169,229,.12)" }} />
                </div>
                <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} style={{ padding: 8, background: "none", border: "none", cursor: "pointer", color: "#64748b", flexShrink: 0 }}><X size={18} /></button>
              </>
            ) : (
              <>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Users size={17} style={{ color: "#61A9E5" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h1 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: 0 }}>User Management</h1>
                  <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>{users.length} team member{users.length !== 1 ? "s" : ""}</p>
                </div>
                <button onClick={() => setSearchOpen(true)} style={{ width: 34, height: 34, borderRadius: 10, border: "1.5px solid #dbeafe", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                  <Search size={15} style={{ color: "#61A9E5" }} />
                </button>
                {/* Profile */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <button type="button" onClick={() => setProfileOpen(v => !v)} style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid #dbeafe", background: "#f0f9ff", overflow: "hidden", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {restaurant?.logo_url ? <img src={resolveAssetUrl(restaurant.logo_url)} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.currentTarget.style.display = "none"; }} /> : <UtensilsCrossed size={14} style={{ color: "#61A9E5" }} />}
                  </button>
                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                      <div style={{ position: "fixed", right: 12, top: 62, zIndex: 20, width: 240, background: "white", borderRadius: 16, border: "1px solid #dbeafe", padding: 14, boxShadow: "0 8px 30px rgba(97,169,229,.15)" }}>
                        <p style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{restaurant?.name || "Your restaurant"}</p>
                        <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{restaurant?.email || "No email"}</p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 8 }}>
                          <Link href="/page/about-restaurant" style={{ borderRadius: 9, border: "1.5px solid #dbeafe", padding: "6px 0", textAlign: "center", fontSize: 11.5, fontWeight: 600, color: "#334155", textDecoration: "none" }}>View</Link>
                          <Link href="/page/about-restaurant" style={{ borderRadius: 9, background: "#61A9E5", padding: "6px 0", textAlign: "center", fontSize: 11.5, fontWeight: 700, color: "white", textDecoration: "none" }}>Edit</Link>
                        </div>
                        <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "7px 0", borderRadius: 9, border: "1px solid #fecaca", background: "#fef2f2", color: "#ef4444", fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                          <LogOut size={12} />Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </header>

        {/* ── Stat Cards — 3-col always, compact on mobile ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }} className="sm:gap-3 sm:mb-6">
          {[
            { icon: <Crown size={17} />,       label: "Owners",   value: ownerCount,   iconBg: "#f5f3ff", iconColor: "#7c3aed" },
            { icon: <ShieldCheck size={17} />, label: "Managers", value: managerCount, iconBg: "#dbeafe", iconColor: "#61A9E5" },
            { icon: <ChefHat size={17} />,     label: "Staff",    value: staffCount,   iconBg: "#dcfce7", iconColor: "#22c55e" },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ padding: "11px 12px", gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: s.iconBg, color: s.iconColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#94a3b8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</p>
                <p style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: 0, lineHeight: 1.2 }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Table / Card container ── */}
        <div style={{ background: "white", borderRadius: 20, border: "1px solid #e0f2fe", overflow: "hidden", boxShadow: "0 2px 16px rgba(97,169,229,.06)" }}>

          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid #f0f9ff", gap: 10 }} className="sm:px-5 sm:py-4">
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0 }} className="sm:text-[15px]">Team Members</h3>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{filteredUsers.length} member{filteredUsers.length !== 1 ? "s" : ""}</p>
            </div>
            {/* Desktop search */}
            <div className="hidden sm:block" style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search name or email…"
                style={{ background: "#f8feff", border: "1.5px solid #dbeafe", borderRadius: 11, padding: "8px 14px 8px 36px", fontSize: 13, color: "#0f172a", outline: "none", width: 240, fontFamily: "'DM Sans',sans-serif" }}
                onFocus={e => e.target.style.borderColor = "#61A9E5"} onBlur={e => e.target.style.borderColor = "#dbeafe"} />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ margin: "0 14px 4px", padding: "10px 13px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 13, color: "#dc2626", display: "flex", alignItems: "center", gap: 8 }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />{error}
            </div>
          )}

          {/* ═══ DESKTOP TABLE (sm+) ═══ */}
          <div className="hidden sm:block" style={{ overflowX: "auto", overflowY: "auto", maxHeight: "60vh" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
              <thead style={{ position: "sticky", top: 0, background: "#f8feff", zIndex: 1 }}>
                <tr style={{ background: "#f8feff" }}>
                  {["Member", "Role", "Email", "Status", "Actions"].map((h, i) => (
                    <th key={h} style={{ padding: "11px 20px", textAlign: i === 4 ? "right" : "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#94a3b8", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1,2,3,4].map(i => (
                    <tr key={i} className="tbl-row">
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#f0f9ff" }} className="pulse" />
                          <div style={{ height: 14, width: 120, borderRadius: 6, background: "#f0f9ff" }} className="pulse" />
                        </div>
                      </td>
                      {[1,2,3,4].map(j => <td key={j} style={{ padding: "14px 20px" }}><div style={{ height: 12, width: 80, borderRadius: 6, background: "#f0f9ff" }} className="pulse" /></td>)}
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: "52px 0", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                    <UserCircle size={32} style={{ color: "#bae6fd", margin: "0 auto 10px", display: "block" }} />
                    {searchQuery ? "No users match your search." : "No team members yet."}
                  </td></tr>
                ) : filteredUsers.map(user => (
                  <tr key={user.id} className="tbl-row">
                    <td style={{ padding: "13px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={user.name} size={38} />
                        <div>
                          <p style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", margin: 0 }}>{user.name}</p>
                          <p style={{ fontSize: 11.5, color: "#94a3b8", margin: 0 }}>ID #{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "13px 20px" }}><RoleBadge role={user.role || ""} /></td>
                    <td style={{ padding: "13px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Mail size={13} style={{ color: "#94a3b8", flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: "#334155" }}>{user.email}</span>
                      </div>
                    </td>
                    <td style={{ padding: "13px 20px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, background: "#f0fdf4", color: "#22c55e", fontSize: 11.5, fontWeight: 700 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                        {user.status || "Active"}
                      </span>
                    </td>
                    <td style={{ padding: "13px 20px" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button className="act-btn" style={{ background: "#f0f9ff", color: "#61A9E5" }} title="View" onClick={() => { setSelectedUser(user); setViewModalOpen(true); }}><Eye size={15} /></button>
                        <button className="act-btn" style={{ background: "#f0f9ff", color: "#61A9E5" }} title="Edit" onClick={() => { setEditUserId(user.id); setEditFormData({ name: user.name, email: user.email, password: "", role: user.role || "staff" }); setEditModalOpen(true); }}><Pencil size={15} /></button>
                        <button className="act-btn" style={{ background: "#fef2f2", color: "#ef4444" }} title="Delete" onClick={() => { setDeleteUserId(user.id); setDeleteConfirmOpen(true); }}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ═══ MOBILE CARDS (< sm) ═══ */}
          <div className="flex flex-col sm:hidden" style={{ padding: "10px 12px 14px", gap: 10, maxHeight: "65vh", overflowY: "auto" }}>
            {loading ? (
              [1,2,3].map(i => (
                <div key={i} style={{ background: "#f8feff", borderRadius: 14, padding: "14px", border: "1px solid #e0f2fe" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#f0f9ff" }} className="pulse" />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 14, width: "60%", borderRadius: 6, background: "#f0f9ff", marginBottom: 6 }} className="pulse" />
                      <div style={{ height: 11, width: "40%", borderRadius: 6, background: "#f0f9ff" }} className="pulse" />
                    </div>
                  </div>
                </div>
              ))
            ) : filteredUsers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8", fontSize: 14 }}>
                <UserCircle size={32} style={{ color: "#bae6fd", margin: "0 auto 10px", display: "block" }} />
                {searchQuery ? "No users match your search." : "No team members yet. Tap + to add one."}
              </div>
            ) : filteredUsers.map(user => (
              <div key={user.id} className="user-card">
                {/* Top row: avatar + name + role badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <Avatar name={user.name} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                      <RoleBadge role={user.role || ""} />
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 99, background: "#f0fdf4", color: "#22c55e", fontSize: 10.5, fontWeight: 700 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }} />
                        {user.status || "Active"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Email row */}
                <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 10px", background: "#f8feff", borderRadius: 10, marginBottom: 10, border: "1px solid #f0f9ff" }}>
                  <Mail size={13} style={{ color: "#94a3b8", flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</span>
                </div>

                {/* Action buttons */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 }}>
                  <button
                    onClick={() => { setSelectedUser(user); setViewModalOpen(true); }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 0", borderRadius: 10, border: "1.5px solid #dbeafe", background: "#f0f9ff", color: "#61A9E5", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}
                  >
                    <Eye size={14} />View
                  </button>
                  <button
                    onClick={() => { setEditUserId(user.id); setEditFormData({ name: user.name, email: user.email, password: "", role: user.role || "staff" }); setEditModalOpen(true); }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 0", borderRadius: 10, border: "1.5px solid #dbeafe", background: "#f0f9ff", color: "#61A9E5", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}
                  >
                    <Pencil size={14} />Edit
                  </button>
                  <button
                    onClick={() => { setDeleteUserId(user.id); setDeleteConfirmOpen(true); }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 0", borderRadius: 10, border: "1.5px solid #fecaca", background: "#fef2f2", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}
                  >
                    <Trash2 size={14} />Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Mobile FAB */}
      <button className="fab sm:hidden" onClick={() => setIsModalOpen(true)} aria-label="Add user">
        <UserPlus size={22} />
      </button>

      {/* ════ Add User Modal ════ */}
      {isModalOpen && (
        <ModalShell onClose={() => setIsModalOpen(false)}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 14px", borderBottom: "1px solid #f0f9ff", flexShrink: 0 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: 0 }}>Add Team Member</h2>
              <p style={{ fontSize: 11.5, color: "#94a3b8", margin: "2px 0 0" }}>Create a new account for your team.</p>
            </div>
            <button onClick={() => setIsModalOpen(false)} style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #dbeafe", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b", flexShrink: 0 }}><X size={15} /></button>
          </div>
          <form onSubmit={handleAddUser} style={{ flex: 1, overflowY: "auto", padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div><label className="flbl">Full Name</label><input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Preap Sovath" className="fi" /></div>
            <div><label className="flbl">Email Address</label><input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="preapsovath@gmail.com" className="fi" /></div>
            <div>
              <label className="flbl">Temporary Password</label>
              <div className="fi-icon-wrap"><Lock size={14} className="fi-icon" /><input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Min. 6 characters" className="fi" /></div>
            </div>
            <div>
              <label className="flbl">Role</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {ROLE_OPTS.filter(r => r.value !== "owner").map(r => (
                  <button key={r.value} type="button" onClick={() => setFormData({...formData, role: r.value})} style={{ padding: "10px 0", borderRadius: 11, border: `1.5px solid ${formData.role === r.value ? r.color : "#dbeafe"}`, background: formData.role === r.value ? r.activeBg : "white", color: formData.role === r.value ? r.color : "#64748b", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all .15s" }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={isSaving} className="primary-btn" style={{ marginTop: 4 }}>
              {isSaving ? <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.35)", borderTopColor: "white", borderRadius: "50%", display: "inline-block" }} className="spin" />Creating…</> : <><UserPlus size={15} />Create Account</>}
            </button>
          </form>
        </ModalShell>
      )}

      {/* ════ View User Modal ════ */}
      {viewModalOpen && selectedUser && (
        <ModalShell onClose={() => setViewModalOpen(false)}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 14px", borderBottom: "1px solid #f0f9ff", flexShrink: 0 }}>
            <h2 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: 0 }}>User Details</h2>
            <button onClick={() => setViewModalOpen(false)} style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #dbeafe", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}><X size={15} /></button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px", background: "#f8feff", borderRadius: 14, border: "1px solid #e0f2fe" }}>
              <Avatar name={selectedUser.name} size={52} />
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedUser.name}</p>
                <p style={{ fontSize: 12.5, color: "#64748b", margin: "3px 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedUser.email}</p>
                <RoleBadge role={selectedUser.role || ""} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Last Login", value: selectedUser.last_login || "N/A" },
                { label: "Status",     value: selectedUser.status || "Active" },
              ].map(item => (
                <div key={item.label} style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                  <p style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 4px" }}>{item.label}</p>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", margin: 0 }}>{item.value}</p>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button className="ghost-btn" style={{ fontSize: 13 }} onClick={() => { setViewModalOpen(false); setEditUserId(selectedUser.id); setEditFormData({ name: selectedUser.name, email: selectedUser.email, password: "", role: selectedUser.role || "staff" }); setEditModalOpen(true); }}>Edit User</button>
              <button className="primary-btn" style={{ fontSize: 13 }} onClick={() => setViewModalOpen(false)}>Close</button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* ════ Edit User Modal ════ */}
      {editModalOpen && (
        <ModalShell onClose={() => setEditModalOpen(false)}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 14px", borderBottom: "1px solid #f0f9ff", flexShrink: 0 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: 0 }}>Edit User</h2>
              <p style={{ fontSize: 11.5, color: "#94a3b8", margin: "2px 0 0" }}>Update account information.</p>
            </div>
            <button onClick={() => setEditModalOpen(false)} style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #dbeafe", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}><X size={15} /></button>
          </div>
          <form onSubmit={handleSaveEdit} style={{ flex: 1, overflowY: "auto", padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div><label className="flbl">Full Name</label><input type="text" required value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} placeholder="e.g. Preap Sovath" className="fi" /></div>
            <div><label className="flbl">Email Address</label><input type="email" required value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} placeholder="preapsovath@gmail.com" className="fi" /></div>
            <div>
              <label className="flbl">New Password <span style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 400, textTransform: "none" }}>(leave blank to keep current)</span></label>
              <div className="fi-icon-wrap"><Lock size={14} className="fi-icon" /><input type="password" value={editFormData.password} onChange={e => setEditFormData({...editFormData, password: e.target.value})} placeholder="Leave blank to keep current" className="fi" /></div>
            </div>
            <div>
              <label className="flbl">Role & Permissions</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {ROLE_OPTS.map(r => (
                  <button key={r.value} type="button" onClick={() => setEditFormData({...editFormData, role: r.value})} style={{ padding: "9px 0", borderRadius: 11, border: `1.5px solid ${editFormData.role === r.value ? r.color : "#dbeafe"}`, background: editFormData.role === r.value ? r.activeBg : "white", color: editFormData.role === r.value ? r.color : "#64748b", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all .15s" }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={isSaving} className="primary-btn" style={{ marginTop: 4 }}>
              {isSaving ? <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.35)", borderTopColor: "white", borderRadius: "50%", display: "inline-block" }} className="spin" />Saving…</> : "Save Changes"}
            </button>
          </form>
        </ModalShell>
      )}

      {/* ════ Delete Confirm Modal ════ */}
      {deleteConfirmOpen && (
        <ModalShell onClose={() => setDeleteConfirmOpen(false)}>
          <div style={{ padding: "28px 24px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 58, height: 58, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <AlertCircle size={26} style={{ color: "#ef4444" }} />
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 900, color: "#0f172a", margin: "0 0 8px" }}>Delete User?</h2>
            <p style={{ fontSize: 13.5, color: "#64748b", margin: "0 0 22px", lineHeight: 1.55 }}>This action cannot be undone. The user will permanently lose access.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%" }}>
              <button className="ghost-btn" onClick={() => setDeleteConfirmOpen(false)}>Cancel</button>
              <button onClick={confirmDelete} disabled={isSaving} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 46, borderRadius: 13, background: "#ef4444", color: "white", fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", opacity: isSaving ? .55 : 1 }}>
                {isSaving ? <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.35)", borderTopColor: "white", borderRadius: "50%", display: "inline-block" }} className="spin" /> : <Trash2 size={16} />}
                Delete
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}