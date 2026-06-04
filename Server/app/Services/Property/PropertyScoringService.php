<?php

namespace App\Services\Property;

use App\Models\Property;

class PropertyScoringService
{
    private const JEMBER_CENTER_LATITUDE = -8.17211;

    private const JEMBER_CENTER_LONGITUDE = 113.69953;

    private const MAX_RECOMMENDED_DISTANCE_KM = 30;

    private const MISSING_FIELD_PENALTY = 0.05;

    private const MAX_COMPLETENESS_PENALTY = 0.3;

    /**
     * Fixed ranges keep scores stable when an extreme listing is added.
     * Rental prices are monthly equivalents.
     */
    private const REFERENCE_PROFILES = [
        'rumah' => [
            'jual' => ['price' => [100000000, 5000000000], 'area' => [20, 500]],
            'sewa' => ['price' => [500000, 20000000], 'area' => [20, 500]],
        ],
        'villa' => [
            'jual' => ['price' => [250000000, 10000000000], 'area' => [30, 1000]],
            'sewa' => ['price' => [1000000, 50000000], 'area' => [30, 1000]],
        ],
        'ruko' => [
            'jual' => ['price' => [100000000, 5000000000], 'area' => [10, 750]],
            'sewa' => ['price' => [1000000, 50000000], 'area' => [10, 750]],
        ],
        'kos' => [
            'sewa' => ['price' => [250000, 5000000], 'area' => [1, 30]],
        ],
        'tanah' => [
            'jual' => ['price' => [50000000, 5000000000], 'area' => [20, 10000]],
            'sewa' => ['price' => [500000, 30000000], 'area' => [20, 10000]],
        ],
    ];

    public function __construct(
        private ?PropertyScoringProfileService $profileService,
    ) {}

    public function normalizeWeights(array $weights): array
    {
        $totalWeight = array_sum($weights);
        if ($totalWeight <= 0) {
            return ['price' => 25, 'location' => 25, 'area' => 25, 'facilities' => 25];
        }

        foreach ($weights as $key => $value) {
            $weights[$key] = ($value / $totalWeight) * 100;
        }

        return $weights;
    }

    public function buildStats(string $type, string $listingType): array
    {
        return $this->profileService?->getActiveStats($type, $listingType)
            ?? $this->getFallbackStats($type, $listingType);
    }

    public function getFallbackStats(string $type, string $listingType): array
    {
        $profile = self::REFERENCE_PROFILES[$type][$listingType];

        return [
            'min_price' => $profile['price'][0],
            'max_price' => $profile['price'][1],
            'min_area' => $profile['area'][0],
            'max_area' => $profile['area'][1],
            'profile_source' => 'fallback',
            'profile_version' => null,
            'profile_sample_count' => 0,
        ];
    }

    public function getSupportedCategories(): array
    {
        $categories = [];

        foreach (self::REFERENCE_PROFILES as $type => $listingProfiles) {
            foreach (array_keys($listingProfiles) as $listingType) {
                $categories[] = ['type' => $type, 'listing_type' => $listingType];
            }
        }

        return $categories;
    }

    public function calculateScore(Property $property, array $stats, array $weights): array
    {
        $priceValue = $this->getComparablePrice($property);
        $areaValue = $this->getAreaValue($property);
        $facilityValue = $this->getFacilityValue($property);
        $distanceFromCenter = $this->getDistanceFromJemberCenter($property);

        $priceScore = 1 - $this->normalizeLogValue($priceValue, $stats['min_price'], $stats['max_price']);
        $areaScore = $this->normalizeLogValue($areaValue, $stats['min_area'], $stats['max_area']);
        $facilityScore = $this->normalizeValue($facilityValue, 0, 1);
        $locationScore = $distanceFromCenter !== null
            ? 1 - $this->normalizeValue($distanceFromCenter, 0, self::MAX_RECOMMENDED_DISTANCE_KM)
            : 0;
        $missingFields = $this->getMissingRecommendationFields($property);
        $completenessPenalty = min(
            count($missingFields) * self::MISSING_FIELD_PENALTY,
            self::MAX_COMPLETENESS_PENALTY
        );
        $rawScore = $priceScore * ($weights['price'] / 100)
            + $locationScore * ($weights['location'] / 100)
            + $areaScore * ($weights['area'] / 100)
            + $facilityScore * ($weights['facilities'] / 100);
        $score = max(0, $rawScore - $completenessPenalty);

        return [
            'score' => $score,
            'detail' => [
                'raw_score' => round($rawScore, 6),
                'completeness_penalty' => $completenessPenalty,
                'data_completeness_score' => round(1 - $completenessPenalty, 2),
                'missing_fields' => $missingFields,
                'price_score' => $priceScore,
                'comparable_price' => round($priceValue, 2),
                'location_score' => $locationScore,
                'distance_from_jember_center_km' => $distanceFromCenter !== null ? round($distanceFromCenter, 3) : null,
                'area_score' => $areaScore,
                'facility_score' => $facilityScore,
                'reference_profile' => [
                    'normalization' => 'logarithmic_clamped',
                    'source' => $stats['profile_source'] ?? 'fallback',
                    'version' => $stats['profile_version'] ?? null,
                    'sample_count' => $stats['profile_sample_count'] ?? 0,
                    'min_price' => $stats['min_price'],
                    'max_price' => $stats['max_price'],
                    'min_area' => $stats['min_area'],
                    'max_area' => $stats['max_area'],
                ],
            ],
        ];
    }

    public function getComparablePrice(Property $property): float
    {
        $price = (float) ($property->price ?? 0);
        if ($property->listing_type !== 'sewa') {
            return $price;
        }

        return match ($property->rent_period ?: 'bulan') {
            'hari' => $price * 30,
            'minggu' => $price * 4.345,
            '3bulan' => $price / 3,
            '6bulan' => $price / 6,
            'tahun' => $price / 12,
            default => $price,
        };
    }

    private function getMissingRecommendationFields(Property $property): array
    {
        $detail = $property->detail;
        $missing = [];

        if ((float) ($property->price ?? 0) <= 0) {
            $missing[] = 'price';
        }
        if ($property->listing_type === 'sewa' && empty($property->rent_period)) {
            $missing[] = 'rent_period';
        }
        if ($property->latitude === null || $property->longitude === null) {
            $missing[] = 'coordinates';
        }
        if (! $detail) {
            return [...$missing, 'detail'];
        }

        $requiredDetailFields = match ($property->type) {
            'rumah', 'villa' => ['luas_tanah', 'luas_bangunan'],
            'ruko' => ['luas_bangunan'],
            'kos' => ['panjang_ruangan', 'lebar_ruangan', 'total_rooms', 'bathrooms'],
            'tanah' => ['luas_tanah', 'road_access'],
            default => [],
        };

        foreach ($requiredDetailFields as $field) {
            if ($detail->{$field} === null || $detail->{$field} === '') {
                $missing[] = $field;
            }
        }

        return $missing;
    }

    private function normalizeValue(float $value, float $min, float $max): float
    {
        if ($max <= $min) {
            return 0.5;
        }

        return max(0, min(1, ($value - $min) / ($max - $min)));
    }

    private function normalizeLogValue(float $value, float $min, float $max): float
    {
        if ($value <= 0 || $min <= 0 || $max <= $min) {
            return $this->normalizeValue($value, $min, $max);
        }

        $clampedValue = max($min, min($value, $max));

        return (log($clampedValue) - log($min)) / (log($max) - log($min));
    }

    public function getAreaValue(Property $property): float
    {
        $detail = $property->detail;
        if (! $detail) {
            return 0;
        }

        $landArea = (float) ($detail->luas_tanah ?? 0);
        $buildingArea = (float) ($detail->luas_bangunan ?? 0);
        $roomLength = (float) ($detail->panjang_ruangan ?? 0);
        $roomWidth = (float) ($detail->lebar_ruangan ?? 0);
        $roomArea = $roomLength > 0 && $roomWidth > 0 ? $roomLength * $roomWidth : 0;
        $totalRooms = (float) ($detail->total_rooms ?? 0);
        $shopFrontWidth = (float) ($detail->shop_front_width ?? 0);
        $warehouseArea = (float) ($detail->warehouse_area ?? 0);

        return match ($property->type) {
            'rumah', 'villa' => ($buildingArea * 0.6) + ($landArea * 0.4),
            'ruko' => ($buildingArea * 0.5) + ($landArea * 0.3) + (($shopFrontWidth + $warehouseArea) * 0.2),
            'kos' => ($roomArea * 0.7) + ($totalRooms * 0.3),
            'tanah' => $landArea,
            default => $buildingArea ?: $landArea,
        };
    }

    private function getFacilityValue(Property $property): float
    {
        $detail = $property->detail;
        if (! $detail) {
            return 0;
        }

        $normalized = fn (float $value, float $target) => max(0, min($value / $target, 1));

        $waterScore = match ($detail->water ?? null) {
            'pdam', 'PDAM' => 1,
            'sumur', 'Sumur' => 0.75,
            default => 0,
        };
        $electricityScore = match ($detail->listrik_type ?? null) {
            'underground' => 1,
            'overground', 'PLN' => 0.85,
            default => 0,
        };
        $roadScore = match ($detail->road_access ?? null) {
            'aspal' => 1,
            'cor' => 0.9,
            'batu' => 0.65,
            'belum' => 0.35,
            default => 0,
        };
        $landTypeScore = match ($detail->land_type ?? null) {
            'datar' => 1,
            'miring' => 0.75,
            'bukit' => 0.65,
            default => 0,
        };

        $houseRoomScore = $normalized((float) ($detail->bedrooms ?? 0), 5) * 0.28
            + $normalized((float) ($detail->bathrooms ?? 0), 4) * 0.24
            + $normalized((float) ($detail->kitchens ?? 0), 2) * 0.18
            + $normalized((float) ($detail->living_rooms ?? 0), 3) * 0.18
            + $normalized((float) ($detail->floors ?? 0), 3) * 0.12;

        $houseExtraScore = ((bool) $detail->carport ? 1 : 0) * 0.18
            + ((bool) $detail->garden ? 1 : 0) * 0.14
            + ((bool) $detail->one_gate_system ? 1 : 0) * 0.2
            + ((bool) $detail->security_24jam ? 1 : 0) * 0.2
            + $electricityScore * 0.14
            + $waterScore * 0.14;

        $villaExtraScore = ((bool) $detail->swimming_pool ? 1 : 0) * 0.2
            + ((bool) $detail->private_pool ? 1 : 0) * 0.16
            + ((bool) $detail->furnished ? 1 : 0) * 0.16
            + ((bool) $detail->near_tourism ? 1 : 0) * 0.16
            + (! empty($detail->view_type) ? 1 : 0) * 0.12
            + ((bool) $detail->garden ? 1 : 0) * 0.1
            + $electricityScore * 0.05
            + $waterScore * 0.05;

        $kosRoomScore = $normalized((float) ($detail->total_rooms ?? 0), 20) * 0.36
            + $normalized((float) ($detail->bathrooms ?? 0), 10) * 0.28
            + (($detail->bathroom_position ?? null) === 'dalam' ? 1 : 0.65) * 0.2
            + (! empty($detail->gender_type) ? 1 : 0) * 0.16;

        $kosExtraScore = ((bool) $detail->wifi_included ? 1 : 0) * 0.18
            + ((bool) $detail->electricity_included ? 1 : 0) * 0.18
            + ((bool) $detail->water_included ? 1 : 0) * 0.16
            + ((bool) $detail->shared_kitchen ? 1 : 0) * 0.14
            + ((bool) $detail->parking_area ? 1 : 0) * 0.16
            + ((bool) $detail->cctv ? 1 : 0) * 0.18;

        $rukoBusinessScore = $normalized((float) ($detail->parking_capacity ?? 0), 5) * 0.36
            + $normalized((float) ($detail->warehouse_area ?? 0), 100) * 0.34
            + $normalized((float) ($detail->shop_front_width ?? 0), 10) * 0.3;

        $rukoUtilityScore = $electricityScore * 0.5 + $waterScore * 0.5;

        return match ($property->type) {
            'rumah' => ($houseRoomScore * 0.45) + ($houseExtraScore * 0.55),
            'villa' => ($houseRoomScore * 0.4) + ($villaExtraScore * 0.6),
            'kos' => ($kosRoomScore * 0.4) + ($kosExtraScore * 0.6),
            'ruko' => ($rukoBusinessScore * 0.4) + ($rukoUtilityScore * 0.6),
            'tanah' => $roadScore * 0.35
                + (! empty($detail->zoning) ? 1 : 0) * 0.25
                + $landTypeScore * 0.25
                + (! empty($detail->land_contour) ? 1 : 0) * 0.15,
            default => 0,
        };
    }

    private function getDistanceFromJemberCenter(Property $property): ?float
    {
        if ($property->latitude === null || $property->longitude === null) {
            return null;
        }

        $earthRadiusKm = 6371;
        $latFrom = deg2rad(self::JEMBER_CENTER_LATITUDE);
        $lngFrom = deg2rad(self::JEMBER_CENTER_LONGITUDE);
        $latTo = deg2rad((float) $property->latitude);
        $lngTo = deg2rad((float) $property->longitude);

        $latDelta = $latTo - $latFrom;
        $lngDelta = $lngTo - $lngFrom;

        $angle = 2 * asin(sqrt(
            (sin($latDelta / 2) ** 2) +
            cos($latFrom) * cos($latTo) * (sin($lngDelta / 2) ** 2)
        ));

        return $earthRadiusKm * $angle;
    }
}
