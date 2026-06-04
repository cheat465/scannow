<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class RestaurantController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Restaurant::query()
            ->withCount(['menuItems', 'orders']);

        if ($request->has('user_id')) {
            $query->where('user_id', $request->query('user_id'));
        }

        $restaurants = $query->latest()->get();

        return response()->json(['data' => $restaurants]);
    }

    public function store(Request $request): JsonResponse
    {
        // Convert stringified JSON from FormData back to array for validation
        if ($request->has('phones') && is_string($request->phones)) {
            $request->merge([
                'phones' => json_decode($request->phones, true)
            ]);
        }

        $validated = $request->validate([
            'user_id' => ['nullable', 'exists:users,id'],
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:restaurants,slug'],
            'phone' => ['nullable', 'string', 'max:50'],
            'phones' => ['nullable', 'array'],
            'phones.*' => ['nullable', 'string', 'max:50'],
            'telegram_chat_id' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'logo_url' => ['nullable', 'string', 'max:2048'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'primary_color' => ['nullable', 'string', 'max:20'],
        ]);

        if ($request->hasFile('logo')) {
            $validated['logo_url'] = $this->storeUploadedLogo($request);
        }

        $validated['slug'] = $validated['slug'] ?? $this->uniqueSlug($validated['name']);
        $validated['qr_code_token'] = (string) Str::uuid();

        $restaurant = Restaurant::create($validated);

        return response()->json([
            'message' => 'Restaurant created.',
            'data' => $restaurant,
        ], 201);
    }

    public function show(Restaurant $restaurant): JsonResponse
    {
        return response()->json([
            'data' => $restaurant->load(['menuItems', 'orders.items']),
        ]);
    }

    public function update(Request $request, Restaurant $restaurant): JsonResponse
    {
        \Illuminate\Support\Facades\Log::info('Update request received', [
            'method' => $request->method(),
            'has_file_logo' => $request->hasFile('logo'),
            'all_data' => $request->all(),
        ]);

        // Convert stringified JSON from FormData back to array for validation
        if ($request->has('table_map_data') && is_string($request->table_map_data)) {
            $request->merge([
                'table_map_data' => json_decode($request->table_map_data, true)
            ]);
        }

        // Convert stringified JSON from FormData back to array for validation
        if ($request->has('categories') && is_string($request->categories)) {
            $request->merge([
                'categories' => json_decode($request->categories, true)
            ]);
        }

        // Convert stringified JSON from FormData back to array for validation
        if ($request->has('phones') && is_string($request->phones)) {
            $request->merge([
                'phones' => json_decode($request->phones, true)
            ]);
        }

        $validated = $request->validate([
            'user_id' => ['nullable', 'exists:users,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('restaurants', 'slug')->ignore($restaurant)],
            'phone' => ['nullable', 'string', 'max:50'],
            'phones' => ['nullable', 'array'],
            'phones.*' => ['nullable', 'string', 'max:50'],
            'telegram_chat_id' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'logo_url' => ['nullable', 'string', 'max:2048'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'primary_color' => ['sometimes', 'string', 'max:20'],
            'usd_to_khr_rate' => ['sometimes', 'integer', 'min:1000', 'max:10000'],
            'is_geofencing_enabled' => ['sometimes', 'boolean'],
            'latitude' => ['sometimes', 'nullable', 'numeric'],
            'longitude' => ['sometimes', 'nullable', 'numeric'],
            'radius_meters' => ['sometimes', 'integer', 'min:1'],
            'location_name' => ['nullable', 'string', 'max:255'],
            'location_link' => ['nullable', 'string', 'max:2048'],
            'language' => ['sometimes', 'string', 'max:10'],
            'is_auto_close_enabled' => ['sometimes', 'boolean'],
            'open_time' => ['nullable', 'string', 'regex:/^\d{2}:\d{2}$/'],
            'close_time' => ['nullable', 'string', 'regex:/^\d{2}:\d{2}$/'],
            'table_map_data' => ['nullable', 'array'],
            'categories' => ['nullable', 'array'],
        ]);

        if ($request->hasFile('logo')) {
            $validated['logo_url'] = $this->storeUploadedLogo($request);
        }

        if (! array_key_exists('slug', $validated) && array_key_exists('name', $validated)) {
            $validated['slug'] = $this->uniqueSlug($validated['name'], $restaurant->id);
        }

        $restaurant->update($validated);

        return response()->json([
            'message' => 'Restaurant updated.',
            'data' => $restaurant->fresh(),
        ]);
    }

    public function destroy(Restaurant $restaurant): JsonResponse
    {
        // Delete the restaurant owner
        if ($restaurant->user_id) {
            $user = \App\Models\User::find($restaurant->user_id);
            if ($user) {
                $user->delete();
            }
        }

        // Delete the restaurant
        $restaurant->delete();

        return response()->json(['message' => 'Restaurant and user deleted.']);
    }

    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($name) ?: 'restaurant';
        $slug = $baseSlug;
        $counter = 2;

        while (
            Restaurant::where('slug', $slug)
                ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
                ->exists()
        ) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    private function storeUploadedLogo(Request $request): string
    {
        $path = $request->file('logo')->store('restaurant-logos', 'public');

        return '/storage/' . $path;
    }
}
