<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Models\GlobalBanner;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\User;
use App\Models\Visitor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    public function trackVisitor(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'restaurant_id' => 'nullable|exists:restaurants,id',
            'session_id' => 'nullable|string',
        ]);

        Visitor::create([
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'restaurant_id' => $validated['restaurant_id'] ?? null,
            'session_id' => $validated['session_id'] ?? null,
        ]);

        return response()->json([
            'message' => 'Visitor tracked successfully',
        ]);
    }

    public function stats(): JsonResponse
    {
        $totalUsers = AdminUser::count();
        $totalRestaurants = Restaurant::count();
        $totalOrders = Order::count();
        $totalRevenue = Order::where('status', Order::STATUS_COMPLETED)->sum('total_amount');
        $totalVisitors = Visitor::count();
        $activeRestaurants = Restaurant::whereHas('orders', function ($query) {
            $query->where('created_at', '>=', now()->subDays(30));
        })->count();
        
        // Mock failed payments for now as it's not implemented
        $failedPayments = 0;

        // Weekly stats for chart
        $weeklyStats = Order::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('count(*) as orders'),
            DB::raw('sum(total_amount) as revenue')
        )
        ->where('created_at', '>=', now()->subDays(7))
        ->groupBy('date')
        ->orderBy('date')
        ->get();

        // Top Restaurants
        $topRestaurants = Restaurant::withCount('orders')
            ->withSum(['orders' => function($query) {
                $query->where('status', Order::STATUS_COMPLETED);
            }], 'total_amount')
            ->orderByDesc('orders_count')
            ->limit(5)
            ->get()
            ->map(function ($restaurant) {
                return [
                    'name' => $restaurant->name,
                    'orders' => $restaurant->orders_count,
                    'revenue' => (float) ($restaurant->orders_sum_total_amount ?? 0),
                ];
            });

        // Recent Logins (Using AdminUser)
        $recentLogins = AdminUser::latest()
            ->limit(5)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => str_pad($user->id, 2, '0', STR_PAD_LEFT),
                    'name' => $user->name,
                    'role' => $user->role,
                    'status' => 'Online',
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'last_login' => $user->created_at->format('d M Y H:i A'),
                ];
            });

        return response()->json([
            'stats' => [
                'total_users' => $totalUsers,
                'total_restaurants' => $totalRestaurants,
                'total_orders' => $totalOrders,
                'total_revenue' => (float) $totalRevenue,
                'total_visitors' => $totalVisitors,
                'active_restaurants' => $activeRestaurants,
                'failed_payments' => $failedPayments,
            ],
            'weekly_stats' => $weeklyStats,
            'top_restaurants' => $topRestaurants,
            'recent_logins' => $recentLogins,
        ]);
    }

    // ============ AdminUser (Platform Admins: Super Admin/Admin/Supporter) ============
    public function adminUsers(): JsonResponse
    {
        $adminUsers = AdminUser::latest()->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'phone' => $user->phone,
                'role' => $user->role,
                'status' => 'Online',
                'last_login' => $user->updated_at->format('d M Y H:i A'),
                'profile_image' => $user->profile_image,
            ];
        });

        return response()->json(['data' => $adminUsers]);
    }

    public function storeAdminUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:admin_users',
            'email' => 'required|email|max:255|unique:admin_users',
            'phone' => 'nullable|string|max:255',
            'role' => 'required|string|in:super admin,admin,supporter',
            'password' => 'required|string|min:6',
            'profile_image' => 'nullable|string',
        ]);

        $adminUser = AdminUser::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'role' => $validated['role'],
            'password' => Hash::make($validated['password']),
            'profile_image' => $validated['profile_image'] ?? null,
        ]);

        return response()->json([
            'message' => 'Admin user created successfully',
            'data' => $adminUser
        ], 201);
    }

    public function showAdminUser($id): JsonResponse
    {
        $adminUser = AdminUser::findOrFail($id);
        return response()->json(['data' => $adminUser]);
    }

    public function updateAdminUser(Request $request, $id): JsonResponse
    {
        $adminUser = AdminUser::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'username' => 'sometimes|string|max:255|unique:admin_users,username,'.$id,
            'email' => 'sometimes|email|max:255|unique:admin_users,email,'.$id,
            'phone' => 'nullable|string|max:255',
            'role' => 'sometimes|string|in:super admin,admin,supporter',
            'password' => 'sometimes|nullable|string|min:6',
            'profile_image' => 'nullable|string',
        ]);

        // Remove password from validated data if it's empty
        if (isset($validated['password']) && empty($validated['password'])) {
            unset($validated['password']);
        }

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $adminUser->update($validated);

        return response()->json([
            'message' => 'Admin user updated successfully',
            'data' => $adminUser
        ]);
    }

    public function deleteAdminUser($id): JsonResponse
    {
        $adminUser = AdminUser::findOrFail($id);
        $adminUser->delete();
        return response()->json(['message' => 'Admin user deleted successfully']);
    }

    // ============ User (Restaurant Staff: Owner/Manager/Staff) ============
    public function restaurantUsers(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Ensure we only show users belonging to the owner's restaurant
        // Or users that have the current restaurant_id if provided
        $restaurantId = $request->query('restaurant_id');
        
        $query = User::query();
        
        if ($restaurantId) {
            $query->where('restaurant_id', $restaurantId);
        } else if ($user instanceof User && $user->isOwner()) {
            // If owner, show all staff for their restaurants
            $restaurantIds = $user->restaurants()->pluck('id');
            $query->whereIn('restaurant_id', $restaurantIds);
        }
        // If AdminUser (super admin/admin), show all users (no filter)

        $users = $query->latest()->get()->keyBy('id');
        
        // Add restaurant owner to the list
        if ($restaurantId) {
            $restaurant = Restaurant::find($restaurantId);
            if ($restaurant && $restaurant->user_id) {
                $owner = User::find($restaurant->user_id);
                if ($owner && !isset($users[$owner->id])) {
                    $users->put($owner->id, $owner);
                }
            }
        } else if ($user instanceof User && $user->isOwner()) {
            // Add current owner to the list
            if (!isset($users[$user->id])) {
                $users->put($user->id, $user);
            }
        }

        $userList = $users->values()->map(function ($u) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role,
                'restaurant_id' => $u->restaurant_id,
                'status' => 'Online',
                'last_login' => $u->updated_at->format('d M Y H:i A'),
            ];
        });

        return response()->json(['data' => $userList]);
    }

    public function storeRestaurantUser(Request $request): JsonResponse
    {
        $authenticatedUser = $request->user();
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users',
            'role' => 'required|string|in:owner,manager,staff',
            'password' => 'required|string|min:6',
            'restaurant_id' => 'required|exists:restaurants,id'
        ]);

        // Authorization check: Does the owner own this restaurant? (only if authenticated user is a User, not AdminUser)
        if ($authenticatedUser instanceof User && !$authenticatedUser->restaurants()->where('id', $validated['restaurant_id'])->exists()) {
            return response()->json(['message' => 'Unauthorized. You do not own this restaurant.'], 403);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'restaurant_id' => $validated['restaurant_id'],
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'message' => 'Restaurant user created successfully',
            'data' => $user
        ], 201);
    }

    public function showRestaurantUser($id): JsonResponse
    {
        $user = User::findOrFail($id);
        return response()->json(['data' => $user]);
    }

    public function updateRestaurantUser(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,'.$id,
            'role' => 'sometimes|string|in:owner,manager,staff',
            'password' => 'sometimes|string|min:6',
            'restaurant_id' => 'sometimes|exists:restaurants,id',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'message' => 'Restaurant user updated successfully',
            'data' => $user
        ]);
    }

    public function deleteRestaurantUser($id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->delete();
        return response()->json(['message' => 'Restaurant user deleted successfully']);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = AdminUser::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Invalid email or password.'
            ], 401);
        }

        return response()->json([
            'message' => 'Admin login successful.',
            'user' => $user,
        ]);
    }

    public function restaurants(): JsonResponse
    {
        $restaurants = Restaurant::with(['user'])->withCount('orders')
            ->withSum(['orders' => function($query) {
                $query->where('status', Order::STATUS_COMPLETED);
            }], 'total_amount')
            ->latest()
            ->get()
            ->map(function ($restaurant) {
                return [
                    'id' => $restaurant->id,
                    'name' => $restaurant->name,
                    'owner' => $restaurant->user->name ?? 'Unknown',
                    'user' => $restaurant->user,
                    'status' => $restaurant->status,
                    'orders' => $restaurant->orders_count,
                    'revenue' => (float) ($restaurant->orders_sum_total_amount ?? 0),
                    'location' => $restaurant->address ?? 'N/A',
                    'joined' => $restaurant->created_at->format('M Y'),
                ];
            });

        return response()->json(['data' => $restaurants]);
    }

    public function impersonateRestaurantOwner($id): JsonResponse
    {
        $restaurant = Restaurant::with('user')->findOrFail($id);
        $user = $restaurant->user;

        if (!$user) {
            return response()->json(['message' => 'This restaurant has no owner.'], 404);
        }

        // Load the restaurant relation for the user
        $user->load('restaurant');

        return response()->json([
            'message' => 'Impersonation successful',
            'user' => $user,
            'restaurant' => $restaurant,
        ]);
    }

    public function showRestaurant($id): JsonResponse
    {
        $restaurant = Restaurant::with(['user', 'menuItems'])->findOrFail($id);
        return response()->json(['data' => $restaurant]);
    }

    public function deleteRestaurant($id): JsonResponse
    {
        $restaurant = Restaurant::findOrFail($id);
        $restaurant->delete();
        return response()->json(['message' => 'Restaurant deleted successfully']);
    }

    public function updateRestaurantStatus(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:active,frozen',
        ]);

        $restaurant = Restaurant::findOrFail($id);
        $restaurant->update(['status' => $validated['status']]);

        return response()->json([
            'message' => 'Restaurant status updated successfully',
            'restaurant' => $restaurant
        ]);
    }

    // ============ Global Banner Management ============
    public function getActiveBanner(): JsonResponse
    {
        $banner = GlobalBanner::where('is_active', true)->latest()->first();
        return response()->json(['data' => $banner]);
    }

    public function setBanner(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string',
        ]);

        // Deactivate all existing banners
        GlobalBanner::where('is_active', true)->update(['is_active' => false]);

        // Create new active banner
        $banner = GlobalBanner::create([
            'message' => $validated['message'],
            'is_active' => true,
            'admin_user_id' => $request->user()->id ?? null,
        ]);

        return response()->json([
            'message' => 'Banner broadcasted successfully',
            'data' => $banner
        ]);
    }

    public function clearBanner(): JsonResponse
    {
        GlobalBanner::where('is_active', true)->update(['is_active' => false]);
        return response()->json(['message' => 'Banner cleared successfully']);
    }
}
