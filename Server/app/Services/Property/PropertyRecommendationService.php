<?php

namespace App\Services\Property;

use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class PropertyRecommendationService
{
    private const JEMBER_CENTER_LATITUDE = -8.17211;
    private const JEMBER_CENTER_LONGITUDE = 113.69953;

    public function __construct(
        private PropertyFilterService $filterService,
        private PropertyMediaService $mediaService,
        private PropertyAccessService $accessService,
    ) {}

    public function paginate(Request $request, ?User $user): LengthAwarePaginator
    {
        $query = Property::with(['user', 'detail', 'images'])
            ->where('is_verified', true);

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        if ($request->filled('listing_type')) {
            $query->where('listing_type', $request->listing_type);
        }
        if ($request->filled('city')) {
            $query->where('city', $request->city);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('min_price')) {
            $query->where('price', '>=', (int) $request->min_price);
        }
        if ($request->filled('max_price')) {
            $query->where('price', '<=', (int) $request->max_price);
        }
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', "%{$request->search}%")
                    ->orWhere('description', 'like', "%{$request->search}%")
                    ->orWhere('kecamatan', 'like', "%{$request->search}%");
            });
        }
        if ($request->filled('kecamatan')) {
            $query->where('kecamatan', 'like', "%{$request->kecamatan}%");
        }

        $this->filterService->applyDetailFilters($query, $request);

        if ($request->filled('certificate_type')) {
            $query->where('certificate_type', $request->certificate_type);
        }

        if ($request->filled('amenities')) {
            $amenities = explode(',', $request->amenities);
            foreach ($amenities as $amenity) {
                $amenity = trim($amenity);
                if (!empty($amenity)) {
                    $query->whereHas('detail', fn($q) => $q->where($amenity, true));
                }
            }
        }

        $query->where('status', 'published')->where('is_verified', true);

        $properties = $query->get();
        $perPage = (int) $request->input('per_page', 8);
        $page = LengthAwarePaginator::resolveCurrentPage();

        if ($properties->isEmpty()) {
            return new LengthAwarePaginator([], 0, $perPage, $page, [
                'path' => $request->url(),
                'query' => $request->query(),
            ]);
        }

        $weights = $this->normalizeWeights([
            'price' => max(0, (float) $request->input('price_weight', 35)),
            'location' => max(0, (float) $request->input('location_weight', 30)),
            'area' => max(0, (float) $request->input('area_weight', 20)),
            'facilities' => max(0, (float) $request->input('facilities_weight', 15)),
        ]);
        $stats = $this->buildStats($properties);

        $sorted = $properties->map(function (Property $property) use ($stats, $weights) {
            $result = $this->calculateScore($property, $stats, $weights);
            $property->setAttribute('recommendation_score', round($result['score'], 6));
            $property->setAttribute('recommendation_detail', $result['detail']);

            return $property;
        })->sortByDesc('recommendation_score')->values();

        $items = $sorted->forPage($page, $perPage)->values();
        $paginator = new LengthAwarePaginator($items, $sorted->count(), $perPage, $page, [
            'path' => $request->url(),
            'query' => $request->query(),
        ]);

        $this->mediaService->appendImageUrls($paginator);
        $this->mediaService->appendRentPriceInfo($paginator, $request);
        if (!$user || !$user->isAdmin()) {
            $this->accessService->stripPrivateFields($paginator);
        }

        return $paginator;
    }

    private function normalizeWeights(array $weights): array
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

    private function buildStats(Collection $properties): array
    {
        $prices = $properties->map(fn(Property $p) => (float) ($p->price ?? 0));
        $areas = $properties->map(fn(Property $p) => $this->getAreaValue($p));
        $facilities = $properties->map(fn(Property $p) => $this->getFacilityValue($p));
        $locationCounts = $properties->groupBy(fn(Property $p) => $this->getLocationKey($p))->map->count();
        $distancesFromCenter = $properties
            ->map(fn(Property $p) => $this->getDistanceFromJemberCenter($p))
            ->filter(fn($distance) => $distance !== null)
            ->values();

        return [
            'min_price' => (float) $prices->min(),
            'max_price' => (float) $prices->max(),
            'min_area' => (float) $areas->min(),
            'max_area' => (float) $areas->max(),
            'min_facility' => (float) $facilities->min(),
            'max_facility' => (float) $facilities->max(),
            'min_location_count' => (float) $locationCounts->min(),
            'max_location_count' => (float) $locationCounts->max(),
            'location_counts' => $locationCounts->all(),
            'min_distance_from_center' => $distancesFromCenter->isNotEmpty() ? (float) $distancesFromCenter->min() : null,
            'max_distance_from_center' => $distancesFromCenter->isNotEmpty() ? (float) $distancesFromCenter->max() : null,
        ];
    }

    private function calculateScore(Property $property, array $stats, array $weights): array
    {
        $priceValue = (float) ($property->price ?? 0);
        $areaValue = $this->getAreaValue($property);
        $facilityValue = $this->getFacilityValue($property);
        $locationCount = (int) ($stats['location_counts'][$this->getLocationKey($property)] ?? 0);
        $distanceFromCenter = $this->getDistanceFromJemberCenter($property);

        $priceScore = 1 - $this->normalizeValue($priceValue, $stats['min_price'], $stats['max_price']);
        $areaScore = $this->normalizeValue($areaValue, $stats['min_area'], $stats['max_area']);
        $facilityScore = $this->normalizeValue($facilityValue, $stats['min_facility'], $stats['max_facility']);
        $locationScore = $distanceFromCenter !== null && $stats['max_distance_from_center'] !== null
            ? 1 - $this->normalizeValue(
                $distanceFromCenter,
                $stats['min_distance_from_center'],
                $stats['max_distance_from_center']
            )
            : $this->normalizeValue($locationCount, $stats['min_location_count'], $stats['max_location_count']);

        $score = $priceScore * ($weights['price'] / 100)
            + $locationScore * ($weights['location'] / 100)
            + $areaScore * ($weights['area'] / 100)
            + $facilityScore * ($weights['facilities'] / 100);

        return [
            'score' => $score,
            'detail' => [
                'price_score' => $priceScore,
                'location_score' => $locationScore,
                'distance_from_jember_center_km' => $distanceFromCenter !== null ? round($distanceFromCenter, 3) : null,
                'area_score' => $areaScore,
                'facility_score' => $facilityScore,
            ],
        ];
    }

    private function normalizeValue(float $value, float $min, float $max): float
    {
        if ($max <= $min) {
            return 0.5;
        }

        return max(0, min(1, ($value - $min) / ($max - $min)));
    }

    private function getAreaValue(Property $property): float
    {
        $detail = $property->detail;
        if (!$detail) {
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
        if (!$detail) {
            return 0;
        }

        $normalized = fn(float $value, float $target) => max(0, min($value / $target, 1));

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
            + (!empty($detail->view_type) ? 1 : 0) * 0.12
            + ((bool) $detail->garden ? 1 : 0) * 0.1
            + $electricityScore * 0.05
            + $waterScore * 0.05;

        $kosRoomScore = $normalized((float) ($detail->total_rooms ?? 0), 20) * 0.36
            + $normalized((float) ($detail->bathrooms ?? 0), 10) * 0.28
            + (($detail->bathroom_position ?? null) === 'dalam' ? 1 : 0.65) * 0.2
            + (!empty($detail->gender_type) ? 1 : 0) * 0.16;

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
                + (!empty($detail->zoning) ? 1 : 0) * 0.25
                + $landTypeScore * 0.25
                + (!empty($detail->land_contour) ? 1 : 0) * 0.15,
            default => 0,
        };
    }

    private function getLocationKey(Property $property): string
    {
        return strtolower(trim(($property->city ?? '') . '|' . ($property->kecamatan ?? '')));
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
