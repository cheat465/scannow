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
        Schema::table('restaurants', function (Blueprint $table) {
            $table->string('location_name')->nullable();
            $table->string('location_link')->nullable();
            $table->string('language')->default('en');
            $table->boolean('is_auto_close_enabled')->default(false);
            $table->time('close_time')->nullable();
            $table->json('table_map_data')->nullable(); // Stores coordinates and metadata for table drag-and-drop
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropColumn([
                'location_name',
                'location_link',
                'language',
                'is_auto_close_enabled',
                'close_time',
                'table_map_data'
            ]);
        });
    }
};
