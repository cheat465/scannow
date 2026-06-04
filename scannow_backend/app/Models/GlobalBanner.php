<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GlobalBanner extends Model
{
    use HasFactory;

    protected $fillable = [
        'message',
        'is_active',
        'admin_user_id',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function adminUser(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class);
    }
}
