<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MenuItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id',
        'name',
        'category',
        'description',
        'price',
        'price_khr',
        'preparation_time_minutes',
        'image_url',
        'is_available',
        'is_vegetarian',
        'sort_order',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'price_khr' => 'decimal:2',
        'is_available' => 'boolean',
        'is_vegetarian' => 'boolean',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
