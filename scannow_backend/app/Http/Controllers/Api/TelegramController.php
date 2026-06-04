<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class TelegramController extends Controller
{
    private $botToken;

    public function __construct()
    {
        $this->botToken = '8724345769:AAFrX8JF8KnYvUYB06w9Zak-7FFvygoZ9_E';
    }

    public function webhook(Request $request)
    {
        $update = $request->all();

        if (isset($update['message'])) {
            $message = $update['message'];
            $chatId = $message['chat']['id'];
            $text = $message['text'] ?? '';

            if (strtolower(trim($text)) === '/start') {
                $this->sendWelcomeMessage($chatId);
            } else {
                $this->sendChatIdMessage($chatId);
            }
        }

        return response()->json(['status' => 'ok']);
    }

    private function sendWelcomeMessage($chatId)
    {
        $url = "https://api.telegram.org/bot{$this->botToken}/sendMessage";
        
        $text = "👋 Welcome to ScanNow Verification Bot!\n\nYour Chat ID is: <code>$chatId</code>\n\nYou can copy this ID and paste it in your restaurant's Telegram settings to receive invoices automatically!";

        Http::withoutVerifying()->post($url, [
            'chat_id' => $chatId,
            'text' => $text,
            'parse_mode' => 'HTML'
        ]);
    }

    private function sendChatIdMessage($chatId)
    {
        $url = "https://api.telegram.org/bot{$this->botToken}/sendMessage";
        
        $text = "📋 Your Chat ID is: <code>$chatId</code>\n\nCopy this and paste it in your restaurant's Telegram settings!";

        Http::withoutVerifying()->post($url, [
            'chat_id' => $chatId,
            'text' => $text,
            'parse_mode' => 'HTML'
        ]);
    }
}
