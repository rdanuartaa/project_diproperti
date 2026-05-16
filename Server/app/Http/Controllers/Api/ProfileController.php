<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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
                'id_card_file_url'    => $user->id_card_file_url,
                'role'               => $user->role,
                'email_verified_at'  => $user->email_verified_at,
            ],
        ]);
    }

    /**
     * PATCH /api/user/profile
     * Update data pribadi user yang sedang login.
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'phone'     => ['required', 'string', 'max:20', 'regex:/^[0-9]{8,15}$/'],
            'id_card_file' => [
                $user->id_card_file ? 'nullable' : 'required',
                'file',
                'mimes:jpg,jpeg,png,pdf',
                'max:5120',
            ],
        ], [
            'full_name.required' => 'Nama lengkap wajib diisi.',
            'full_name.max'      => 'Nama lengkap maksimal 255 karakter.',
            'phone.required'     => 'Nomor WhatsApp wajib diisi.',
            'phone.regex'        => 'Nomor WhatsApp hanya boleh angka (8-15 digit, tanpa +62 atau 0).',
            'phone.max'          => 'Nomor WhatsApp terlalu panjang.',
            'id_card_file.required' => 'Foto KTP wajib diunggah.',
            'id_card_file.mimes'    => 'Foto KTP harus berupa JPG, PNG, atau PDF.',
            'id_card_file.max'      => 'Ukuran foto KTP maksimal 5MB.',
        ]);

        $user->full_name = $validated['full_name'];
        $user->phone = $validated['phone'];

        if ($request->hasFile('id_card_file')) {
            $file = $request->file('id_card_file');
            $filename = time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
            $r2Path = 'user-id-cards/' . $filename;
            $uploaded = Storage::disk('s3')->put($r2Path, file_get_contents($file->getRealPath()), 'private');

            if (!$uploaded) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal mengunggah foto KTP.',
                ], 500);
            }

            if ($user->id_card_file && Storage::disk('s3')->exists($user->id_card_file)) {
                Storage::disk('s3')->delete($user->id_card_file);
            }

            $user->id_card_file = $r2Path;
        }

        $user->save();

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
                'id_card_file_url'   => $user->id_card_file_url,
                'role'              => $user->role,
                'email_verified_at' => $user->email_verified_at,
            ],
        ]);
    }
}
