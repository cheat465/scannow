import MenuClient from "./MenuClient";

export const dynamic = "force-dynamic";

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string; restaurant_id?: string }>;
}) {
  const { table, restaurant_id } = await searchParams;

  // Use the standard API URL used throughout the project
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8000/api";

  // Build request to Laravel API. Default to restaurant id 1 if not provided.
  const restaurantId =
    restaurant_id || process.env.NEXT_PUBLIC_RESTAURANT_ID || "1";

  // Ensure we have the base URL without trailing slash and with /api
  const base = apiBase.replace(/\/$/, "");
  const itemsUrl = `${base}/restaurants/${restaurantId}/menu-items?available=1`;
  const restaurantUrl = `${base}/restaurants/${restaurantId}`;

  const [itemsRes, restaurantRes] = await Promise.all([
    fetch(itemsUrl, { cache: "no-store" }),
    fetch(restaurantUrl, { cache: "no-store" }),
  ]);

  if (!itemsRes.ok) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-bold">Menu fetch failed</h2>
        <p className="text-sm text-gray-600 mt-2">Status: {itemsRes.status}</p>
      </div>
    );
  }

  const itemsJson = await itemsRes.json();
  const rawItems: any[] = itemsJson.data || [];
  const geofencing = itemsJson.geofencing || { is_enabled: false, can_order: true };

  let restaurant = null;
  if (restaurantRes.ok) {
    const resJson = await restaurantRes.json();
    restaurant = resJson.data || resJson;
  }

  // Collect all unique categories from items first
  const uniqueItemCategories = Array.from(
    new Set((rawItems || []).map((item: any) => item.category || "food"))
  );
  
  // Combine restaurant's saved categories with item categories, ensuring no duplicates
  const restaurantCategories = restaurant?.categories || [];
  const defaultCategories = ["food", "drinks", "dessert"];
  const categoryNames = Array.from(new Set([...restaurantCategories, ...defaultCategories, ...uniqueItemCategories]));
  
  const categories = categoryNames.map((name: string, idx: number) => ({ id: idx + 1, name }));

  const formattedItems = (rawItems || []).map((item: any) => ({
    id: item.id,
    restaurant_id: item.restaurant_id,
    name: item.name,
    description: item.description,
    price: item.price,
    price_khr: item.price_khr,
    image_url: item.image_url || "",
    category_ids: [
      categories.find((c: { id: number; name: string }) => c.name.toLowerCase() === (item.category || "food").toLowerCase())?.id || 1,
    ],
    is_available: !!item.is_available,
    variants: [],
  }));

  return (
    <MenuClient
      categories={categories || []}
      foodItems={formattedItems}
      tableNumber={table || "1"}
      restaurant={restaurant}
      geofencing={geofencing}
    />
  );
}
