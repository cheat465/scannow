"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, resolveAssetUrl, Restaurant } from "@/lib/api";
import { MapPin, UtensilsCrossed } from "lucide-react";

type Category = { id: number; name: string };
type Variant = { id: number; name: string; price: number; price_khr?: number | null };
type FoodItem = {
  id: number;
  restaurant_id: number;
  name: string;
  description: string;
  price: number;
  price_khr: number | null;
  image_url: string;
  category_ids: number[];
  is_available: boolean;
  variants: Variant[];
};
type CartItem = FoodItem & {
  quantity: number;
  selectedVariant?: Variant;
};

export default function MenuClient({
  categories,
  foodItems,
  tableNumber,
  restaurant,
  geofencing,
}: {
  categories: Category[];
  foodItems: FoodItem[];
  tableNumber: string;
  restaurant?: Restaurant | null;
  geofencing?: { is_enabled: boolean; can_order: boolean; distance_meters: number | null; radius_meters: number };
}) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [showGeofenceBanner, setShowGeofenceBanner] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number | null>(
    categories[0]?.id || null,
  );

  // Check for location if geofencing is enabled
  useEffect(() => {
    if (geofencing?.is_enabled && !userLocation) {
      const options = { 
        enableHighAccuracy: false, 
        timeout: 10000,
        maximumAge: Infinity 
      };

      const success = (pos: GeolocationPosition) => {
        const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(newLoc);
        localStorage.setItem("user_lat", newLoc.lat.toString());
        localStorage.setItem("user_lng", newLoc.lng.toString());
        router.refresh();
      };

      const error = async (err: GeolocationPositionError) => {
        console.warn("Menu Geolocation timed out, trying IP fallback...", err.code);
        
        // IP Fallback logic
        try {
          const res = await fetch('https://ipapi.co/json/');
          const data = await res.json();
          if (data.latitude && data.longitude) {
            const newLoc = { lat: data.latitude, lng: data.longitude };
            setUserLocation(newLoc);
            localStorage.setItem("user_lat", newLoc.lat.toString());
            localStorage.setItem("user_lng", newLoc.lng.toString());
            router.refresh();
            return;
          }
        } catch (ipErr) {
          console.error("Menu IP fallback failed:", ipErr);
        }
        
        setLocationError(true);
      };

      navigator.geolocation.getCurrentPosition(success, error, options);
    }
  }, [geofencing, router, userLocation]);

  // Client-side distance calculation for instant UI feedback
  const [realDistance, setRealDistance] = useState<number | null>(null);

  useEffect(() => {
    if (userLocation && restaurant?.latitude && restaurant?.longitude) {
      const dist = haversineDistance(
        userLocation.lat,
        userLocation.lng,
        Number(restaurant.latitude),
        Number(restaurant.longitude)
      );
      setRealDistance(dist);
    }
  }, [userLocation, restaurant]);

  function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Track current time to recheck operating hours periodically
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Check if we are within operating hours
  const isWithinOperatingHours = () => {
    if (!restaurant?.is_auto_close_enabled) {
      return true; // If auto-close not enabled, always allow ordering
    }

    const now = currentTime;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    
    if (!restaurant.open_time && !restaurant.close_time) {
      return true;
    }

    let openMinutes = 0;
    let closeMinutes = 24 * 60;
    
    if (restaurant.open_time) {
      const [openHours, openMins] = restaurant.open_time.split(":").map(Number);
      openMinutes = openHours * 60 + openMins;
    }
    
    if (restaurant.close_time) {
      const [closeHours, closeMins] = restaurant.close_time.split(":").map(Number);
      closeMinutes = closeHours * 60 + closeMins;
    }

    // Handle case where closing time is after midnight (e.g., open 20:00, close 03:00)
    if (closeMinutes <= openMinutes) {
      // Operating hours wrap around midnight
      return nowMinutes >= openMinutes || nowMinutes < closeMinutes;
    } else {
      // Normal operating hours (same day)
      return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
    }
  };

  const canOrder = 
    ((!geofencing?.is_enabled) || 
     (geofencing?.can_order) || 
     (realDistance !== null && realDistance <= ((geofencing?.radius_meters || 100) + 20))) && 
    isWithinOperatingHours() && 
    restaurant?.status !== 'frozen'; // Also check if restaurant isn't frozen

  // Auto-hide geofence banner after 3 seconds
  useEffect(() => {
    if (showGeofenceBanner) {
      const timer = setTimeout(() => {
        setShowGeofenceBanner(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showGeofenceBanner]);

  // Show/hide banner based on operating hours or frozen status
  useEffect(() => {
    if (!isWithinOperatingHours() || restaurant?.status === 'frozen') {
      setShowGeofenceBanner(true);
    } else {
      // If we are now within operating hours and not frozen, hide banner
      setShowGeofenceBanner(false);
    }
  }, [currentTime, restaurant]);

  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [variantModal, setVariantModal] = useState<FoodItem | null>(null);
  const [navigating, setNavigating] = useState(false);

  // Refs for each category section
  const sectionRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const tabsRef = useRef<HTMLDivElement>(null);
  const isScrollingToSection = useRef(false);

  // Scroll spy — watch which section is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingToSection.current) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const catId = Number(entry.target.getAttribute("data-category-id"));
            setActiveCategory(catId);
            // Scroll the active tab into view
            scrollTabIntoView(catId);
          }
        });
      },
      {
        rootMargin: "-30% 0px -60% 0px",
        threshold: 0,
      },
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [foodItems, categories]);

  function scrollTabIntoView(catId: number) {
    const tabEl = document.getElementById(`tab-${catId}`);
    if (tabEl && tabsRef.current) {
      tabEl.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }

  function scrollToSection(catId: number) {
    setActiveCategory(catId);
    scrollTabIntoView(catId);
    isScrollingToSection.current = true;

    const section = sectionRefs.current[catId];
    if (section) {
      const offset = 120; // header + tabs height
      const top = section.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });

      // Re-enable scroll spy after scrolling
      setTimeout(() => {
        isScrollingToSection.current = false;
      }, 800);
    }
  }

  function addToCart(item: FoodItem, variant?: Variant) {
    setCart((prev) => {
      const existing = prev.find(
        (c) => c.id === item.id && c.selectedVariant?.id === variant?.id,
      );
      if (existing) {
        return prev.map((c) =>
          c.id === item.id && c.selectedVariant?.id === variant?.id
            ? { ...c, quantity: c.quantity + 1 }
            : c,
        );
      }
      return [
        ...prev,
        {
          ...item,
          price: variant ? variant.price : item.price,
          price_khr: variant ? (variant.price_khr || (Number(variant.price) * 4000)) : (item.price_khr || (Number(item.price) * 4000)),
          quantity: 1,
          selectedVariant: variant,
        },
      ];
    });
  }

  function removeFromCart(item: FoodItem, variant?: Variant) {
    setCart((prev) => {
      const existing = prev.find(
        (c) => c.id === item.id && c.selectedVariant?.id === variant?.id,
      );
      if (existing && existing.quantity === 1) {
        return prev.filter(
          (c) => !(c.id === item.id && c.selectedVariant?.id === variant?.id),
        );
      }
      return prev.map((c) =>
        c.id === item.id && c.selectedVariant?.id === variant?.id
          ? { ...c, quantity: c.quantity - 1 }
          : c,
      );
    });
  }

  function getQuantity(itemId: number, variantId?: number) {
    return (
      cart.find((c) => c.id === itemId && c.selectedVariant?.id === variantId)
        ?.quantity || 0
    );
  }

  function getTotalQuantity(itemId: number) {
    return cart
      .filter((c) => c.id === itemId)
      .reduce((sum, c) => sum + c.quantity, 0);
  }

  const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0);
  const totalPrice = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  function goToCart() {
    setNavigating(true);
    const cartToSave = cart.map((item) => ({
      ...item,
      name: item.selectedVariant
        ? `${item.name} (${item.selectedVariant.name})`
        : item.name,
    }));

    // Extract restaurantId from the first item in the cart or from the props if available
    const restaurantId = foodItems[0]?.restaurant_id;

    localStorage.setItem("cart", JSON.stringify(cartToSave));
    localStorage.setItem("tableNumber", tableNumber);
    if (restaurantId) {
      localStorage.setItem("restaurantId", String(restaurantId));
    }
    router.push("/page/cart");
  }

  // Filter categories that have items
  const categoriesWithItems = categories.filter((cat) =>
    foodItems.some((item) => item.category_ids.includes(cat.id)),
  );

  // Sticky Header + Category Tabs
  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Geofencing & Closed & Frozen Persistent Alert */}
      {(!canOrder && showGeofenceBanner) && (
        <div className="fixed top-0 left-0 right-0 z-[100] p-4 bg-red-600 text-white shadow-lg animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              {restaurant?.status === 'frozen' ? (
                <div className="text-lg">❄️</div>
              ) : (
                <MapPin size={20} />
              )}
            </div>
            <div className="flex-1">
              {restaurant?.status === 'frozen' ? (
                <>
                  <h3 className="text-xs font-black uppercase tracking-wider">Restaurant Temporarily Unavailable</h3>
                  <p className="text-[10px] font-bold opacity-90 leading-tight">
                    This restaurant is currently not accepting orders. Please check back later!
                  </p>
                </>
              ) : !isWithinOperatingHours() ? (
                <>
                  <h3 className="text-xs font-black uppercase tracking-wider">Restaurant Closed</h3>
                  <p className="text-[10px] font-bold opacity-90 leading-tight">
                    We are currently closed. Please visit us during opening hours!
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-xs font-black uppercase tracking-wider">Outside Ordering Zone</h3>
                  <p className="text-[10px] font-bold opacity-90 leading-tight">
                    You are {Math.round((realDistance ?? geofencing?.distance_meters) || 0)}m away. 
                    Please visit the shop to place an order.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header + Tabs */}
      <div className={`sticky top-0 z-10 bg-white shadow-sm transition-all duration-300 ${!canOrder && showGeofenceBanner ? 'mt-[72px]' : ''}`}>
        {/* Header */}
        <div className="px-5">
          <div className="flex items-center justify-between">
            <div className="w-8" />
            <div className="flex flex-col items-center">
              {restaurant?.logo_url ? (
                <img
                  src={resolveAssetUrl(restaurant.logo_url)}
                  alt={restaurant.name}
                  className="w-16 h-16 object-cover rounded-full mt-2"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mt-2">
                  <UtensilsCrossed size={32} className="text-[#61A9E5]" />
                </div>
              )}
            </div>
            <button
              onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600"
            >
              {viewMode === "list" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Category Tabs — no All button */}
        <div
          ref={tabsRef}
          className="flex gap-1 overflow-x-auto px-1 py-1 border-t scrollbar-hide"
        >
          {categoriesWithItems.map((cat) => (
            <button
              key={cat.id}
              id={`tab-${cat.id}`}
              onClick={() => scrollToSection(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap font-medium transition ${
                activeCategory === cat.id
                  ? "bg-[#61A9E5]  text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-blue-300 hover:text-white"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Food Items — all categories shown, scroll to navigate */}
      <div className="px-4 py-4 flex flex-col gap-6">
        {categoriesWithItems.map((cat) => {
          const catItems = foodItems.filter((item) =>
            item.category_ids.includes(cat.id),
          );
          if (catItems.length === 0) return null;

          return (
            <div
              key={cat.id}
              data-category-id={cat.id}
              ref={(el) => {
                sectionRefs.current[cat.id] = el;
              }}
            >
              {/* Category Header */}
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-base font-bold text-[#61A9E5]">
                  {cat.name}
                </h2>
                <div className="flex-1 h-px bg-[#61A9E5]" />
              </div>

              {/* LIST VIEW */}
              {viewMode === "list" && (
                <div className="flex flex-col gap-3">
                  {catItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => !canOrder && setShowGeofenceBanner(true)}
                      className={`bg-white rounded-2xl shadow-sm flex gap-4 p-3 items-center ${!canOrder ? 'cursor-pointer' : ''}`}
                    >
                      {item.image_url ? (
                        <img
                          src={resolveAssetUrl(item.image_url)}
                          alt={item.name}
                          className="w-24 h-24 rounded-xl object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center text-3xl">
                          🍴
                        </div>
                      )}
                      <div className="flex-1">
                        <h2 className="font-semibold text-gray-800">
                          {item.name}
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.description}
                        </p>
                        {item.variants.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.variants.map((v) => (
                              <span
                                key={v.id}
                                className="text-xs bg-[#61A9E5] text-white px-2 py-0.5 rounded-full"
                              >
                                {v.name}: ${Number(v.price).toFixed(2)} / ៛
                                {(Number(v.price) * 4000).toLocaleString()}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <>
                            <p className="text-blue-500 font-bold mt-1">
                              ${Number(item.price).toFixed(2)}
                            </p>
                            <p className="text-blue-500 font-bold">
                              ៛{item.price_khr ? Number(item.price_khr).toLocaleString() : (Number(item.price) * 4000).toLocaleString()}
                            </p>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!canOrder ? (
                          <button 
                            onClick={() => setShowGeofenceBanner(true)}
                            className="px-3 py-1 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                          >
                            View Only
                          </button>
                        ) : (
                          <>
                            {getTotalQuantity(item.id) > 0 &&
                              !item.variants.length && (
                                <>
                                  <button
                                    onClick={() => removeFromCart(item)}
                                    className="bg-gray-100 text-blue-500 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold"
                                  >
                                    −
                                  </button>
                                  <span className="text-sm font-bold text-blue-500 w-4 text-center">
                                    {getTotalQuantity(item.id)}
                                  </span>
                                </>
                              )}
                            {getTotalQuantity(item.id) > 0 &&
                              item.variants.length > 0 && (
                                <span className="text-sm font-bold text-blue-500 w-4 text-center">
                                  {getTotalQuantity(item.id)}
                                </span>
                              )}
                            <button
                              onClick={() => {
                                if (item.variants.length > 0) {
                                  setVariantModal(item);
                                } else {
                                  addToCart(item);
                                }
                              }}
                              className="bg-[#61A9E5] text-white rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold shadow hover:bg-blue transition"
                            >
                              +
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* GRID VIEW */}
              {viewMode === "grid" && (
                <div className="grid grid-cols-2 gap-3">
                  {catItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => !canOrder && setShowGeofenceBanner(true)}
                      className={`bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col ${!canOrder ? 'cursor-pointer' : ''}`}
                    >
                      <div className="h-32 w-full relative">
                        {item.image_url ? (
                          <img
                            src={resolveAssetUrl(item.image_url)}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-3xl">
                            🍴
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex flex-col flex-1">
                        <h2 className="font-semibold text-gray-800 text-sm line-clamp-1">
                          {item.name}
                        </h2>
                        <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                          {item.description}
                        </p>
                        <div className="mt-auto pt-2 flex items-center justify-between">
                          <div className="flex flex-col">
                            <p className="text-blue-500 font-bold text-xs">
                              ${Number(item.price).toFixed(2)}
                            </p>
                            <p className="text-blue-500 font-bold text-[10px]">
                              ៛{item.price_khr ? Number(item.price_khr).toLocaleString() : (Number(item.price) * 4000).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {!canOrder ? (
                              <button
                                onClick={() => setShowGeofenceBanner(true)}
                                className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-md text-[8px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                              >
                                View Only
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  if (item.variants.length > 0) {
                                    setVariantModal(item);
                                  } else {
                                    addToCart(item);
                                  }
                                }}
                                className="bg-[#61A9E5] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow hover:bg-blue transition"
                              >
                                +
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Cart Button */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 left-4 right-4">
          <button
            onClick={goToCart}
            className="w-full bg-[#61A9E5] text-white py-4 rounded-2xl shadow-lg flex justify-between items-center px-6 font-semibold text-lg"
          >
            <span className="bg-[#61A9E5] rounded-full px-2 py-0.5 text-sm">
              {totalItems} items
            </span>
            <span>View Cart</span>
            <div className="flex flex-col items-end">
              <span className="text-base leading-tight">${totalPrice.toFixed(2)}</span>
              <span className="text-[10px] opacity-80 leading-tight">៛{(totalPrice * 4000).toLocaleString()}</span>
            </div>
          </button>
        </div>
      )}

      {/* Contact */}
      <div className="ml-10 mr-10 text-[#162279] space-y-1 pb-6">
        <p className="font-semibold text-lg">Contact Us</p>
        {(() => {
          const allPhones = [];
          if (restaurant?.phone) allPhones.push(restaurant.phone);
          if (restaurant?.phones) {
            allPhones.push(...restaurant.phones.filter((p) => p));
          }
          if (allPhones.length > 0) {
            return (
              <p>
                <span className="font-medium">Phone:</span> {allPhones.join(" / ")}
              </p>
            );
          }
          return null;
        })()}
        {restaurant?.email && (
          <p className="hover:text-blue-600">Email: {restaurant.email}</p>
        )}
      </div>

      {/* Variant Picker Modal */}
      {variantModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">
                {variantModal.name}
              </h2>
              <button
                onClick={() => setVariantModal(null)}
                className="text-gray-400 text-xl font-bold"
              >
                ✕
              </button>
            </div>
            {variantModal.image_url && (
              <img
                src={resolveAssetUrl(variantModal.image_url)}
                alt={variantModal.name}
                className="w-full h-40 object-cover rounded-2xl"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
            )}
            <p className="text-sm text-gray-400">{variantModal.description}</p>
            <p className="text-sm font-semibold text-gray-600">
              Select a size:
            </p>

            <div className="flex flex-col gap-3">
              {variantModal.variants.map((variant) => (
                <div
                  key={variant.id}
                  className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      {variant.name}
                    </p>
                    <p className="text-blue-500 font-bold">
                      ${Number(variant.price).toFixed(2)}
                    </p>
                    <p className="text-blue-500 text-xs">
                      ៛{(Number(variant.price) * 4000).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getQuantity(variantModal.id, variant.id) > 0 && (
                      <>
                        <button
                          onClick={() => removeFromCart(variantModal, variant)}
                          className="bg-gray-100 text-blue-500 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold"
                        >
                          −
                        </button>
                        <span className="text-sm font-bold text-blue-500 w-4 text-center">
                          {getQuantity(variantModal.id, variant.id)}
                        </span>
                      </>
                    )}
                    <button
                      onClick={() => addToCart(variantModal, variant)}
                      className="bg-[#61A9E5] text-white rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setVariantModal(null)}
              className="w-full bg-[#61A9E5] text-white py-3 rounded-2xl font-semibold"   
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {navigating && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center">
          <div className="bg-white rounded-2xl px-8 py-6 flex flex-col items-center gap-3 shadow-xl">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-[#61A9E5] rounded-full animate-spin" /> 
            <p className="text-gray-700 font-semibold">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
}
