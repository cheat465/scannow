"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera, ImagePlus, MapPin, Phone, Plus, Trash2,
  Link as LinkIcon, FileText, Store, ChevronRight, X,
} from "lucide-react";
import {
  apiRequest, getStoredRestaurant, getStoredUser,
  ItemResponse, resolveAssetUrl, Restaurant, storeRestaurant,
} from "@/lib/api";

export default function AboutYourRestaurant() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [locationLink, setLocationLink] = useState("");
  const [phone, setPhone] = useState("");
  const [extraPhones, setExtraPhones] = useState<string[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const r = getStoredRestaurant();
    if (!r) return;
    setRestaurantId(r.id);
    setName(r.name ?? "");
    setDescription(r.description ?? "");
    const parts = (r.address ?? "").split("\n");
    setAddress(parts[0] ?? "");
    setLocationLink(parts[1] ?? "");
    setPhone(r.phone ?? "");
    setExtraPhones(r.phones ?? []);
    setLogoPreview(resolveAssetUrl(r.logo_url) ?? "");
  }, []);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); e.target.value = ""; return; }
    setError(null); setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") setLogoPreview(reader.result); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      const user = getStoredUser();
      const fullAddress = [address, locationLink].filter(Boolean).join("\n");
      let response: ItemResponse<Restaurant>;
      if (logoFile) {
        const fd = new FormData();
        if (restaurantId) fd.append("_method", "PATCH");
        if (user?.id) fd.append("user_id", String(user.id));
        fd.append("name", name); fd.append("description", description || "");
        fd.append("address", fullAddress || ""); fd.append("phone", phone || "");
        fd.append("phones", JSON.stringify(extraPhones));
        if (user?.email) fd.append("email", user.email);
        fd.append("logo", logoFile);
        response = await apiRequest<ItemResponse<Restaurant>>(
          restaurantId ? `/restaurants/${restaurantId}` : "/restaurants",
          { method: "POST", body: fd }
        );
      } else {
        response = await apiRequest<ItemResponse<Restaurant>>(
          restaurantId ? `/restaurants/${restaurantId}` : "/restaurants",
          { method: restaurantId ? "PATCH" : "POST", body: JSON.stringify({ user_id: user?.id ?? null, name, description: description || null, address: fullAddress || null, phone: phone || null, phones: extraPhones, email: user?.email ?? null }) }
        );
      }
      storeRestaurant(response.data);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save restaurant.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#EAF9FF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }

        /* ── Field styles ── */
        .fi-wrap { position: relative; }
        .fi-icon {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
          color: #94a3b8; pointer-events: none;
        }
        .fi {
          width: 100%; background: white; border: 1.5px solid #dbeafe;
          border-radius: 12px; padding: 10px 14px 10px 38px;
          color: #0f172a; font-size: 13.5px; font-family: 'DM Sans', sans-serif;
          outline: none; transition: border-color .15s, box-shadow .15s;
        }
        .fi:focus { border-color: #61A9E5; box-shadow: 0 0 0 3px rgba(97,169,229,.12); }
        .fi::placeholder { color: #94a3b8; }

        .flbl {
          font-size: 11.5px; font-weight: 700; color: #475569;
          margin-bottom: 6px; display: flex; align-items: center; gap: 5px;
        }

        /* ── Logo uploader ── */
        .logo-btn {
          width: 110px; height: 110px; border-radius: 50%;
          border: 3px dashed #bae6fd; background: white;
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; cursor: pointer; overflow: hidden;
          transition: border-color .2s, box-shadow .2s;
          box-shadow: 0 4px 20px rgba(97,169,229,.12);
        }
        .logo-btn:hover { border-color: #61A9E5; box-shadow: 0 6px 24px rgba(97,169,229,.2); }

        /* ── Buttons ── */
        .save-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          flex: 1; height: 46px; border-radius: 13px;
          background: linear-gradient(135deg, #61A9E5, #2e9be0);
          color: white; font-weight: 800; font-size: 14px; border: none;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 14px rgba(97,169,229,.3);
          transition: opacity .15s, transform .1s;
        }
        .save-btn:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
        .save-btn:disabled { opacity: .55; cursor: not-allowed; transform: none; }

        .cancel-btn {
          display: flex; align-items: center; justify-content: center;
          height: 46px; border-radius: 13px; padding: 0 22px;
          border: 1.5px solid #dbeafe; background: white;
          color: #475569; font-weight: 700; font-size: 14px;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: background .15s;
          text-decoration: none;
        }
        .cancel-btn:hover { background: #f0f9ff; }

        .add-phone-btn {
          display: flex; align-items: center; justify-content: center; gap: 7px;
          width: 100%; padding: 9px 14px; border-radius: 11px;
          border: 1.5px dashed #bae6fd; background: transparent;
          color: #61A9E5; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: background .15s;
        }
        .add-phone-btn:hover { background: #f0f9ff; }

        .remove-btn {
          width: 40px; height: 40px; flex-shrink: 0; border-radius: 10px;
          border: 1.5px solid #fecaca; background: #fef2f2;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #ef4444; transition: background .15s;
        }
        .remove-btn:hover { background: #fee2e2; }

        /* ── Layout: desktop = side by side, mobile = stacked ── */
        .page-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          min-height: 100vh;
        }

        /* ── Left panel ── */
        .left-panel {
          background: white;
          border-right: 1px solid #e0f2fe;
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 40px 24px;
          position: sticky; top: 0; height: 100vh;
          box-shadow: 2px 0 16px rgba(97,169,229,.06);
        }

        /* ── Right panel ── */
        .right-panel {
          display: flex; flex-direction: column;
          min-height: 100vh;
        }

        .form-body {
          flex: 1; padding: 28px 36px;
          display: flex; flex-direction: column; gap: 20px;
        }

        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        /* ── Mobile overrides ── */
        @media (max-width: 768px) {
          .page-layout {
            grid-template-columns: 1fr;
          }
          .left-panel {
            position: relative; height: auto;
            padding: 28px 20px 20px;
            border-right: none;
            border-bottom: 1px solid #e0f2fe;
            flex-direction: row; justify-content: flex-start; gap: 18px;
          }
          .left-preview-text { text-align: left !important; }
          .form-body { padding: 20px 18px; gap: 16px; }
          .two-col { grid-template-columns: 1fr; gap: 14px; }
          .form-footer { padding: 14px 18px !important; }
        }

        @media (max-width: 480px) {
          .left-panel { flex-direction: column; align-items: center; }
          .left-preview-text { text-align: center !important; }
          .logo-btn { width: 90px; height: 90px; }
        }

        .spin { animation: spin .7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="page-layout">

        {/* ════ LEFT — Logo + Live Preview ════ */}
        <div className="left-panel">
          {/* Logo upload */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div className="logo-btn" onClick={() => fileInputRef.current?.click()}>
              {logoPreview
                ? <img src={logoPreview} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <>
                    <Camera size={26} style={{ color: "#61A9E5" }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#61A9E5", marginTop: 4 }}>Add Photo</span>
                  </>
              }
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{ position: "absolute", bottom: 3, right: 3, width: 30, height: 30, borderRadius: "50%", background: "#61A9E5", border: "2.5px solid white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(97,169,229,.4)" }}
            >
              <ImagePlus size={13} style={{ color: "white" }} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoFileChange} style={{ display: "none" }} />
          </div>

          {/* Live text preview */}
          <div className="left-preview-text" style={{ textAlign: "center", flex: 1 }}>
            <p style={{ fontSize: 16, fontWeight: 900, color: name ? "#0f172a" : "#cbd5e1", margin: "0 0 4px", lineHeight: 1.2, transition: "color .2s" }}>
              {name || "Your restaurant name"}
            </p>
            {description && (
              <p style={{ fontSize: 12.5, color: "#64748b", margin: "0 0 10px", lineHeight: 1.4 }}>{description}</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
              {address && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }}>
                  <MapPin size={12} style={{ color: "#61A9E5", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#64748b" }}>{address}</span>
                </div>
              )}
              {phone && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }}>
                  <Phone size={12} style={{ color: "#61A9E5", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#64748b" }}>{phone}</span>
                </div>
              )}
              {!name && !address && !phone && (
                <p style={{ fontSize: 12, color: "#cbd5e1", margin: 0 }}>Your info will appear here as you fill in the form</p>
              )}
            </div>
          </div>
        </div>

        {/* ════ RIGHT — Form ════ */}
        <div className="right-panel">

          {/* Header */}
          {/* <div style={{ flexShrink: 0, padding: "20px 36px 16px", background: "rgba(255,255,255,.8)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(186,230,253,.5)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Store size={18} style={{ color: "#61A9E5" }} />
              </div>
              <div>
                <h1 style={{ fontSize: 17, fontWeight: 900, color: "#0f172a", margin: 0 }}>
                  {restaurantId ? "Update your restaurant profile." : "About Your Restaurant"}
                </h1>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
                  {restaurantId ? "Update your restaurant profile." : "Fill in your restaurant details to get started."}
                </p>
              </div>
            </div>
          </div> */}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div className="form-body">

              {error && (
                <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 13, color: "#dc2626", display: "flex", alignItems: "center", gap: 8 }}>
                  <X size={14} style={{ flexShrink: 0 }} />{error}
                </div>
              )}

              {/* Name + Description */}
              <div className="two-col">
                <div>
                  <div className="flbl"><Store size={13} />Place Name <span style={{ color: "#61A9E5" }}>*</span></div>
                  <div className="fi-wrap">
                    <Store size={15} className="fi-icon" />
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Pkay Restaurant" required className="fi" />
                  </div>
                </div>
                <div>
                  <div className="flbl"><FileText size={13} />Description <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400 }}>(optional)</span></div>
                  <div className="fi-wrap">
                    <FileText size={15} className="fi-icon" />
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="A short tagline…" className="fi" />
                  </div>
                </div>
              </div>

              {/* Location + Link */}
              <div className="two-col">
                <div>
                  <div className="flbl"><MapPin size={13} />Location Name</div>
                  <div className="fi-wrap">
                    <MapPin size={15} className="fi-icon" />
                    <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. Phnom Penh, Cambodia" className="fi" />
                  </div>
                </div>
                <div>
                  <div className="flbl"><LinkIcon size={13} />Location Link <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400 }}>(optional)</span></div>
                  <div className="fi-wrap">
                    <LinkIcon size={15} className="fi-icon" />
                    <input type="url" value={locationLink} onChange={e => setLocationLink(e.target.value)} placeholder="Google Maps URL" className="fi" />
                  </div>
                </div>
              </div>

              {/* Phone + extras */}
              <div>
                <div className="flbl"><Phone size={13} />Phone Numbers</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div className="fi-wrap">
                    <Phone size={15} className="fi-icon" />
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Primary phone number" className="fi" />
                  </div>

                  {extraPhones.map((ep, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div className="fi-wrap" style={{ flex: 1 }}>
                        <Phone size={15} className="fi-icon" />
                        <input type="tel" value={ep} onChange={e => { const n = [...extraPhones]; n[idx] = e.target.value; setExtraPhones(n); }} placeholder={`Extra phone ${idx + 1}`} className="fi" />
                      </div>
                      <button type="button" className="remove-btn" onClick={() => setExtraPhones(extraPhones.filter((_, i) => i !== idx))}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}

                  <button type="button" className="add-phone-btn" onClick={() => setExtraPhones([...extraPhones, ""])}>
                    <Plus size={15} />Add Extra Number
                  </button>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="form-footer" style={{ flexShrink: 0, padding: "16px 36px", borderTop: "1px solid #e0f2fe", background: "rgba(255,255,255,.85)", display: "flex", gap: 10, alignItems: "center" }}>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => restaurantId ? router.push("/dashboard") : router.back()}
              >
                Cancel
              </button>
              <button type="submit" disabled={loading} className="save-btn">
                {loading
                  ? <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.35)", borderTopColor: "white", borderRadius: "50%", display: "inline-block" }} className="spin" />Saving…</>
                  : <>{restaurantId ? "Update Restaurant" : "Create Restaurant"}<ChevronRight size={16} /></>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}