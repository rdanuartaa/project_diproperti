<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\GoogleProvider;


class GoogleAuthController extends Controller
{
    public function redirect()
    {
        /** @var GoogleProvider $provider */
        $provider = Socialite::driver('google');
        return $provider->stateless()->redirect();
    }

    public function callback()
    {
        try {
            // 1. Ambil data user dari Google
            /** @var GoogleProvider $provider */
            $provider = Socialite::driver('google');
            $googleUser = $provider->stateless()->user();

            // 2. Cek apakah user sudah ada berdasarkan google_id
            $user = User::where('google_id', $googleUser->getId())->first();

            // 3. Jika belum ada, cek email atau buat baru
            if (!$user) {
                $existingUser = User::where('email', $googleUser->getEmail())->first();

                if ($existingUser) {
                    // Link akun Google ke user yang sudah ada
                    $existingUser->update([
                        'google_id' => $googleUser->getId(),
                        'avatar' => $googleUser->getAvatar(),
                        'email_verified_at' => now(),
                    ]);
                    $user = $existingUser;
                } else {
                    // Buat user baru
                    $user = User::create([
                        'name' => $googleUser->getName(),
                        'email' => $googleUser->getEmail(),
                        'google_id' => $googleUser->getId(),
                        'avatar' => $googleUser->getAvatar(),
                        'role' => 'user',
                        'email_verified_at' => now(),
                        'password' => Hash::make(Str::random(24)),
                    ]);
                }
            }

            // 4. Generate Sanctum Token
            $token = $user->createToken('auth_token')->plainTextToken;

            // 5. Redirect ke Frontend (Next.js) bawa token
            return redirect(
                env('FRONTEND_URL', 'http://localhost:3000') .
                    '/?token=' . $token . '&status=success'
            );

        }

        catch (\Exception $e) {
            // Jika error, redirect dengan pesan gagal
            return redirect(
                env('FRONTEND_URL', 'http://localhost:3000') .
                    '/auth/google/callback?status=failed&error=' . urlencode($e->getMessage())
            );
        }
    }

    // Endpoint untuk ambil data user yang login (butuh token)
    public function me(Request $request)
    {
        return response()->json(['user' => $request->user()]);
    }

    // Endpoint logout
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }
}
