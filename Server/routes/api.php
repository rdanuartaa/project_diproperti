<?php

use App\Http\Controllers\Api\GoogleAuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\PropertyController;
use App\Http\Controllers\Api\ArticleController;
use App\Http\Controllers\Api\TagController;
use App\Http\Controllers\Api\FaqController;
use Illuminate\Support\Facades\Route;

// Public OAuth
Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect']);
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback']);

// ✅ PUBLIC (Tanpa Login)
Route::get('/properties', [PropertyController::class, 'index']);
Route::get('/properties/{slug}', [PropertyController::class, 'show']);
Route::get('/articles', [ArticleController::class, 'index']);
Route::get('/articles/popular', [ArticleController::class, 'popular']);
Route::get('/articles/{slug}', [ArticleController::class, 'show']);
Route::get('/tags', [TagController::class, 'index']);
Route::get('/tags/{tag:slug}', [TagController::class, 'show']); 
Route::get('/faqs', [FaqController::class, 'index']);

// ✅ PROTECTED (Butuh Login)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [GoogleAuthController::class, 'me']);
    Route::post('/logout', [GoogleAuthController::class, 'logout']);

    // ✅ ADMIN ONLY (Butuh Login + Role Admin)
    Route::middleware('admin')->group(function () {
        Route::get('/admin/dashboard/stats', [DashboardController::class, 'stats']);
        Route::get('/admin/dashboard/analytics', [DashboardController::class, 'analytics']);
        Route::get('/admin/users', [UserController::class, 'index']);
        Route::put('/admin/users/{user}', [UserController::class, 'update']);
        Route::delete('/admin/users/{user}', [UserController::class, 'destroy']);
        Route::get('/admin/properties', [PropertyController::class, 'adminIndex']);
        Route::post('/admin/properties', [PropertyController::class, 'store']);
        Route::put('/admin/properties/{property}', [PropertyController::class, 'update']);
        Route::delete('/admin/properties/{property}', [PropertyController::class, 'destroy']);
        Route::delete('/admin/property-images/{image}', [PropertyController::class, 'deleteImage']);
        Route::get('/admin/articles', [ArticleController::class, 'adminIndex']);
        Route::post('/admin/articles', [ArticleController::class, 'store']);
        Route::put('/admin/articles/{article}', [ArticleController::class, 'update']);
        Route::delete('/admin/articles/{article}', [ArticleController::class, 'destroy']);
        Route::get('/admin/tags', [TagController::class, 'adminIndex']);
        Route::post('/admin/tags', [TagController::class, 'store']);
        Route::get('/admin/tags/{tag}', [TagController::class, 'show']);
        Route::put('/admin/tags/{tag}', [TagController::class, 'update']);
        Route::delete('/admin/tags/{tag}', [TagController::class, 'destroy']);
        Route::get('/admin/faqs', [FaqController::class, 'index']);
        Route::post('/admin/faqs', [FaqController::class, 'store']);
        Route::put('/admin/faqs/{faq}', [FaqController::class, 'update']);
        Route::delete('/admin/faqs/{faq}', [FaqController::class, 'destroy']);
    });
});

// Dummy login route (biar Sanctum tidak error redirect)
Route::get('/login', function () {
    return response()->json(['message' => 'Please login via API']);
})->name('login');
