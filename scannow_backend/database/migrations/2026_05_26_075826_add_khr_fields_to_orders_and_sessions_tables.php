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
        Schema::table('order_sessions', function (Blueprint $table) {
            $table->decimal('total_amount_khr', 12, 2)->default(0)->after('total_amount');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('total_amount_khr', 12, 2)->default(0)->after('total_amount');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->decimal('unit_price_khr', 12, 2)->nullable()->after('unit_price');
            $table->decimal('line_total_khr', 12, 2)->nullable()->after('line_total');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['unit_price_khr', 'line_total_khr']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('total_amount_khr');
        });

        Schema::table('order_sessions', function (Blueprint $table) {
            $table->dropColumn('total_amount_khr');
        });
    }
};
