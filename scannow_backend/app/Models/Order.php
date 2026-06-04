<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_ACCEPTED = 'accepted';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'restaurant_id',
        'order_session_id',
        'order_number',
        'table_number',
        'customer_name',
        'customer_phone',
        'status',
        'total_amount',
        'total_amount_khr',
        'notes',
    ];

    protected static function boot()
    {
        parent::boot();

        static::deleting(function (Order $order) {
            // Delete all related order items
            $order->items()->delete();
        });
    }

    protected $casts = [
        'total_amount' => 'decimal:2',
        'total_amount_khr' => 'decimal:2',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(OrderSession::class, 'order_session_id');
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
