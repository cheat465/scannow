<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'menu_item_id',
        'item_name',
        'quantity',
        'unit_price',
        'unit_price_khr',
        'line_total',
        'line_total_khr',
        'special_instructions',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'unit_price_khr' => 'decimal:2',
        'line_total' => 'decimal:2',
        'line_total_khr' => 'decimal:2',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }
}
