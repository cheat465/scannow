const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

function getApiOrigin(): string {
  try {
    const parsed = new URL(API_BASE_URL);
    return parsed.origin;
  } catch {
    return "";
  }
}

type ApiErrorBody = {
  message?: string;
  errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export type ApiUser = {
  id: number;
  name: string;
  email: string;
  role?: string;
  restaurant_id?: number | null;
  restaurant?: Restaurant | null;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
  last_login?: string | null;
  status?: string;
};

export type AuthResponse = {
  message: string;
  user: ApiUser;
};

export type GlobalBanner = {
  id: number;
  message: string;
  is_active: boolean;
  admin_user_id?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type Restaurant = {
  id: number;
  user_id?: number | null;
  name: string;
  slug: string;
  phone?: string | null;
  phones?: string[] | null;
  telegram_chat_id?: string | null;
  email?: string | null;
  address?: string | null;
  description?: string | null;
  logo_url?: string | null;
  primary_color?: string;
  usd_to_khr_rate?: number;
  qr_code_token?: string;
  menu_items_count?: number;
  orders_count?: number;
  created_at?: string;
  updated_at?: string;
  is_geofencing_enabled?: boolean;
  latitude?: number | string | null;
  longitude?: number | string | null;
  radius_meters?: number | null;
  location_name?: string | null;
  location_link?: string | null;
  language?: string;
  is_auto_close_enabled?: boolean;
  open_time?: string | null;
  close_time?: string | null;
  table_map_data?: any;
  categories?: string[] | null;
  status?: string;
};

export type MenuItem = {
  id: number;
  restaurant_id: number;
  name: string;
  category: "food" | "drinks" | "dessert" | string;
  description?: string | null;
  price: string;
  price_khr?: number | string | null;
  preparation_time_minutes?: number | null;
  image_url?: string | null;
  is_available: boolean;
  is_vegetarian: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export type OrderItem = {
  id: number;
  order_id: number;
  menu_item_id?: number | null;
  item_name: string;
  quantity: number;
  unit_price: string;
  line_total: string;
  special_instructions?: string | null;
};

export type Order = {
  id: number;
  restaurant_id: number;
  order_number: string;
  table_number?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  status: "pending" | "completed" | "cancelled" | string;
  total_amount: string;
  notes?: string | null;
  items?: OrderItem[];
  created_at?: string;
  updated_at?: string;
};

export type KitchenItem = {
  name: string;
  quantity: number;
  unit_price?: number;
  unit_price_khr?: number;
  status: string;
  special_instructions?: string | null;
};

export type KitchenSession = {
  session_id: string;
  table_number: string;
  total_bill: number;
  total_bill_khr?: number;
  items: KitchenItem[];
  created_at: string;
};

export type ListResponse<T> = {
  data: T[];
};

export type ItemResponse<T> = {
  message?: string;
  data: T;
};

export async function trackVisitor(restaurantId?: number | null, sessionId?: string | null) {
  try {
    await apiRequest("/visitors", {
      method: "POST",
      body: JSON.stringify({
        restaurant_id: restaurantId,
        session_id: sessionId,
      }),
    });
  } catch (error) {
    console.error("Failed to track visitor:", error);
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(options.headers);
  const isFormData = options.body instanceof FormData;

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (options.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Auto-inject location headers if available in localStorage
  if (typeof window !== "undefined") {
    const lat = localStorage.getItem("user_lat");
    const lng = localStorage.getItem("user_lng");
    if (lat && lng) {
      headers.set("X-User-Lat", lat);
      headers.set("X-User-Lng", lng);
    }

    const scannowUser = localStorage.getItem("scannow_user");
    if (scannowUser) {
      try {
        const user = JSON.parse(scannowUser);
        if (user.id) {
          headers.set("X-User-Id", String(user.id));
        }
      } catch (e) {
        console.error("Failed to parse user from localStorage");
      }
    }

    const scannowAdminUser = localStorage.getItem("scannow_admin_user");
    if (scannowAdminUser) {
      try {
        const adminUser = JSON.parse(scannowAdminUser);
        if (adminUser.id) {
          headers.set("X-Admin-User-Id", String(adminUser.id));
        }
      } catch (e) {
        console.error("Failed to parse admin user from localStorage");
      }
    }
  }

  const response = await fetch(url, {
    cache: "no-store", // Disable caching by default for API requests
    ...options,
    headers,
  });

  const body = (await readJson(response)) as ApiErrorBody | T | null;

  if (!response.ok) {
    const errorBody = body as ApiErrorBody | null;
    const firstValidationMessage = errorBody?.errors
      ? Object.values(errorBody.errors).flat()[0]
      : undefined;

    throw new ApiError(
      firstValidationMessage ?? errorBody?.message ?? "Request failed.",
      response.status,
      errorBody?.errors,
    );
  }

  return body as T;
}

async function readJson(response: Response): Promise<unknown | null> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  return JSON.parse(text);
}

export function getStoredUser(): ApiUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawUser = window.localStorage.getItem("scannow_user");

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as ApiUser;
  } catch {
    window.localStorage.removeItem("scannow_user");
    return null;
  }
}

export function storeUser(user: ApiUser) {
  window.localStorage.setItem("scannow_user", JSON.stringify(user));
}

export function getStoredAdminUser(): ApiUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawUser = window.localStorage.getItem("scannow_admin_user");

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as ApiUser;
  } catch {
    window.localStorage.removeItem("scannow_admin_user");
    return null;
  }
}

export function storeAdminUser(user: ApiUser) {
  window.localStorage.setItem("scannow_admin_user", JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  
  // Clear all known Scannow-related localStorage items
  const keysToRemove = [
    "scannow_user",
    "scannow_admin_user",
    "scannow_restaurant",
    "scannow_restaurant_id",
    "cart",
    "tableNumber",
    "restaurantId",
    "scannow_impersonating_admin"
  ];
  
  keysToRemove.forEach(key => window.localStorage.removeItem(key));
  
  // Optional: Clear all localStorage to be safe
  // window.localStorage.clear();
}

export function storeImpersonatingAdmin(admin: ApiUser) {
  window.localStorage.setItem("scannow_impersonating_admin", JSON.stringify(admin));
}

export function getStoredImpersonatingAdmin(): ApiUser | null {
  if (typeof window === "undefined") return null;
  
  const raw = window.localStorage.getItem("scannow_impersonating_admin");
  if (!raw) return null;
  
  try {
    return JSON.parse(raw) as ApiUser;
  } catch {
    window.localStorage.removeItem("scannow_impersonating_admin");
    return null;
  }
}

export function getStoredRestaurantId(): number | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawRestaurantId = window.localStorage.getItem("scannow_restaurant_id");
  const restaurantId = Number(rawRestaurantId);

  return Number.isFinite(restaurantId) && restaurantId > 0
    ? restaurantId
    : null;
}

export function getStoredRestaurant(): Restaurant | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawRestaurant = window.localStorage.getItem("scannow_restaurant");

  if (!rawRestaurant) {
    return null;
  }

  try {
    return JSON.parse(rawRestaurant) as Restaurant;
  } catch {
    window.localStorage.removeItem("scannow_restaurant");
    return null;
  }
}

export function storeRestaurant(restaurant: Restaurant) {
  window.localStorage.setItem("scannow_restaurant_id", String(restaurant.id));
  window.localStorage.setItem("scannow_restaurant", JSON.stringify(restaurant));
}

export function resolveAssetUrl(path?: string | null): string {
  if (!path) {
    return "";
  }

  // If it's already a data URI, return it
  if (path.startsWith("data:")) {
    return path;
  }

  // Handle backend storage paths
  // We check if it's a relative path starting with /storage/ 
  // OR if it's a full URL that contains /storage/ (to fix misconfigured APP_URL)
  const storageMarker = "/storage/";
  const storageIndex = path.indexOf(storageMarker);

  if (storageIndex !== -1) {
    // Extract the part from /storage/ onwards
    const relativePath = path.substring(storageIndex);
    const origin = getApiOrigin();
    return origin ? `${origin}${relativePath}` : relativePath;
  }

  // If it's a full URL but not a storage path, return it as is
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  // If it's a relative path (like /logo/logo.png), return as is (frontend asset)
  return path;
}
