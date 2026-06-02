<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PropertyScoringProfile extends Model
{
    protected $fillable = [
        'type',
        'listing_type',
        'version',
        'min_price',
        'max_price',
        'min_area',
        'max_area',
        'sample_count',
        'minimum_sample_size',
        'source_type',
        'is_active',
        'generated_at',
    ];

    protected $casts = [
        'version' => 'integer',
        'min_price' => 'float',
        'max_price' => 'float',
        'min_area' => 'float',
        'max_area' => 'float',
        'sample_count' => 'integer',
        'minimum_sample_size' => 'integer',
        'is_active' => 'boolean',
        'generated_at' => 'datetime',
    ];
}
