<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // For development: Disable SSL verification for Socialite/Guzzle
        if (app()->environment('local')) {
            \Laravel\Socialite\Facades\Socialite::extend('google', function ($app) {
                $config = $app['config']['services.google'];
                return \Laravel\Socialite\Facades\Socialite::buildProvider(
                    \Laravel\Socialite\Two\GoogleProvider::class,
                    $config
                )->setHttpClient(new \GuzzleHttp\Client(['verify' => false]));
            });
        }

        RateLimiter::for('orders', function (Request $request) {
            // Rate limit by IP address and Table Number
            // Max 10 orders per 5 minutes
            $table = $request->input('table_number', 'unknown');
            return Limit::perMinutes(5, 8)->by($request->ip() . $table);
        });
    }
}
