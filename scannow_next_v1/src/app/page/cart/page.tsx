"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, resolveAssetUrl } from "@/lib/api";
import Link from "next/link";


type CartItem = {
  id: number;
  restaurant_id: number;
  name: string;
  price: number;
  price_khr?: number;
  quantity: number;
  image_url: string;
};

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState("1");
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [isFrozen, setIsFrozen] = useState(false);

  // Fetch restaurant data to check if frozen
  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!restaurantId) return;
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/restaurants/${restaurantId}`
        );
        if (res.ok) {
          const data = await res.json();
          const restaurantData = data.data || data;
          setRestaurant(restaurantData);
          setIsFrozen(restaurantData?.status === "frozen");
        }
      } catch (err) {
        console.error("Failed to fetch restaurant for cart page", err);
      }
    };
    fetchRestaurant();
  }, [restaurantId]);

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    const savedTable = localStorage.getItem("tableNumber");
    const savedRestaurantId = localStorage.getItem("restaurantId");
    
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedTable) setTableNumber(savedTable);
    if (savedRestaurantId) setRestaurantId(savedRestaurantId);
  }, []);

  function updateQuantity(id: number, delta: number) {
    const updatedCart = cart
      .map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + delta } : item
      )
      .filter((item) => item.quantity > 0);
    
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  }

  const totalPrice = cart.reduce((sum, c) => sum + Number(c.price) * c.quantity, 0);
  const totalPriceKhr = cart.reduce((sum, c) => {
    const unitPriceKhr = c.price_khr ? Number(c.price_khr) : Number(c.price) * 4000;
    return sum + (unitPriceKhr * c.quantity);
  }, 0);

  async function placeOrder() {
    if (cart.length === 0 || !restaurantId) return;
    setPlacing(true);
    setError(null);

    try {
      const orderData = {
        table_number: tableNumber,
        status: "pending",
        items: cart.map((item) => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          unit_price_khr: item.price_khr || (Number(item.price) * 4000),
          item_name: item.name
        })),
        total_amount: totalPrice.toFixed(2),
        total_amount_khr: totalPriceKhr.toFixed(2)
      };

      await apiRequest(`/restaurants/${restaurantId}/orders`, {
        method: "POST",
        body: JSON.stringify(orderData),
      });

      setPlaced(true);
      localStorage.removeItem("cart");
      setCart([]);
    } catch (err) {
      console.error("Order failed:", err);
      setError(err instanceof Error ? err.message : "Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  }

  if (placed) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h1>
        <p className="text-gray-600 mb-8">Your delicious food is being prepared. Table #{tableNumber}</p>
        <button
          onClick={() => router.back()}
          className="px-8 py-3 bg-[#61A9E5] text-white font-bold rounded-xl shadow-lg hover:brightness-95 transition"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white shadow-sm px-4 py-4 flex items-center">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="ml-2 text-lg font-bold text-gray-900">Your Cart</h1>
        <div className="ml-auto bg-blue-[#61A9E5] text-white px-3 py-1 rounded-full text-xs font-bold">
          Table #{tableNumber}
        </div>
      </div>

      {/* Modern Error Notification */}
      {error && (
        <div className="mx-4 mt-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm flex items-start gap-3">
            <div className="flex-shrink-0 text-red-500 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-red-800">Order Error</h3>
              <p className="text-xs text-red-600 mt-1 leading-relaxed">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Frozen Banner */}
      {isFrozen && !error && (
        <div className="mx-4 mt-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm flex items-start gap-3">
            <div className="flex-shrink-0 text-red-500 mt-0.5">
              <div className="text-lg">❄️</div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-red-800">Restaurant Temporarily Unavailable</h3>
              <p className="text-xs text-red-600 mt-1 leading-relaxed">This restaurant is currently not accepting orders. Please check back later!</p>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-6 flex flex-col gap-4">
        {cart.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-gray-300 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-gray-500">Your cart is empty</p>
            <Link href="/page/menu" className="text-blue-500 font-bold mt-4 inline-block">
              Browse Menu
            </Link>
          </div>
        ) : (
          <>
            {cart.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 border border-gray-100">
                <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                  {item.image_url ? (
                    <img src={resolveAssetUrl(item.image_url)} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{item.name}</h3>
                  <p className="text-blue-500 font-bold">${Number(item.price).toFixed(2)}</p>
                  <p className="text-blue-500 text-xs font-bold">
                    ៛{(item.price_khr ? Number(item.price_khr) : Number(item.price) * 4000).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <span className="font-bold text-gray-900 w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-8 h-8 flex items-center justify-center text-[#F42997]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500">Subtotal</span>
                <div className="text-right">
                  <div className="font-medium text-gray-900">${totalPrice.toFixed(2)}</div>
                  <div className="text-[10px] font-bold text-gray-400">៛{totalPriceKhr.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-4">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <div className="text-right">
                  <div className="text-xl font-black text-blue-500">${totalPrice.toFixed(2)}</div>
                  <div className="text-xs font-bold text-blue-400">៛{totalPriceKhr.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Checkout Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg z-20">
          <button
            onClick={placeOrder}
            disabled={placing || isFrozen}
            className={`w-full py-4 font-black text-lg rounded-2xl shadow-xl transition flex items-center justify-center gap-3 ${
              isFrozen 
                ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                : "bg-[#61A9E5] text-white hover:brightness-95"
            } disabled:opacity-50`}
          >
            {placing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Placing Order...
              </>
            ) : isFrozen ? (
              "Restaurant Temporarily Unavailable"
            ) : (
              "Confirm Order"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
