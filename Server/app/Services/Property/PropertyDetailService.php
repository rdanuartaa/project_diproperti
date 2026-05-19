<?php

namespace App\Services\Property;

class PropertyDetailService
{
    public function getDetailValidationRules(string $type): array
    {
        $base = ['detail' => 'required|array'];

        $universal = [
            'detail.luas_tanah' => 'required|integer|min:0',
            'detail.water' => 'nullable|in:pdam,sumur',
            'detail.electricity_capacity' => 'nullable|integer|min:0',
            'detail.listrik_type' => 'nullable|in:overground,underground',
            'detail.road_access' => 'nullable|in:aspal,cor,batu,belum',
            'detail.wifi_provider' => 'nullable|string|max:255',
        ];

        return match ($type) {
            'rumah' => array_merge($base, $universal, [
                'detail.luas_bangunan' => 'required|integer|min:0',
                'detail.bedrooms' => 'required|integer|min:0',
                'detail.bathrooms' => 'required|integer|min:0',
                'detail.floors' => 'required|integer|min:0',
                'detail.kitchens' => 'nullable|integer|min:0',
                'detail.living_rooms' => 'nullable|integer|min:0',
                'detail.carport' => 'nullable|boolean',
                'detail.garden' => 'nullable|boolean',
                'detail.one_gate_system' => 'nullable|boolean',
                'detail.security_24jam' => 'nullable|boolean',
            ]),
            'villa' => array_merge($base, $universal, [
                'detail.luas_bangunan' => 'required|integer|min:0',
                'detail.bedrooms' => 'required|integer|min:0',
                'detail.bathrooms' => 'required|integer|min:0',
                'detail.floors' => 'required|integer|min:0',
                'detail.kitchens' => 'nullable|integer|min:0',
                'detail.living_rooms' => 'nullable|integer|min:0',
                'detail.carport' => 'nullable|boolean',
                'detail.garden' => 'nullable|boolean',
                'detail.one_gate_system' => 'nullable|boolean',
                'detail.security_24jam' => 'nullable|boolean',
                'detail.swimming_pool' => 'nullable|boolean',
                'detail.private_pool' => 'nullable|boolean',
                'detail.view_type' => 'nullable|string|max:100',
                'detail.furnished' => 'nullable|boolean',
                'detail.near_tourism' => 'nullable|boolean',
            ]),
            'kos' => array_merge($base, $universal, [
                'detail.panjang_ruangan' => 'required|numeric|min:0',
                'detail.lebar_ruangan' => 'required|numeric|min:0',
                'detail.total_rooms' => 'required|integer|min:0',
                'detail.bathrooms' => 'required|integer|min:0',
                'detail.bathroom_position' => 'nullable|in:dalam,luar',
                'detail.gender_type' => 'nullable|in:laki-laki,perempuan,campuran',
                'detail.wifi_included' => 'nullable|boolean',
                'detail.electricity_included' => 'nullable|boolean',
                'detail.water_included' => 'nullable|boolean',
                'detail.shared_kitchen' => 'nullable|boolean',
                'detail.parking_area' => 'nullable|boolean',
                'detail.cctv' => 'nullable|boolean',
            ]),
            'ruko' => array_merge($base, $universal, [
                'detail.luas_bangunan' => 'required|integer|min:0',
                'detail.bedrooms' => 'nullable|integer|min:0',
                'detail.bathrooms' => 'nullable|integer|min:0',
                'detail.parking_capacity' => 'nullable|integer|min:0',
                'detail.warehouse_area' => 'nullable|integer|min:0',
                'detail.shop_front_width' => 'nullable|numeric|min:0',
            ]),
            'tanah' => array_merge($base, $universal, [
                'detail.panjang_tanah' => 'required|numeric|min:0',
                'detail.lebar_tanah' => 'required|numeric|min:0',
                'detail.road_access' => 'required|in:aspal,cor,batu,belum',
                'detail.land_type' => 'nullable|in:datar,miring,bukit',
                'detail.land_contour' => 'nullable|string|max:100',
                'detail.zoning' => 'nullable|string|max:100',
            ]),
            default => $base,
        };
    }

    public function getCertificateRules(string $type, bool $isUpdate = false): array
    {
        $requiresCertificate = in_array($type, ['rumah', 'villa', 'ruko', 'tanah'], true);
        if ($requiresCertificate) {
            return [
                'certificate_type' => $isUpdate ? 'sometimes|required|in:SHM,SHGB' : 'required|in:SHM,SHGB',
                'certificate_status' => 'nullable|in:lunas,bank',
            ];
        }

        return [
            'certificate_type' => 'nullable|in:SHM,SHGB',
            'certificate_status' => 'nullable|in:lunas,bank',
        ];
    }

    public function normalizeDetailInput(array $detail): array
    {
        if (array_key_exists('panjang_ruangan', $detail) && !array_key_exists('luas_tanah', $detail)) {
            $detail['luas_tanah'] = $detail['panjang_ruangan'];
        }
        if (array_key_exists('lebar_ruangan', $detail) && !array_key_exists('luas_bangunan', $detail)) {
            $detail['luas_bangunan'] = $detail['lebar_ruangan'];
        }
        if (
            array_key_exists('panjang_tanah', $detail) &&
            array_key_exists('lebar_tanah', $detail) &&
            (!array_key_exists('luas_tanah', $detail) || $detail['luas_tanah'] === null || $detail['luas_tanah'] === '')
        ) {
            $detail['luas_tanah'] = round((float) $detail['panjang_tanah'] * (float) $detail['lebar_tanah']);
        }

        $integerFields = [
            'luas_tanah',
            'luas_bangunan',
            'panjang_ruangan',
            'lebar_ruangan',
            'panjang_tanah',
            'lebar_tanah',
            'floors',
            'bedrooms',
            'bathrooms',
            'kitchens',
            'living_rooms',
            'electricity_capacity',
            'total_rooms',
            'parking_capacity',
            'warehouse_area',
        ];

        foreach ($integerFields as $field) {
            if (array_key_exists($field, $detail)) {
                $value = $detail[$field];
                if ($value === 'null' || $value === '' || $value === null || (is_string($value) && trim($value) === '')) {
                    $detail[$field] = null;
                }
            }
        }

        $booleanFields = [
            'carport',
            'garden',
            'one_gate_system',
            'security_24jam',
            'wifi_included',
            'electricity_included',
            'water_included',
            'shared_kitchen',
            'parking_area',
            'cctv',
            'swimming_pool',
            'private_pool',
            'furnished',
            'near_tourism',
        ];

        foreach ($booleanFields as $field) {
            if (array_key_exists($field, $detail)) {
                $detail[$field] = filter_var($detail[$field], FILTER_VALIDATE_BOOLEAN);
            }
        }

        return $detail;
    }

    public function prepareDetailData(array $detail, int $propertyId): array
    {
        $data = ['property_id' => $propertyId];

        $intFields = [
            'luas_tanah' => 0,
            'luas_bangunan' => 0,
            'floors' => 1,
            'bedrooms' => 0,
            'bathrooms' => 0,
            'kitchens' => 0,
            'living_rooms' => 0,
            'electricity_capacity' => 0,
            'total_rooms' => 0,
            'parking_capacity' => 0,
            'warehouse_area' => 0,
        ];

        foreach ($intFields as $field => $default) {
            $val = $detail[$field] ?? null;
            $data[$field] = ($val === null || $val === '' || $val === 'null') ? $default : (int) $val;
        }

        foreach (['panjang_ruangan', 'lebar_ruangan', 'panjang_tanah', 'lebar_tanah'] as $field) {
            $val = $detail[$field] ?? null;
            $data[$field] = ($val === null || $val === '' || $val === 'null') ? null : (float) $val;
        }

        $data['shop_front_width'] = isset($detail['shop_front_width']) && $detail['shop_front_width'] !== null
            ? (float) $detail['shop_front_width']
            : null;

        $boolFields = [
            'carport',
            'garden',
            'one_gate_system',
            'security_24jam',
            'wifi_included',
            'electricity_included',
            'water_included',
            'shared_kitchen',
            'parking_area',
            'cctv',
            'swimming_pool',
            'private_pool',
            'furnished',
            'near_tourism',
        ];

        foreach ($boolFields as $field) {
            $data[$field] = filter_var($detail[$field] ?? false, FILTER_VALIDATE_BOOLEAN);
        }

        $data['water'] = $detail['water'] ?? 'pdam';
        $data['listrik_type'] = $detail['listrik_type'] ?? 'overground';
        $data['road_access'] = $detail['road_access'] ?? 'aspal';
        $data['bathroom_position'] = $detail['bathroom_position'] ?? 'dalam';
        $data['gender_type'] = $detail['gender_type'] ?? 'laki-laki';
        $data['land_type'] = $detail['land_type'] ?? 'datar';
        $data['land_contour'] = $detail['land_contour'] ?? null;
        $data['view_type'] = $detail['view_type'] ?? null;
        $data['zoning'] = $detail['zoning'] ?? null;
        $data['wifi_provider'] = $detail['wifi_provider'] ?? null;

        return $data;
    }
}
