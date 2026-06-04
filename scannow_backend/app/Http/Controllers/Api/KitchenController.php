<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderSession;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class KitchenController extends Controller
{
    private function sendTelegramMessage($chatId, $message)
    {
        $botToken = '8724345769:AAFrX8JF8KnYvUYB06w9Zak-7FFvygoZ9_E';
        $url = "https://api.telegram.org/bot{$botToken}/sendMessage";
        
        try {
            Http::withoutVerifying()->post($url, [
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => 'Markdown'
            ]);
        } catch (\Exception $e) {
            // Log error but don't fail the request
            \Illuminate\Support\Facades\Log::error('Failed to send Telegram message: ' . $e->getMessage());
        }
    }

    public function index(Request $request): JsonResponse
    {
        // For now, if no restaurant_id is provided, we might want to get for all or a specific one
        // Usually, a kitchen dashboard is for a specific restaurant
        $restaurantId = $request->query('restaurant_id');

        $query = OrderSession::where('status', 'active')
            ->select(['id', 'session_id', 'table_number', 'status', 'total_amount', 'total_amount_khr', 'created_at', 'restaurant_id'])
            ->with([
                'orders' => function ($q) {
                    $q->select(['id', 'order_session_id', 'status']);
                },
                'orders.items' => function ($q) {
                    $q->select(['id', 'order_id', 'item_name', 'quantity', 'unit_price', 'unit_price_khr', 'special_instructions']);
                }
            ]);

        if ($restaurantId) {
            $query->where('restaurant_id', $restaurantId);
        }

        $sessions = $query->get()->map(function ($session) {
            $aggregatedItems = [];
            foreach ($session->orders as $order) {
                foreach ($order->items as $item) {
                    $key = $item->item_name . '_' . $item->special_instructions;
                    if (isset($aggregatedItems[$key])) {
                        $aggregatedItems[$key]['quantity'] += $item->quantity;
                    } else {
                        $aggregatedItems[$key] = [
                            'name' => $item->item_name,
                            'quantity' => $item->quantity,
                            'unit_price' => (float) $item->unit_price,
                            'unit_price_khr' => (float) $item->unit_price_khr,
                            'status' => $order->status,
                            'special_instructions' => $item->special_instructions,
                            'order_id' => $order->id,
                        ];
                    }
                }
            }

            return [
                'session_id' => $session->session_id,
                'table_number' => $session->table_number,
                'status' => $session->status,
                'total_bill' => (float) $session->total_amount,
                'total_bill_khr' => (float) $session->total_amount_khr,
                'order_ids' => $session->orders->pluck('id'),
                'items' => array_values($aggregatedItems),
                'created_at' => $session->created_at,
            ];
        });

        return response()->json($sessions);
    }

    public function completeSession(string $sessionId): JsonResponse
    {
        $session = OrderSession::where('session_id', $sessionId)->firstOrFail();
        
        $session->update(['status' => 'completed']);
        
        // Also mark all orders in this session as completed if they aren't already
        $session->orders()->where('status', '!=', 'cancelled')->update(['status' => 'completed']);

        // Get restaurant
        $restaurant = Restaurant::find($session->restaurant_id);

        // Send Telegram message if chat ID is set
        if ($restaurant && $restaurant->telegram_chat_id) {
            $aggregatedItems = [];
            foreach ($session->orders as $order) {
                foreach ($order->items as $item) {
                    $key = $item->item_name . '_' . $item->special_instructions;
                    if (isset($aggregatedItems[$key])) {
                        $aggregatedItems[$key]['quantity'] += $item->quantity;
                    } else {
                        $aggregatedItems[$key] = [
                            'name' => $item->item_name,
                            'quantity' => $item->quantity,
                            'unit_price' => (float) $item->unit_price,
                            'unit_price_khr' => (float) $item->unit_price_khr,
                            'special_instructions' => $item->special_instructions,
                        ];
                    }
                }
            }

            $invoiceMessage = "🏪 *{$restaurant->name}*\n";
            $invoiceMessage .= "📅 " . now()->format('d/m/Y H:i') . "\n";
            $invoiceMessage .= "🪑 Table: {$session->table_number}\n";
            $invoiceMessage .= "━━━━━━━━━━━━━━\n";
            foreach ($aggregatedItems as $item) {
                $invoiceMessage .= "• {$item['name']} x {$item['quantity']} - $" . number_format($item['unit_price'] * $item['quantity'], 2);
                if ($item['special_instructions']) {
                    $invoiceMessage .= " ({$item['special_instructions']})";
                }
                $invoiceMessage .= "\n";
            }
            $invoiceMessage .= "━━━━━━━━━━━━━━\n";
            $invoiceMessage .= "💰 Total: \$" . number_format((float)$session->total_amount, 2) . " / ៛" . number_format((float)$session->total_amount_khr);
            $this->sendTelegramMessage($restaurant->telegram_chat_id, $invoiceMessage);
        }

        return response()->json([
            'message' => 'Session completed and bill cleared.',
        ]);
    }

    public function archive(Request $request): JsonResponse
    {
        $restaurantId = $request->query('restaurant_id');

        $query = OrderSession::where('status', 'completed')
            ->select(['id', 'session_id', 'table_number', 'status', 'total_amount', 'total_amount_khr', 'created_at'])
            ->with([
                'orders' => function ($q) {
                    $q->select(['id', 'order_session_id', 'status']);
                },
                'orders.items' => function ($q) {
                    $q->select(['id', 'order_id', 'item_name', 'quantity', 'unit_price', 'unit_price_khr', 'special_instructions']);
                }
            ])
            ->orderBy('created_at', 'desc');

        if ($restaurantId) {
            $query->where('restaurant_id', $restaurantId);
        }

        $sessions = $query->get()->map(function ($session) {
            $aggregatedItems = [];
            foreach ($session->orders as $order) {
                foreach ($order->items as $item) {
                    $key = $item->item_name . '_' . $item->special_instructions;
                    if (isset($aggregatedItems[$key])) {
                        $aggregatedItems[$key]['quantity'] += $item->quantity;
                    } else {
                        $aggregatedItems[$key] = [
                            'name' => $item->item_name,
                            'quantity' => $item->quantity,
                            'unit_price' => (float) $item->unit_price,
                            'unit_price_khr' => (float) $item->unit_price_khr,
                            'status' => $order->status,
                            'special_instructions' => $item->special_instructions,
                            'order_id' => $order->id,
                        ];
                    }
                }
            }

            return [
                'session_id' => $session->session_id,
                'table_number' => $session->table_number,
                'status' => $session->status,
                'total_bill' => (float) $session->total_amount,
                'total_bill_khr' => (float) $session->total_amount_khr,
                'order_ids' => $session->orders->pluck('id'),
                'items' => array_values($aggregatedItems),
                'created_at' => $session->created_at,
            ];
        });

        return response()->json($sessions);
    }

    public function updateOrderStatus(Request $request, $orderId): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,accepted,completed',
        ]);

        $order = \App\Models\Order::findOrFail($orderId);
        $order->update(['status' => $validated['status']]);

        return response()->json([
            'message' => 'Order status updated successfully',
            'order' => $order,
        ]);
    }
}
