"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Settings,
  QrCode,
  Users,
  ChevronRight,
  LogOut,
  Menu,
  X,
  AlertTriangle,
} from "lucide-react";
import {
  getStoredRestaurant,
  resolveAssetUrl,
  Restaurant,
  getStoredUser,
  ApiUser,
  storeRestaurant,
  apiRequest,
  ListResponse,
  ItemResponse,
  GlobalBanner,
  getStoredImpersonatingAdmin,
  storeAdminUser,
  clearSession
} from "@/lib/api";
import { useLanguage } from "@/app/contexts/LanguageContext";

interface NavItemProps {
  href?: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}

const NavItem = ({ href = "#", icon, label, active, badge, onClick }: NavItemProps) => (
  <Link href={href} onClick={onClick}>
    <div
      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
        active
          ? "bg-[#61A9E5] text-white shadow-md shadow-[#61A9E5]/30"
          : "text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/60 rounded-r-full" />
      )}
      <span className={`flex-shrink-0 transition-transform duration-200 ${active ? "scale-110" : "group-hover:scale-110"}`}>
        {icon}
      </span>
      <span className="flex-1 text-sm font-semibold tracking-wide">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${active ? "bg-white/25 text-white" : "bg-[#61A9E5]/15 text-[#61A9E5]"}`}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {!active && (
        <ChevronRight size={14} className="opacity-0 group-hover:opacity-40 transition-opacity -translate-x-1 group-hover:translate-x-0 duration-200" />
      )}
    </div>
  </Link>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400/70 select-none">
    {children}
  </p>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const [isFrozen, setIsFrozen] = useState(false);
  const [activeBanner, setActiveBanner] = useState<GlobalBanner | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Fetch and poll for global banner
  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const res = await apiRequest<ItemResponse<GlobalBanner | null>>('/banners/active');
        setActiveBanner(res.data);
      } catch (err) {
        console.error('Failed to fetch banner:', err);
      }
    };

    fetchBanner();
    const interval = setInterval(fetchBanner, 5000); // Poll every 5 seconds for near-real-time updates
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function checkAuth() {
      const storedUser = getStoredUser();
      if (!storedUser) { router.replace("/auth/login"); return; }
      setUser(storedUser);
      
      // Always fetch fresh restaurant data to get latest status
      let freshRestaurant: Restaurant | null = null;
      try {
        if ((storedUser.role === "manager" || storedUser.role === "staff") && storedUser.restaurant_id) {
          const response = await apiRequest<ItemResponse<Restaurant>>(`/restaurants/${storedUser.restaurant_id}`);
          if (response.data) {
            freshRestaurant = response.data;
          }
        } else if (storedUser.role === "owner") {
          const response = await apiRequest<ListResponse<Restaurant>>(`/restaurants?user_id=${storedUser.id}`);
          if (response.data && response.data.length > 0) {
            freshRestaurant = response.data[0];
          }
        }
        
        // Update stored restaurant with fresh data
        if (freshRestaurant) {
          storeRestaurant(freshRestaurant);
        } else {
          const storedRestaurant = getStoredRestaurant();
          if (storedRestaurant) {
            freshRestaurant = storedRestaurant;
          }
        }
      } catch (error) {
        console.error("Failed to fetch fresh restaurant data:", error);
        const storedRestaurant = getStoredRestaurant();
        if (storedRestaurant) {
          freshRestaurant = storedRestaurant;
        }
      }

      if (!freshRestaurant && storedUser.role === "owner") { 
        router.replace("/page/about-restaurant"); 
        return; 
      }
      
      setRestaurant(freshRestaurant);
      if (freshRestaurant?.language) setLanguage(freshRestaurant.language as "en" | "kh");
      setIsFrozen(freshRestaurant?.status === "frozen");
      setAuthorized(true);
      setLoading(false);
    }
    checkAuth();
  }, [router, setLanguage]);

  const role = user?.role || "staff";
  const canAccessDashboard = role === "owner" || role === "manager";
  const canAccessMenu = role === "owner" || role === "manager";
  const canAccessOrders = true;
  const canAccessQrCode = role === "owner";
  const canAccessSettings = role === "owner";
  const canAccessUsers = role === "owner";

  useEffect(() => {
    if (!user) return;
    const isSettings = pathname === "/dashboard/settings";
    const isUsers = pathname === "/dashboard/users";
    const isDashboard = pathname === "/dashboard";
    const isMenu = pathname.startsWith("/dashboard/menu") && !pathname.includes("/order");
    if (role === "staff" && (isDashboard || isMenu || isSettings || isUsers || pathname === "/dashboard/qrcode")) {
      router.replace("/dashboard/menu/order");
    } else if (role === "manager" && (isSettings || isUsers)) {
      router.replace("/dashboard");
    }
  }, [pathname, user, role, router]);

  // Check if we're impersonating
  useEffect(() => {
    const impersonatingAdmin = getStoredImpersonatingAdmin();
    setIsImpersonating(!!impersonatingAdmin);
  }, []);

  const handleExitImpersonation = () => {
    const adminUser = getStoredImpersonatingAdmin();
    if (adminUser) {
      storeAdminUser(adminUser);
    }
    // Only clear impersonation and user data, NOT the admin user we just stored!
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("scannow_user");
      window.localStorage.removeItem("scannow_restaurant");
      window.localStorage.removeItem("scannow_restaurant_id");
      window.localStorage.removeItem("scannow_impersonating_admin");
    }
    router.push("/admin");
  };

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#EFFFFF] via-[#E8F8FF] to-[#d8f0ff] flex flex-col items-center justify-center gap-6">
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
    );
  }

  if (isFrozen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF5F5] via-[#FFEEEE] to-[#FFE3E3] flex flex-col items-center justify-center gap-8 px-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-red-100 flex items-center justify-center shadow-lg shadow-red-200">
            <div className="text-5xl">❄️</div>
          </div>
        </div>
        <div className="text-center space-y-3 max-w-md">
          <h1 className="text-2xl font-bold text-red-700">
            {language === "kh" ? "ភោជនីយដ្ឋានត្រូវបានពន្យារពេលប្រើប្រាស់" : "Your restaurant has been frozen"}
          </h1>
          <p className="text-sm text-red-600 leading-relaxed">
            Your restaurant has been frozen by the admin. Please contact the administrator at <strong>scannow@gmail.com</strong> or <strong>010766900</strong> for assistance.
          </p>
        </div>
        <button
          onClick={() => router.replace("/auth/login")}
          className="px-8 py-3 bg-red-600 text-white font-semibold rounded-xl shadow-md hover:bg-red-700 transition-all"
        >
          {language === "kh" ? "ចាកចេញ" : "Sign Out"}
        </button>
      </div>
    );
  }

  const roleMeta: Record<string, { label: string; color: string }> = {
    owner: { label: language === "kh" ? "ម្ចាស់" : "Owner", color: "bg-amber-100 text-amber-700" },
    manager: { label: language === "kh" ? "មន្ត្រីគ្រប់គ្រង" : "Manager", color: "bg-purple-100 text-purple-700" },
    staff: { label: language === "kh" ? "បុគ្គលិក" : "Staff", color: "bg-slate-100 text-slate-600" },
  };
  const roleBadge = roleMeta[role] ?? roleMeta.staff;

  const SidebarContent = () => (
    <div className="relative flex flex-col h-full z-10">
      {/* Brand / Restaurant Header */}
      <div className="px-3 pt-2 pb-4 flex flex-col items-center border-b border-slate-100/80">
        <Link href="/dashboard" className="group" onClick={() => setSidebarOpen(false)}>
          <div className="mb-3 relative">
            <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden border-2 border-white shadow-lg shadow-[#61A9E5]/20 bg-gradient-to-br from-[#61A9E5]/10 to-[#61A9E5]/20 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-[#61A9E5]/30">
              {restaurant?.logo_url ? (
                <img src={resolveAssetUrl(restaurant.logo_url)} alt="Logo" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
              ) : (
                <UtensilsCrossed size={32} className="text-[#61A9E5]" />
              )}
            </div>
            <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white shadow-sm" />
          </div>
        </Link>
        <p className="font-bold text-[#61A9E5] text-sm tracking-wide text-center leading-tight mb-1">
          {restaurant?.name || "Scan Now"}
        </p>
        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${roleBadge.color}`}>
          {roleBadge.label}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto scrollbar-none space-y-0.5">
        {canAccessDashboard && (
          <>
            <SectionLabel>{language === "kh" ? "ទិដ្ឋភាពទូទៅ" : "Overview"}</SectionLabel>
            <NavItem href="/dashboard" icon={<LayoutDashboard size={18} />} label={t.dashboard} active={pathname === "/dashboard"} onClick={() => setSidebarOpen(false)} />
          </>
        )}
        <SectionLabel>{language === "kh" ? "ប្រតិបត្តិការ" : "Operations"}</SectionLabel>
        {canAccessMenu && (
          <NavItem href="/dashboard/menu" icon={<UtensilsCrossed size={18} />} label={language === "kh" ? "ម៉ឺនុយ" : "Menu"} active={pathname === "/dashboard/menu" || pathname === "/dashboard/menu/add"} onClick={() => setSidebarOpen(false)} />
        )}
        {canAccessOrders && (
          <NavItem href="/dashboard/menu/order" icon={<ShoppingBag size={18} />} label={t.orders} active={pathname === "/dashboard/menu/order" || pathname === "/dashboard/kitchen"} onClick={() => setSidebarOpen(false)} />
        )}
        {(canAccessUsers || canAccessQrCode || canAccessSettings) && (
          <SectionLabel>{language === "kh" ? "ការគ្រប់គ្រង" : "Management"}</SectionLabel>
        )}
        {canAccessUsers && (
          <NavItem href="/dashboard/users" icon={<Users size={18} />} label={language === "kh" ? "ក្រុមការងារ" : "Team"} active={pathname === "/dashboard/users"} onClick={() => setSidebarOpen(false)} />
        )}
        {/* {canAccessQrCode && (
          <NavItem href="/dashboard/qrcode" icon={<QrCode size={18} />} label={language === "kh" ? "កូដ QR" : "QR Code"} active={pathname === "/dashboard/qrcode"} onClick={() => setSidebarOpen(false)} />
        )} */}
        {canAccessSettings && (
          <NavItem href="/dashboard/settings" icon={<Settings size={18} />} label={t.settings} active={pathname === "/dashboard/settings"} onClick={() => setSidebarOpen(false)} />
        )}
      </nav>

      {/* User Footer */}
      <div className="border-t border-slate-100/80 pt-3 mt-1">
{isImpersonating && (
  <button
    onClick={handleExitImpersonation}
    className="
      relative
      w-50
      mb-2
      mx-2
      overflow-hidden
      rounded-xl
      px-4
      py-2.5
      text-xs
      font-semibold
      text-white
      shadow-lg
      transition-all
      duration-300
      hover:scale-[1.02]
      hover:shadow-xl
      bg-gradient-to-r
      from-violet-600
      via-fuchsia-500
      to-indigo-600
    "
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.3),transparent_25%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.2),transparent_20%),radial-gradient(circle_at_60%_20%,rgba(255,255,255,0.15),transparent_15%)]" />

    <span className="relative flex items-center justify-center gap-2">
      <LogOut size={14} />
      Exit Impersonation
    </span>
  </button>
)}
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/70 transition-colors cursor-pointer group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#61A9E5] to-[#3d8fd4] flex items-center justify-center shadow-sm flex-shrink-0">
            <span className="text-xs font-bold text-white">
              {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() ?? "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-700 truncate leading-tight">{user?.name ?? "User"}</p>
            <p className="text-[10px] text-slate-400 truncate leading-tight">{user?.email ?? ""}</p>
          </div>
          <button
            onClick={() => router.replace("/auth/login")}
            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-50 hover:text-red-500 text-slate-400"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#EFFFFF] via-[#ECF9FF] to-[#E0F4FF] overflow-hidden flex-col">
      {/* Impersonation Banner */}
{isImpersonating && (
  <div
    className="
      relative
      overflow-hidden
      px-4
      py-3
      text-white
      shadow-lg
      bg-gradient-to-r
      from-violet-600
      via-fuchsia-500
      to-indigo-600
      z-50
    "
  >
    {/* Galaxy glow */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.3),transparent_25%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.2),transparent_20%),radial-gradient(circle_at_60%_20%,rgba(255,255,255,0.15),transparent_15%)]" />

    <div className="relative flex items-center justify-center gap-4">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
        <AlertTriangle size={18} />
      </div>

      <p className="text-sm font-semibold tracking-wide">
        Administrator Impersonation Active
      </p>

      <button
        onClick={handleExitImpersonation}
        className="
          rounded-xl
          border
          border-white/20
          bg-white/10
          px-4
          py-1.5
          text-sm
          font-semibold
          backdrop-blur-sm
          transition-all
          duration-300
          hover:bg-white/20
          hover:border-white/40
        "
      >
        Exit
      </button>
    </div>
  </div>
)}
      <div className="flex flex-1 overflow-hidden">

      {/* ── Mobile Overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar (desktop: always visible, mobile: slide-in drawer) ── */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-40
          w-64 flex flex-col shrink-0 py-4 px-3 gap-1
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Sidebar glass card */}
        <div className="absolute inset-0 bg-white/60 backdrop-blur-xl rounded-none lg:rounded-2xl mx-0 lg:mx-2 my-0 lg:my-2 shadow-xl shadow-[#61A9E5]/10 border-r lg:border border-white/80" />

        {/* Mobile close button */}
        <button
          className="lg:hidden absolute top-3 right-3 z-20 p-1.5 rounded-lg bg-white/80 text-slate-500 hover:text-slate-800 shadow-sm"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={16} />
        </button>

        <SidebarContent />
      </aside>

      {/* ── Main Content ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* ── Mobile Top Bar ── */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white/70 backdrop-blur-md border-b border-white/80 shadow-sm shrink-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl bg-[#61A9E5]/10 text-[#61A9E5] hover:bg-[#61A9E5]/20 transition-colors"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg overflow-hidden bg-[#61A9E5]/10 flex items-center justify-center flex-shrink-0">
              {restaurant?.logo_url ? (
                <img src={resolveAssetUrl(restaurant.logo_url)} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <UtensilsCrossed size={14} className="text-[#61A9E5]" />
              )}
            </div>
            <span className="text-sm font-bold text-slate-700 truncate">{restaurant?.name || "Scan Now"}</span>
          </div>

          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 ${roleBadge.color}`}>
            {roleBadge.label}
          </span>
        </header>

        {/* Global Banner */}
{activeBanner && (
  <div className="bg-white border-b border-slate-200">
    <div className="max-w-6xl mx-auto py-3">
      <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <div className="w-1 self-stretch rounded-full bg-amber-500" />

        <AlertTriangle
          size={18}
          className="text-amber-600 flex-shrink-0"
        />

        <div>
          <p className="text-sm font-semibold text-amber-900">
            Warning
          </p>
          <p className="text-sm text-amber-700">
            {activeBanner.message}
          </p>
        </div>
      </div>
    </div>
  </div>
)}

        {/* ── Page Content ── */}
        <main className="flex-1 overflow-y-auto flex flex-col min-w-0 lg:pr-3 lg:py-3 p-0">
          <div className="bg-white/50 backdrop-blur-sm lg:rounded-2xl rounded-none border-0 lg:border border-white/80 shadow-sm">
            {children}
          </div>
        </main>
      </div>
      </div>
    </div>
  );
}