"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UtensilsCrossed, ShoppingBag, Settings } from "lucide-react";

// --- 1. Define the NavItem component ---
interface NavItemProps {
  href?: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}



const NavItem = ({ href = "#", icon, label, active }: NavItemProps) => {
  return (
    <Link
      href={href}
      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
        active 
          ? "bg-[#61A9E5] text-white" 
          : "hover:bg-slate-100 text-slate-500"
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
};

// --- 2. Your DashboardLayout ---
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen bg-[#EFFFFF]">
      <aside className="w-64 bg-[#EFFFFF] border shadow-black shadow-xs text-slate-400 flex flex-col shrink-0">
        <div className="p-8 flex flex-col items-center">
          <Link href="/page">
            <div className="mb-1 mt-[-15px]">
              <Image src="/logo/logo.png" alt="Logo" width={40} height={40} />
            </div>
          </Link>
          <span className="font-bold text-[#61A9E5] tracking-wide">
            Scan Now
          </span>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavItem
            href="/dashboard  "
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            active={pathname === "/dashboard"}
          />
          <NavItem
            href="/dashboard/menu"
            icon={<UtensilsCrossed size={20} />}
            label="Menu"
            active={pathname === "/dashboard/menu"}
          />
          <NavItem
            href="/dashboard/menu/order"
            icon={<ShoppingBag size={20} />}
            label="Orders"
            active={pathname === "/dashboard/menu/order"}
          />
        </nav>

        <div className="p-4 border-t border-slate-200">
          <NavItem icon={<Settings size={20} />} label="Settings" href="/settings" />
        </div>
      </aside>
      
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}