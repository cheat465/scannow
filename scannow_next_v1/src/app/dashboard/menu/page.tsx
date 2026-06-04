"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera, CookingPot, Eye, HandPlatter, ImagePlus,
  Layers, Pencil, Search, Trash2, LogOut, UtensilsCrossed,
  Plus, X, Check, Leaf, QrCode, List, LayoutGrid,
} from "lucide-react";
import {
  apiRequest, getStoredRestaurantId, ListResponse, MenuItem,
  Restaurant, resolveAssetUrl, storeRestaurant, ItemResponse,
  clearSession,
} from "@/lib/api";
import { useLanguage } from "@/app/contexts/LanguageContext";

type CategoryFilter = string;

export default function Menu() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [editForm, setEditForm] = useState({
    name: "", category: "food" as CategoryFilter, description: "",
    price: "", priceKhr: "", isAutoCalculate: true,
    imageUrl: "", isAvailable: true, isVegetarian: false,
  });

  const categories = useMemo(() => restaurant?.categories || ["food", "drinks", "dessert"], [restaurant]);
  const exchangeRate = restaurant?.usd_to_khr_rate || 4000;

  const filteredItems = useMemo(() => {
    let filtered = [...allItems];
    if (category !== "all") filtered = filtered.filter(i => i.category === category);
    if (search.trim()) {
      const s = search.toLowerCase();
      filtered = filtered.filter(i => i.name.toLowerCase().includes(s) || (i.description && i.description.toLowerCase().includes(s)));
    }
    return filtered;
  }, [allItems, category, search]);

  const categoriesWithItems = useMemo(() => {
    const cats = new Set(allItems.map(i => i.category));
    return Array.from(cats).map(cat => ({
      name: cat,
      items: filteredItems.filter(i => i.category === cat),
    })).filter(c => c.items.length > 0);
  }, [filteredItems, allItems]);

  useEffect(() => {
    if (editForm.isAutoCalculate && editForm.price) {
      const calc = Math.round((Number(editForm.price) * exchangeRate) / 100) * 100;
      setEditForm(p => ({ ...p, priceKhr: calc.toString() }));
    }
  }, [editForm.price, editForm.isAutoCalculate, exchangeRate]);

  const loadMenu = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      let restaurantId = getStoredRestaurantId();
      if (!restaurantId) {
        const r = await apiRequest<ListResponse<Restaurant>>("/restaurants");
        const first = r.data[0];
        if (first) { storeRestaurant(first); restaurantId = first.id; setRestaurant(first); }
      }
      if (!restaurantId) { setAllItems([]); setRestaurant(null); return; }
      const [rRes, mRes] = await Promise.all([
        apiRequest<{ data: Restaurant }>(`/restaurants/${restaurantId}`),
        apiRequest<ListResponse<MenuItem>>(`/restaurants/${restaurantId}/menu-items`),
      ]);
      setRestaurant(rRes.data);
      setAllItems(mRes.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.couldNotLoadMenu);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadMenu(); }, [loadMenu]);

  const availableCount = allItems.filter(i => i.is_available).length;
  const totalCategories = new Set(allItems.map(i => i.category)).size;
  const handleLogout = () => { clearSession(); router.push("/auth/login"); };

  const deleteItem = async (itemId: number) => {
    try {
      await apiRequest(`/menu-items/${itemId}`, { method: "DELETE" });
      setAllItems(p => p.filter(i => i.id !== itemId));
      setDeleteConfirm(null);
    } catch (e) { setError(e instanceof Error ? e.message : t.couldNotDeleteItem); }
  };

  const openEditDrawer = (item: MenuItem) => {
    setError(null); setEditingItem(item);
    setEditImageFile(null); setEditImagePreview("");
    if (editFileInputRef.current) editFileInputRef.current.value = "";
    setEditForm({
      name: item.name, category: (item.category as CategoryFilter) ?? "food",
      description: item.description ?? "", price: item.price ? String(item.price) : "",
      priceKhr: item.price_khr ? String(item.price_khr) : "",
      isAutoCalculate: !item.price_khr,
      imageUrl: item.image_url ?? "", isAvailable: item.is_available, isVegetarian: item.is_vegetarian,
    });
  };

  const closeEditDrawer = () => {
    if (savingEdit) return;
    setEditImageFile(null); setEditImagePreview("");
    if (editFileInputRef.current) editFileInputRef.current.value = "";
    setEditingItem(null);
  };

  const submitEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;
    setSavingEdit(true); setError(null);
    try {
      const response = editImageFile
        ? await (() => {
            const fd = new FormData();
            fd.append("_method", "PATCH");
            fd.append("name", editForm.name);
            fd.append("category", editForm.category);
            fd.append("price", String(Number(editForm.price)));
            if (editForm.priceKhr) fd.append("price_khr", String(Number(editForm.priceKhr)));
            fd.append("is_available", editForm.isAvailable ? "1" : "0");
            fd.append("is_vegetarian", editForm.isVegetarian ? "1" : "0");
            fd.append("description", editForm.description || "");
            fd.append("image", editImageFile as File);
            fd.append("image_url", "");
            return apiRequest<ItemResponse<MenuItem>>(`/menu-items/${editingItem.id}`, { method: "POST", body: fd });
          })()
        : await apiRequest<ItemResponse<MenuItem>>(`/menu-items/${editingItem.id}`, {
            method: "PATCH",
            body: JSON.stringify({
              name: editForm.name, category: editForm.category,
              description: editForm.description || null,
              price: Number(editForm.price),
              price_khr: editForm.priceKhr ? Number(editForm.priceKhr) : null,
              image_url: editForm.imageUrl || null,
              is_available: editForm.isAvailable, is_vegetarian: editForm.isVegetarian,
            }),
          });
      setAllItems(p => p.map(i => i.id === editingItem.id ? response.data : i));
      closeEditDrawer();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.couldNotUpdateItem);
    } finally { setSavingEdit(false); }
  };

  const handleEditImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError(t.pleaseChooseAnImageFile); e.target.value = ""; return; }
    setEditImageFile(file);
    setEditForm(p => ({ ...p, imageUrl: "" }));
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") setEditImagePreview(reader.result); };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#EAF9FF", minHeight: "100vh", overflowY: "auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }

        .fi {
          width: 100%; background: white; border: 1.5px solid #dbeafe;
          border-radius: 10px; padding: 9px 13px; color: #0f172a;
          font-size: 13.5px; font-weight: 500; font-family: 'DM Sans', sans-serif;
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
        }
        .fi:focus { border-color: #61A9E5; box-shadow: 0 0 0 3px rgba(97,169,229,0.12); }
        .fi::placeholder { color: #94a3b8; }
        .fi:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }

        .cat-chip {
          padding: 6px 14px; border-radius: 99px; font-size: 12.5px; font-weight: 600;
          cursor: pointer; border: 1.5px solid #dbeafe; background: white; color: #64748b;
          transition: all 0.15s; text-transform: capitalize; font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
        }
        .cat-chip:hover { border-color: #7dd3fc; color: #0369a1; }
        .cat-chip.active { background: #61A9E5; border-color: #61A9E5; color: white; }

        .menu-card {
          background: white; border-radius: 18px; border: 1px solid #e0f2fe;
          overflow: hidden; transition: box-shadow 0.2s, transform 0.15s;
          display: flex; flex-direction: column;
        }
        .menu-card:hover { box-shadow: 0 8px 28px rgba(97,169,229,0.18); transform: translateY(-2px); }

        .action-icon-btn {
          width: 34px; height: 34px; border-radius: 9px; border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.15s; flex-shrink: 0;
        }

        .toggle-wrap { position: relative; display: inline-flex; width: 40px; height: 22px; cursor: pointer; flex-shrink: 0; }
        .toggle-wrap input { opacity: 0; width: 0; height: 0; position: absolute; }
        .toggle-track { position: absolute; inset: 0; background: #cbd5e1; border-radius: 99px; transition: background 0.2s; }
        .toggle-wrap input:checked ~ .toggle-track { background: #61A9E5; }
        .toggle-thumb { position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; background: white; border-radius: 50%; transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,.2); }
        .toggle-wrap input:checked ~ .toggle-track ~ .toggle-thumb { transform: translateX(18px); }

        /* Drawer: full-screen on mobile, side panel on sm+ */
        .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 40; backdrop-filter: blur(2px); }
        .drawer {
          position: fixed; top: 0; right: 0; height: 100dvh;
          width: 100%; max-width: 420px;
          background: white; z-index: 50;
          box-shadow: -8px 0 40px rgba(0,0,0,0.12);
          display: flex; flex-direction: column;
        }
        @media (max-width: 480px) {
          .drawer { max-width: 100%; border-radius: 0; }
        }

        .stat-card {
          background: white; border-radius: 16px; border: 1px solid #e0f2fe;
          padding: 14px 16px; display: flex; align-items: center; gap: 12px;
        }

        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .drawer { animation: slideIn 0.25s ease; }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:.4;} }

        /* Mobile search bar expand animation */
        .search-expand {
          transition: width 0.2s ease, opacity 0.2s ease;
        }

        /* Mobile FAB */
        .fab {
          position: fixed; bottom: 20px; right: 16px; z-index: 30;
          width: 52px; height: 52px; border-radius: 50%;
          background: #61A9E5; color: white; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 6px 20px rgba(97,169,229,0.45);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .fab:active { transform: scale(0.94); }
      `}</style>

      {/* ── Sticky Header ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(186,230,253,0.5)", padding: "10px 14px" }}>

        {/* Desktop header row */}
        <div className="hidden sm:flex" style={{ alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flexShrink: 0 }}>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>{t.menu}</h1>
            {restaurant && <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{restaurant.name}</p>}
          </div>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: 300, position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t.searchDishes} className="fi" style={{ paddingLeft: 34, fontSize: 13 }} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* View Toggle */}
            <button onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 10, border: "1.5px solid #dbeafe", background: "white", color: "#475569", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              {viewMode === "list" ? <LayoutGrid size={14} /> : <List size={14} />}
              <span className="hidden md:inline">{viewMode === "list" ? t.grid : t.list}</span>
            </button>
            {/* QR link */}
            <Link href="/dashboard/qrcode" style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 10, border: "1.5px solid #dbeafe", background: "white", color: "#475569", fontSize: 12.5, fontWeight: 600, textDecoration: "none" }}>
              <QrCode size={14} style={{ color: "#61A9E5" }} />
              <span className="hidden md:inline">{t.qrCode}</span>
            </Link>
            {/* Add Dish */}
            <Link href="/dashboard/menu/add" style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 10, background: "#61A9E5", color: "white", fontSize: 12.5, fontWeight: 700, textDecoration: "none", boxShadow: "0 3px 10px rgba(97,169,229,0.35)" }}>
              <Plus size={14} />
              <span>{t.addDish}</span>
            </Link>
            {/* Profile */}
            <div style={{ position: "relative" }}>
              <button type="button" onClick={() => setProfileOpen(v => !v)} style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid #dbeafe", background: "#f0f9ff", cursor: "pointer", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {restaurant?.logo_url ? <img src={resolveAssetUrl(restaurant.logo_url)} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.currentTarget.style.display = "none"; }} /> : <UtensilsCrossed size={14} style={{ color: "#61A9E5" }} />}
              </button>
              {profileOpen && (
                <div style={{ position: "absolute", right: 0, top: 42, zIndex: 20, width: 250, background: "white", borderRadius: 14, border: "1px solid #dbeafe", padding: 16, boxShadow: "0 8px 30px rgba(97,169,229,0.15)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", border: "1px solid #dbeafe", background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {restaurant?.logo_url ? <img src={resolveAssetUrl(restaurant.logo_url)} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <UtensilsCrossed size={18} style={{ color: "#61A9E5" }} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{restaurant?.name || t.yourRestaurant}</p>
                      <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{restaurant?.email || t.noEmail}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 11, color: "#64748b", marginBottom: 10 }}>{restaurant?.phone || ""}{restaurant?.address ? ` · ${restaurant.address}` : ""}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 8 }}>
                    <Link href="/page/about-restaurant" style={{ borderRadius: 8, border: "1.5px solid #dbeafe", padding: "7px 0", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#334155", textDecoration: "none" }}>{t.view}</Link>
                    <Link href="/page/about-restaurant" style={{ borderRadius: 8, background: "#61A9E5", padding: "7px 0", textAlign: "center", fontSize: 12, fontWeight: 700, color: "white", textDecoration: "none" }}>{t.edit}</Link>
                  </div>
                  <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "7px 0", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    <LogOut size={13} />{t.signOut}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile header row */}
        <div className="flex sm:hidden" style={{ alignItems: "center", gap: 8 }}>
          {searchOpen ? (
            /* Expanded search on mobile */
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input
                  ref={searchInputRef}
                  autoFocus
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={t.searchDishes} className="fi" style={{ paddingLeft: 34, fontSize: 13 }}
                />
              </div>
              <button onClick={() => { setSearchOpen(false); setSearch(""); }} style={{ padding: "8px", border: "none", background: "none", cursor: "pointer", color: "#64748b", flexShrink: 0 }}>
                <X size={18} />
              </button>
            </div>
          ) : (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>{t.menu}</h1>
                {restaurant && <p style={{ fontSize: 10, color: "#94a3b8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{restaurant.name}</p>}
              </div>
              <button onClick={() => setSearchOpen(true)} style={{ width: 34, height: 34, borderRadius: 10, border: "1.5px solid #dbeafe", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                <Search size={15} style={{ color: "#61A9E5" }} />
              </button>
              <button onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")} style={{ width: 34, height: 34, borderRadius: 10, border: "1.5px solid #dbeafe", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                {viewMode === "list" ? <LayoutGrid size={15} style={{ color: "#475569" }} /> : <List size={15} style={{ color: "#475569" }} />}
              </button>
              <Link href="/dashboard/qrcode" style={{ width: 34, height: 34, borderRadius: 10, border: "1.5px solid #dbeafe", background: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <QrCode size={15} style={{ color: "#61A9E5" }} />
              </Link>
              {/* Profile */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <button type="button" onClick={() => setProfileOpen(v => !v)} style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid #dbeafe", background: "#f0f9ff", cursor: "pointer", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {restaurant?.logo_url ? <img src={resolveAssetUrl(restaurant.logo_url)} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.currentTarget.style.display = "none"; }} /> : <UtensilsCrossed size={13} style={{ color: "#61A9E5" }} />}
                </button>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div style={{ position: "fixed", right: 12, top: 62, zIndex: 20, width: 240, background: "white", borderRadius: 14, border: "1px solid #dbeafe", padding: 14, boxShadow: "0 8px 30px rgba(97,169,229,0.15)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: "50%", overflow: "hidden", border: "1px solid #dbeafe", background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {restaurant?.logo_url ? <img src={resolveAssetUrl(restaurant.logo_url)} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <UtensilsCrossed size={16} style={{ color: "#61A9E5" }} />}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{restaurant?.name || t.yourRestaurant}</p>
                          <p style={{ fontSize: 10.5, color: "#94a3b8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{restaurant?.email || t.noEmail}</p>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 8 }}>
                        <Link href="/page/about-restaurant" style={{ borderRadius: 8, border: "1.5px solid #dbeafe", padding: "6px 0", textAlign: "center", fontSize: 11.5, fontWeight: 600, color: "#334155", textDecoration: "none" }}>{t.view}</Link>
                        <Link href="/page/about-restaurant" style={{ borderRadius: 8, background: "#61A9E5", padding: "6px 0", textAlign: "center", fontSize: 11.5, fontWeight: 700, color: "white", textDecoration: "none" }}>{t.edit}</Link>
                      </div>
                      <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "7px 0", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", color: "#ef4444", fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                        <LogOut size={12} />{t.signOut}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      {/* ── Page body ── */}
      <div style={{ padding: "14px 14px 80px" }} className="sm:px-6 sm:pb-10 md:px-8">

        {/* Stat cards — 1 col on xs, 3 col on sm+ */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3" style={{ marginBottom: 16 }}>
          {[
            { id: "total", icon: <CookingPot size={18} />, label: t.totalDishes, value: String(allItems.length), bg: "#dbeafe", color: "#61A9E5" },
            { id: "available", icon: <HandPlatter size={18} />, label: t.available, value: String(availableCount), bg: "#e0f2fe", color: "#0ea5e9" },
            { id: "categories", icon: <Layers size={18} />, label: t.categories, value: String(totalCategories), bg: "#dcfce7", color: "#22c55e" },
          ].map(s => (
            <div key={s.id} className="stat-card" style={{ padding: "12px 10px" }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", color: s.color, flexShrink: 0 }}>{s.icon}</div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</p>
                <p style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", margin: 0, lineHeight: 1.2 }}>{loading ? "—" : s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 13, color: "#dc2626", display: "flex", alignItems: "center", gap: 8 }}>
            <X size={14} style={{ flexShrink: 0 }} />{error}
          </div>
        )}

        {/* Category filter chips — horizontally scrollable */}
        <div className="no-scrollbar" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 6 }}>
          <button onClick={() => setCategory("all")} className={`cat-chip${category === "all" ? " active" : ""}`} style={{ flexShrink: 0, fontSize: 12, padding: "5px 12px" }}>{t.all} ({allItems.length})</button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} className={`cat-chip${category === cat ? " active" : ""}`} style={{ flexShrink: 0, fontSize: 12, padding: "5px 12px" }}>
              {cat} ({allItems.filter(i => i.category === cat).length})
            </button>
          ))}
        </div>

        {/* No restaurant */}
        {!restaurant && !loading && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <UtensilsCrossed size={40} style={{ color: "#dbeafe", marginBottom: 12 }} />
            <p style={{ color: "#64748b", marginBottom: 16 }}>{t.createYourRestaurantProfile}</p>
            <Link href="/page/about-restaurant" style={{ padding: "10px 24px", borderRadius: 10, background: "#61A9E5", color: "white", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>{t.createRestaurant}</Link>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" style={{ gap: 12 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ background: "white", borderRadius: 18, border: "1px solid #e0f2fe", overflow: "hidden" }}>
                <div style={{ height: 130, background: "#f0f9ff", animation: "pulse 1.5s ease-in-out infinite" }} />
                <div style={{ padding: 12 }}>
                  <div style={{ height: 13, background: "#f0f9ff", borderRadius: 8, marginBottom: 7, animation: "pulse 1.5s ease-in-out infinite" }} />
                  <div style={{ height: 10, width: "60%", background: "#f0f9ff", borderRadius: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Menu cards grouped by category */}
        {!loading && restaurant && (
          <>
            {filteredItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <UtensilsCrossed size={40} style={{ color: "#dbeafe", marginBottom: 12 }} />
                <p style={{ color: "#94a3b8", fontSize: 14 }}>{t.noItemsFound}{search ? ` for "${search}"` : ""}.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {categoriesWithItems.map(cat => (
                  <div key={cat.name}>
                    {/* Category header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <h2 style={{ fontSize: 14, fontWeight: 800, color: "#61A9E5", textTransform: "capitalize", margin: 0, whiteSpace: "nowrap" }}>{cat.name}</h2>
                      <div style={{ flex: 1, height: 1, background: "#61A9E5", opacity: 0.2 }} />
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", whiteSpace: "nowrap" }}>{cat.items.length} {cat.items.length === 1 ? t.item : t.items}</span>
                    </div>

                    {/* LIST VIEW */}
                    {viewMode === "list" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {cat.items.map(item => (
                          <div key={item.id} className="menu-card" style={{ flexDirection: "row" }}>
                            {/* Image */}
                            <div style={{ position: "relative", width: 100, height: 100, background: "#f0f9ff", flexShrink: 0, borderTopLeftRadius: 18, borderBottomLeftRadius: 18 }} className="sm:w-[120px] sm:h-[120px]">
                              {item.image_url
                                ? <img src={resolveAssetUrl(item.image_url)} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderTopLeftRadius: 18, borderBottomLeftRadius: 18 }} onError={e => { e.currentTarget.style.display = "none"; }} />
                                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><UtensilsCrossed size={28} style={{ color: "#bae6fd" }} /></div>
                              }
                              {/* Status badge */}
                              <div style={{ position: "absolute", top: 7, left: 7, padding: "2px 7px", borderRadius: 99, fontSize: 9.5, fontWeight: 700, background: item.is_available ? "rgba(34,197,94,0.15)" : "rgba(100,116,139,0.15)", color: item.is_available ? "#15803d" : "#64748b", backdropFilter: "blur(4px)", border: `1px solid ${item.is_available ? "rgba(34,197,94,0.25)" : "rgba(100,116,139,0.2)"}` }}>
                                {item.is_available ? t.available : t.unavailable}
                              </div>
                              {item.is_vegetarian && (
                                <div style={{ position: "absolute", top: 7, right: 7, width: 22, height: 22, borderRadius: "50%", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                                  <Leaf size={11} style={{ color: "#10b981" }} />
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div style={{ padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>
                              <div>
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
                                  <div style={{ minWidth: 0 }}>
                                    <p style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                                    {item.description && <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.description}</p>}
                                  </div>
                                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "#f0f9ff", color: "#0369a1", border: "1px solid #dbeafe", textTransform: "capitalize", whiteSpace: "nowrap", flexShrink: 0 }}>{item.category}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 6 }}>
                                  <span style={{ fontSize: 15, fontWeight: 800, color: "#61A9E5" }}>${Number(item.price).toFixed(2)}</span>
                                  <span style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600 }}>
                                    ≈ {item.price_khr ? Number(item.price_khr).toLocaleString() : (Math.round((Number(item.price) * 4000) / 100) * 100).toLocaleString()}៛
                                  </span>
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                                <button onClick={() => openEditDrawer(item)} className="action-icon-btn" style={{ background: "#eff6ff", width: 32, height: 32 }} title="Edit">
                                  <Pencil size={14} style={{ color: "#61A9E5" }} />
                                </button>
                                {deleteConfirm === item.id ? (
                                  <div style={{ display: "flex", gap: 5 }}>
                                    <button onClick={() => deleteItem(item.id)} className="action-icon-btn" style={{ background: "#fef2f2", width: 32, height: 32 }}>
                                      <Check size={14} style={{ color: "#ef4444" }} />
                                    </button>
                                    <button onClick={() => setDeleteConfirm(null)} className="action-icon-btn" style={{ background: "#f8fafc", width: 32, height: 32 }}>
                                      <X size={14} style={{ color: "#64748b" }} />
                                    </button>
                                  </div>
                                ) : (
                                  <button onClick={() => setDeleteConfirm(item.id)} className="action-icon-btn" style={{ background: "#fef2f2", width: 32, height: 32 }}>
                                    <Trash2 size={14} style={{ color: "#ef4444" }} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* GRID VIEW — 2 cols on mobile, auto-fill on sm+ */}
                    {viewMode === "grid" && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" style={{ gap: 12 }}>
                        {cat.items.map(item => (
                          <div key={item.id} className="menu-card">
                            {/* Image */}
                            <div style={{ position: "relative", height: 130, background: "#f0f9ff", flexShrink: 0 }} className="sm:h-[150px]">
                              {item.image_url
                                ? <img src={resolveAssetUrl(item.image_url)} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.currentTarget.style.display = "none"; }} />
                                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><UtensilsCrossed size={28} style={{ color: "#bae6fd" }} /></div>
                              }
                              <div style={{ position: "absolute", top: 8, left: 8, padding: "2px 8px", borderRadius: 99, fontSize: 9.5, fontWeight: 700, background: item.is_available ? "rgba(34,197,94,0.15)" : "rgba(100,116,139,0.15)", color: item.is_available ? "#15803d" : "#64748b", backdropFilter: "blur(4px)", border: `1px solid ${item.is_available ? "rgba(34,197,94,0.25)" : "rgba(100,116,139,0.2)"}` }}>
                                {item.is_available ? t.available : t.unavailable}
                              </div>
                              {item.is_vegetarian && (
                                <div style={{ position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: "50%", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                                  <Leaf size={11} style={{ color: "#10b981" }} />
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div style={{ padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
                                <div style={{ minWidth: 0 }}>
                                  <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                                  {item.description && <p style={{ fontSize: 10.5, color: "#94a3b8", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.description}</p>}
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 2 }}>
                                <span style={{ fontSize: 14, fontWeight: 800, color: "#61A9E5" }}>${Number(item.price).toFixed(2)}</span>
                                <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>
                                  ≈ {item.price_khr ? Number(item.price_khr).toLocaleString() : (Math.round((Number(item.price) * 4000) / 100) * 100).toLocaleString()}៛
                                </span>
                              </div>
                              {/* Actions */}
                              <div style={{ display: "flex", gap: 6, marginTop: "auto", paddingTop: 8, borderTop: "1px solid #f0f9ff" }}>
                                <button onClick={() => openEditDrawer(item)} className="action-icon-btn" style={{ background: "#eff6ff", flex: 1, width: "auto", height: 32 }} title="Edit">
                                  <Pencil size={14} style={{ color: "#61A9E5" }} />
                                </button>
                                {deleteConfirm === item.id ? (
                                  <div style={{ display: "flex", gap: 4, flex: 1 }}>
                                    <button onClick={() => deleteItem(item.id)} className="action-icon-btn" style={{ background: "#fef2f2", flex: 1, width: "auto", height: 32 }}>
                                      <Check size={14} style={{ color: "#ef4444" }} />
                                    </button>
                                    <button onClick={() => setDeleteConfirm(null)} className="action-icon-btn" style={{ background: "#f8fafc", flex: 1, width: "auto", height: 32 }}>
                                      <X size={14} style={{ color: "#64748b" }} />
                                    </button>
                                  </div>
                                ) : (
                                  <button onClick={() => setDeleteConfirm(item.id)} className="action-icon-btn" style={{ background: "#fef2f2", flex: 1, width: "auto", height: 32 }}>
                                    <Trash2 size={14} style={{ color: "#ef4444" }} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Mobile FAB: Add Dish ── */}
      <Link href="/dashboard/menu/add" className="fab sm:hidden" aria-label={t.addDish}>
        <Plus size={22} />
      </Link>

      {/* ── Edit Drawer ── */}
      {editingItem && (
        <>
          <div className="drawer-overlay" onClick={closeEditDrawer} />
          <div className="drawer">
            {/* Drawer header */}
            <div style={{ padding: "16px 18px", borderBottom: "1px solid #e0f2fe", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>{t.editItem}</h2>
                <p style={{ fontSize: 11.5, color: "#94a3b8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 260 }}>{editingItem.name}</p>
              </div>
              <button type="button" onClick={closeEditDrawer} style={{ width: 32, height: 32, borderRadius: "50%", background: "#f8fafc", border: "1px solid #e2e8f0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <X size={15} style={{ color: "#64748b" }} />
              </button>
            </div>

            {/* Drawer form */}
            <form onSubmit={submitEdit} style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Image */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>{t.photo}</label>
                <div onClick={() => editFileInputRef.current?.click()} style={{ border: "2px dashed #bae6fd", borderRadius: 14, overflow: "hidden", cursor: "pointer", background: "white" }}>
                  {editImagePreview || editForm.imageUrl ? (
                    <div style={{ position: "relative" }}>
                      <img src={editImagePreview || resolveAssetUrl(editForm.imageUrl)} alt="preview" style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
                      <button type="button" onClick={e => { e.stopPropagation(); setEditImagePreview(""); setEditForm(p => ({ ...p, imageUrl: "" })); setEditImageFile(null); }} style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <X size={12} style={{ color: "#64748b" }} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ height: 90, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Camera size={16} style={{ color: "#38bdf8" }} />
                      </div>
                      <span style={{ fontSize: 11.5, color: "#94a3b8" }}>{t.clickToUpload}</span>
                    </div>
                  )}
                </div>
                <input ref={editFileInputRef} type="file" accept="image/*" onChange={handleEditImageFileChange} style={{ display: "none" }} />
                <input type="url" value={editForm.imageUrl} onChange={e => setEditForm(p => ({ ...p, imageUrl: e.target.value }))} placeholder={t.orPasteImageUrl} className="fi" style={{ marginTop: 7, fontSize: 12 }} />
              </div>

              {/* Name */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{t.name} <span style={{ color: "#61A9E5" }}>*</span></label>
                <input type="text" required value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} placeholder={t.dishName} className="fi" />
              </div>

              {/* Category chips */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>{t.category}</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {categories.map(cat => (
                    <button key={cat} type="button" onClick={() => setEditForm(p => ({ ...p, category: cat }))} className={`cat-chip${editForm.category === cat ? " active" : ""}`} style={{ fontSize: 11.5, padding: "4px 11px" }}>{cat}</button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{t.description}</label>
                <textarea rows={3} value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} placeholder={t.describeTheDish} className="fi" style={{ resize: "none" }} />
              </div>

              {/* Price */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>{t.pricing}</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <div style={{ position: "relative" }}>
                    <input type="number" min="0" step="0.01" required value={editForm.price} onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))} placeholder="0.00" className="fi" style={{ paddingRight: 26 }} />
                    <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11.5, fontWeight: 700, color: "#94a3b8" }}>$</span>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input type="number" min="0" step="100" value={editForm.priceKhr} onChange={e => setEditForm(p => ({ ...p, priceKhr: e.target.value }))} disabled={editForm.isAutoCalculate} placeholder={editForm.isAutoCalculate ? t.auto : "0"} className="fi" style={{ paddingRight: 26 }} />
                    <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11.5, fontWeight: 700, color: editForm.isAutoCalculate ? "#cbd5e1" : "#94a3b8" }}>៛</span>
                  </div>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <label className="toggle-wrap">
                    <input type="checkbox" checked={editForm.isAutoCalculate} onChange={e => setEditForm(p => ({ ...p, isAutoCalculate: e.target.checked }))} />
                    <span className="toggle-track" /><span className="toggle-thumb" />
                  </label>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: "#475569" }}>{t.autoCalculateKhr} <span style={{ color: "#94a3b8", fontWeight: 400 }}>({t.rate}: {exchangeRate.toLocaleString()})</span></span>
                </label>
              </div>

              {/* Toggles */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 9, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={13} style={{ color: "#22c55e" }} /></div>
                    <div><p style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a", margin: 0 }}>{t.available}</p><p style={{ fontSize: 10.5, color: "#94a3b8", margin: 0 }}>{t.visibleOnMenu}</p></div>
                  </div>
                  <label className="toggle-wrap"><input type="checkbox" checked={editForm.isAvailable} onChange={e => setEditForm(p => ({ ...p, isAvailable: e.target.checked }))} /><span className="toggle-track" /><span className="toggle-thumb" /></label>
                </label>
                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 9, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}><Leaf size={13} style={{ color: "#10b981" }} /></div>
                    <div><p style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a", margin: 0 }}>Vegetarian</p><p style={{ fontSize: 10.5, color: "#94a3b8", margin: 0 }}>{t.plantBasedItem}</p></div>
                  </div>
                  <label className="toggle-wrap"><input type="checkbox" checked={editForm.isVegetarian} onChange={e => setEditForm(p => ({ ...p, isVegetarian: e.target.checked }))} /><span className="toggle-track" /><span className="toggle-thumb" /></label>
                </label>
              </div>

            </form>

            {/* Drawer footer */}
            <div style={{ padding: "12px 18px", borderTop: "1px solid #e0f2fe", display: "flex", gap: 10, flexShrink: 0, background: "white" }}>
              <button type="button" onClick={closeEditDrawer} disabled={savingEdit} style={{ flex: 1, height: 44, borderRadius: 11, border: "1.5px solid #dbeafe", background: "white", color: "#475569", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{t.cancel}</button>
              <button type="button" disabled={savingEdit} onClick={() => { const form = document.querySelector<HTMLFormElement>('.drawer form'); if (form) form.requestSubmit(); }} style={{ flex: 2, height: 44, borderRadius: 11, background: "#61A9E5", color: "white", fontSize: 13.5, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 3px 10px rgba(97,169,229,0.3)", opacity: savingEdit ? 0.6 : 1 }}>
                {savingEdit ? <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block" }} className="spin" />{t.saving}</> : t.saveItem}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}