<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

#[Signature('app:set-telegram-webhook {url?}')]
#[Description('Set the Telegram bot webhook URL')]
class SetTelegramWebhook extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $botToken = '8724345769:AAFrX8JF8KnYvUYB06w9Zak-7FFvygoZ9_E';
        $webhookUrl = $this->argument('url') ?? config('app.url') . '/api/telegram/webhook';
        
        $url = "https://api.telegram.org/bot{$botToken}/setWebhook";
        
        $response = Http::withoutVerifying()->post($url, [
            'url' => $webhookUrl,
            'allowed_updates' => ['message']
        ]);
        
        if ($response->successful()) {
            $this->info('Webhook set successfully!');
            $this->line('Webhook URL: ' . $webhookUrl);
        } else {
            $this->error('Failed to set webhook!');
            $this->line('Response: ' . $response->body());
        }
    }
}
