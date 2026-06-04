<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    private int $passwordResetCodeExpiryMinutes = 15;

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $validated['role'] = User::ROLE_OWNER;
        $user = User::create($validated);

        return response()->json([
            'message' => 'Registration successful.',
            'user' => $user,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid email or password.'],
            ]);
        }

        // Load restaurant relation if user has a restaurant_id
        $user->load('restaurant');

        return response()->json([
            'message' => 'Login successful.',
            'user' => $user,
        ]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if ($user) {
            $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $validated['email']],
                [
                    'token' => Hash::make($code),
                    'created_at' => now(),
                ]
            );

            Mail::raw(
                "Your ScanNow password reset verification code is: {$code}\n\n".
                "This code expires in {$this->passwordResetCodeExpiryMinutes} minutes.",
                function ($message) use ($validated) {
                    $message
                        ->to($validated['email'])
                        ->subject('ScanNow Password Reset Code');
                }
            );
        }

        return response()->json([
            'message' => 'If the email exists, a verification code has been sent.',
        ]);
    }

    public function verifyPasswordResetCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'digits:6'],
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $validated['email'])
            ->first();

        if (! $record || ! $this->isCodeValid($record->created_at, $record->token, $validated['code'])) {
            throw ValidationException::withMessages([
                'code' => ['The verification code is invalid or expired.'],
            ]);
        }

        return response()->json([
            'message' => 'Code verified successfully.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'digits:6'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $validated['email'])
            ->first();

        if (! $record || ! $this->isCodeValid($record->created_at, $record->token, $validated['code'])) {
            throw ValidationException::withMessages([
                'code' => ['The verification code is invalid or expired.'],
            ]);
        }

        $user = User::where('email', $validated['email'])->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['User not found.'],
            ]);
        }

        $user->forceFill([
            'password' => $validated['password'],
            'remember_token' => Str::random(60),
        ])->save();

        DB::table('password_reset_tokens')
            ->where('email', $validated['email'])
            ->delete();

        return response()->json([
            'message' => 'Password reset successful.',
        ]);
    }

    private function isCodeValid(?string $createdAt, string $hashedToken, string $code): bool
    {
        if (! $createdAt) {
            return false;
        }

        $expiresAt = Carbon::parse($createdAt)->addMinutes($this->passwordResetCodeExpiryMinutes);
        $isNotExpired = now()->lte($expiresAt);

        return $isNotExpired && Hash::check($code, $hashedToken);
    }

    public function redirectToGoogle()
    {
        return Socialite::driver('google')->redirect();
    }

    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();
            
            $user = User::updateOrCreate(
                ['email' => $googleUser->getEmail()],
                [
                    'name' => $googleUser->getName(),
                    'password' => Hash::make(Str::random(24)), // Random password for social login
                    'email_verified_at' => now(),
                    'role' => User::ROLE_OWNER,
                ]
            );

            // In a real app, you might return a JWT or set a session
            // For now, we'll redirect back to the frontend with the user email
            // The frontend can then fetch the user data or we can pass it via encrypted param
            $frontendUrl = env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000');
            $frontendUrl = explode(',', $frontendUrl)[0]; // Get the first one

            return redirect()->away($frontendUrl . "/auth/login?social_login_email=" . urlencode($user->email));
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Google login failed.',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    public function socialComplete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
        ]);

        $user = User::where('email', $validated['email'])->first();
        
        // Load restaurant relation if user has a restaurant_id
        $user->load('restaurant');

        return response()->json([
            'message' => 'Social login completed.',
            'user' => $user,
        ]);
    }

    public function deleteAccount(Request $request): JsonResponse
    {
        $user = $request->user();

        // Delete all restaurants owned by this user first
        // This will also cascade delete all menu items, orders, etc. for each restaurant
        $user->restaurants()->delete();

        // Then delete the user
        $user->delete();

        return response()->json([
            'message' => 'Your account and all associated data have been deleted successfully.',
        ], 200);
    }
}
