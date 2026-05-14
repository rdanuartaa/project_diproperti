<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class Property extends Model
{
    use HasFactory;

    protected $table = 'properties';

    protected $fillable = [
        'title',
        'slug',
        'type',
        'building_type',
        'listing_type',
        'kecamatan',
        'city',
        'address',
        'latitude',
        'longitude',
        'price',
        'certificate_type',
        'certificate_status',
        'certificate_file',
        'electric_bill_file',
        'water_bill_file',
        'status',
        'is_verified',
        'views',
        'description',
        'user_id',
    ];

    protected $casts = [
        'price'             => 'integer',
        'views'             => 'integer',
        'building_type'     => 'string',
        'is_verified'       => 'boolean',
        'latitude'          => 'float',
        'longitude'         => 'float',
        'type'              => 'string', // ✅ Enum: rumah, villa, ruko, kos, tanah
        'listing_type'      => 'string',
    ];

    // ✅ Mutator dengan type hints yang benar
    public function setTitleAttribute(string $value): void
    {
        $this->attributes['title'] = $value;
        $this->attributes['slug'] = Str::slug($value) . '-' . Str::random(5);
    }

    // Relasi
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function detail(): HasOne
    {
        return $this->hasOne(PropertyDetail::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(PropertyImage::class)->orderBy('is_primary', 'desc');
    }

    // ✅ Scopes dengan type hints
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published')->where('is_verified', true);
    }

    public function scopeFilter(Builder $query, array $filters): Builder
    {
        if ($filters['type'] ?? false) {
            $query->where('type', $filters['type']);
        }
        if ($filters['listing_type'] ?? false) {
            $query->where('listing_type', $filters['listing_type']);
        }
        if ($filters['min_price'] ?? false) {
            $query->where('price', '>=', (int) $filters['min_price']);
        }
        if ($filters['max_price'] ?? false) {
            $query->where('price', '<=', (int) $filters['max_price']);
        }
        if ($filters['city'] ?? false) {
            $query->where('city', $filters['city']);
        }
        return $query;
    }

    // Accessor
    public function getFormattedPriceAttribute(): string
    {
        return 'Rp ' . number_format($this->price, 0, ',', '.');
    }
}
