<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderSession;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function index(Request $request, Restaurant $restaurant): JsonResponse
    {
        $query = $restaurant->orders()->with('items');

        // Filter by Status
        if ($request->filled('status')) {
            $query->where('status', $this->normalizeStatus((string) $request->input('status')));
        }

        // Filter by Date Range
        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->input('from_date'));
        }
        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->input('to_date'));
        }

        $orders = $query->latest()->get();

        // Calculate summary in one pass over the orders instead of multiple queries
        $summary = [
            'total' => 0,
            'pending' => 0,
            'accepted' => 0,
            'completed' => 0,
            'cancelled' => 0,
        ];

        foreach ($orders as $order) {
            $summary['total']++;
            switch ($order->status) {
                case Order::STATUS_PENDING:
                    $summary['pending']++;
                    break;
                case Order::STATUS_ACCEPTED:
                    $summary['accepted']++;
                    break;
                case Order::STATUS_COMPLETED:
                    $summary['completed']++;
                    break;
                case Order::STATUS_CANCELLED:
                    $summary['cancelled']++;
                    break;
            }
        }

        return response()->json([
            'data' => $orders,
            'summary' => $summary,
        ]);
    }

    public function store(Request $request, Restaurant $restaurant): JsonResponse
    {
        // Check if restaurant is frozen
        if ($restaurant->status === 'frozen') {
            return response()->json(['message' => 'This restaurant is currently unavailable. Please try again later.'], 403);
        }

        // Geofencing check
        if ($restaurant->is_geofencing_enabled) {
            $userLat = $request->header('X-User-Lat');
            $userLng = $request->header('X-User-Lng');

            if (! $userLat || ! $userLng) {
                return response()->json(['message' => 'Location coordinates are required to place an order.'], 403);
            }

            $distance = $this->haversineDistance(
                (float) $userLat,
                (float) $userLng,
                (float) $restaurant->latitude,
                (float) $restaurant->longitude
            );

            if ($distance > $restaurant->radius_meters) {
                return response()->json(['message' => 'You are outside the allowed ordering radius.'], 403);
            }
        }

        // Operating hours check
        if ($restaurant->is_auto_close_enabled) {
            $now = now();
            $nowMinutes = $now->hour * 60 + $now->minute;
            
            $openMinutes = 0;
            $closeMinutes = 24 * 60;
            
            if ($restaurant->open_time) {
                $openTime = \Carbon\Carbon::parse($restaurant->open_time);
                $openMinutes = $openTime->hour * 60 + $openTime->minute;
            }
            
            if ($restaurant->close_time) {
                $closeTime = \Carbon\Carbon::parse($restaurant->close_time);
                $closeMinutes = $closeTime->hour * 60 + $closeTime->minute;
            }
            
            $isWithinHours = false;
            if ($closeMinutes <= $openMinutes) {
                // Operating hours wrap around midnight
                $isWithinHours = $nowMinutes >= $openMinutes || $nowMinutes < $closeMinutes;
            } else {
                // Normal operating hours (same day)
                $isWithinHours = $nowMinutes >= $openMinutes && $nowMinutes < $closeMinutes;
            }
            
            if (!$isWithinHours) {
                return response()->json(['message' => 'We are closed. Please visit us during opening hours.'], 403);
            }
        }

        $validated = $request->validate([
            'table_number' => ['nullable', 'string', 'max:50'],
            'customer_name' => ['nullable', 'string', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.menu_item_id' => ['nullable', 'exists:menu_items,id'],
            'items.*.item_name' => ['nullable', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:20'],
            'items.*.unit_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.special_instructions' => ['nullable', 'string'],
        ], [
            'items.*.quantity.max' => 'Maximum quantity per item is 20.',
        ]);

        // Block suspicious bulk orders (e.g., total items > 50)
        $totalQuantity = array_sum(array_column($validated['items'], 'quantity'));
        if ($totalQuantity > 50) {
            return response()->json([
                'message' => 'Suspicious order detected. Total items exceed limit (max 50).',
            ], 422);
        }

        $order = DB::transaction(function () use ($restaurant, $validated) {
            // Handle Order Session
            $session = null;
            if (!empty($validated['table_number'])) {
                $session = OrderSession::firstOrCreate(
                    [
                        'restaurant_id' => $restaurant->id,
                        'table_number' => $validated['table_number'],
                        'status' => 'active',
                    ],
                    [
                        'session_id' => (string) Str::uuid(),
                        'total_amount' => 0,
                    ]
                );
            }

            $order = $restaurant->orders()->create([
                'order_session_id' => $session?->id,
                'order_number' => $this->uniqueOrderNumber(),
                'table_number' => $validated['table_number'] ?? null,
                'customer_name' => $validated['customer_name'] ?? null,
                'customer_phone' => $validated['customer_phone'] ?? null,
                'status' => Order::STATUS_PENDING,
                'notes' => $validated['notes'] ?? null,
                'total_amount' => 0,
            ]);

            $total = 0;
            $totalKhr = 0;

            foreach ($validated['items'] as $itemData) {
                $menuItem = null;

                if (! empty($itemData['menu_item_id'])) {
                    $menuItem = MenuItem::find($itemData['menu_item_id']);

                    if (! $menuItem || $menuItem->restaurant_id !== $restaurant->id) {
                        throw ValidationException::withMessages([
                            'items' => ['One or more menu items do not belong to this restaurant.'],
                        ]);
                    }
                }

                $quantity = (int) $itemData['quantity'];
                $unitPrice = (float) ($itemData['unit_price'] ?? $menuItem?->price ?? 0);
                $lineTotal = $quantity * $unitPrice;

                // Get KHR price from DB or fallback to 4000 rate   
                $unitPriceKhr = $menuItem?->price_khr ?? ($unitPrice * 4000);
                $lineTotalKhr = $quantity * $unitPriceKhr;

                $total += $lineTotal;
                $totalKhr += $lineTotalKhr;

                $order->items()->create([
                    'menu_item_id' => $menuItem?->id,
                    'item_name' => $itemData['item_name'] ?? $menuItem?->name ?? 'Menu item',
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'unit_price_khr' => $unitPriceKhr,
                    'line_total' => $lineTotal,
                    'line_total_khr' => $lineTotalKhr,
                    'special_instructions' => $itemData['special_instructions'] ?? null,
                ]);
            }

            $order->update([
                'total_amount' => $total,
                'total_amount_khr' => $totalKhr,
            ]);

            // Update session total
            if ($session) {
                $session->increment('total_amount', $total);
                $session->increment('total_amount_khr', $totalKhr);
            }

            return $order->fresh('items');
        });

        return response()->json([
            'message' => 'Order created.',
            'data' => $order,
        ], 201);
    }

    public function show(Order $order): JsonResponse
    {
        return response()->json([
            'data' => $order->load(['restaurant', 'items.menuItem']),
        ]);
    }

    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in([
                Order::STATUS_PENDING,
                Order::STATUS_ACCEPTED,
                Order::STATUS_COMPLETED,
                Order::STATUS_CANCELLED,
                'accept',
                'accepted',
                'cancel',
                'canceled',
            ])],
        ]);

        $order->update([
            'status' => $this->normalizeStatus($validated['status']),
        ]);

        return response()->json([
            'message' => 'Order status updated.',
            'data' => $order->fresh('items'),
        ]);
    }

    public function destroy(Order $order): JsonResponse
    {
        $order->delete();

        return response()->json(['message' => 'Order deleted.']);
    }

    private function normalizeStatus(string $status): string
    {
        return match (strtolower(trim($status))) {
            'accepted', 'accept' => Order::STATUS_ACCEPTED,
            'completed', 'complete' => Order::STATUS_COMPLETED,
            'cancel', 'canceled', 'cancelled' => Order::STATUS_CANCELLED,
            default => Order::STATUS_PENDING,
        };
    }

    private function uniqueOrderNumber(): string
    {
        do {
            $orderNumber = 'SN-'.now()->format('Ymd').'-'.random_int(1000, 9999);
        } while (Order::where('order_number', $orderNumber)->exists());

        return $orderNumber;
    }

    private function haversineDistance($lat1, $lon1, $lat2, $lon2): float
    {
        $earthRadius = 6371000; // Earth radius in meters

        $latDelta = deg2rad($lat2 - $lat1);
        $lonDelta = deg2rad($lon2 - $lon1);

        $a = sin($latDelta / 2) * sin($latDelta / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($lonDelta / 2) * sin($lonDelta / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
