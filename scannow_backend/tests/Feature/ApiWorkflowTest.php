<?php

namespace Tests\Feature;

use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_restaurant_menu_and_order_workflow(): void
    {
        $registerResponse = $this->postJson('/api/register', [
            'name' => 'Scan Now Owner',
            'email' => 'owner@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $registerResponse
            ->assertCreated()
            ->assertJsonPath('user.email', 'owner@example.com');

        $loginResponse = $this->postJson('/api/login', [
            'email' => 'owner@example.com',
            'password' => 'password',
        ]);

        $loginResponse
            ->assertOk()
            ->assertJsonPath('user.email', 'owner@example.com');

        $restaurantResponse = $this->postJson('/api/restaurants', [
            'user_id' => $registerResponse->json('user.id'),
            'name' => 'Romdoul Kitchen',
            'phone' => '012345678',
            'email' => 'owner@example.com',
            'address' => 'Phnom Penh',
            'description' => 'Fresh local food.',
        ]);

        $restaurantResponse
            ->assertCreated()
            ->assertJsonPath('data.name', 'Romdoul Kitchen')
            ->assertJsonStructure(['data' => ['id', 'slug', 'qr_code_token']]);

        $restaurantId = $restaurantResponse->json('data.id');

        $menuItemResponse = $this->postJson("/api/restaurants/{$restaurantId}/menu-items", [
            'name' => 'Fried Rice',
            'category' => 'food',
            'description' => 'House fried rice.',
            'price' => 2.50,
            'preparation_time_minutes' => 10,
            'is_available' => true,
            'is_vegetarian' => false,
        ]);

        $menuItemResponse
            ->assertCreated()
            ->assertJsonPath('data.name', 'Fried Rice')
            ->assertJsonPath('data.category', 'food');

        $menuItemId = $menuItemResponse->json('data.id');

        $this->getJson("/api/restaurants/{$restaurantId}/menu-items?available=true")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $menuItemId);

        $orderResponse = $this->postJson("/api/restaurants/{$restaurantId}/orders", [
            'table_number' => 'A1',
            'customer_name' => 'Customer One',
            'items' => [
                [
                    'menu_item_id' => $menuItemId,
                    'quantity' => 2,
                ],
            ],
        ]);

        $orderResponse
            ->assertCreated()
            ->assertJsonPath('data.status', Order::STATUS_PENDING)
            ->assertJsonPath('data.total_amount', '5.00')
            ->assertJsonPath('data.items.0.item_name', 'Fried Rice');

        $orderId = $orderResponse->json('data.id');

        $this->patchJson("/api/orders/{$orderId}/status", [
            'status' => Order::STATUS_COMPLETED,
        ])
            ->assertOk()
            ->assertJsonPath('data.status', Order::STATUS_COMPLETED);

        $this->getJson("/api/restaurants/{$restaurantId}/orders")
            ->assertOk()
            ->assertJsonPath('summary.total', 1)
            ->assertJsonPath('summary.completed', 1);
    }
}
