"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus, Leaf, CheckCircle2, ChevronLeft, X } from "lucide-react";
import { useRef, useState, useEffect, useMemo } from "react";
import {
  apiRequest,
  getStoredRestaurant,
  getStoredRestaurantId,
  ItemResponse,
  MenuItem,
  Restaurant,
  resolveAssetUrl,
  storeRestaurant,
} from "@/lib/api";
import { useLanguage } from "@/app/contexts/LanguageContext";

type MenuCategory = string;

export default function MenuItemForm() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>("food");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [priceKhr, setPriceKhr] = useState("");
  const [isAutoCalculate, setIsAutoCalculate] = useState(true);
  const [exchangeRate, setExchangeRate] = useState(4000);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(() => {
    return restaurant?.categories || ["food", "drinks", "dessert"];
  }, [restaurant]);

  useEffect(() => {
    async function fetchRestaurant() {
      try {
        const restaurantId = getStoredRestaurantId();
        if (restaurantId) {
          const response = await apiRequest<ItemResponse<Restaurant>>(`/restaurants/${restaurantId}`);
          const restaurantData = response.data;
          setRestaurant(restaurantData);
          storeRestaurant(restaurantData);
          if (restaurantData.usd_to_khr_rate) setExchangeRate(restaurantData.usd_to_khr_rate);
          const firstCat = restaurantData.categories?.[0];
          if (firstCat) setSelectedCategory(firstCat);
        } else {
          const res = getStoredRestaurant();
          if (res) {
            setRestaurant(res);
            if (res.usd_to_khr_rate) setExchangeRate(res.usd_to_khr_rate);
            const firstCat = res.categories?.[0];
            if (firstCat) setSelectedCategory(firstCat);
          }
        }
      } catch (err) {
        console.error("Failed to fetch restaurant:", err);
        const res = getStoredRestaurant();
        if (res) {
          setRestaurant(res);
          if (res.usd_to_khr_rate) setExchangeRate(res.usd_to_khr_rate);
          const firstCat = res.categories?.[0];
          if (firstCat) setSelectedCategory(firstCat);
        }
      }
    }
    fetchRestaurant();
  }, []);

  useEffect(() => {
    if (isAutoCalculate && price) {
      const calculated = Math.round((Number(price) * exchangeRate) / 100) * 100;
      setPriceKhr(calculated.toString());
    }
  }, [price, isAutoCalculate, exchangeRate]);

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t.pleaseChooseAnImageFile);
      event.target.value = "";
      return;
    }
    setImageFile(file);
    setImageUrl("");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(event.target.value);
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearImage = () => {
    setImagePreview("");
    setImageUrl("");
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const restaurantId = getStoredRestaurantId();
      if (!restaurantId) throw new Error("Please create your restaurant profile before adding menu items.");
      const formData = new FormData();
      formData.append("name", name);
      formData.append("category", selectedCategory);
      formData.append("price", price);
      if (priceKhr) formData.append("price_khr", priceKhr);
      formData.append("is_available", available ? "1" : "0");
      if (description) formData.append("description", description);
      if (imageFile) formData.append("image", imageFile);
      else if (imageUrl) formData.append("image_url", imageUrl);
      await apiRequest<ItemResponse<MenuItem>>(`/restaurants/${restaurantId}/menu-items`, { method: "POST", body: formData });
      router.push("/dashboard/menu");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : t.couldNotSaveMenuItem);
    } finally {
      setLoading(false);
    }
  };

  const hasImage = imagePreview || imageUrl;

  return (
    <div
      className="flex flex-col overflow-y-auto lg:overflow-hidden lg:h-screen"
      style={{ background: "linear-gradient(135deg, #e0f7ff 0%, #f0fffe 50%, #e8f4ff 100%)", fontFamily: "'DM Sans', sans-serif", minHeight: "100dvh" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap');
        * { box-sizing: border-box; }

        .fi {
          width: 100%;
          background: white;
          border: 1.5px solid #dbeafe;
          border-radius: 10px;
          padding: 9px 13px;
          color: #0f172a;
          font-size: 13.5px;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.15s, box-shadow 0.15s;
          outline: none;
        }
        .fi:focus { border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56,189,248,0.12); }
        .fi::placeholder { color: #94a3b8; }
        .fi:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }

        .card {
          background: rgba(255,255,255,0.82);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(186,230,253,0.6);
          border-radius: 18px;
        }

        .flbl {
          display: block;
          font-size: 11.5px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 6px;
        }

        .cat-chip {
          padding: 5px 14px;
          border-radius: 99px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          border: 1.5px solid #dbeafe;
          background: white;
          color: #64748b;
          transition: all 0.15s;
          text-transform: capitalize;
          white-space: nowrap;
          font-family: 'DM Sans', sans-serif;
        }
        .cat-chip:hover { border-color: #7dd3fc; color: #0369a1; }
        .cat-chip.active { background: #0ea5e9; border-color: #0ea5e9; color: white; }

        .toggle-wrap { position: relative; display: inline-flex; width: 42px; height: 23px; cursor: pointer; flex-shrink: 0; }
        .toggle-wrap input { opacity: 0; width: 0; height: 0; position: absolute; }
        .toggle-track { position: absolute; inset: 0; background: #cbd5e1; border-radius: 99px; transition: background 0.2s; }
        .toggle-wrap input:checked ~ .toggle-track { background: #0ea5e9; }
        .toggle-thumb { position: absolute; top: 3px; left: 3px; width: 17px; height: 17px; background: white; border-radius: 50%; transition: transform 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
        .toggle-wrap input:checked ~ .toggle-track ~ .toggle-thumb { transform: translateX(19px); }

        .save-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          color: white; font-weight: 700; font-size: 14px; letter-spacing: 0.01em;
          border-radius: 12px; padding: 0 28px; height: 48px; border: none;
          cursor: pointer; width: 100%; font-family: 'DM Sans', sans-serif;
          transition: opacity 0.15s, transform 0.1s;
          box-shadow: 0 4px 14px rgba(14,165,233,0.35);
        }
        .save-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(14,165,233,0.4); }
        .save-btn:active:not(:disabled) { transform: translateY(0); }
        .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .cancel-btn {
          display: flex; align-items: center; justify-content: center;
          border: 1.5px solid #dbeafe; background: white; color: #475569;
          font-weight: 600; font-size: 14px; border-radius: 12px;
          padding: 0 28px; height: 48px; width: 100%;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.15s, border-color 0.15s;
          text-decoration: none;
        }
        .cancel-btn:hover { background: #f0f9ff; border-color: #7dd3fc; }

        .img-zone {
          border: 2px dashed #bae6fd;
          border-radius: 14px;
          background: rgba(255,255,255,0.7);
          overflow: hidden;
          transition: border-color 0.15s, background 0.15s;
          cursor: pointer;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .img-zone:hover { border-color: #38bdf8; background: rgba(240,249,255,0.8); }

        .cur-wrap { position: relative; }
        .cur-wrap .fi { padding-right: 34px; }
        .cur-badge { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 13px; font-weight: 700; color: #94a3b8; pointer-events: none; }

        .option-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 12px; border-radius: 12px; background: rgba(248,250,252,0.8);
          border: 1px solid #e2e8f0;
        }

        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Mobile scrollbar hide */
        .no-sb::-webkit-scrollbar { display: none; }
        .no-sb { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ── Top Bar ── */}
      <header
        className="flex items-center justify-between flex-shrink-0"
        style={{
          padding: "12px 16px",
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(186,230,253,0.5)",
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/menu"
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "#f0f9ff", border: "1.5px solid #dbeafe",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#0ea5e9", textDecoration: "none", flexShrink: 0,
            }}
          >
            <ChevronLeft size={18} />
          </Link>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.2 }} className="sm:text-[20px]">
              {t.addMenuItem}
            </h1>
            <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{t.fillInAllDetails}</p>
          </div>
        </div>

        {/* Desktop: save + cancel in header */}
        <div className="hidden lg:flex items-center gap-3">
          <Link href="/dashboard/menu" className="cancel-btn" style={{ height: 40, width: "auto", padding: "0 20px", fontSize: 13 }}>
            {t.cancel}
          </Link>
          <button
            type="submit" form="menu-item-form" disabled={loading}
            className="save-btn"
            style={{ height: 40, width: "auto", padding: "0 24px", fontSize: 13 }}
          >
            {loading ? (
              <>
                <span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block" }} className="spin" />
                {t.saving}
              </>
            ) : t.saveItem}
          </button>
        </div>
      </header>

      {/* ── Error bar ── */}
      {error && (
        <div style={{ margin: "8px 16px 0", padding: "10px 14px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 13, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <X size={14} style={{ flexShrink: 0 }} />
          <span>{error}{" "}<Link href="/page/about-restaurant" style={{ fontWeight: 700, textDecoration: "underline", color: "#dc2626" }}>{t.createRestaurantLink}</Link></span>
        </div>
      )}

      {/* ── Form ── */}
      {/*
        Layout:
          mobile  : single column, scrollable
          md      : 2 columns (image | details+options)
          lg      : 3 columns (image | details | options) — fills screen height, no scroll
      */}
      <form
        id="menu-item-form"
        onSubmit={handleSubmit}
        className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[280px_1fr_260px] no-sb"
        style={{ gap: 14, padding: "14px 16px 24px", overflowY: "auto", minHeight: 0 }}
      >

        {/* ════ IMAGE COLUMN ════ */}
        <div className="flex flex-col gap-3 md:row-span-2 lg:row-span-1">
          <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10, height: "100%" }}>
            <span className="flbl">{t.itemPhoto}</span>

            {/* Drop zone */}
            <div
              className="img-zone"
              onClick={() => fileInputRef.current?.click()}
              style={{ minHeight: 160 }}
            >
              {hasImage ? (
                <div style={{ position: "relative", flex: 1 }}>
                  <img
                    src={imagePreview || resolveAssetUrl(imageUrl)}
                    alt="Preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover", minHeight: 160 }}
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); clearImage(); }}
                    style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.92)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}
                  >
                    <X size={13} style={{ color: "#64748b" }} />
                  </button>
                </div>
              ) : (
                <div style={{ flex: 1, minHeight: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Camera size={24} style={{ color: "#38bdf8" }} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#475569", margin: 0 }}>{t.clickToUpload}</p>
                  <p style={{ fontSize: 11.5, color: "#94a3b8", margin: 0 }}>{t.jpgPngWebp}</p>
                </div>
              )}
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 38, borderRadius: 10, border: "1.5px solid #dbeafe", background: "white", color: "#0369a1", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
            >
              <ImagePlus size={15} />
              {t.chooseImage}
            </button>

            <div>
              <span className="flbl" style={{ marginBottom: 5 }}>{t.orPasteUrl}</span>
              <input
                type="url"
                value={imageUrl}
                onChange={handleImageUrlChange}
                placeholder={t.examplePhotoUrl}
                className="fi"
                style={{ fontSize: 12.5 }}
              />
            </div>
          </div>
        </div>

        {/* ════ DETAILS COLUMN ════ */}
        <div className="flex flex-col gap-3">

          {/* Name + Category */}
          <div className="card" style={{ padding: 16 }}>
            {/* On mobile: stack name + category vertically. On sm+: side by side */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-start">
              <div style={{ flex: 1, minWidth: 0 }}>
                <label className="flbl">{t.itemName} <span style={{ color: "#0ea5e9" }}>*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.exampleClassicCheeseburger}
                  required
                  className="fi"
                />
              </div>
              <div style={{ minWidth: 130 }}>
                <label className="flbl">{t.category}</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="fi"
                  style={{ textTransform: "capitalize" }}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} style={{ textTransform: "capitalize" }}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category chips — scrollable on mobile */}
            <div className="no-sb" style={{ display: "flex", flexWrap: "nowrap", gap: 6, marginTop: 12, overflowX: "auto", paddingBottom: 2 }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`cat-chip${selectedCategory === cat ? " active" : ""}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="card" style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column", minHeight: 120 }}>
            <label className="flbl">{t.description}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.describeTheDish}
              className="fi"
              style={{ flex: 1, resize: "none", minHeight: 100 }}
            />
          </div>

          {/* Pricing */}
          <div className="card" style={{ padding: 16 }}>
            <label className="flbl" style={{ marginBottom: 10 }}>{t.pricing}</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label className="flbl" style={{ fontSize: 10.5 }}>{t.usd} <span style={{ color: "#0ea5e9" }}>*</span></label>
                <div className="cur-wrap">
                  <input
                    type="number" min="0" step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    required
                    className="fi"
                  />
                  <span className="cur-badge">$</span>
                </div>
              </div>
              <div>
                <label className="flbl" style={{ fontSize: 10.5 }}>{t.khr}</label>
                <div className="cur-wrap">
                  <input
                    type="number" min="0" step="100"
                    value={priceKhr}
                    onChange={(e) => setPriceKhr(e.target.value)}
                    placeholder={isAutoCalculate ? t.auto : "0"}
                    disabled={isAutoCalculate}
                    className="fi"
                  />
                  <span className="cur-badge" style={{ color: isAutoCalculate ? "#cbd5e1" : "#94a3b8" }}>៛</span>
                </div>
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, cursor: "pointer" }}>
              <label className="toggle-wrap">
                <input type="checkbox" checked={isAutoCalculate} onChange={(e) => setIsAutoCalculate(e.target.checked)} />
                <span className="toggle-track" />
                <span className="toggle-thumb" />
              </label>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
                {t.autoCalculateKhr}{" "}
                <span style={{ fontWeight: 400, color: "#94a3b8" }}>({t.rate}: {exchangeRate.toLocaleString()})</span>
              </span>
            </label>
          </div>
        </div>

        {/* ════ OPTIONS + PREVIEW + ACTIONS COLUMN ════ */}
        {/*
          On mobile/md: this column flows below details (full width)
          On lg: right column
        */}
        <div className="flex flex-col gap-3 md:col-span-2 lg:col-span-1">

          {/* Options */}
          <div className="card" style={{ padding: 16 }}>
            <label className="flbl" style={{ marginBottom: 10 }}>{t.options}</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="option-row">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <CheckCircle2 size={16} style={{ color: "#22c55e" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", margin: 0 }}>{t.available}</p>
                    <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{t.visibleOnMenu}</p>
                  </div>
                </div>
                <label className="toggle-wrap">
                  <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
                  <span className="toggle-track" />
                  <span className="toggle-thumb" />
                </label>
              </div>

            </div>
          </div>

          {/* Preview card */}
          <div
            className="card"
            style={{ padding: 16, flex: 1, background: "linear-gradient(135deg, rgba(14,165,233,0.06) 0%, rgba(255,255,255,0.85) 100%)" }}
          >
            <label className="flbl" style={{ marginBottom: 10 }}>{t.preview}</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: name ? "#0f172a" : "#cbd5e1", minHeight: 22 }}>
                {name || t.itemName}
              </div>
              {selectedCategory && (
                <span style={{ display: "inline-flex", alignSelf: "flex-start", padding: "2px 10px", borderRadius: 99, background: "#e0f2fe", color: "#0369a1", fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>
                  {selectedCategory}
                </span>
              )}
              <div style={{ fontSize: 12, color: description ? "#475569" : "#cbd5e1", lineHeight: 1.5 }}>
                {description || t.noDescriptionYet}
              </div>
              <div style={{ borderTop: "1px dashed #dbeafe", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: price ? "#0ea5e9" : "#cbd5e1" }}>
                    {price ? `$${Number(price).toFixed(2)}` : "$0.00"}
                  </div>
                  {priceKhr && (
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>
                      {Number(priceKhr).toLocaleString()}៛
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {available && (
                    <span style={{ padding: "2px 8px", borderRadius: 99, background: "#dcfce7", color: "#16a34a", fontSize: 10, fontWeight: 700 }}>
                      {t.availableLabel}
                    </span>
                  )}
                 
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons — always shown here on mobile/md, hidden on lg (shown in header) */}
          <div className="flex flex-col gap-3 lg:hidden">
            <button type="submit" disabled={loading} className="save-btn">
              {loading ? (
                <>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block" }} className="spin" />
                  {t.saving}
                </>
              ) : t.saveItem}
            </button>
            <Link href="/dashboard/menu" className="cancel-btn">
              {t.cancel}
            </Link>
          </div>

        </div>
      </form>
    </div>
  );
}