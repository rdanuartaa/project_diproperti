<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo; // ← Tambahkan import ini

class PropertyImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_id',
        'image_url',
        'is_primary',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    protected $appends = ['full_url'];

    public function getImageUrlAttribute($value)
    {
        // Jika sudah full URL, return langsung
        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            return $value;
        }

        $accountId = 'a0eea8f875e1416b9ea4a5c4a1cea45e'; // Ganti dengan Account ID Anda
        return "https://pub-{$accountId}.r2.dev/{$value}";
    }

    public function getFullUrlAttribute()
    {
        return $this->image_url;
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }
}
