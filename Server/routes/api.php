<?php

use App\Http\Controllers\Api\GoogleAuthController;
use Illuminate\Support\Facades\Route;

Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect']);
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [GoogleAuthController::class, 'me']);
    Route::post('/logout', [GoogleAuthController::class, 'logout']);

    route::middleware('admin')->group(function () {
        Route::get('/admin-only', function () {
            return response()->json(['message' => 'Welcome, Admin!']);
        });
    });
});
