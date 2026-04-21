<?php

use App\Http\Controllers\Api\GoogleAuthController;
use App\Http\Controllers\Api\PropertyController;
use Illuminate\Support\Facades\Route;

// Public OAuth
Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect']);
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback']);

// ✅ PUBLIC (Tanpa Login)
Route::get('/properties', [PropertyController::class, 'index']);
Route::get('/properties/{slug}', [PropertyController::class, 'show']);

// ✅ PROTECTED (Butuh Login)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [GoogleAuthController::class, 'me']);
    Route::post('/logout', [GoogleAuthController::class, 'logout']);

    // ✅ ADMIN ONLY (Butuh Login + Role Admin)
    Route::middleware('admin')->group(function () {
        Route::post('/properties', [PropertyController::class, 'store']);
        Route::put('/properties/{property}', [PropertyController::class, 'update']);
        Route::delete('/properties/{property}', [PropertyController::class, 'destroy']);
        Route::delete('/property-images/{image}', [PropertyController::class, 'deleteImage']);
    });
});

// Dummy login route (biar Sanctum tidak error redirect)
Route::get('/login', function () {
    return response()->json(['message' => 'Please login via API']);
})->name('login');
