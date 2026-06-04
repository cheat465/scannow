<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\KitchenController;
use App\Http\Controllers\Api\MenuItemController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\RestaurantController;
use App\Http\Controllers\Api\TelegramController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => [
    'status' => 'ok',
    'app' => config('app.name'),
]);

// Visitor tracking
Route::post('/visitors', [AdminController::class, 'trackVisitor']);

// Telegram Webhook
Route::post('/telegram/webhook', [TelegramController::class, 'webhook']);

Route::post('/admin/login', [AdminController::class, 'login']);

// Platform Admin Routes
Route::middleware(['role:super admin,admin'])->group(function () {
    Route::get('/admin/stats', [AdminController::class, 'stats']);
    
    // AdminUser (Platform Admins)
    Route::get('/admin/admin-users', [AdminController::class, 'adminUsers']);
    Route::post('/admin/admin-users', [AdminController::class, 'storeAdminUser']);
    Route::get('/admin/admin-users/{id}', [AdminController::class, 'showAdminUser']);
    Route::patch('/admin/admin-users/{id}', [AdminController::class, 'updateAdminUser']);
    Route::delete('/admin/admin-users/{id}', [AdminController::class, 'deleteAdminUser']);

    Route::get('/admin/restaurants', [AdminController::class, 'restaurants']);
    Route::get('/admin/restaurants/{id}', [AdminController::class, 'showRestaurant']);
    Route::delete('/admin/restaurants/{id}', [AdminController::class, 'deleteRestaurant']);
    Route::patch('/admin/restaurants/{id}/status', [AdminController::class, 'updateRestaurantStatus']);
    Route::post('/admin/restaurants/{id}/impersonate', [AdminController::class, 'impersonateRestaurantOwner'])->middleware('role:super admin');

    // Global Banner Management
    Route::get('/admin/banners/active', [AdminController::class, 'getActiveBanner']);
    Route::post('/admin/banners/set', [AdminController::class, 'setBanner']);
    Route::post('/admin/banners/clear', [AdminController::class, 'clearBanner']);
});

// Get active banner (public route for any user)
Route::get('/banners/active', [AdminController::class, 'getActiveBanner']);

// Restaurant Staff Routes (accessible by platform admins AND restaurant owners/managers)
Route::middleware(['role:super admin,admin,owner,manager', 'check.restaurant.frozen'])->group(function () {
    // User (Restaurant Staff)
    Route::get('/admin/restaurant-users', [AdminController::class, 'restaurantUsers']);
    Route::post('/admin/restaurant-users', [AdminController::class, 'storeRestaurantUser']);
    Route::get('/admin/restaurant-users/{id}', [AdminController::class, 'showRestaurantUser']);
    Route::patch('/admin/restaurant-users/{id}', [AdminController::class, 'updateRestaurantUser']);
    Route::delete('/admin/restaurant-users/{id}', [AdminController::class, 'deleteRestaurantUser']);
});

// Menu Item Routes - these are for restaurant staff (owner, manager) still
Route::middleware(['role:owner,manager', 'check.restaurant.frozen'])->group(function () {
    Route::post('/restaurants/{restaurant}/menu-items', [MenuItemController::class, 'store']);
    Route::put('/menu-items/{menuItem}', [MenuItemController::class, 'update']);
    Route::patch('/menu-items/{menuItem}', [MenuItemController::class, 'update']);
    Route::delete('/menu-items/{menuItem}', [MenuItemController::class, 'destroy']);
});

// Kitchen Routes - these are for restaurant staff (owner, manager, staff) still
Route::middleware(['role:owner,manager,staff', 'check.restaurant.frozen'])->group(function () {
    Route::get('/admin/kitchen/orders', [KitchenController::class, 'index']);
    Route::get('/admin/kitchen/archive', [KitchenController::class, 'archive']);
    Route::post('/admin/kitchen/sessions/{sessionId}/complete', [KitchenController::class, 'completeSession']);
    Route::patch('/admin/kitchen/orders/{orderId}/status', [KitchenController::class, 'updateOrderStatus']);
});

// Delete account route also uses check.restaurant.frozen
Route::delete('/auth/delete-account', [AuthController::class, 'deleteAccount'])->middleware(['role:owner,manager,staff', 'check.restaurant.frozen']);

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/verify-password-reset-code', [AuthController::class, 'verifyPasswordResetCode']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

Route::post('/auth/social-complete', [AuthController::class, 'socialComplete']);

// Fallback for Google callback (in case Google redirects to /api version)
Route::middleware('web')->group(function () {
    Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);
});
Route::delete('/auth/delete-account', [AuthController::class, 'deleteAccount'])->middleware('role:owner,manager,staff');

Route::apiResource('restaurants', RestaurantController::class);

Route::get('/restaurants/{restaurant}/menu-items', [MenuItemController::class, 'index']);
Route::get('/menu-items/{menuItem}', [MenuItemController::class, 'show']);

Route::get('/restaurants/{restaurant}/orders', [OrderController::class, 'index']);
Route::middleware('throttle:orders')->post('/restaurants/{restaurant}/orders', [OrderController::class, 'store']);
Route::get('/orders/{order}', [OrderController::class, 'show']);
Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);
Route::delete('/orders/{order}', [OrderController::class, 'destroy']);
