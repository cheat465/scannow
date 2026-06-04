"use client";

import React, { useEffect, useState } from "react";
import {
  Users as UsersIcon,
  UserCheck,
  ShieldCheck,
  UserCog,
  Clock,
  Plus,
  Trash2,
  Edit,
  X,
  Camera,
  Loader2,
  Eye,
  Save,
  User,
  AtSign,
  Phone,
  Lock,
  Mail,
  Search,
  ChevronDown,
  MoreVertical,
} from "lucide-react";
import { apiRequest, resolveAssetUrl } from "@/lib/api";
import Link from "next/link";

/* ── Design tokens ── */
const C = {
  blue:       "#38B6FF",
  blueDark:   "#1a9fe8",
  blueLight:  "#e8f7ff",
  blueFaint:  "#EFFFFF",
  blueMid:    "rgba(56,182,255,0.12)",
  white:      "#ffffff",
  ink:        "#0a1628",
  inkMid:     "#2c4165",
  slate:      "#5a7a9f",
  slateLight: "#8fafc8",
  border:     "rgba(56,182,255,0.18)",
  borderSoft: "rgba(56,182,255,0.10)",
  surface:    "rgba(255,255,255,0.92)",
  danger:     "#e53e3e",
  dangerBg:   "#fff5f5",
  green:      "#1aaf6c",
  greenBg:    "#edfbf4",
};

/* ── useIsMobile hook ── */
function useIsMobile(bp = 640) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < bp);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [bp]);
  return mobile;
}

/* ── Avatar ── */
const Avatar = ({ user, size = 38, radius = 10 }: { user: any; size?: number; radius?: number }) => (
  <div style={{
    width: size, height: size, borderRadius: radius, flexShrink: 0,
    background: `linear-gradient(135deg, ${C.blue}, ${C.blueDark})`,
    overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.32, fontWeight: 800, color: "#fff",
    boxShadow: `0 2px 8px rgba(56,182,255,0.30)`,
  }}>
    {user.profile_image
      ? <img src={resolveAssetUrl(user.profile_image)} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      : user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)
    }
  </div>
);

/* ── Role badge ── */
const RoleBadge = ({ role }: { role: string }) => {
  const map: Record<string, { bg: string; color: string }> = {
    "super admin": { bg: C.ink,      color: "#fff" },
    "admin":       { bg: C.blue,     color: "#fff" },
    "supporter":   { bg: C.blueLight, color: C.blueDark },
  };
  const s = map[role] ?? map["supporter"];
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase",
      padding: "3px 9px", borderRadius: 20, background: s.bg, color: s.color,
      whiteSpace: "nowrap",
    }}>{role}</span>
  );
};

/* ── Stat Card ── */
const StatCard = ({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent?: boolean }) => (
  <div style={{
    background: accent ? C.blue : C.white,
    borderRadius: 16, padding: "14px 16px",
    border: `1px solid ${accent ? "transparent" : C.border}`,
    display: "flex", alignItems: "center", gap: 11,
    boxShadow: accent ? `0 4px 18px rgba(56,182,255,0.30)` : `0 1px 4px rgba(56,182,255,0.06)`,
    animation: "fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both",
  }}>
    <div style={{
      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
      background: accent ? "rgba(255,255,255,0.22)" : C.blueLight,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Icon size={17} color={accent ? "#fff" : C.blue} />
    </div>
    <div style={{ minWidth: 0 }}>
      <p style={{ fontSize: 20, fontWeight: 800, color: accent ? "#fff" : C.ink, margin: 0, letterSpacing: "-0.5px", lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 9, fontWeight: 700, color: accent ? "rgba(255,255,255,0.75)" : C.slate, margin: "3px 0 0", textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</p>
    </div>
  </div>
);

/* ── View Modal ── */
const ViewModal = ({ user, onClose }: { user: any; onClose: () => void }) => {
  const isMobile = useIsMobile();
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(10,22,40,0.50)", zIndex: 50, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 24, backdropFilter: "blur(4px)" }}
    >
      <div style={{
        background: C.white,
        borderRadius: isMobile ? "20px 20px 0 0" : 24,
        width: "100%", maxWidth: isMobile ? "100%" : 460,
        overflow: "hidden",
        boxShadow: "0 24px 60px rgba(56,182,255,0.18)",
        animation: isMobile ? "slideUp 0.35s cubic-bezier(0.22,1,0.36,1)" : "modalIn 0.35s cubic-bezier(0.22,1,0.36,1)",
      }}>
        {/* drag handle on mobile */}
        {isMobile && <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 4 }}><div style={{ width: 36, height: 4, borderRadius: 2, background: C.border }} /></div>}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${C.blue}, ${C.blueDark})` }} />
        <div style={{ padding: isMobile ? "16px 20px" : "22px 24px", borderBottom: `1px solid ${C.borderSoft}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar user={user} size={isMobile ? 44 : 52} radius={12} />
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: C.ink, margin: 0 }}>{user.name}</p>
              <p style={{ fontSize: 12, color: C.slate, margin: "2px 0 0" }}>@{user.username}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: C.blueLight, border: "none", borderRadius: 10, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.slate }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: isMobile ? "16px 20px" : "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "Email",      value: user.email },
            { label: "Phone",      value: user.phone || "—" },
            { label: "Role",       value: user.role },
            { label: "Last Login", value: user.last_login },
          ].map(item => (
            <div key={item.label} style={{ background: C.blueFaint, borderRadius: 12, padding: "11px 13px", border: `1px solid ${C.borderSoft}` }}>
              <p style={{ fontSize: 9, fontWeight: 800, color: C.slateLight, textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 4px" }}>{item.label}</p>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.ink, margin: 0, wordBreak: "break-all" }}>{item.value}</p>
            </div>
          ))}
        </div>
        <div style={{ padding: isMobile ? "0 20px 28px" : "0 24px 22px" }}>
          <button onClick={onClose} style={{ width: "100%", padding: "13px", background: C.blueLight, border: "none", borderRadius: 12, fontSize: 12, fontWeight: 800, color: C.blue, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Field wrapper for edit modal ── */
const MField = ({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    <label style={{ fontSize: 9, fontWeight: 800, color: C.slate, textTransform: "uppercase", letterSpacing: "0.13em" }}>{label}</label>
    <div style={{ position: "relative" }}>
      <Icon size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.slateLight, pointerEvents: "none" }} />
      {children}
    </div>
  </div>
);

/* ── Edit Modal ── */
const EditModal = ({ user, onClose, onUpdate }: { user: any; onClose: () => void; onUpdate: (u: any) => void }) => {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: user.name, username: user.username, email: user.email,
    phone: user.phone || "", role: user.role, password: "",
    profile_image: user.profile_image || "",
  });

  const fi = (name: string): React.CSSProperties => ({
    width: "100%", paddingLeft: 36, paddingRight: 14, paddingTop: 11, paddingBottom: 11,
    background: focused === name ? C.white : C.blueFaint,
    border: `1.5px solid ${focused === name ? C.blue : C.borderSoft}`,
    borderRadius: 10, fontSize: 13, fontWeight: 600, color: C.ink,
    outline: "none", boxSizing: "border-box",
    boxShadow: focused === name ? `0 0 0 3px rgba(56,182,255,0.12)` : "none",
    transition: "all 0.18s",
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, profile_image: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const body: any = { name: formData.name, username: formData.username, email: formData.email, phone: formData.phone, role: formData.role, profile_image: formData.profile_image };
      if (formData.password) body.password = formData.password;
      const response = await apiRequest<any>(`/admin/admin-users/${user.id}`, { method: "PATCH", body: JSON.stringify(body) });
      onUpdate(response.data); onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(10,22,40,0.50)", zIndex: 50, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 24, overflowY: isMobile ? "hidden" : "auto", backdropFilter: "blur(4px)" }}
    >
      <div style={{
        background: C.white,
        borderRadius: isMobile ? "20px 20px 0 0" : 24,
        width: "100%", maxWidth: isMobile ? "100%" : 600,
        maxHeight: isMobile ? "92dvh" : "unset",
        overflowY: "auto",
        boxShadow: "0 24px 60px rgba(56,182,255,0.18)",
        animation: isMobile ? "slideUp 0.35s cubic-bezier(0.22,1,0.36,1)" : "modalIn 0.35s cubic-bezier(0.22,1,0.36,1)",
      }}>
        {isMobile && <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 4 }}><div style={{ width: 36, height: 4, borderRadius: 2, background: C.border }} /></div>}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${C.blue}, ${C.blueDark})` }} />
        <div style={{ padding: isMobile ? "14px 18px" : "20px 24px", borderBottom: `1px solid ${C.borderSoft}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.blueLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Edit size={16} color={C.blue} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: C.ink, margin: 0 }}>Edit User</p>
              <p style={{ fontSize: 11, color: C.slate, margin: 0 }}>Update account details</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: C.blueLight, border: "none", borderRadius: 10, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.slate }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: isMobile ? "16px 18px" : "22px 24px" }}>
          {error && <div style={{ marginBottom: 16, padding: "10px 14px", background: C.dangerBg, border: "1px solid #fecaca", borderRadius: 10, fontSize: 12, fontWeight: 700, color: C.danger }}>⚠ {error}</div>}
          <form onSubmit={handleSubmit}>
            {/* Avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, padding: "13px 15px", background: C.blueFaint, borderRadius: 14, border: `1px solid ${C.borderSoft}` }}>
              <label style={{ cursor: "pointer", flexShrink: 0 }}>
                <div style={{ width: 52, height: 52, borderRadius: 13, background: `linear-gradient(135deg,${C.blue},${C.blueDark})`, border: `2px dashed rgba(255,255,255,0.5)`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {formData.profile_image ? <img src={resolveAssetUrl(formData.profile_image)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Camera size={17} color="rgba(255,255,255,0.8)" />}
                </div>
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
              </label>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: C.ink, margin: "0 0 2px" }}>Profile Photo</p>
                <p style={{ fontSize: 11, color: C.slate, margin: 0 }}>{formData.profile_image ? "✓ Photo selected" : "Tap avatar to upload"}</p>
              </div>
            </div>
            {/* Form fields – single col on mobile, 2-col on desktop */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? "10px" : "12px 14px", marginBottom: 16 }}>
              <MField label="Full Name" icon={User}><input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} onFocus={() => setFocused("name")} onBlur={() => setFocused(null)} style={fi("name")} /></MField>
              <MField label="Username" icon={AtSign}><input type="text" required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} onFocus={() => setFocused("username")} onBlur={() => setFocused(null)} style={fi("username")} /></MField>
              <MField label="Email" icon={Mail}><input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} onFocus={() => setFocused("email")} onBlur={() => setFocused(null)} style={fi("email")} /></MField>
              <MField label="Phone" icon={Phone}><input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} onFocus={() => setFocused("phone")} onBlur={() => setFocused(null)} style={fi("phone")} /></MField>
              <MField label="Access Role" icon={ShieldCheck}>
                <select required value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} onFocus={() => setFocused("role")} onBlur={() => setFocused(null)} style={{ ...fi("role"), appearance: "none", cursor: "pointer" }}>
                  <option value="super admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="supporter">Supporter</option>
                </select>
              </MField>
              <MField label="New Password" icon={Lock}><input type="password" minLength={8} value={formData.password} placeholder="Leave blank to keep" onChange={e => setFormData({ ...formData, password: e.target.value })} onFocus={() => setFocused("password")} onBlur={() => setFocused(null)} style={fi("password")} /></MField>
            </div>
            <div style={{ display: "flex", gap: 10, flexDirection: isMobile ? "column-reverse" : "row" }}>
              <button type="button" onClick={onClose} style={{ padding: "13px 22px", background: C.blueLight, color: C.slate, border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 13, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>
                Cancel
              </button>
              <button type="submit" disabled={loading} style={{ flex: 1, padding: "13px", background: loading ? C.slateLight : C.blue, color: "#fff", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.75 : 1, boxShadow: loading ? "none" : `0 4px 14px rgba(56,182,255,0.35)`, transition: "all 0.18s" }}>
                {loading ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={15} />}
                {loading ? "Saving…" : "Save Changes"}
              </button>
            </div>
            {/* Safe area padding for iOS */}
            {isMobile && <div style={{ height: 8 }} />}
          </form>
        </div>
      </div>
    </div>
  );
};

/* ── Mobile user card ── */
const UserCard = ({
  user, deletingId, onView, onEdit, onDelete,
}: {
  user: any; deletingId: number | null;
  onView: () => void; onEdit: () => void; onDelete: () => void;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isDeleting = deletingId === user.id;

  return (
    <div style={{
      background: C.white, borderRadius: 16, border: `1px solid ${C.border}`,
      padding: "14px 14px", display: "flex", alignItems: "center", gap: 12,
      boxShadow: "0 1px 4px rgba(56,182,255,0.07)",
      opacity: isDeleting ? 0.4 : 1, pointerEvents: isDeleting ? "none" : "auto",
      transition: "all 0.15s",
      animation: "fadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both",
      zIndex: menuOpen ? 100 : 'auto',
    }}>
      <Avatar user={user} size={44} radius={12} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: C.ink, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</p>
        </div>
        <p style={{ fontSize: 11, color: C.slate, margin: "0 0 5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>@{user.username}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <RoleBadge role={user.role} />
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 20, background: C.greenBg, color: C.green }}>Online</span>
        </div>
      </div>
      {/* 3-dot menu */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => setMenuOpen(o => !o)}
          style={{ width: 34, height: 34, borderRadius: 10, border: "none", background: C.blueLight, color: C.slateLight, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <MoreVertical size={16} />
        </button>
        {menuOpen && (
          <>
            {/* backdrop */}
            <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
            <div style={{
              position: "absolute", right: 0, top: 40, zIndex: 50,
              background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
              boxShadow: "0 8px 28px rgba(56,182,255,0.18)", overflow: "hidden", minWidth: 150,
              animation: "modalIn 0.2s cubic-bezier(0.22,1,0.36,1)",
            }}>
              {[
                { icon: Eye,    label: "View",   color: C.blue,   fn: () => { setMenuOpen(false); onView(); } },
                { icon: Edit,   label: "Edit",   color: C.blueDark, fn: () => { setMenuOpen(false); onEdit(); } },
                { icon: Trash2, label: "Delete", color: C.danger, fn: () => { setMenuOpen(false); onDelete(); } },
              ].map(({ icon: Icon, label, color, fn }) => (
                <button
                  key={label} onClick={fn}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", border: "none", background: "transparent", color, fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "left" }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.blueFaint)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
   Main Page
══════════════════════════════════════════ */
export default function UsersAdmin() {
  const isMobile = useIsMobile();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [viewingUser, setViewingUser] = useState<any | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    apiRequest<any>("/admin/admin-users")
      .then(r => setUsers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this admin user?")) return;
    setDeletingId(id);
    try {
      await apiRequest(`/admin/admin-users/${id}`, { method: "DELETE" });
      setUsers(users.filter(u => u.id !== id));
    } catch { alert("Failed to delete user"); }
    finally { setDeletingId(null); }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const statCards = [
    { icon: UsersIcon,   label: "Total Users",  value: users.length.toString(),                                       accent: true  },
    { icon: UserCheck,   label: "Super Admins", value: users.filter(u => u.role === "super admin").length.toString(), accent: false },
    { icon: ShieldCheck, label: "Admins",       value: users.filter(u => u.role === "admin").length.toString(),       accent: false },
    { icon: UserCog,     label: "Supporters",   value: users.filter(u => u.role === "supporter").length.toString(),   accent: false },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: 10, color: C.slate, fontSize: 13, fontWeight: 700, background: C.blueFaint }}>
        <Loader2 size={18} style={{ animation: "spin 1s linear infinite", color: C.blue }} /> Loading users…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      padding: isMobile ? "0" : "20px 24px",
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
      background: C.blueFaint,
      height: "100%",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      gap: isMobile ? 0 : 18,
      overflow: "hidden",
    }}>
      {viewingUser && <ViewModal user={viewingUser} onClose={() => setViewingUser(null)} />}
      {editingUser && <EditModal user={editingUser} onClose={() => setEditingUser(null)} onUpdate={u => setUsers(users.map(x => x.id === u.id ? u : x))} />}

      {/* ── Mobile sticky header ── */}
      {isMobile && (
        <div style={{
          position: "sticky", top: 0, zIndex: 10,
          background: "rgba(239,255,255,0.92)", backdropFilter: "blur(10px)",
          borderBottom: `1px solid ${C.border}`,
          padding: "12px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
        }}>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 800, color: C.ink, margin: 0, letterSpacing: "-0.4px" }}>Admin Users</h1>
            <p style={{ fontSize: 11, color: C.slate, margin: 0 }}>Manage all admin staff</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setSearchOpen(o => !o)}
              style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`, background: C.white, color: C.blue, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <Search size={16} />
            </button>
            <Link
              href="/admin/users/create"
              style={{ width: 36, height: 36, borderRadius: 10, background: C.blue, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", boxShadow: `0 4px 14px rgba(56,182,255,0.35)` }}
            >
              <Plus size={18} />
            </Link>
          </div>
        </div>
      )}

      {/* ── Mobile collapsible search ── */}
      {isMobile && searchOpen && (
        <div style={{ padding: "10px 16px", background: C.white, borderBottom: `1px solid ${C.borderSoft}` }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: C.slateLight, pointerEvents: "none" }} />
            <input
              autoFocus
              type="text"
              placeholder="Search users…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                paddingLeft: 34, paddingRight: 14, paddingTop: 10, paddingBottom: 10,
                border: `1.5px solid ${C.blue}`, borderRadius: 10,
                fontSize: 13, color: C.ink, background: C.blueFaint,
                outline: "none", fontFamily: "inherit",
                boxShadow: `0 0 0 3px rgba(56,182,255,0.12)`,
              }}
            />
          </div>
        </div>
      )}

      {/* ── Desktop header ── */}
      {!isMobile && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: C.ink, margin: 0, letterSpacing: "-0.4px" }}>Admin Users</h1>
            <p style={{ fontSize: 12, color: C.slate, margin: "2px 0 0" }}>Manage all admin staff across your platform</p>
          </div>
          <Link
            href="/admin/users/create"
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "10px 18px",
              background: C.blue, color: "#fff",
              borderRadius: 12, fontSize: 12, fontWeight: 800,
              textDecoration: "none", letterSpacing: "0.06em", textTransform: "uppercase",
              boxShadow: `0 4px 14px rgba(56,182,255,0.35)`,
              transition: "filter 0.15s",
            }}
          >
            <Plus size={15} /> Create New
          </Link>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)",
        gap: isMobile ? 10 : 12,
        flexShrink: 0,
        padding: isMobile ? "14px 16px" : 0,
      }}>
        {statCards.map((s, i) => (
          <div key={i} style={{ animationDelay: `${i * 0.07}s` }}>
            <StatCard {...s} />
          </div>
        ))}
      </div>

      {/* ── Table card (desktop) / Card list (mobile) ── */}
      {isMobile ? (
        /* Mobile: card list */
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 24px" }}>
          {/* Count row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: C.ink, margin: 0 }}>All Admin Users</p>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.blue, background: C.blueLight, padding: "3px 9px", borderRadius: 20 }}>{filtered.length}</span>
          </div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: C.slateLight, fontSize: 13, fontWeight: 600 }}>
              No users match your search.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map((user, i) => (
                <UserCard
                  key={user.id}
                  user={user}
                  deletingId={deletingId}
                  onView={() => setViewingUser(user)}
                  onEdit={() => setEditingUser(user)}
                  onDelete={() => handleDelete(user.id)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Desktop: full table */
        <div style={{
          background: C.white,
          borderRadius: 20,
          border: `1px solid ${C.border}`,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          boxShadow: "0 2px 12px rgba(56,182,255,0.07)",
        }}>
          {/* Table toolbar */}
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.borderSoft}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: C.ink, margin: 0 }}>All Admin Users</p>
              <span style={{ fontSize: 10, fontWeight: 800, color: C.blue, background: C.blueLight, padding: "3px 10px", borderRadius: 20 }}>{filtered.length}</span>
            </div>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: C.slateLight, pointerEvents: "none" }} />
              <input
                type="text"
                placeholder="Search users…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  paddingLeft: 32, paddingRight: 14, paddingTop: 8, paddingBottom: 8,
                  border: `1.5px solid ${C.border}`, borderRadius: 10,
                  fontSize: 12, color: C.ink, background: C.blueFaint,
                  outline: "none", width: 200, fontFamily: "inherit",
                }}
              />
            </div>
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                <tr style={{ background: C.blueFaint }}>
                  {["User", "Role", "Status", "Last Login", "Actions"].map((h, i) => (
                    <th key={i} style={{
                      padding: "9px 18px",
                      textAlign: i === 4 ? "right" : i === 2 ? "center" : "left",
                      fontSize: 9, fontWeight: 800, color: C.slateLight,
                      letterSpacing: "0.14em", textTransform: "uppercase",
                      borderBottom: `1px solid ${C.borderSoft}`,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "40px 20px", textAlign: "center", color: C.slateLight, fontSize: 13, fontWeight: 600 }}>
                      No users match your search.
                    </td>
                  </tr>
                ) : filtered.map((user, i) => (
                  <tr
                    key={i}
                    style={{
                      borderTop: `1px solid ${C.borderSoft}`,
                      opacity: deletingId === user.id ? 0.4 : 1,
                      pointerEvents: deletingId === user.id ? "none" : "auto",
                      transition: "background 0.12s",
                      background: "transparent",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.blueFaint)}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "11px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                        <Avatar user={user} size={36} radius={10} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 800, color: C.ink, margin: 0 }}>{user.name}</p>
                          <p style={{ fontSize: 11, color: C.slate, margin: 0 }}>@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "11px 18px" }}><RoleBadge role={user.role} /></td>
                    <td style={{ padding: "11px 18px", textAlign: "center" }}>
                      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 20, background: C.greenBg, color: C.green }}>Online</span>
                    </td>
                    <td style={{ padding: "11px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: C.slate }}>
                        <Clock size={12} color={C.slateLight} /> {user.last_login}
                      </div>
                    </td>
                    <td style={{ padding: "11px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 5 }}>
                        {[
                          { icon: Eye,    title: "View",   fn: () => setViewingUser(user), hoverBg: C.blueLight,  hoverColor: C.blue   },
                          { icon: Edit,   title: "Edit",   fn: () => setEditingUser(user),  hoverBg: C.blueLight,  hoverColor: C.blueDark },
                          { icon: Trash2, title: "Delete", fn: () => handleDelete(user.id), hoverBg: C.dangerBg,   hoverColor: C.danger  },
                        ].map(({ icon: Icon, title, fn, hoverBg, hoverColor }) => (
                          <button
                            key={title} onClick={fn} title={title}
                            style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: C.blueLight, color: C.slateLight, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.14s" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = hoverBg; (e.currentTarget as HTMLButtonElement).style.color = hoverColor; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = C.blueLight; (e.currentTarget as HTMLButtonElement).style.color = C.slateLight; }}
                          >
                            <Icon size={14} />
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}