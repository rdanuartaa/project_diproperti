<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\PropertyImage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class PropertyController extends Controller
{
    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    private function appendImageUrls(Property|Collection|LengthAwarePaginator $data): Property|Collection|LengthAwarePaginator
    {
        $callback = function ($property) {
            if ($property->relationLoaded('images')) {
                $property->images->each(fn($image) => $image->full_url);
            }
            return $property;
        };

        if ($data instanceof LengthAwarePaginator) {
            $data->getCollection()->transform($callback);
        } elseif ($data instanceof Collection) {
            $data->each($callback);
        } elseif ($data instanceof Property) {
            $callback($data);
        }
        return $data;
    }

    private function buildR2Url(?string $path): ?string
    {
        if (!$path) return null;
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) return $path;
        $accountId = 'a0eea8f875e1416b9ea4a5c4a1cea45e';
        return "https://pub-{$accountId}.r2.dev/{$path}";
    }

    private function makeDownloadFilename(string $label, ?string $path): string
    {
        $extension = pathinfo(parse_url((string) $path, PHP_URL_PATH) ?: '', PATHINFO_EXTENSION);
        $filename = Str::slug($label);
        return $extension ? "{$filename}.{$extension}" : $filename;
    }

    private function downloadFileResponse(?string $path, string $filename): \Symfony\Component\HttpFoundation\Response
    {
        abort_if(!$path, 404, 'File tidak ditemukan.');

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            $response = Http::timeout(30)->get($path);
            abort_unless($response->successful(), 404, 'File tidak dapat diunduh.');

            return response()->make($response->body(), 200, [
                'Content-Type' => $response->header('Content-Type') ?: 'application/octet-stream',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ]);
        }

        abort_unless(Storage::disk('s3')->exists($path), 404, 'File tidak ditemukan.');

        return response()->streamDownload(function () use ($path) {
            $stream = Storage::disk('s3')->readStream($path);
            if (is_resource($stream)) {
                fpassthru($stream);
                fclose($stream);
            }
        }, $filename, [
            'Content-Type' => 'application/octet-stream',
        ]);
    }

    private function appendDocumentUrls(Property|Collection|LengthAwarePaginator $data): Property|Collection|LengthAwarePaginator
    {
        $apply = function (Property $property) {
            $property->setAttribute('certificate_file_url', $this->buildR2Url($property->certificate_file));
            $property->setAttribute('electric_bill_file_url', $this->buildR2Url($property->electric_bill_file));
            $property->setAttribute('water_bill_file_url', $this->buildR2Url($property->water_bill_file));
        };
        if ($data instanceof LengthAwarePaginator) $data->getCollection()->each($apply);
        elseif ($data instanceof Collection) $data->each($apply);
        elseif ($data instanceof Property) $apply($data);
        return $data;
    }

    private function normalizeRentPeriod(string $period): string
    {
        $normalized = strtolower(str_replace(' ', '', $period));
        return match ($normalized) {
            '3bulan' => '3bulan',
            '6bulan' => '6bulan',
            '12bulan', '1tahun', 'tahun' => 'tahun',
            default => 'bulan',
        };
    }

    private function appendRentPriceInfo(Property|Collection|LengthAwarePaginator $data, Request $request): Property|Collection|LengthAwarePaginator
    {
        $periodKey = $this->normalizeRentPeriod((string) $request->input('rent_period', 'bulan'));
        $labels = ['bulan' => 'bulan', '3bulan' => '3 bulan', '6bulan' => '6 bulan', 'tahun' => 'tahun'];
        $label = $labels[$periodKey] ?? 'bulan';

        $apply = function (Property $property) use ($periodKey, $label) {
            if ($property->listing_type !== 'sewa') {
                $property->setAttribute('price_period', null);
                $property->setAttribute('price_display', null);
                return;
            }
            $property->setAttribute('price_period', $periodKey);
            $property->setAttribute('price_display', ($property->price ?? 0) . '/' . $label);
        };

        if ($data instanceof LengthAwarePaginator) $data->getCollection()->each($apply);
        elseif ($data instanceof Collection) $data->each($apply);
        elseif ($data instanceof Property) $apply($data);
        return $data;
    }

    private function applyLocationAccess(Property $property, ?User $user): void
    {
        $isAdmin = $user?->isAdmin() ?? false;
        $isOwner = $user && (int) $property->user_id === (int) $user->id;
        $canView = $isAdmin || $isOwner;

        $property->setAttribute('can_view_location', $canView);
        if ($canView) return;

        $lat = $property->latitude;
        $lng = $property->longitude;
        if ($lat !== null && $lng !== null) {
            $property->setAttribute('location_preview', [
                'latitude' => round((float) $lat, 2),
                'longitude' => round((float) $lng, 2),
            ]);
        } else {
            $property->setAttribute('location_preview', null);
        }
        $property->setAttribute('latitude', null);
        $property->setAttribute('longitude', null);
        $property->setAttribute('address', null);
    }

    private function stripPrivateFields(Property|Collection|LengthAwarePaginator $data): Property|Collection|LengthAwarePaginator
    {
        $hidden = ['certificate_file', 'electric_bill_file', 'water_bill_file', 'is_verified', 'latitude', 'longitude', 'address'];
        $apply = fn(Property $p) => $p->makeHidden($hidden);

        if ($data instanceof LengthAwarePaginator) $data->getCollection()->each($apply);
        elseif ($data instanceof Collection) $data->each($apply);
        elseif ($data instanceof Property) $apply($data);
        return $data;
    }

    private function applySortOrder(Builder $query, Request $request): Builder
    {
        $sortOrder = strtolower((string) $request->input('sort_order', 'desc'));
        return in_array($sortOrder, ['asc', 'oldest', 'terlama'], true)
            ? $query->orderBy('created_at', 'asc')
            : $query->latest();
    }

    private function applyDetailFilters(Builder $query, Request $request): Builder
    {
        $numericFilters = [
            'bedrooms', 'bathrooms', 'living_rooms', 'kitchens', 'floors',
            'total_rooms', 'parking_capacity', 'warehouse_area',
            'luas_tanah', 'luas_bangunan', 'shop_front_width',
        ];

        foreach ($numericFilters as $field) {
            if ($request->filled($field)) {
                $query->whereHas('detail', fn($q) => $q->where($field, '>=', (float) $request->input($field)));
            }
        }

        $exactFilters = [
            'water', 'listrik_type', 'bathroom_position',
            'gender_type', 'road_access', 'land_type',
        ];

        foreach ($exactFilters as $field) {
            if ($request->filled($field)) {
                $query->whereHas('detail', fn($q) => $q->where($field, $request->input($field)));
            }
        }

        return $query;
    }

    // =========================================================================
    // RECOMMENDATION ENGINE
    // =========================================================================

    private function normalizeRecommendationValue(float $value, float $min, float $max): float
    {
        if ($max <= $min) return 0.5;
        return max(0, min(1, ($value - $min) / ($max - $min)));
    }

    private function getRecommendationFacilityValue(Property $property): float
    {
        $detail = $property->detail;
        if (!$detail) return 0;
        return (float)($detail->bedrooms ?? 0) * 1.0
            + (float)($detail->bathrooms ?? 0) * 0.85
            + (float)($detail->living_rooms ?? 0) * 0.65
            + (float)($detail->kitchens ?? 0) * 0.8
            + (float)($detail->floors ?? 0) * 0.45
            + ((bool) $detail->carport ? 1 : 0) * 0.7
            + ((bool) $detail->garden ? 1 : 0) * 0.55
            + ((bool) $detail->one_gate_system ? 1 : 0) * 0.75
            + ((bool) $detail->security_24jam ? 1 : 0) * 0.8;
    }

    private function getRecommendationLocationKey(Property $property): string
    {
        return strtolower(trim(($property->city ?? '') . '|' . ($property->kecamatan ?? '')));
    }

    private function calculateRecommendationScore(Property $property, array $stats, array $weights): array
    {
        $priceValue = (float) ($property->price ?? 0);
        $areaValue = (float) ($property->detail?->luas_bangunan ?? $property->detail?->luas_tanah ?? 0);
        $facilityValue = $this->getRecommendationFacilityValue($property);
        $locationCount = (int) ($stats['location_counts'][$this->getRecommendationLocationKey($property)] ?? 0);

        $priceScore = 1 - $this->normalizeRecommendationValue($priceValue, $stats['min_price'], $stats['max_price']);
        $areaScore = $this->normalizeRecommendationValue($areaValue, $stats['min_area'], $stats['max_area']);
        $facilityScore = $this->normalizeRecommendationValue($facilityValue, $stats['min_facility'], $stats['max_facility']);
        $locationScore = $this->normalizeRecommendationValue($locationCount, $stats['min_location_count'], $stats['max_location_count']);

        $score = $priceScore * ($weights['price'] / 100)
            + $locationScore * ($weights['location'] / 100)
            + $areaScore * ($weights['area'] / 100)
            + $facilityScore * ($weights['facilities'] / 100);

        return [
            'score' => $score,
            'detail' => [
                'price_score' => $priceScore,
                'location_score' => $locationScore,
                'area_score' => $areaScore,
                'facility_score' => $facilityScore,
            ]
        ];
    }

    // =========================================================================
    // DYNAMIC DETAIL VALIDATION HELPER ✅
    // =========================================================================

    private function getDetailValidationRules(string $type): array
    {
        $base = ['detail' => 'required|array'];

        $universal = [
            'detail.luas_tanah'           => 'required|integer|min:0',
            'detail.water'                => 'nullable|in:pdam,sumur',
            'detail.electricity_capacity' => 'nullable|integer|min:0',
            'detail.listrik_type'         => 'nullable|in:overground,underground',
            'detail.road_access'          => 'nullable|in:aspal,cor,batu,belum',
            'detail.wifi_provider'        => 'nullable|string|max:255',
        ];

        return match ($type) {
            'rumah' => array_merge($base, $universal, [
                'detail.luas_bangunan'  => 'required|integer|min:0',
                'detail.bedrooms'       => 'required|integer|min:0',
                'detail.bathrooms'      => 'required|integer|min:0',
                'detail.floors'         => 'required|integer|min:0',
                'detail.kitchens'       => 'nullable|integer|min:0',
                'detail.living_rooms'   => 'nullable|integer|min:0',
                'detail.carport'        => 'nullable|boolean',
                'detail.garden'         => 'nullable|boolean',
                'detail.one_gate_system' => 'nullable|boolean',
                'detail.security_24jam'  => 'nullable|boolean',
            ]),
            'villa' => array_merge($base, $universal, [
                'detail.luas_bangunan'  => 'required|integer|min:0',
                'detail.bedrooms'       => 'required|integer|min:0',
                'detail.bathrooms'      => 'required|integer|min:0',
                'detail.floors'         => 'required|integer|min:0',
                'detail.kitchens'       => 'nullable|integer|min:0',
                'detail.living_rooms'   => 'nullable|integer|min:0',
                'detail.carport'        => 'nullable|boolean',
                'detail.garden'         => 'nullable|boolean',
                'detail.one_gate_system' => 'nullable|boolean',
                'detail.security_24jam'  => 'nullable|boolean',
                'detail.swimming_pool'  => 'nullable|boolean',
                'detail.private_pool'   => 'nullable|boolean',
                'detail.view_type'      => 'nullable|string|max:100',
                'detail.furnished'      => 'nullable|boolean',
                'detail.near_tourism'   => 'nullable|boolean',
            ]),
            'kos' => array_merge($base, $universal, [
                'detail.panjang_ruangan'        => 'required|numeric|min:0',
                'detail.lebar_ruangan'          => 'required|numeric|min:0',
                'detail.total_rooms'            => 'required|integer|min:0',
                'detail.bathrooms'              => 'required|integer|min:0',
                'detail.bathroom_position'      => 'nullable|in:dalam,luar',
                'detail.gender_type'            => 'nullable|in:laki-laki,perempuan,campuran',
                'detail.wifi_included'          => 'nullable|boolean',
                'detail.electricity_included'   => 'nullable|boolean',
                'detail.water_included'         => 'nullable|boolean',
                'detail.shared_kitchen'         => 'nullable|boolean',
                'detail.parking_area'           => 'nullable|boolean',
                'detail.cctv'                   => 'nullable|boolean',
            ]),
            'ruko' => array_merge($base, $universal, [
                'detail.parking_capacity'   => 'nullable|integer|min:0',
                'detail.warehouse_area'     => 'nullable|integer|min:0',
                'detail.shop_front_width'   => 'nullable|numeric|min:0',
            ]),
            'tanah' => array_merge($base, $universal, [
                'detail.road_access'    => 'required|in:aspal,cor,batu,belum',
                'detail.land_type'      => 'nullable|in:datar,miring,bukit',
                'detail.land_contour'   => 'nullable|string|max:100',
                'detail.zoning'         => 'nullable|string|max:100',
            ]),
            default => $base,
        };
    }

    private function getCertificateRules(string $type, bool $isUpdate = false): array
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

    private function normalizeDetailInput(array $detail): array
    {
        if (
            array_key_exists('panjang_ruangan', $detail) &&
            !array_key_exists('luas_tanah', $detail)
        ) {
            $detail['luas_tanah'] = $detail['panjang_ruangan'];
        }
        if (
            array_key_exists('lebar_ruangan', $detail) &&
            !array_key_exists('luas_bangunan', $detail)
        ) {
            $detail['luas_bangunan'] = $detail['lebar_ruangan'];
        }

        $integerFields = [
            'luas_tanah', 'luas_bangunan', 'panjang_ruangan', 'lebar_ruangan',
            'floors', 'bedrooms', 'bathrooms',
            'kitchens', 'living_rooms', 'electricity_capacity',
            'total_rooms', 'parking_capacity', 'warehouse_area',
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
            'carport', 'garden', 'one_gate_system', 'security_24jam',
            'wifi_included', 'electricity_included', 'water_included', 'shared_kitchen',
            'parking_area', 'cctv', 'swimming_pool', 'private_pool', 'furnished', 'near_tourism',
        ];
        foreach ($booleanFields as $field) {
            if (array_key_exists($field, $detail)) {
                $detail[$field] = filter_var($detail[$field], FILTER_VALIDATE_BOOLEAN);
            }
        }
        return $detail;
    }

    private function prepareDetailData(array $detail, int $propertyId): array
    {
        $data = ['property_id' => $propertyId];

        $intFields = [
            'luas_tanah' => 0, 'luas_bangunan' => 0, 'floors' => 1, 'bedrooms' => 0,
            'bathrooms' => 0, 'kitchens' => 0, 'living_rooms' => 0, 'electricity_capacity' => 0,
            'total_rooms' => 0, 'parking_capacity' => 0, 'warehouse_area' => 0,
        ];
        foreach ($intFields as $field => $default) {
            $val = $detail[$field] ?? null;
            $data[$field] = ($val === null || $val === '' || $val === 'null') ? $default : (int) $val;
        }

        foreach (['panjang_ruangan', 'lebar_ruangan'] as $field) {
            $val = $detail[$field] ?? null;
            $data[$field] = ($val === null || $val === '' || $val === 'null') ? null : (float) $val;
        }

        $data['shop_front_width'] = isset($detail['shop_front_width']) && $detail['shop_front_width'] !== null
            ? (float) $detail['shop_front_width']
            : null;

        $boolFields = [
            'carport', 'garden', 'one_gate_system', 'security_24jam',
            'wifi_included', 'electricity_included', 'water_included', 'shared_kitchen',
            'parking_area', 'cctv', 'swimming_pool', 'private_pool', 'furnished', 'near_tourism',
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

    // =========================================================================
    // PUBLIC ENDPOINTS
    // =========================================================================

    public function recommendations(Request $request): \Illuminate\Http\JsonResponse
    {
        $query = Property::with(['user', 'detail', 'images'])
            ->where('is_verified', true);

        // Filters
        if ($request->filled('type')) $query->where('type', $request->type);
        if ($request->filled('listing_type')) $query->where('listing_type', $request->listing_type);
        if ($request->filled('city')) $query->where('city', $request->city);
        if ($request->filled('status')) $query->where('status', $request->status);
        if ($request->filled('min_price')) $query->where('price', '>=', (int) $request->min_price);
        if ($request->filled('max_price')) $query->where('price', '<=', (int) $request->max_price);
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%")
                  ->orWhere('kecamatan', 'like', "%{$request->search}%");
            });
        }
        if ($request->filled('kecamatan')) $query->where('kecamatan', 'like', "%{$request->kecamatan}%");

        // Detail filters
        $this->applyDetailFilters($query, $request);
        if ($request->filled('certificate_type')) $query->where('certificate_type', $request->certificate_type);

        // Amenities filter
        if ($request->filled('amenities')) {
            $amenities = explode(',', $request->amenities);
            foreach ($amenities as $amenity) {
                $amenity = trim($amenity);
                if (!empty($amenity)) $query->whereHas('detail', fn($q) => $q->where($amenity, true));
            }
        }

        $user = $request->user();
        $query->where('status', 'published')->where('is_verified', true);

        $properties = $query->get();

        // Weights calculation
        $weights = [
            'price'      => max(0, (float) $request->input('price_weight', 35)),
            'location'   => max(0, (float) $request->input('location_weight', 30)),
            'area'       => max(0, (float) $request->input('area_weight', 20)),
            'facilities' => max(0, (float) $request->input('facilities_weight', 15)),
        ];
        $totalWeight = array_sum($weights);
        if ($totalWeight <= 0) {
            $weights = ['price' => 25, 'location' => 25, 'area' => 25, 'facilities' => 25];
        } else {
            foreach ($weights as $key => $value) $weights[$key] = ($value / $totalWeight) * 100;
        }

        if ($properties->isEmpty()) {
            $perPage = (int) $request->input('per_page', 8);
            $page = LengthAwarePaginator::resolveCurrentPage();
            return response()->json(new LengthAwarePaginator([], 0, $perPage, $page, ['path' => $request->url(), 'query' => $request->query()]));
        }

        // Stats calculation
        $prices = $properties->map(fn(Property $p) => (float) ($p->price ?? 0));
        $areas = $properties->map(fn(Property $p) => (float) ($p->detail?->luas_bangunan ?? $p->detail?->luas_tanah ?? 0));
        $facilities = $properties->map(fn(Property $p) => $this->getRecommendationFacilityValue($p));
        $locationCounts = $properties->groupBy(fn(Property $p) => $this->getRecommendationLocationKey($p))->map->count();

        $stats = [
            'min_price' => (float) $prices->min(), 'max_price' => (float) $prices->max(),
            'min_area' => (float) $areas->min(), 'max_area' => (float) $areas->max(),
            'min_facility' => (float) $facilities->min(), 'max_facility' => (float) $facilities->max(),
            'min_location_count' => (float) $locationCounts->min(), 'max_location_count' => (float) $locationCounts->max(),
            'location_counts' => $locationCounts->all(),
        ];

        // Sort by recommendation score
        $sorted = $properties->map(function (Property $property) use ($stats, $weights) {
            $result = $this->calculateRecommendationScore($property, $stats, $weights);
            $property->setAttribute('recommendation_score', round($result['score'], 6));
            $property->setAttribute('recommendation_detail', $result['detail']);
            return $property;
        })->sortByDesc('recommendation_score')->values();

        $perPage = (int) $request->input('per_page', 8);
        $page = LengthAwarePaginator::resolveCurrentPage();
        $items = $sorted->forPage($page, $perPage)->values();
        $paginator = new LengthAwarePaginator($items, $sorted->count(), $perPage, $page, ['path' => $request->url(), 'query' => $request->query()]);

        $this->appendImageUrls($paginator);
        $this->appendRentPriceInfo($paginator, $request);
        if (!$user || !$user->isAdmin()) $this->stripPrivateFields($paginator);

        return response()->json($paginator);
    }

    public function index(Request $request): \Illuminate\Http\JsonResponse
    {
        $query = Property::with(['user', 'detail', 'images']);

        if ($request->filled('type')) $query->where('type', $request->type);
        if ($request->filled('listing_type')) $query->where('listing_type', $request->listing_type);
        if ($request->filled('city')) $query->where('city', $request->city);
        if ($request->filled('status')) $query->where('status', $request->status);
        if ($request->filled('min_price')) $query->where('price', '>=', (int) $request->min_price);
        if ($request->filled('max_price')) $query->where('price', '<=', (int) $request->max_price);
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%")
                  ->orWhere('kecamatan', 'like', "%{$request->search}%");
            });
        }
        if ($request->filled('kecamatan')) $query->where('kecamatan', 'like', "%{$request->kecamatan}%");

        $this->applyDetailFilters($query, $request);
        if ($request->filled('certificate_type')) $query->where('certificate_type', $request->certificate_type);

        if ($request->filled('amenities')) {
            $amenities = explode(',', $request->amenities);
            foreach ($amenities as $amenity) {
                $amenity = trim($amenity);
                if (!empty($amenity)) $query->whereHas('detail', fn($q) => $q->where($amenity, true));
            }
        }

        $user = $request->user();
        if (!$user || !$user->isAdmin()) $query->where('status', 'published')->where('is_verified', true);

        $perPage = $request->input('per_page', 12);
        $properties = $this->applySortOrder($query, $request)->paginate($perPage);

        $this->appendImageUrls($properties);
        $this->appendRentPriceInfo($properties, $request);
        if (!$user || !$user->isAdmin()) $this->stripPrivateFields($properties);

        return response()->json($properties);
    }

    public function adminIndex(Request $request): \Illuminate\Http\JsonResponse
    {
        if (!$request->user()?->isAdmin()) return response()->json(['message' => 'Unauthorized'], 403);

        $query = Property::with(['user', 'detail', 'images'])
            ->where('is_verified', true);

        if ($request->filled('type')) $query->where('type', $request->type);
        if ($request->filled('listing_type')) $query->where('listing_type', $request->listing_type);
        if ($request->filled('city')) $query->where('city', $request->city);
        if ($request->filled('min_price')) $query->where('price', '>=', (int) $request->min_price);
        if ($request->filled('max_price')) $query->where('price', '<=', (int) $request->max_price);
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%")
                  ->orWhere('kecamatan', 'like', "%{$request->search}%");
            });
        }
        if ($request->filled('kecamatan')) $query->where('kecamatan', 'like', "%{$request->kecamatan}%");

        if ($request->filled('bedrooms')) $query->whereHas('detail', fn($q) => $q->where('bedrooms', '>=', (int) $request->bedrooms));
        if ($request->filled('bathrooms')) $query->whereHas('detail', fn($q) => $q->where('bathrooms', '>=', (int) $request->bathrooms));
        if ($request->filled('living_rooms')) $query->whereHas('detail', fn($q) => $q->where('living_rooms', '>=', (int) $request->living_rooms));
        if ($request->filled('kitchens')) $query->whereHas('detail', fn($q) => $q->where('kitchens', '>=', (int) $request->kitchens));
        if ($request->filled('floors')) $query->whereHas('detail', fn($q) => $q->where('floors', '>=', (int) $request->floors));
        if ($request->filled('certificate_type')) $query->where('certificate_type', $request->certificate_type);
        if ($request->filled('water')) $query->whereHas('detail', fn($q) => $q->where('water', $request->water));
        if ($request->filled('listrik_type')) $query->whereHas('detail', fn($q) => $q->where('listrik_type', $request->listrik_type));

        if ($request->filled('amenities')) {
            $amenities = explode(',', $request->amenities);
            foreach ($amenities as $amenity) {
                $amenity = trim($amenity);
                if (!empty($amenity)) $query->whereHas('detail', fn($q) => $q->where($amenity, true));
            }
        }

        $perPage = $request->input('per_page', 12);
        $properties = $this->applySortOrder($query, $request)->paginate($perPage);

        $this->appendImageUrls($properties);
        $this->appendRentPriceInfo($properties, $request);

        return response()->json($properties);
    }

    public function show(string $slug): \Illuminate\Http\JsonResponse
    {
        $property = Property::with(['user', 'detail', 'images'])->where('slug', $slug)->firstOrFail();

        $this->appendImageUrls($property);
        $this->appendRentPriceInfo($property, request());

        $viewer = request()->user();
        $isAdmin = $viewer?->isAdmin() ?? false;
        $isOwner = $viewer && (int) $property->user_id === (int) $viewer->id;
        if (!$isAdmin) {
            if (!$isOwner && ($property->status !== 'published' || !$property->is_verified)) {
                return response()->json(['message' => 'Not found'], 404);
            }
            if (!$isOwner) {
                $this->stripPrivateFields($property);
            }
        } else {
            $this->appendDocumentUrls($property);
        }

        $this->applyLocationAccess($property, $viewer);
        if ($property->getAttribute('can_view_location')) {
            $property->makeVisible(['latitude', 'longitude']);
        }

        if (!$viewer?->isAdmin()) $property->increment('views');

        return response()->json($property);
    }

    // =========================================================================
    // CREATE / STORE
    // =========================================================================

    public function store(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            Log::info('=== CREATE PROPERTY START ===');
            Log::info('User ID: ' . $request->user()->id);

            $rawDetail = $request->input('detail', []);
            $normalizedDetail = $this->normalizeDetailInput($rawDetail);
            $request->merge(['detail' => $normalizedDetail]);

            $baseRules = [
                'title' => 'required|string|max:255',
                'type' => 'required|in:rumah,villa,ruko,kos,tanah', // ✅ VILLA menggantikan perumahan
                'building_type' => 'nullable|string|max:50',
                'listing_type' => 'required|in:jual,sewa',
                'kecamatan' => 'required|string|max:100',
                'city' => 'required|string|max:100',
                'address' => 'nullable|string|max:255',
                'latitude' => 'nullable|numeric|between:-90,90',
                'longitude' => 'nullable|numeric|between:-180,180',
                'price' => 'required|integer|min:0',
                'certificate_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
                'electric_bill_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
                'water_bill_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
                'status' => 'nullable|in:draft,published,sold',
                'description' => 'nullable|string',
                'images' => 'nullable',
                'primary_new_index' => 'nullable|integer|min:0',
            ];

            $validated = $request->validate(array_merge(
                $baseRules,
                $this->getCertificateRules($request->input('type', 'rumah')),
                $this->getDetailValidationRules($request->input('type', 'rumah'))
            ));

            Log::info('Validation passed');

            $property = $request->user()->properties()->create([
                'title' => $validated['title'],
                'slug' => Str::slug($validated['title']) . '-' . Str::random(5),
                'type' => $validated['type'],
                'building_type' => $validated['building_type'] ?? null,
                'listing_type' => $validated['listing_type'],
                'kecamatan' => $validated['kecamatan'],
                'city' => $validated['city'],
                'address' => $validated['address'] ?? null,
                'latitude' => $validated['latitude'] ?? null,
                'longitude' => $validated['longitude'] ?? null,
                'price' => $validated['price'],
                'certificate_type' => $validated['certificate_type'] ?? null,
                'certificate_status' => $validated['certificate_status'] ?? null,
                'status' => $validated['status'] ?? 'draft',
                'is_verified' => true,
                'description' => $validated['description'] ?? null,
            ]);

            Log::info('Property created with ID: ' . $property->id);

            $detailData = $this->prepareDetailData($validated['detail'], $property->id);
            $property->detail()->create($detailData);
            Log::info('Property detail created');

            $primaryNewIndex = $request->input('primary_new_index');
            $uploadedCount = $this->handleImageUpload($property, $request, 0, $primaryNewIndex, $primaryNewIndex !== null);
            $this->handleDocumentUpload($request, $property, 'certificate_file');
            $this->handleDocumentUpload($request, $property, 'electric_bill_file');
            $this->handleDocumentUpload($request, $property, 'water_bill_file');

            if ($uploadedCount === 0 && $request->hasFile('images')) {
                Log::warning('Images uploaded to R2 but NOT saved to database! Count: 0');
            }

            $property->load(['detail', 'images', 'user']);
            $this->appendImageUrls($property);
            $this->appendDocumentUrls($property);
            $this->appendRentPriceInfo($property, $request);

            Log::info('=== CREATE PROPERTY SUCCESS ===');
            return response()->json(['message' => 'Property created successfully', 'property' => $property], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Validation failed: ' . json_encode($e->errors()));
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('=== CREATE PROPERTY ERROR ===');
            Log::error('Message: ' . $e->getMessage());
            Log::error('File: ' . $e->getFile() . ':' . $e->getLine());
            Log::error('Trace: ' . $e->getTraceAsString());
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // UPDATE
    // =========================================================================

    public function update(Request $request, Property $property): \Illuminate\Http\JsonResponse
    {
        try {
            if (!$request->user()->isAdmin() && $property->user_id !== $request->user()->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            Log::info('=== UPDATE PROPERTY START === ID: ' . $property->id);

            $rawDetail = $request->input('detail', []);
            $normalizedDetail = $this->normalizeDetailInput($rawDetail);
            $request->merge(['detail' => $normalizedDetail]);

            $baseRules = [
                'title' => 'sometimes|required|string|max:255',
                'type' => 'sometimes|required|in:rumah,villa,ruko,kos,tanah', // ✅ VILLA
                'building_type' => 'nullable|string|max:50',
                'listing_type' => 'sometimes|required|in:jual,sewa',
                'kecamatan' => 'sometimes|required|string|max:100',
                'city' => 'sometimes|required|string|max:100',
                'address' => 'nullable|string|max:255',
                'latitude' => 'nullable|numeric|between:-90,90',
                'longitude' => 'nullable|numeric|between:-180,180',
                'price' => 'sometimes|required|integer|min:0',
                'certificate_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
                'electric_bill_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
                'water_bill_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
                'status' => 'sometimes|required|in:draft,published,sold',
                'is_verified' => 'nullable|boolean',
                'description' => 'nullable|string',
                'images_to_delete' => 'nullable|array',
                'images_to_delete.*' => 'integer|exists:property_images,id',
                'images' => 'nullable|array',
                'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:5120',
                'primary_image_id' => 'nullable|integer|exists:property_images,id',
                'primary_new_index' => 'nullable|integer|min:0',
            ];

            $effectiveType = $request->input('type', $property->type);
            $detailRules = $request->filled('detail')
                ? $this->getDetailValidationRules($effectiveType)
                : ['detail' => 'nullable|array'];

            $certificateRules = $this->getCertificateRules($effectiveType, true);
            $validated = $request->validate(array_merge($baseRules, $detailRules, $certificateRules));

            $updatableFields = [
                'title', 'type', 'building_type', 'listing_type',
                'kecamatan', 'city', 'address', 'latitude', 'longitude',
                'price', 'certificate_type', 'certificate_status', 'status', 'description',
            ];
            foreach ($updatableFields as $field) {
                if (isset($validated[$field])) $property->{$field} = $validated[$field];
            }
            if ($request->user()->isAdmin() && array_key_exists('is_verified', $validated)) {
                $property->is_verified = (bool) $validated['is_verified'];
            }
            if (isset($validated['title'])) $property->slug = Str::slug($validated['title']) . '-' . Str::random(5);
            $property->save();

            if ($request->filled('primary_image_id')) {
                $primaryImage = $property->images()->where('id', $request->primary_image_id)->first();
                if (!$primaryImage) return response()->json(['message' => 'Primary image not found for this property'], 422);
                $property->images()->update(['is_primary' => false]);
                $primaryImage->update(['is_primary' => true]);
            }

            if (isset($validated['detail'])) {
                $detailData = $this->prepareDetailData($validated['detail'], $property->id);
                $property->detail()->updateOrCreate(['property_id' => $property->id], $detailData);
            }

            if (!empty($validated['images_to_delete'])) {
                $imagesToDelete = $property->images()->whereIn('id', $validated['images_to_delete'])->get();
                foreach ($imagesToDelete as $image) {
                    if (Storage::disk('s3')->exists($image->image_url)) Storage::disk('s3')->delete($image->image_url);
                    $image->delete();
                    Log::info('Image deleted from R2: ' . $image->id);
                }
            }

            $primaryNewIndex = $request->input('primary_new_index');
            if ($primaryNewIndex !== null) $property->images()->update(['is_primary' => false]);
            $uploadedCount = $this->handleImageUpload($property, $request, $property->images()->count(), $primaryNewIndex, $primaryNewIndex !== null);

            if ($request->user()->isAdmin()) {
                $this->handleDocumentUpload($request, $property, 'certificate_file');
                $this->handleDocumentUpload($request, $property, 'electric_bill_file');
                $this->handleDocumentUpload($request, $property, 'water_bill_file');
            }

            if ($uploadedCount === 0 && $request->hasFile('images')) {
                Log::warning('Update: Images uploaded to R2 but NOT saved to database!');
            }

            $property->load(['detail', 'images', 'user']);
            $this->appendImageUrls($property);
            $this->appendDocumentUrls($property);
            $this->appendRentPriceInfo($property, $request);

            Log::info('=== UPDATE PROPERTY SUCCESS ===');
            return response()->json(['message' => 'Property updated successfully', 'property' => $property]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Validation failed: ' . json_encode($e->errors()));
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('=== UPDATE PROPERTY ERROR ===: ' . $e->getMessage());
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // SUBMIT (User Submission for Admin Review)
    // =========================================================================

    public function submit(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            Log::info('=== SUBMIT PROPERTY START ===');

            $rawDetail = $request->input('detail', []);
            $normalizedDetail = $this->normalizeDetailInput($rawDetail);
            $request->merge(['detail' => $normalizedDetail]);

            $baseRules = [
                'title' => 'required|string|max:255',
                'type' => 'required|in:rumah,villa,ruko,kos,tanah', // ✅ VILLA
                'building_type' => 'nullable|string|max:50',
                'listing_type' => 'required|in:jual,sewa',
                'kecamatan' => 'required|string|max:100',
                'city' => 'required|string|max:100',
                'address' => 'nullable|string|max:255',
                'latitude' => 'nullable|numeric|between:-90,90',
                'longitude' => 'nullable|numeric|between:-180,180',
                'price' => 'required|integer|min:0',
                'description' => 'nullable|string',
                'images' => 'required|array|min:1',
                'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:5120',
                'primary_new_index' => 'nullable|integer|min:0',
                'certificate_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
                'electric_bill_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
                'water_bill_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            ];

            $validated = $request->validate(array_merge(
                $baseRules,
                $this->getCertificateRules($request->input('type', 'rumah')),
                $this->getDetailValidationRules($request->input('type', 'rumah'))
            ));

            $property = $request->user()->properties()->create([
                'title' => $validated['title'],
                'slug' => Str::slug($validated['title']) . '-' . Str::random(5),
                'type' => $validated['type'],
                'building_type' => $validated['building_type'] ?? null,
                'listing_type' => $validated['listing_type'],
                'kecamatan' => $validated['kecamatan'],
                'city' => $validated['city'],
                'address' => $validated['address'] ?? null,
                'latitude' => $validated['latitude'] ?? null,
                'longitude' => $validated['longitude'] ?? null,
                'price' => $validated['price'],
                'certificate_type' => $validated['certificate_type'] ?? null,
                'certificate_status' => $validated['certificate_status'] ?? null,
                'status' => 'draft',
                'is_verified' => false, // ⚠️ Perlu approval admin
                'description' => $validated['description'] ?? null,
            ]);

            $detailData = $this->prepareDetailData($validated['detail'], $property->id);
            $property->detail()->create($detailData);

            $primaryNewIndex = $request->input('primary_new_index');
            $this->handleImageUpload($property, $request, 0, $primaryNewIndex, $primaryNewIndex !== null);
            $this->handleDocumentUpload($request, $property, 'certificate_file');
            $this->handleDocumentUpload($request, $property, 'electric_bill_file');
            $this->handleDocumentUpload($request, $property, 'water_bill_file');

            $property->load(['detail', 'images', 'user']);
            $this->appendImageUrls($property);
            $this->appendDocumentUrls($property);
            $this->appendRentPriceInfo($property, $request);

            Log::info('=== SUBMIT PROPERTY SUCCESS ===');
            return response()->json(['message' => 'Pengajuan properti berhasil dikirim', 'property' => $property], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('=== SUBMIT PROPERTY ERROR ===: ' . $e->getMessage());
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // ADMIN: SUBMISSIONS & APPROVAL
    // =========================================================================

    public function submissions(Request $request): \Illuminate\Http\JsonResponse
    {
        if (!$request->user()?->isAdmin()) return response()->json(['message' => 'Unauthorized'], 403);

        $query = Property::with(['user', 'detail', 'images'])
            ->orderBy('is_verified', 'asc')
            ->orderByDesc('created_at');

        $submissions = $query->paginate(20);
        $this->appendImageUrls($submissions);
        $this->appendDocumentUrls($submissions);
        $this->appendRentPriceInfo($submissions, $request);

        return response()->json($submissions);
    }

    public function mySubmissions(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $query = Property::with(['user', 'detail', 'images'])
            ->where('user_id', $user->id)
            ->orderByRaw('CASE WHEN status = "sold" THEN 0 WHEN is_verified = 0 THEN 1 ELSE 2 END')
            ->orderByDesc('created_at');

        $submissions = $query->paginate(20);
        $this->appendImageUrls($submissions);
        $this->appendDocumentUrls($submissions);
        $this->appendRentPriceInfo($submissions, $request);

        return response()->json($submissions);
    }

    public function approveSubmission(Request $request, Property $property): \Illuminate\Http\JsonResponse
    {
        if (!$request->user()?->isAdmin()) return response()->json(['message' => 'Unauthorized'], 403);

        $property->is_verified = true;
        $property->status = 'published';
        $property->save();

        $property->load(['detail', 'images', 'user']);
        $this->appendImageUrls($property);
        $this->appendDocumentUrls($property);
        $this->appendRentPriceInfo($property, $request);

        return response()->json(['message' => 'Pengajuan properti disetujui', 'property' => $property]);
    }

    public function downloadPropertyImage(Request $request, PropertyImage $image): \Symfony\Component\HttpFoundation\Response
    {
        if (!$request->user()?->isAdmin()) abort(403, 'Unauthorized');

        $propertyTitle = $image->property?->title ?? 'gambar-properti';
        $path = $image->getRawOriginal('image_url') ?: $image->image_url;
        $filename = $this->makeDownloadFilename($propertyTitle . '-gambar-' . $image->id, $path);

        return $this->downloadFileResponse($path, $filename);
    }

    public function downloadSubmissionDocument(Request $request, Property $property, string $document): \Symfony\Component\HttpFoundation\Response
    {
        if (!$request->user()?->isAdmin()) abort(403, 'Unauthorized');

        $documents = [
            'certificate' => ['field' => 'certificate_file', 'label' => 'sertifikat'],
            'electric-bill' => ['field' => 'electric_bill_file', 'label' => 'tagihan-listrik'],
            'water-bill' => ['field' => 'water_bill_file', 'label' => 'tagihan-air'],
        ];

        abort_unless(isset($documents[$document]), 404, 'Dokumen tidak ditemukan.');

        $field = $documents[$document]['field'];
        $label = $documents[$document]['label'];
        $path = $property->{$field};
        $filename = $this->makeDownloadFilename($property->title . '-' . $label, $path);

        return $this->downloadFileResponse($path, $filename);
    }

    // =========================================================================
    // DELETE
    // =========================================================================

    public function destroy(Request $request, Property $property): \Illuminate\Http\JsonResponse
    {
        try {
            if (!$request->user()->isAdmin() && $property->user_id !== $request->user()->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            Log::info('=== DELETE PROPERTY START === ID: ' . $property->id);

            foreach ($property->images as $image) {
                if (Storage::disk('s3')->exists($image->image_url)) {
                    Storage::disk('s3')->delete($image->image_url);
                }
            }

            $propertyId = $property->id;
            $property->delete();

            Log::info('=== DELETE PROPERTY SUCCESS === ID: ' . $propertyId);
            return response()->json(['message' => 'Property deleted successfully']);

        } catch (\Exception $e) {
            Log::error('=== DELETE PROPERTY ERROR ===: ' . $e->getMessage());
            return response()->json(['message' => 'Server error: ' . $e->getMessage()], 500);
        }
    }

    public function deleteImage(Request $request, PropertyImage $image): \Illuminate\Http\JsonResponse
    {
        try {
            if (!$request->user()->isAdmin() && $image->property->user_id !== $request->user()->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            if (Storage::disk('s3')->exists($image->image_url)) {
                Storage::disk('s3')->delete($image->image_url);
            }

            $imageId = $image->id;
            $image->delete();

            Log::info('Image deleted from R2: ' . $imageId);
            return response()->json(['message' => 'Image deleted successfully']);

        } catch (\Exception $e) {
            Log::error('Failed to delete image: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to delete image'], 500);
        }
    }

    // =========================================================================
    // PRIVATE HELPERS: UPLOADS
    // =========================================================================

    private function handleImageUpload(Property $property, Request $request, int $startIndex = 0, ?int $primaryNewIndex = null, bool $forcePrimary = false): int
    {
        if (!$request->hasFile('images')) return 0;

        $images = $request->file('images');
        if (!is_array($images)) $images = [$images];
        $images = array_filter($images, fn($img) => $img !== null && $img instanceof \Illuminate\Http\UploadedFile);
        if (count($images) === 0) return 0;

        Log::info('Uploading ' . count($images) . ' images to R2 for property #' . $property->id);

        $successCount = 0;
        $hasPrimary = $property->images()->where('is_primary', true)->exists();
        if ($forcePrimary) $hasPrimary = false;

        foreach ($images as $index => $image) {
            try {
                if (!$image->isValid()) {
                    Log::error('Invalid file: ' . $image->getClientOriginalName());
                    continue;
                }

                $filename = time() . '_' . Str::random(10) . '.' . $image->getClientOriginalExtension();
                $r2Path = 'properties/' . $filename;
                $uploaded = Storage::disk('s3')->put($r2Path, file_get_contents($image->getRealPath()), 'public');

                if (!$uploaded) {
                    Log::error('R2 upload failed for: ' . $filename);
                    continue;
                }

                $isPrimary = $primaryNewIndex !== null ? $index === (int) $primaryNewIndex : (!$hasPrimary && $index === 0);
                $imageRecord = $property->images()->create(['image_url' => $r2Path, 'is_primary' => $isPrimary]);

                if ($isPrimary) $hasPrimary = true;
                Log::info('Image record created! ID: ' . $imageRecord->id . ' | R2 Path: ' . $r2Path);
                $successCount++;
                $hasPrimary = true;

            } catch (\Illuminate\Database\QueryException $qe) {
                Log::error('DATABASE QUERY ERROR: ' . $qe->getMessage());
                Log::error('SQL: ' . $qe->getSql());
                Log::error('Bindings: ' . json_encode($qe->getBindings()));
                if (app()->environment('local')) throw $qe;
            } catch (\Exception $e) {
                Log::error('GENERAL ERROR: ' . $e->getMessage());
                Log::error('Trace: ' . $e->getTraceAsString());
                if (app()->environment('local')) throw $e;
            }
        }

        Log::info('R2 Upload completed: ' . $successCount . '/' . count($images) . ' images saved');
        return $successCount;
    }

    private function handleDocumentUpload(Request $request, Property $property, string $field): void
    {
        if (!$request->hasFile($field)) return;

        $file = $request->file($field);
        if (!$file || !$file->isValid()) return;

        $filename = time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
        $r2Path = 'property-docs/' . $filename;
        $uploaded = Storage::disk('s3')->put($r2Path, file_get_contents($file->getRealPath()), 'private');

        if (!$uploaded) {
            Log::error('R2 upload failed for doc: ' . $filename);
            return;
        }

        if ($property->{$field} && Storage::disk('s3')->exists($property->{$field})) {
            Storage::disk('s3')->delete($property->{$field});
        }

        $property->{$field} = $r2Path;
        $property->save();
    }
    public function updateSubmission(Request $request, int $id): \Illuminate\Http\JsonResponse
{
    try {
        Log::info('=== UPDATE SUBMISSION START === ID: ' . $id);

        $property = Property::where('id', $id)
            ->where('user_id', $request->user()->id)  // ✅ konsisten dengan method lain
            ->where('is_verified', false)
            ->where('status', '!=', 'sold')
            ->firstOrFail();

        $validated = $request->validate([
            'title'              => 'sometimes|required|string|max:255',
            'price'              => 'sometimes|required|integer|min:0',
            'description'        => 'nullable|string',
            'kecamatan'          => 'sometimes|required|string|max:100',
            'city'               => 'sometimes|required|string|max:100',
            'address'            => 'nullable|string|max:255',
            'certificate_type'   => 'nullable|in:SHM,SHGB',
            'certificate_status' => 'nullable|in:lunas,bank',
            'rent_period'        => 'nullable|string',
            'images'             => 'nullable|array',
            'images.*'           => 'image|mimes:jpeg,png,jpg,gif|max:5120',
            'primary_new_index'  => 'nullable|integer|min:0',
        ]);

        // ✅ Update field yang diizinkan
        $updatable = [
            'title', 'price', 'description', 'kecamatan',
            'city', 'address', 'certificate_type',
            'certificate_status', 'rent_period',
        ];
        foreach ($updatable as $field) {
            if (array_key_exists($field, $validated)) {
                $property->{$field} = $validated[$field];
            }
        }
        $property->save();

        // ✅ Upload gambar baru ke R2 seperti method lain
        $primaryNewIndex = $request->input('primary_new_index');
        $this->handleImageUpload(
            $property,
            $request,
            $property->images()->count(),
            $primaryNewIndex,
            $primaryNewIndex !== null
        );

        $property->load(['detail', 'images', 'user']);
        $this->appendImageUrls($property);
        $this->appendRentPriceInfo($property, $request);

        Log::info('=== UPDATE SUBMISSION SUCCESS === ID: ' . $id);
        return response()->json([
            'message' => 'Pengajuan berhasil diperbarui.',
            'data'    => $property,
        ]);

    } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
        return response()->json([
            'message' => 'Pengajuan tidak ditemukan atau tidak dapat diedit.',
        ], 404);
    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json([
            'message' => 'Validasi gagal.',
            'errors'  => $e->errors(),
        ], 422);
    } catch (\Exception $e) {
        Log::error('=== UPDATE SUBMISSION ERROR ===: ' . $e->getMessage());
        return response()->json([
            'message' => 'Server error: ' . $e->getMessage(),
        ], 500);
    }
}
}
