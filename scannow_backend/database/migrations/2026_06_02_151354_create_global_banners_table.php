<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('global_banners', function (Blueprint $table) {
            $table->id();
            $table->text('message');
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('admin_user_id')->nullable();
            $table->foreign('admin_user_id')->references('id')->on('admin_users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('global_banners');
    }
};
