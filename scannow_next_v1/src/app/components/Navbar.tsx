"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSession, getStoredUser } from "@/lib/api";
import {
  LayoutGrid,
  Tag,
  Mail,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

/* ─────────────────────────────────
   Brand tokens (original palette)
───────────────────────────────── */
const C = {
  accent:       "#38B6FF",
  accentAlt:    "#1fa3f0",
  accentSoft:   "#EAF9FF",
  border:       "rgba(56,182,255,0.18)",
  borderStrong: "rgba(56,182,255,0.35)",
  ink:          "#0d2d45",
  body:         "#3a6f8f",
  muted:        "#7db8d4",
  white:        "#ffffff",
  bg:           "rgba(240,255,255,0.92)",
  bgScrolled:   "rgba(240,255,255,0.97)",
  red:          "#ef4444",
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .sn-nav * { box-sizing: border-box; }

  .sn-nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 50;
    font-family: 'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif;
  }

  /* ── Pill container ── */
  .sn-nav-inner {
    margin: 12px 20px;
    border-radius: 20px;
    padding: 0 24px;
    height: 62px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    background: ${C.bg};
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: 1px solid ${C.border};
    box-shadow: 0 4px 24px rgba(56,182,255,0.10), 0 1px 4px rgba(0,0,0,0.04);
    transition: background 0.3s ease, box-shadow 0.3s ease;
  }
  .sn-nav-inner.scrolled {
    background: ${C.bgScrolled};
    box-shadow: 0 8px 32px rgba(56,182,255,0.16), 0 2px 8px rgba(0,0,0,0.07);
  }

  /* ── Logo ── */
  .sn-logo {
    display: flex;
    align-items: center;
    gap: 9px;
    text-decoration: none;
    flex-shrink: 0;
    transition: opacity 0.2s;
  }
  .sn-logo:hover { opacity: 0.88; }
  .sn-logo img {
    height: 36px;
    width: auto;
    object-fit: contain;
    pointer-events: none;
    transition: transform 0.25s ease;
  }
  .sn-logo:hover img { transform: scale(1.04); }

  /* ── Desktop nav links ── */
  .sn-links {
    display: flex;
    align-items: center;
    gap: 2px;
    list-style: none;
    margin: 0; padding: 0;
    flex: 1;
    justify-content: center;
  }
  .sn-links a {
    position: relative;
    padding: 8px 15px;
    border-radius: 12px;
    font-size: 13.5px;
    font-weight: 500;
    color: ${C.body};
    text-decoration: none;
    transition: color 0.2s ease, background 0.2s ease;
    white-space: nowrap;
  }
  .sn-links a::after {
    content: '';
    position: absolute;
    bottom: 5px;
    left: 50%;
    transform: translateX(-50%) scaleX(0);
    width: calc(100% - 24px);
    height: 2px;
    border-radius: 999px;
    background: ${C.accent};
    transition: transform 0.25s ease;
  }
  .sn-links a:hover,
  .sn-links a.active {
    color: ${C.accent};
    background: rgba(56,182,255,0.08);
  }
  .sn-links a:hover::after,
  .sn-links a.active::after { transform: translateX(-50%) scaleX(1); }
  .sn-links a.active { font-weight: 700; }

  /* ── CTA buttons ── */
  .sn-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .sn-btn-signin {
    padding: 9px 18px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
    color: ${C.accent};
    background: transparent;
    border: 1.5px solid ${C.borderStrong};
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s ease;
    white-space: nowrap;
    font-family: inherit;
  }
  .sn-btn-signin:hover {
    background: rgba(56,182,255,0.08);
    border-color: ${C.accent};
  }
  .sn-btn-getstarted {
    padding: 9px 18px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    background: ${C.accent};
    border: none;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s ease;
    box-shadow: 0 4px 14px rgba(56,182,255,0.35);
    white-space: nowrap;
    font-family: inherit;
  }
  .sn-btn-getstarted:hover {
    background: ${C.accentAlt};
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(56,182,255,0.45);
  }
  .sn-btn-getstarted:active { transform: translateY(0); }
  .sn-btn-signout {
    padding: 9px 18px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
    color: ${C.red};
    background: transparent;
    border: 1.5px solid rgba(239,68,68,0.3);
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    font-family: inherit;
  }
  .sn-btn-signout:hover {
    background: rgba(239,68,68,0.06);
    border-color: ${C.red};
  }

  /* ── Hamburger ── */
  .sn-hamburger {
    display: none;
    flex-direction: column;
    gap: 5px;
    cursor: pointer;
    padding: 7px;
    border-radius: 10px;
    background: rgba(56,182,255,0.07);
    border: 1.5px solid ${C.border};
    transition: background 0.2s;
    flex-shrink: 0;
  }
  .sn-hamburger:hover { background: rgba(56,182,255,0.13); }
  .sn-hamburger span {
    display: block;
    width: 20px;
    height: 2px;
    border-radius: 999px;
    background: ${C.body};
    transition: all 0.28s ease;
  }
  .sn-hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
  .sn-hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
  .sn-hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

  /* ── Mobile drawer ── */
  .sn-drawer {
    position: fixed;
    top: 88px;
    left: 12px;
    right: 12px;
    background: rgba(240,255,255,0.97);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border-radius: 20px;
    border: 1px solid rgba(56,182,255,0.18);
    box-shadow: 0 16px 40px rgba(56,182,255,0.14);
    padding: 12px;
    z-index: 49;
    overflow: hidden;
    max-height: 0;
    opacity: 0;
    transform: translateY(-8px);
    transition:
      max-height 0.32s cubic-bezier(0.4,0,0.2,1),
      opacity 0.25s ease,
      transform 0.28s ease;
    pointer-events: none;
  }
  .sn-drawer.open {
    max-height: 420px;
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }
  .sn-drawer-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 14px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    color: ${C.body};
    text-decoration: none;
    transition: background 0.18s, color 0.18s;
  }
  .sn-drawer-link:hover { background: rgba(56,182,255,0.08); color: ${C.accent}; }
  .sn-drawer-link svg { color: ${C.muted}; transition: color 0.18s; }
  .sn-drawer-link:hover svg { color: ${C.accent}; }
  .sn-drawer-divider {
    height: 1px;
    background: rgba(56,182,255,0.12);
    margin: 6px 0;
  }
  .sn-drawer-ctas {
    display: flex;
    flex-direction: column;
    gap: 7px;
    padding: 4px 2px 2px;
  }
  .sn-drawer-ctas .sn-btn-signin,
  .sn-drawer-ctas .sn-btn-getstarted,
  .sn-drawer-ctas .sn-btn-signout {
    width: 100%;
    text-align: center;
    padding: 11px 18px;
    display: block;
  }

  /* ── Responsive breakpoint ── */
  @media (max-width: 768px) {
    .sn-links   { display: none; }
    .sn-actions { display: none; }
    .sn-hamburger { display: flex; }
    .sn-nav-inner { padding: 0 18px; }
  }
`;

interface NavLinkItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!getStoredUser());
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close drawer on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const handleLogout = () => {
    clearSession();
    setIsLoggedIn(false);
    window.location.href = "/auth/login";
  };

  const navLinks: NavLinkItem[] = [
    { href: "/page/examplemenu", label: "Menu",       icon: <LayoutGrid size={16} /> },
    { href: "/page/pricing",     label: "Pricing",    icon: <Tag size={16} /> },
    { href: "/page/contact",     label: "Contact us", icon: <Mail size={16} /> },
  ];

  const AuthButtons = ({ mobile = false }: { mobile?: boolean }) =>
    !isLoggedIn ? (
      <>
        <Link
          href="/auth/login"
          className="sn-btn-signin"
          onClick={() => mobile && setMenuOpen(false)}
        >
          Sign in
        </Link>
        <Link
          href="/auth/register"
          className="sn-btn-getstarted"
          onClick={() => mobile && setMenuOpen(false)}
        >
          Get started
        </Link>
      </>
    ) : (
      <button onClick={handleLogout} className="sn-btn-signout">
        Sign out
      </button>
    );

  return (
    <>
      <style>{styles}</style>

      <nav className="sn-nav" aria-label="Main navigation">
        {/* ── Pill bar ── */}
        <div className={`sn-nav-inner${scrolled ? " scrolled" : ""}`}>
          {/* Logo */}
          <Link href="/" className="sn-logo">
            <img src="/logo/main/snblue.webp" alt="Scan Now" />
          </Link>

          {/* Desktop links */}
          <ul className="sn-links" role="list">
            {navLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={pathname === item.href ? "active" : ""}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop CTAs */}
          <div className="sn-actions">
            <AuthButtons />
          </div>

          {/* Hamburger */}
          <button
            className={`sn-hamburger${menuOpen ? " open" : ""}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </div>

        {/* ── Mobile drawer ── */}
        <div
          className={`sn-drawer${menuOpen ? " open" : ""}`}
          role="dialog"
          aria-label="Mobile navigation"
        >
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="sn-drawer-link"
              onClick={() => setMenuOpen(false)}
            >
              {item.icon}
              {item.label}
              <ChevronRight size={14} style={{ marginLeft: "auto", opacity: 0.4 }} />
            </Link>
          ))}
          <div className="sn-drawer-divider" />
          <div className="sn-drawer-ctas">
            <AuthButtons mobile />
          </div>
        </div>
      </nav>

      {/* Spacer so content clears the fixed navbar */}
      <div style={{ height: "88px" }} aria-hidden="true" />
    </>
  );
}