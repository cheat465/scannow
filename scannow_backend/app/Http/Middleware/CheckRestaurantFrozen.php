<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRestaurantFrozen
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        // Only check if the user is a restaurant owner/manager/staff (not platform admin)
        if ($user && method_exists($user, 'hasRole') && $user->hasRole(['owner', 'manager', 'staff'])) {
            if ($user->restaurant_id) {
                $restaurant = \App\Models\Restaurant::find($user->restaurant_id);
                if ($restaurant && $restaurant->status === 'frozen') {
                    return response()->json([
                        'message' => 'Your restaurant has been frozen by the admin. Please contact the administrator at scannow@gmail.com or 010766900.'
                    ], 403);
                }
            }
        }

        return $next($request);
    }
}
