<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PropertyDetail extends Model
{
    use HasFactory;

    protected $table = 'property_details';

    // ✅ SEMUA FIELD DARI MIGRASI
    protected $fillable = [
        'property_id',
        // 🌐 Universal (Semua Tipe)
        'luas_tanah',
        'water',
        'electricity_capacity',
        'listrik_type',
        'road_access',
        'wifi_provider',
        // 🏠 Rumah & Villa
        'luas_bangunan',
        'bedrooms',
        'bathrooms',
        'bathroom_position',
        'floors',
        'kitchens',
        'living_rooms',
        'carport',
        'garden',
        'one_gate_system',
        'security_24jam',
        // 🏡 Villa Specific
        'swimming_pool',
        'private_pool',
        'view_type',
        'furnished',
        'near_tourism',
        // 🛏️ Kos Specific
        'total_rooms',
        'panjang_ruangan',
        'lebar_ruangan',
        'gender_type',
        'wifi_included',
        'electricity_included',
        'water_included',
        'shared_kitchen',
        'parking_area',
        'cctv',
        // 🏪 Ruko Specific
        'parking_capacity',
        'warehouse_area',
        'shop_front_width',
        // 🌾 Tanah Specific
        'land_type',
        'land_contour',
        'zoning', // ✅ Ditambahkan
    ];

    // ✅ CASTS OTOMATIS
    protected $casts = [
        // Integer Fields
        'luas_tanah'           => 'integer',
        'luas_bangunan'        => 'integer',
        'floors'               => 'integer',
        'bedrooms'             => 'integer',
        'bathrooms'            => 'integer',
        'bathroom_position'    => 'string',
        'kitchens'             => 'integer',
        'living_rooms'         => 'integer',
        'electricity_capacity' => 'integer',
        'total_rooms'          => 'integer',
        'panjang_ruangan'      => 'float',
        'lebar_ruangan'        => 'float',
        'parking_capacity'     => 'integer',
        'warehouse_area'       => 'integer',
        // Float/Decimal Field
        'shop_front_width'     => 'float',
        // Boolean Fields
        'carport'              => 'boolean',
        'garden'               => 'boolean',
        'one_gate_system'      => 'boolean', // ✅ Ditambahkan
        'security_24jam'       => 'boolean', // ✅ Ditambahkan
        'swimming_pool'        => 'boolean',
        'private_pool'         => 'boolean',
        'furnished'            => 'boolean',
        'near_tourism'         => 'boolean',
        'wifi_included'        => 'boolean',
        'electricity_included' => 'boolean',
        'water_included'       => 'boolean',
        'shared_kitchen'       => 'boolean',
        'parking_area'         => 'boolean',
        'cctv'                 => 'boolean',
        // String Fields
        'water'                => 'string',
        'listrik_type'         => 'string',
        'road_access'          => 'string',
        'gender_type'          => 'string',
        'land_type'            => 'string',
        'view_type'            => 'string',
        'land_contour'         => 'string',
        'zoning'               => 'string', // ✅ Ditambahkan
        'wifi_provider'        => 'string',
    ];

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }
}

