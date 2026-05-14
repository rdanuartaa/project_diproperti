<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    /**
     * GET /api/user/profile
     * Mengembalikan data profil user yang sedang login.
     */
    public function show(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data'    => [
                'id'                 => $user->id,
                'name'               => $user->name,
                'full_name'          => $user->full_name,
                'email'              => $user->email,
                'phone'              => $user->phone,
                'avatar'             => $user->avatar,
                'role'               => $user->role,
                'email_verified_at'  => $user->email_verified_at,
            ],
        ]);
    }

    /**
     * PATCH /api/user/profile
     * Update full_name dan phone user yang sedang login.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'phone'     => ['required', 'string', 'max:20', 'regex:/^[0-9]{8,15}$/'],
        ], [
            'full_name.required' => 'Nama lengkap wajib diisi.',
            'full_name.max'      => 'Nama lengkap maksimal 255 karakter.',
            'phone.required'     => 'Nomor WhatsApp wajib diisi.',
            'phone.regex'        => 'Nomor WhatsApp hanya boleh angka (8-15 digit, tanpa +62 atau 0).',
            'phone.max'          => 'Nomor WhatsApp terlalu panjang.',
        ]);

        $user = $request->user();
        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui.',
            'data'    => [
                'id'                => $user->id,
                'name'              => $user->name,
                'full_name'         => $user->full_name,
                'email'             => $user->email,
                'phone'             => $user->phone,
                'avatar'            => $user->avatar,
                'role'              => $user->role,
                'email_verified_at' => $user->email_verified_at,
            ],
        ]);
    }
}
