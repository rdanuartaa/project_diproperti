<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PropertyDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_id',
        'luas_tanah',
        'luas_bangunan',
        'floors',
        'bedrooms',
        'bathrooms',
        'kitchens',
        'living_rooms',
        'carport',
        'garden',
        'electricity_capacity',
        'water',
        'one_gate_system',
        'security_24jam',
        'listrik_type',
        'wifi_provider',
    ];

    protected $casts = [
        'luas_tanah' => 'integer',
        'luas_bangunan' => 'integer',
        'floors' => 'integer',
        'bedrooms' => 'integer',
        'bathrooms' => 'integer',
        'kitchens' => 'integer',
        'living_rooms' => 'integer',
        'carport' => 'boolean',
        'garden' => 'boolean',
        'one_gate_system' => 'boolean',
        'security_24jam' => 'boolean',
    ];

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }
}
