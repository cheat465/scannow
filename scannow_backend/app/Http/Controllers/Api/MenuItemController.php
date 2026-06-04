<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MenuItemController extends Controller
{
    public function index(Request $request, Restaurant $restaurant): JsonResponse
    {
        $canOrder = true;
        $distance = null;

        if ($restaurant->is_geofencing_enabled) {
            $userLat = $request->header('X-User-Lat');
            $userLng = $request->header('X-User-Lng');

            if ($userLat && $userLng && $restaurant->latitude && $restaurant->longitude) {
                $distance = $this->haversineDistance(
                    (float) $userLat,
                    (float) $userLng,
                    (float) $restaurant->latitude,
                    (float) $restaurant->longitude
                );

                $canOrder = $distance <= $restaurant->radius_meters;
            } else {
                // If geofencing is enabled but coordinates are missing, 
                // we block ordering to be safe
                $canOrder = false;
            }
        }

        $menuItems = $restaurant->menuItems()
            ->when($request->filled('category'), fn ($query) => $query->where('category', $this->normalizeCategory((string) $request->input('category'))))
            ->when($request->filled('search'), fn ($query) => $query->where('name', 'like', '%'.((string) $request->input('search')).'%'))
            ->when($request->filled('available'), fn ($query) => $query->where('is_available', filter_var($request->input('available'), FILTER_VALIDATE_BOOLEAN)))
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $menuItems,
            'geofencing' => [
                'is_enabled' => (bool) $restaurant->is_geofencing_enabled,
                'can_order' => $canOrder,
                'distance_meters' => $distance,
                'radius_meters' => $restaurant->radius_meters
            ]
        ]);
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

    public function store(Request $request, Restaurant $restaurant): JsonResponse
    {
        $validated = $request->validate($this->rules());
        $validated['category'] = $this->normalizeCategory($validated['category'] ?? 'food');
        unset($validated['image']);

        if ($request->hasFile('image')) {
            $validated['image_url'] = $this->storeImage($request);
        }

        $menuItem = $restaurant->menuItems()->create($validated);

        return response()->json([
            'message' => 'Menu item created.',
            'data' => $menuItem,
        ], 201);
    }

    public function show(MenuItem $menuItem): JsonResponse
    {
        return response()->json([
            'data' => $menuItem->load('restaurant'),
        ]);
    }

    public function update(Request $request, MenuItem $menuItem): JsonResponse
    {
        $validated = $request->validate($this->rules(isUpdate: true));
        unset($validated['image']);

        if (array_key_exists('category', $validated)) {
            $validated['category'] = $this->normalizeCategory($validated['category']);
        }

        if ($request->hasFile('image')) {
            $this->deleteStoredImage($menuItem);
            $validated['image_url'] = $this->storeImage($request);
        }

        $menuItem->update($validated);

        return response()->json([
            'message' => 'Menu item updated.',
            'data' => $menuItem->fresh(),
        ]);
    }

    public function destroy(MenuItem $menuItem): JsonResponse
    {
        $this->deleteStoredImage($menuItem);
        $menuItem->delete();

        return response()->json(['message' => 'Menu item deleted.']);
    }

    private function rules(bool $isUpdate = false): array
    {
        $required = $isUpdate ? 'sometimes' : 'required';

        return [
            'name' => [$required, 'string', 'max:255'],
            'category' => ['sometimes', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'price' => [$required, 'numeric', 'min:0'],
            'price_khr' => ['nullable', 'numeric', 'min:0'],
            'preparation_time_minutes' => ['nullable', 'integer', 'min:0'],
            'image_url' => ['nullable', 'string', 'max:2048'],
            'image' => ['nullable', 'image', 'max:5120'],
            'is_available' => ['sometimes', 'boolean'],
            'is_vegetarian' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    private function normalizeCategory(string $category): string
    {
        $category = strtolower(trim($category));
        
        return match ($category) {
            'drink', 'drinks' => 'drinks',
            'desert', 'dessert', 'desserts' => 'dessert',
            default => $category,
        };
    }

    private function storeImage(Request $request): string
    {
        $path = $request->file('image')->store('menu-items', 'public');

        return '/storage/' . $path;
    }

    private function deleteStoredImage(MenuItem $menuItem): void
    {
        $imageUrl = $menuItem->image_url;

        if (! $imageUrl) {
            return;
        }

        $storagePrefix = '/storage/';
        $pathStart = strpos($imageUrl, $storagePrefix);

        if ($pathStart === false) {
            return;
        }

        $path = substr($imageUrl, $pathStart + strlen($storagePrefix));

        if ($path) {
            Storage::disk('public')->delete($path);
        }
    }
}
