<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Restaurant extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'phone',
        'phones',
        'telegram_chat_id',
        'email',
        'address',
        'description',
        'logo_url',
        'primary_color',
        'usd_to_khr_rate',
        'qr_code_token',
        'is_geofencing_enabled',
        'latitude',
        'longitude',
        'radius_meters',
        'location_name',
        'location_link',
        'language',
        'is_auto_close_enabled',
        'open_time',
        'close_time',
        'table_map_data',
        'categories',
        'status',
    ];

    protected static function boot()
    {
        parent::boot();

        static::deleting(function (Restaurant $restaurant) {
            // Delete all related menu items
            $restaurant->menuItems()->delete();

            // Delete all related orders
            $restaurant->orders()->delete();
        });
    }

    protected $casts = [
        'is_geofencing_enabled' => 'boolean',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'radius_meters' => 'integer',
        'is_auto_close_enabled' => 'boolean',
        'table_map_data' => 'array',
        'categories' => 'array',
        'phones' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function menuItems(): HasMany
    {
        return $this->hasMany(MenuItem::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
