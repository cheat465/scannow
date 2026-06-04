"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, resolveAssetUrl } from "@/lib/api";
import {
  ArrowLeft,
  User,
  AtSign,
  Phone,
  ShieldCheck,
  Lock,
  Save,
  Loader2,
  Mail,
  Camera,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

/* ── Design tokens ── */
const P = {
  navy:      "#0e3a52",
  blue:      "#38B6FF",
  blueMid:   "#61A9E5",
  blueLight: "#a8d8f0",
  bluePale:  "#c8eef7",
  bgBase:    "#EFFFFF",
  bgSurface: "#EAF9FF",
  white:     "#ffffff",
  border:    "#daf2fb",
};

/* ── Field wrapper ── */
const Field = ({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    <label
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: P.blueMid,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        paddingLeft: 2,
      }}
    >
      {label}
    </label>
    <div style={{ position: "relative" }}>
      <Icon
        size={15}
        style={{
          position: "absolute",
          left: 13,
          top: "50%",
          transform: "translateY(-50%)",
          color: P.blueLight,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      {children}
    </div>
  </div>
);

/* ── Base input style ── */
const baseInput: React.CSSProperties = {
  width: "100%",
  paddingLeft: 38,
  paddingRight: 14,
  paddingTop: 12,
  paddingBottom: 12,
  background: P.bgSurface,
  border: "1.5px solid transparent",
  borderRadius: 12,
  fontSize: 13,
  fontWeight: 500,
  color: P.navy,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
  fontFamily: "inherit",
  WebkitAppearance: "none",
};

export default function CreateAdminUser() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    role: "admin",
    password: "",
    profile_image: "",
  });

  /* focused input style */
  const fs = (name: string): React.CSSProperties => ({
    ...baseInput,
    borderColor: focused === name ? P.blue : "transparent",
    background: focused === name ? P.white : P.bgSurface,
    boxShadow: focused === name ? `0 0 0 3px ${P.bluePale}` : "none",
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setFormData({ ...formData, profile_image: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiRequest("/admin/admin-users", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      router.push("/admin/users");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans','DM Sans','Segoe UI',sans-serif",
        background: P.bgBase,
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      {/* ── Sticky Header ── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: P.bgBase,
          borderBottom: `1px solid ${P.border}`,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Link
          href="/admin/users"
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: P.white,
            border: `1.5px solid ${P.bluePale}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: P.blue,
            textDecoration: "none",
            flexShrink: 0,
            boxShadow: "0 1px 4px rgba(56,182,255,0.10)",
          }}
        >
          <ArrowLeft size={17} />
        </Link>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: P.navy,
              margin: 0,
              letterSpacing: "-0.3px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Create Admin User
          </h1>
          <p
            style={{
              fontSize: 12,
              color: P.blueMid,
              margin: "1px 0 0",
              fontWeight: 500,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Add admin member to the dashboard
          </p>
        </div>
      </div>

      {/* ── Step pills (scrollable on mobile) ── */}
      <div
        style={{
          padding: "10px 16px",
          overflowX: "auto",
          display: "flex",
          gap: 8,
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
        }}
      >

      </div>

      {/* ── Main Content ── */}
      <div style={{ padding: "0 16px 24px" }}>
        {/* Error banner */}
        {error && (
          <div
            style={{
              padding: "12px 16px",
              background: "#fff0f0",
              border: "1px solid #fcd0d0",
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              color: "#c0392b",
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            ⚠ {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          {/* ── Card wrapper ── */}
          <div
            style={{
              background: P.white,
              borderRadius: 20,
              border: `1.5px solid ${P.border}`,
              overflow: "hidden",
              boxShadow: "0 2px 16px rgba(56,182,255,0.07)",
            }}
          >
            {/* Accent bar */}
            <div
              style={{
                height: 3,
                background: `linear-gradient(90deg, ${P.navy}, ${P.blue}, ${P.blueMid})`,
              }}
            />

            <div style={{ padding: "18px 16px", display: "flex", flexDirection: "column", gap: 18 }}>

              {/* ── Avatar row ── */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "14px 16px",
                  background: P.bgSurface,
                  borderRadius: 14,
                }}
              >
                <label style={{ cursor: "pointer", flexShrink: 0 }}>
                  <div
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: 16,
                      background: P.bluePale,
                      border: `2px dashed ${P.blueMid}`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      gap: 4,
                      transition: "border-color 0.2s",
                    }}
                  >
                    {formData.profile_image ? (
                      <img
                        src={resolveAssetUrl(formData.profile_image)}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <>
                        <Camera size={20} color={P.blue} />
                        <span
                          style={{
                            fontSize: 8,
                            fontWeight: 800,
                            color: P.blueMid,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                          }}
                        >
                          Upload
                        </span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleImageUpload}
                  />
                </label>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: P.navy, margin: "0 0 4px" }}>
                    Profile Photo
                  </p>
                  <p style={{ fontSize: 11, color: P.blueMid, margin: 0, lineHeight: 1.4 }}>
                    JPG, PNG or GIF — max 2MB
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      marginTop: 8,
                    }}
                  >
                    {formData.profile_image ? (
                      <>
                        <CheckCircle2 size={12} color={P.blue} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: P.blue, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Photo selected
                        </span>
                      </>
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 600, color: P.blueLight, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        No photo selected
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Account Information ── */}
              <div>
                <SectionTitle color={P.blue} label="Account Information" />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "12px 14px",
                  }}
                >
                  <Field label="Full Name" icon={User}>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      placeholder="e.g. Preap Sovath"
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      onFocus={() => setFocused("name")}
                      onBlur={() => setFocused(null)}
                      style={fs("name")}
                    />
                  </Field>
                  <Field label="Username" icon={AtSign}>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      placeholder="preapsovath"
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      onFocus={() => setFocused("username")}
                      onBlur={() => setFocused(null)}
                      style={fs("username")}
                    />
                  </Field>
                  <Field label="Email Address" icon={Mail}>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      placeholder="preapsovath@gmail.com"
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      onFocus={() => setFocused("email")}
                      onBlur={() => setFocused(null)}
                      style={fs("email")}
                    />
                  </Field>
                  <Field label="Phone Number" icon={Phone}>
                    <input
                      type="tel"
                      value={formData.phone}
                      placeholder="010 900 900"
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      onFocus={() => setFocused("phone")}
                      onBlur={() => setFocused(null)}
                      style={fs("phone")}
                    />
                  </Field>
                </div>
              </div>

              {/* ── Access & Security ── */}
              <div>
                
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "12px 14px",
                  }}
                >
                  <Field label="Access Role" icon={ShieldCheck}>
                    <select
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      onFocus={() => setFocused("role")}
                      onBlur={() => setFocused(null)}
                      style={{
                        ...fs("role"),
                        appearance: "none",
                        WebkitAppearance: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="super admin">Super Admin</option>
                      <option value="admin">Admin</option>
                      <option value="supporter">Supporter</option>
                    </select>
                  </Field>
                  <Field label="Password" icon={Lock}>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={formData.password}
                      placeholder="Min. 8 characters"
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      onFocus={() => setFocused("password")}
                      onBlur={() => setFocused(null)}
                      style={fs("password")}
                    />
                  </Field>
                </div>
              </div>

              {/* ── Role hint pills ── */}
              {/* <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  padding: "12px 14px",
                  background: P.bgSurface,
                  borderRadius: 14,
                }}
              >
                {[
                  { role: "Super Admin", desc: "Full platform access",       dot: P.navy    },
                  { role: "Admin",       desc: "Manage users & restaurants", dot: P.blue    },
                  { role: "Supporter",   desc: "View only + support tools",  dot: P.blueMid },
                ].map((r) => (
                  <div
                    key={r.role}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 12px",
                      borderRadius: 20,
                      background: P.white,
                      border: `1.5px solid ${P.border}`,
                    }}
                  >
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: r.dot,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 11, fontWeight: 700, color: P.navy }}>
                      {r.role}
                    </span>
                    <span style={{ fontSize: 11, color: P.blueMid }}>— {r.desc}</span>
                  </div>
                ))}
              </div> */}
            </div>
          </div>

          {/* ── Actions (sticky on mobile) ── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                background: loading ? P.blueLight : P.blue,
                color: P.white,
                border: "none",
                borderRadius: 13,
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: loading ? 0.75 : 1,
                fontFamily: "inherit",
                transition: "background 0.2s, transform 0.1s",
                boxShadow: loading ? "none" : `0 4px 14px rgba(56,182,255,0.35)`,
              }}
            >
              {loading ? (
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <Save size={16} />
              )}
              {loading ? "Creating…" : "Create User"}
            </button>
            <Link
              href="/admin/users"
              style={{
                width: "100%",
                padding: "13px",
                background: P.bgSurface,
                color: P.blueMid,
                border: `1.5px solid ${P.bluePale}`,
                borderRadius: 13,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
              }}
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        input::placeholder, textarea::placeholder { color: ${P.blueLight}; }
        select option { background: #fff; color: ${P.navy}; }
        ::-webkit-scrollbar { display: none; }

        @media (min-width: 640px) {
          /* On tablet+, show back as row and slightly wider padding */
        }
      `}</style>
    </div>
  );
}

/* ── Section title helper ── */
function SectionTitle({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <div
        style={{ width: 3, height: 16, borderRadius: 99, background: color }}
      />
      <span
        style={{
          fontSize: 10.5,
          fontWeight: 800,
          color: "#0e3a52",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
  );
}