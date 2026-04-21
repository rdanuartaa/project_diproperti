<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;
use App\Models\PropertyImage;

class Property extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'type',
        'building_type',
        'listing_type',
        'kecamatan',
        'city',
        'price',
        'certificate_type',
        'certificate_status',
        'status',
        'views',
        'description',
        'user_id',
    ];

    protected $casts = [
        'price' => 'integer',
        'views' => 'integer',
        'building_type' => 'integer',
        'is_primary' => 'boolean',
    ];

    // Auto-generate slug dari title
    public function setTitleAttribute($value)
    {
        $this->attributes['title'] = $value;
        $this->attributes['slug'] = Str::slug($value) . '-' . Str::random(5);
    }

    // Relasi: Milik User (Agen/Admin)
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Relasi: Punya 1 Detail
    public function detail(): HasOne
    {
        return $this->hasOne(PropertyDetail::class);
    }

    // Relasi: Punya Banyak Gambar
    public function images(): HasMany
    {
        return $this->hasMany(PropertyImage::class)->orderBy('is_primary', 'desc');
    }

    // Scope: Hanya properti yang published
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    // Scope: Filter berdasarkan tipe & listing
    public function scopeFilter($query, array $filters)
    {
        if ($filters['type'] ?? false) {
            $query->where('type', $filters['type']);
        }
        if ($filters['listing_type'] ?? false) {
            $query->where('listing_type', $filters['listing_type']);
        }
        if ($filters['min_price'] ?? false) {
            $query->where('price', '>=', $filters['min_price']);
        }
        if ($filters['max_price'] ?? false) {
            $query->where('price', '<=', $filters['max_price']);
        }
        if ($filters['city'] ?? false) {
            $query->where('city', $filters['city']);
        }
        return $query;
    }

    // Accessor: Format harga ke Rupiah
    public function getFormattedPriceAttribute()
    {
        return 'Rp ' . number_format($this->price, 0, ',', '.');
    }
}
