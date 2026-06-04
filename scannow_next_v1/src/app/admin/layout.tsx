"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Store,
  Settings,
  LogOut,
  Bell,
  Search,
  Megaphone,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { ApiUser, clearSession, getStoredAdminUser } from "@/lib/api";

/* ─────────────────────────────────────────
   Brand palette (original colors preserved)
───────────────────────────────────────── */
const C = {
  bg:         "#EFFFFF",
  surface:    "#EAF9FF",
  white:      "#ffffff",
  border:     "#c8eef9",
  accent:     "#38B6FF",
  accentAlt:  "#61A9E5",
  accentSoft: "#daf3ff",
  ink:        "#0d2d45",
  body:       "#3a6f8f",
  muted:      "#7db8d4",
  onAccent:   "#ffffff",
};

/* ─────────────────────────────────────────
   Injected responsive styles
───────────────────────────────────────── */
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .sn-admin-root {
    font-family: 'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif;
  }

  /* Sidebar overlay on mobile */
  .sn-sidebar-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(13, 45, 69, 0.45);
    backdrop-filter: blur(2px);
    z-index: 40;
  }
  .sn-sidebar-overlay.open { display: block; }

  /* Sidebar */
  .sn-sidebar {
    position: fixed;
    top: 0; left: 0; bottom: 0;
    width: 260px;
    z-index: 50;
    transform: translateX(-100%);
    transition: transform 0.26s cubic-bezier(0.4,0,0.2,1);
  }
  .sn-sidebar.open {
    transform: translateX(0);
    box-shadow: 12px 0 48px rgba(13, 45, 69, 0.15);
  }

  @media (min-width: 1024px) {
    .sn-sidebar {
      position: relative;
      transform: translateX(0) !important;
      box-shadow: none !important;
      flex-shrink: 0;
    }
    .sn-sidebar-overlay { display: none !important; }
    .sn-mobile-toggle { display: none !important; }
  }

  /* Main content offset */
  .sn-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* Nav item hover */
  .sn-nav-item:hover:not(.active) {
    background: ${C.accentSoft} !important;
    color: ${C.accent} !important;
  }
  .sn-nav-item:hover:not(.active) .sn-nav-icon {
    background: ${C.accent}22 !important;
    color: ${C.accent} !important;
  }

  /* Logout hover */
  .sn-logout:hover {
    background: #fff0f0 !important;
    color: #e05050 !important;
  }
  .sn-logout:hover .sn-logout-icon {
    background: #fde8e8 !important;
    color: #e05050 !important;
  }

  /* Search focus */
  .sn-search:focus {
    border-color: ${C.accent} !important;
    box-shadow: 0 0 0 3px ${C.accent}22 !important;
  }

  /* Bell hover */
  .sn-bell:hover {
    border-color: ${C.accent} !important;
    background: ${C.accentSoft} !important;
  }

  /* Scrollbar */
  .sn-nav-scroll::-webkit-scrollbar { width: 4px; }
  .sn-nav-scroll::-webkit-scrollbar-track { background: transparent; }
  .sn-nav-scroll::-webkit-scrollbar-thumb {
    background: ${C.border};
    border-radius: 8px;
  }

  /* Loading pulse */
  @keyframes sn-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  .sn-pulse { animation: sn-pulse 1.6s ease-in-out infinite; }

  /* Responsive header search */
  @media (max-width: 640px) {
    .sn-search-wrap { display: none !important; }
    .sn-header-title { display: block !important; }
  }
  @media (min-width: 641px) {
    .sn-header-title { display: none !important; }
  }

  /* User chip name hidden on very small screens */
  @media (max-width: 480px) {
    .sn-user-name { display: none !important; }
  }
`;

/* ─────────────────────────────────────────
   Sub-components
───────────────────────────────────────── */
interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem = ({ href, icon, label, active, onClick }: NavItemProps) => (
  <Link
    href={href}
    onClick={onClick}
    className={`sn-nav-item${active ? " active" : ""}`}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "9px 12px",
      borderRadius: 12,
      background: active
        ? `linear-gradient(135deg, ${C.accent} 0%, ${C.accentAlt} 100%)`
        : "transparent",
      color: active ? C.onAccent : C.body,
      fontSize: 13.5,
      fontWeight: active ? 700 : 500,
      textDecoration: "none",
      transition: "all 0.18s ease",
      cursor: "pointer",
    }}
  >
    <span
      className="sn-nav-icon"
      style={{
        width: 32,
        height: 32,
        borderRadius: 9,
        background: active ? "rgba(255,255,255,0.2)" : C.border,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color: active ? C.onAccent : C.accent,
        transition: "all 0.18s ease",
      }}
    >
      {icon}
    </span>
    <span style={{ flex: 1 }}>{label}</span>
    {active && <ChevronRight size={14} style={{ opacity: 0.7 }} />}
  </Link>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p
    style={{
      fontSize: 10,
      fontWeight: 800,
      color: C.muted,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      padding: "0 12px 6px",
      margin: "0 0 2px",
    }}
  >
    {children}
  </p>
);

/* ─────────────────────────────────────────
   Page title map
───────────────────────────────────────── */
const PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/users": "Users",
  "/admin/restaurants": "Restaurants",
  "/admin/broadcast": "Broadcast",
  "/admin/settings": "Settings",
};

/* ─────────────────────────────────────────
   Layout
───────────────────────────────────────── */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [adminUser, setAdminUser] = useState<ApiUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const storedAdmin = getStoredAdminUser();
    if (pathname === "/admin/login") { setAuthorized(true); return; }
    if (!storedAdmin) {
      router.replace("/admin/login");
    } else {
      setAdminUser(storedAdmin);
      setAuthorized(true);
    }
  }, [pathname, router]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    clearSession();
    router.push("/admin/login");
  };

  /* Loading gate */
  if (!authorized && pathname !== "/admin/login") {
    return (
      <>
        <style>{globalStyles}</style>
        <div
          className="sn-admin-root"
          style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #EFFFFF 0%, #E8F8FF 50%, #d8f0ff 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 24,
            backdropFilter: "blur(20px)",
          }}
        >
          <img
            src="/logo/main/snloading.webp"
            alt="Loading"
            style={{ 
              width: 180, 
              height: "auto", 
              animation: "logoPulse 2s ease-in-out infinite" 
            }}
          />
          <div style={{ display: "flex", gap: 5 }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#61A9E5",
              animation: "loadingDot 1.4s ease-in-out infinite",
              animationDelay: "0s"
            }}></span>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#61A9E5",
              animation: "loadingDot 1.4s ease-in-out infinite",
              animationDelay: "0.2s"
            }}></span>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#61A9E5",
              animation: "loadingDot 1.4s ease-in-out infinite",
              animationDelay: "0.4s"
            }}></span>
          </div>
          <style>{`
            @keyframes logoPulse {
              0%, 100% {
                opacity: 1;
                transform: scale(1);
              }
              50% {
                opacity: 0.85;
                transform: scale(1.03);
              }
            }
            @keyframes loadingDot {
              0%, 80%, 100% {
                opacity: 0.3;
                transform: scale(0.8);
              }
              40% {
                opacity: 1;
                transform: scale(1);
              }
            }
          `}</style>
        </div>
      </>
    );
  }

  if (pathname === "/admin/login") return <>{children}</>;

  const navItems = [
    { href: "/admin",             icon: <LayoutDashboard size={16} />, label: "Dashboard" },
    { href: "/admin/users",       icon: <Users size={16} />,           label: "Users" },
    { href: "/admin/restaurants", icon: <Store size={16} />,           label: "Restaurants" },
    { href: "/admin/broadcast",   icon: <Megaphone size={16} />,       label: "Broadcast" },
  ];

  const initials =
    adminUser?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "AD";

  const pageTitle = PAGE_TITLES[pathname] ?? "Admin";

  return (
    <>
      <style>{globalStyles}</style>

      <div
        className="sn-admin-root"
        style={{
          display: "flex",
          height: "100dvh",
          width: "100%",
          overflow: "hidden",
          background: C.bg,
        }}
      >
        {/* ── Mobile overlay ── */}
        <div
          className={`sn-sidebar-overlay${sidebarOpen ? " open" : ""}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* ══════════════════════════════
            SIDEBAR
        ══════════════════════════════ */}
        <aside
          className={`sn-sidebar${sidebarOpen ? " open" : ""}`}
          style={{
            width: 260,
            background: C.white,
            borderRight: `1px solid ${C.border}`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Logo */}
          <div style={{
            padding: "8px 16px",
            borderBottom: `1px solid ${C.border}`,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <img
              src="/logo/main/snblue.webp"
              alt="Scan Now"
              style={{ height: 48, width: "auto", display: "block" }}
            />
            {/* Close button (mobile only, hidden on desktop via CSS) */}
            <button
              className="sn-mobile-toggle"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                width: 34,
                height: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: C.body,
                flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Nav */}
          <div
            className="sn-nav-scroll"
            style={{ flex: 1, overflowY: "auto", padding: "20px 10px 0" }}
          >
            <SectionLabel>Main Menu</SectionLabel>
            <nav style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 24 }}>
              {navItems.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={pathname === item.href}
                  onClick={() => setSidebarOpen(false)}
                />
              ))}
            </nav>

            <SectionLabel>System</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <NavItem
                href="/admin/settings"
                icon={<Settings size={16} />}
                label="Settings"
                active={pathname === "/admin/settings"}
                onClick={() => setSidebarOpen(false)}
              />
              <button
                onClick={handleLogout}
                className="sn-logout"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  width: "100%",
                  background: "transparent",
                  color: C.body,
                  fontSize: 13.5,
                  fontWeight: 500,
                  textAlign: "left",
                  transition: "all 0.18s",
                }}
              >
                <span
                  className="sn-logout-icon"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    background: C.border,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    color: C.muted,
                    transition: "all 0.18s",
                  }}
                >
                  <LogOut size={16} />
                </span>
                Sign Out
              </button>
            </div>
          </div>

          {/* Profile card */}
          <div style={{
            margin: "12px",
            padding: "12px 14px",
            borderRadius: 16,
            background: C.surface,
            border: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            gap: 11,
            flexShrink: 0,
          }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentAlt})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 800,
              color: "#fff",
              flexShrink: 0,
              boxShadow: `0 4px 12px ${C.accent}44`,
            }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.ink,
                margin: 0,
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {adminUser?.name || "Admin User"}
              </p>
              <p style={{
                fontSize: 10.5,
                color: C.muted,
                margin: 0,
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}>
                {adminUser?.role || "Administrator"}
              </p>
            </div>

            {/* Online dot */}
            <div style={{
              marginLeft: "auto",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#34d399",
              flexShrink: 0,
              boxShadow: "0 0 0 2px #d1fae5",
            }} />
          </div>
        </aside>

        {/* ══════════════════════════════
            MAIN CONTENT
        ══════════════════════════════ */}
        <div className="sn-main">

          {/* ── Top Header ── */}
          <header style={{
            height: 64,
            background: C.white,
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            gap: 14,
            flexShrink: 0,
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}>

            {/* Mobile hamburger */}
            <button
              className="sn-mobile-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              style={{
                background: C.surface,
                border: `1.5px solid ${C.border}`,
                borderRadius: 11,
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: C.body,
                flexShrink: 0,
                transition: "all 0.15s",
              }}
            >
              <Menu size={18} />
            </button>

            {/* Mobile page title (hidden on desktop) */}
            <span
              className="sn-header-title"
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: C.ink,
                display: "none",
              }}
            >
              {pageTitle}
            </span>

            {/* Search (hidden on small screens) */}
            <div
              className="sn-search-wrap"
              style={{ position: "relative", flex: 1, maxWidth: 380 }}
            >
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 13,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: C.muted,
                }}
              />
              <input
                type="text"
                placeholder="Search anything…"
                className="sn-search"
                style={{
                  width: "100%",
                  background: C.surface,
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 11,
                  padding: "9px 14px 9px 36px",
                  fontSize: 13,
                  color: C.ink,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Right actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>

              {/* Bell */}
              <button
                className="sn-bell"
                aria-label="Notifications"
                style={{
                  position: "relative",
                  background: C.surface,
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 11,
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  flexShrink: 0,
                }}
              >
                <Bell size={17} color={C.accentAlt} />
                <span style={{
                  position: "absolute",
                  top: 9,
                  right: 9,
                  width: 7,
                  height: 7,
                  background: "#f04e4e",
                  borderRadius: "50%",
                  border: `2px solid ${C.white}`,
                }} />
              </button>

              {/* Divider */}
              <div style={{ width: 1, height: 24, background: C.border, flexShrink: 0 }} />

              {/* User chip */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "5px 12px 5px 5px",
                borderRadius: 13,
                background: C.surface,
                border: `1.5px solid ${C.border}`,
                cursor: "default",
                flexShrink: 0,
              }}>
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  background: `linear-gradient(135deg, ${C.accent}, ${C.accentAlt})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#fff",
                  flexShrink: 0,
                }}>
                  {initials}
                </div>
                <span
                  className="sn-user-name"
                  style={{ fontSize: 13, fontWeight: 700, color: C.ink, whiteSpace: "nowrap" }}
                >
                  {adminUser?.name || "Admin User"}
                </span>
              </div>
            </div>
          </header>

          {/* ── Page content ── */}
          <div style={{ flex: 1, overflow: "auto", minHeight: "auto" }}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}