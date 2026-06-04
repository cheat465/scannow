"use client";

import React, { useState, useEffect } from "react";
import {
  QrCode,
  Download,
  Printer,
  Copy,
  Check,
  Table as TableIcon,
  ArrowLeft
} from "lucide-react";
import QRCode from "qrcode";
import { getStoredRestaurant, Restaurant } from "@/lib/api";
import { useLanguage } from "@/app/contexts/LanguageContext";
import Link from "next/link";

export default function QRCodePage() {
  const { language, t } = useLanguage();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [tableNumber, setTableNumber] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const storedRestaurant = getStoredRestaurant();
    setRestaurant(storedRestaurant);
  }, []);

  useEffect(() => {
    if (restaurant) generateQRCode();
  }, [restaurant, tableNumber]);

  const generateQRCode = async () => {
    try {
      const baseUrl = window.location.origin;
      const tableNum = tableNumber ? tableNumber.replace(/[^0-9]/g, "") : "";
      const menuUrl = `${baseUrl}/page/menu?restaurant_id=${restaurant?.id}${tableNum ? `&table=${tableNum}` : ""}`;
      const url = await QRCode.toDataURL(menuUrl, {
        width: 1000,
        margin: 2,
        color: { dark: "#0f172a", light: "#ffffff" },
      });
      setQrCodeUrl(url);
    } catch (err) {
      console.error("Failed to generate QR Code:", err);
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `qrcode-${restaurant?.name || "restaurant"}${tableNumber ? `-table-${tableNumber}` : ""}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQRCode = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code - ${restaurant?.name}</title>
            <style>
              body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background: white; }
              img { width: 400px; height: 400px; }
              h1 { margin-bottom: 0; color: #0f172a; font-size: 28px; }
              p { margin-top: 10px; font-size: 22px; font-weight: bold; color: #64748b; }
            </style>
          </head>
          <body>
            <h1>${restaurant?.name || "Restaurant"}</h1>
            <img src="${qrCodeUrl}" />
            ${tableNumber ? `<p>Table ${tableNumber}</p>` : ""}
            <script>window.onload = () => { window.print(); window.close(); };<\/script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const copyToClipboard = () => {
    const baseUrl = window.location.origin;
    const tableNum = tableNumber ? tableNumber.replace(/[^0-9]/g, "") : "";
    const menuUrl = `${baseUrl}/page/menu?restaurant_id=${restaurant?.id}${tableNum ? `&table=${tableNum}` : ""}`;
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif", background: "linear-gradient(135deg, #EAF9FF 0%, #F0FFFE 50%, #E8F4FF 100%)" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }

        .ring {
          position: absolute; border-radius: 50%;
          border: 1px solid rgba(97,169,229,0.15);
          animation: pr 4s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes pr { 0%,100%{transform:scale(1);opacity:1;} 50%{transform:scale(1.04);opacity:0.3;} }

        .action-btn {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          border-radius: 10px; font-weight: 700;
          font-family: 'DM Sans', sans-serif; cursor: pointer; border: none;
          transition: opacity 0.15s, transform 0.1s; white-space: nowrap;
        }
        .action-btn:hover { opacity: 0.88; transform: translateY(-1px); }
        .action-btn:active { transform: translateY(0) scale(0.97); }

        .ghost-btn {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          border-radius: 10px; font-weight: 600;
          font-family: 'DM Sans', sans-serif; cursor: pointer;
          border: 1.5px solid #dbeafe; background: white; color: #475569;
          transition: background 0.15s, border-color 0.15s; white-space: nowrap;
        }
        .ghost-btn:hover { background: #f0f9ff; border-color: #7dd3fc; }

        /* Table input pill */
        .table-pill {
          display: flex; align-items: center; gap: 8px;
          background: white; border: 1.5px solid #dbeafe;
          border-radius: 12px; transition: border-color 0.15s, box-shadow 0.15s;
        }
        .table-pill:focus-within {
          border-color: #61A9E5;
          box-shadow: 0 0 0 3px rgba(97,169,229,0.13);
        }
        .table-pill input {
          border: none; outline: none; background: transparent;
          color: #0f172a; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
        }
        .table-pill input::placeholder { color: #94a3b8; font-weight: 400; }

        /* Scan hint pulse */
        @keyframes scanPulse {
          0%, 100% { box-shadow: 0 20px 60px rgba(97,169,229,0.18), 0 4px 16px rgba(0,0,0,0.05); }
          50% { box-shadow: 0 24px 72px rgba(97,169,229,0.30), 0 4px 20px rgba(0,0,0,0.07); }
        }
        .qr-card { animation: scanPulse 3s ease-in-out infinite; }
      `}</style>

      {/* ── Header ── */}
      <div
        style={{
          flexShrink: 0,
          borderBottom: "1px solid rgba(186,230,253,0.5)",
          background: "rgba(255,255,255,0.65)",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Desktop header */}
        <div
          className="hidden sm:flex"
          style={{
            padding: "16px 28px",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          {/* Title */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <Link href="/dashboard/menu" style={{ width: 34, height: 34, borderRadius: "50%", background: "#f0f9ff", border: "1.5px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center", color: "#61A9E5", textDecoration: "none" }}>
              <ArrowLeft size={16} />
            </Link>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <QrCode size={20} style={{ color: "#61A9E5" }} />
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>{t.qrCodeGenerator}</h1>
              {restaurant?.name && <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{restaurant.name}</p>}
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {/* Table pill */}
            <div className="table-pill" style={{ padding: "7px 12px 7px 10px" }}>
              <TableIcon size={15} style={{ color: "#61A9E5", flexShrink: 0 }} />
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder={t.tableNumberOptional}
                style={{ fontSize: 13, width: 170 }}
              />
            </div>

            <div style={{ width: 1, height: 28, background: "#dbeafe", flexShrink: 0 }} />

            <button onClick={copyToClipboard} className="ghost-btn" style={{ padding: "9px 16px", fontSize: 13 }}>
              {copied
                ? <><Check size={14} style={{ color: "#22c55e" }} /><span style={{ color: "#22c55e" }}>{t.copied}</span></>
                : <><Copy size={14} />{t.copyLink}</>}
            </button>

            <button onClick={downloadQRCode} className="action-btn" style={{ padding: "9px 16px", fontSize: 13, background: "#f1f5f9", color: "#334155", border: "1.5px solid #e2e8f0" }}>
              <Download size={14} />{t.download}
            </button>

            <button onClick={printQRCode} className="action-btn" style={{ padding: "9px 18px", fontSize: 13, background: "#61A9E5", color: "white", boxShadow: "0 4px 12px rgba(97,169,229,0.35)" }}>
              <Printer size={14} />{t.print}
            </button>
          </div>
        </div>

        {/* Mobile header */}
        <div className="flex sm:hidden" style={{ padding: "12px 16px", alignItems: "center", gap: 10 }}>
          <Link href="/dashboard/menu" style={{ width: 32, height: 32, borderRadius: "50%", background: "#f0f9ff", border: "1.5px solid #dbeafe", display: "flex", alignItems: "center", justifyContent: "center", color: "#61A9E5", textDecoration: "none", flexShrink: 0 }}>
            <ArrowLeft size={15} />
          </Link>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <QrCode size={17} style={{ color: "#61A9E5" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>{t.qrCodeGenerator}</h1>
            {restaurant?.name && <p style={{ fontSize: 10, color: "#94a3b8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{restaurant.name}</p>}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          padding: "24px 16px",
        }}
      >
        {/* Decorative rings — hidden on tiny screens */}
        {/* <div className="hidden sm:block">
          <div className="ring" style={{ width: 540, height: 540, animationDelay: "1.3s" }} />
          <div className="ring" style={{ width: 700, height: 700, animationDelay: "2.6s" }} />
        </div> */}

        {/* QR card + label */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 20, width: "100%", maxWidth: 360 }}>

          {/* Mobile: Table input inline above card */}
          <div className="flex sm:hidden w-full">
            <div className="table-pill" style={{ padding: "9px 14px 9px 12px", width: "100%" }}>
              <TableIcon size={15} style={{ color: "#61A9E5", flexShrink: 0 }} />
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder={t.tableNumberOptional}
                style={{ fontSize: 13.5, flex: 1 }}
              />
            </div>
          </div>

          {/* QR Card */}
          <div
            className="qr-card"
            style={{
              background: "white",
              borderRadius: 28,
              padding: 20,
              border: "1px solid #dbeafe",
              position: "relative",
            }}
          >
            {/* Corner brackets */}
            {[
              { top: 8, left: 8, borderTop: "3px solid #61A9E5", borderLeft: "3px solid #61A9E5", borderRadius: "7px 0 0 0" },
              { top: 8, right: 8, borderTop: "3px solid #61A9E5", borderRight: "3px solid #61A9E5", borderRadius: "0 7px 0 0" },
              { bottom: 8, left: 8, borderBottom: "3px solid #61A9E5", borderLeft: "3px solid #61A9E5", borderRadius: "0 0 0 7px" },
              { bottom: 8, right: 8, borderBottom: "3px solid #61A9E5", borderRight: "3px solid #61A9E5", borderRadius: "0 0 7px 0" },
            ].map((s, i) => (
              <div key={i} style={{ position: "absolute", width: 20, height: 20, ...s }} />
            ))}

            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="QR Code"
                style={{ width: 220, height: 220, display: "block", borderRadius: 8 }}
                className="sm:w-[260px] sm:h-[260px]"
              />
            ) : (
              <div style={{ width: 220, height: 220, background: "#f8fafc", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }} className="sm:w-[260px] sm:h-[260px]">
                <QrCode size={54} style={{ color: "#bae6fd" }} />
              </div>
            )}
          </div>

          {/* Label */}
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }} className="sm:text-[26px]">
              {tableNumber ? `${t.table} ${tableNumber}` : t.generalMenu}
            </h2>
          </div>

          {/* Meta strip */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ height: 1, width: 32, background: "#bae6fd", display: "block" }} />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {restaurant?.name || t.scanNow}
            </span>
            <span style={{ height: 1, width: 32, background: "#bae6fd", display: "block" }} />
          </div>

          {/* Mobile action buttons — 3 pill buttons below QR */}
          <div className="flex sm:hidden" style={{ display: "flex", gap: 8, width: "100%" }}>
            <button
              onClick={copyToClipboard}
              className="ghost-btn"
              style={{ flex: 1, padding: "11px 8px", fontSize: 12.5, flexDirection: "column", gap: 4, borderRadius: 14, height: 64 }}
            >
              {copied
                ? <Check size={18} style={{ color: "#22c55e" }} />
                : <Copy size={18} style={{ color: "#61A9E5" }} />}
              <span style={{ color: copied ? "#22c55e" : "#475569", fontSize: 11, fontWeight: 700 }}>
                {copied ? t.copied : t.copyLink}
              </span>
            </button>

            <button
              onClick={downloadQRCode}
              className="action-btn"
              style={{ flex: 1, padding: "11px 8px", fontSize: 12.5, flexDirection: "column", gap: 4, background: "#f1f5f9", color: "#334155", border: "1.5px solid #e2e8f0", borderRadius: 14, height: 64 }}
            >
              <Download size={18} style={{ color: "#334155" }} />
              <span style={{ fontSize: 11, fontWeight: 700 }}>{t.download}</span>
            </button>

          </div>

          {/* Scan hint */}
          <p style={{ fontSize: 11.5, color: "#94a3b8", margin: 0, textAlign: "center" }}>
            {language === "kh" ? "ស្កែនដើម្បីបើកម៉ឺនុយ" : "Scan with any camera app to open the menu"}
          </p>
        </div>
      </div>
    </div>
  );
}