<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // Try to get user from standard auth first
        $user = $request->user();

        // If not authenticated via standard methods, check for X-User-Id header (Project's custom auth style)
        if (!$user && $request->hasHeader('X-User-Id')) {
            $userId = $request->header('X-User-Id');
            $user = \App\Models\User::find($userId);
            if ($user) {
                // Manually set the user for the request
                $request->setUserResolver(fn() => $user);
            }
        }

        // If still no user, check for X-Admin-User-Id header
        if (!$user && $request->hasHeader('X-Admin-User-Id')) {
            $adminUserId = $request->header('X-Admin-User-Id');
            $user = \App\Models\AdminUser::find($adminUserId);
            if ($user) {
                // Manually set the user for the request
                $request->setUserResolver(fn() => $user);
            }
        }

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (!$user->hasRole($roles)) {
            return response()->json(['message' => 'Access Denied. You do not have the required permissions.'], 403);
        }

        return $next($request);
    }
}
