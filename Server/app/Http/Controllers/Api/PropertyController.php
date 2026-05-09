<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\PropertyImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class PropertyController extends Controller
{
    /**
     * Helper: Trigger accessor full_url untuk semua images
     */
    private function appendImageUrls(Property|Collection|LengthAwarePaginator $data): Property|Collection|LengthAwarePaginator
    {
        if ($data instanceof LengthAwarePaginator) {
            $data->getCollection()->transform(function($property) {
                if ($property->relationLoaded('images')) {
                    $property->images->each(function($image) {
                        // Force trigger accessor dengan mengakses full_url
                        $image->full_url;
                    });
                }
                return $property;
            });
        } elseif ($data instanceof Collection) {
            $data->each(function($property) {
                if ($property->relationLoaded('images')) {
                    $property->images->each(function($image) {
                        $image->full_url;
                    });
                }
            });
        } elseif ($data instanceof Property) {
            if ($data->relationLoaded('images')) {
                $data->images->each(function($image) {
                    $image->full_url;
                });
            }
        }
        return $data;
    }

    /**
     * Helper: Build full URL for R2 files
     */
    private function buildR2Url(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        $accountId = 'a0eea8f875e1416b9ea4a5c4a1cea45e';
        return "https://pub-{$accountId}.r2.dev/{$path}";
    }

    /**
     * Helper: Append document URLs for admin/user views
     */
    private function appendDocumentUrls(Property|Collection|LengthAwarePaginator $data): Property|Collection|LengthAwarePaginator
    {
        $apply = function (Property $property) {
            $property->setAttribute('certificate_file_url', $this->buildR2Url($property->certificate_file));
            $property->setAttribute('electric_bill_file_url', $this->buildR2Url($property->electric_bill_file));
            $property->setAttribute('water_bill_file_url', $this->buildR2Url($property->water_bill_file));
        };

        if ($data instanceof LengthAwarePaginator) {
            $data->getCollection()->each($apply);
        } elseif ($data instanceof Collection) {
            $data->each($apply);
        } elseif ($data instanceof Property) {
            $apply($data);
        }

        return $data;
    }

    /**
     * Helper: Remove private fields for public responses
     */
    private function stripPrivateFields(Property|Collection|LengthAwarePaginator $data): Property|Collection|LengthAwarePaginator
    {
        $hidden = ['certificate_file', 'electric_bill_file', 'water_bill_file', 'is_verified'];

        $apply = function (Property $property) use ($hidden) {
            $property->makeHidden($hidden);
        };

        if ($data instanceof LengthAwarePaginator) {
            $data->getCollection()->each($apply);
        } elseif ($data instanceof Collection) {
            $data->each($apply);
        } elseif ($data instanceof Property) {
            $apply($data);
        }

        return $data;
    }

    /**
     * Apply sort order to query
     */
    private function applySortOrder(Builder $query, Request $request): Builder
    {
        $sortOrder = strtolower((string) $request->input('sort_order', 'desc'));
        if (in_array($sortOrder, ['asc', 'oldest', 'terlama'], true)) {
            return $query->orderBy('created_at', 'asc');
        }
        return $query->latest();
    }

    private function normalizeRecommendationValue(float $value, float $min, float $max): float
    {
        if ($max <= $min) {
            return 0.5;
        }

        return max(0, min(1, ($value - $min) / ($max - $min)));
    }

    private function getRecommendationFacilityValue(Property $property): float
    {
        $detail = $property->detail;

        if (!$detail) {
            return 0;
        }

        return (
            (float) ($detail->bedrooms ?? 0) * 1.0
            + (float) ($detail->bathrooms ?? 0) * 0.85
            + (float) ($detail->living_rooms ?? 0) * 0.65
            + (float) ($detail->kitchens ?? 0) * 0.8
            + (float) ($detail->floors ?? 0) * 0.45
            + ((bool) $detail->carport ? 1 : 0) * 0.7
            + ((bool) $detail->garden ? 1 : 0) * 0.55
            + ((bool) $detail->one_gate_system ? 1 : 0) * 0.75
            + ((bool) $detail->security_24jam ? 1 : 0) * 0.8
        );
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

        $score =
            $priceScore * ($weights['price'] / 100)
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
            ],
        ];
    }

    /**
     * Display a recommendation listing of properties (Public)
     */
    public function recommendations(Request $request): \Illuminate\Http\JsonResponse
    {
        $query = Property::with(['user', 'detail', 'images']);

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
            $query->where(function($q) use ($request) {
                $q->where('title', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%")
                  ->orWhere('kecamatan', 'like', "%{$request->search}%");
            });
        }
        if ($request->filled('kecamatan')) {
            $query->where('kecamatan', 'like', "%{$request->kecamatan}%");
        }
        if ($request->filled('bedrooms')) {
            $query->whereHas('detail', function($q) use ($request) {
                $q->where('bedrooms', '>=', (int) $request->bedrooms);
            });
        }
        if ($request->filled('bathrooms')) {
            $query->whereHas('detail', function($q) use ($request) {
                $q->where('bathrooms', '>=', (int) $request->bathrooms);
            });
        }
        if ($request->filled('living_rooms')) {
            $query->whereHas('detail', function($q) use ($request) {
                $q->where('living_rooms', '>=', (int) $request->living_rooms);
            });
        }
        if ($request->filled('kitchens')) {
            $query->whereHas('detail', function($q) use ($request) {
                $q->where('kitchens', '>=', (int) $request->kitchens);
            });
        }
        if ($request->filled('floors')) {
            $query->whereHas('detail', function($q) use ($request) {
                $q->where('floors', '>=', (int) $request->floors);
            });
        }
        if ($request->filled('certificate_type')) {
            $query->where('certificate_type', $request->certificate_type);
        }
        if ($request->filled('water')) {
            $query->whereHas('detail', function($q) use ($request) {
                $q->where('water', $request->water);
            });
        }
        if ($request->filled('listrik_type')) {
            $query->whereHas('detail', function($q) use ($request) {
                $q->where('listrik_type', $request->listrik_type);
            });
        }
        if ($request->filled('amenities')) {
            $amenities = explode(',', $request->amenities);
            foreach ($amenities as $amenity) {
                $amenity = trim($amenity);
                if (!empty($amenity)) {
                    $query->whereHas('detail', function($q) use ($amenity) {
                        $q->where($amenity, true);
                    });
                }
            }
        }

        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            $query->where('status', 'published')->where('is_verified', true);
        }

        $properties = $query->get();

        $weights = [
            'price' => max(0, (float) $request->input('price_weight', 35)),
            'location' => max(0, (float) $request->input('location_weight', 30)),
            'area' => max(0, (float) $request->input('area_weight', 20)),
            'facilities' => max(0, (float) $request->input('facilities_weight', 15)),
        ];

        $totalWeight = array_sum($weights);
        if ($totalWeight <= 0) {
            $weights = [
                'price' => 25,
                'location' => 25,
                'area' => 25,
                'facilities' => 25,
            ];
        } else {
            foreach ($weights as $key => $value) {
                $weights[$key] = ($value / $totalWeight) * 100;
            }
        }

        if ($properties->isEmpty()) {
            $perPage = (int) $request->input('per_page', 8);
            $page = LengthAwarePaginator::resolveCurrentPage();
            $emptyPaginator = new LengthAwarePaginator([], 0, $perPage, $page, [
                'path' => $request->url(),
                'query' => $request->query(),
            ]);

            return response()->json($emptyPaginator);
        }

        $prices = $properties->map(fn (Property $property) => (float) ($property->price ?? 0));
        $areas = $properties->map(fn (Property $property) => (float) ($property->detail?->luas_bangunan ?? $property->detail?->luas_tanah ?? 0));
        $facilities = $properties->map(fn (Property $property) => $this->getRecommendationFacilityValue($property));
        $locationCounts = $properties->groupBy(fn (Property $property) => $this->getRecommendationLocationKey($property))->map->count();

        $stats = [
            'min_price' => (float) $prices->min(),
            'max_price' => (float) $prices->max(),
            'min_area' => (float) $areas->min(),
            'max_area' => (float) $areas->max(),
            'min_facility' => (float) $facilities->min(),
            'max_facility' => (float) $facilities->max(),
            'min_location_count' => (float) $locationCounts->min(),
            'max_location_count' => (float) $locationCounts->max(),
            'location_counts' => $locationCounts->all(),
        ];

        $sorted = $properties->map(function (Property $property) use ($stats, $weights) {
            $result = $this->calculateRecommendationScore($property, $stats, $weights);
            $property->setAttribute('recommendation_score', round($result['score'], 6));
            $property->setAttribute('recommendation_detail', $result['detail']);
            return $property;
        })->sortByDesc('recommendation_score')->values();

        $perPage = (int) $request->input('per_page', 8);
        $page = LengthAwarePaginator::resolveCurrentPage();
        $items = $sorted->forPage($page, $perPage)->values();

        $paginator = new LengthAwarePaginator($items, $sorted->count(), $perPage, $page, [
            'path' => $request->url(),
            'query' => $request->query(),
        ]);

        $this->appendImageUrls($paginator);

        if (!$user || !$user->isAdmin()) {
            $this->stripPrivateFields($paginator);
        }

        return response()->json($paginator);
    }

    /**
     * Display a listing of properties (Public)
     * ✅ FIX: Handle ALL filter fields from frontend
     */
    public function index(Request $request): \Illuminate\Http\JsonResponse
    {
        $query = Property::with(['user', 'detail', 'images']);

        // ====== BASIC FILTERS ======
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
            $query->where(function($q) use ($request) {
                $q->where('title', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%")
                  ->orWhere('kecamatan', 'like', "%{$request->search}%");
            });
        }

        // ====== ADVANCED FILTERS FROM SIDEBAR ======

        // Kecamatan
        if ($request->filled('kecamatan')) {
            $query->where('kecamatan', 'like', "%{$request->kecamatan}%");
        }

        // Filter via property_details table
        if ($request->filled('bedrooms')) {
            $query->whereHas('detail', function($q) use ($request) {
                $q->where('bedrooms', '>=', (int) $request->bedrooms);
            });
        }

        if ($request->filled('bathrooms')) {
            $query->whereHas('detail', function($q) use ($request) {
                $q->where('bathrooms', '>=', (int) $request->bathrooms);
            });
        }

        if ($request->filled('living_rooms')) {
            $query->whereHas('detail', function($q) use ($request) {
                $q->where('living_rooms', '>=', (int) $request->living_rooms);
            });
        }

        if ($request->filled('kitchens')) {
            $query->whereHas('detail', function($q) use ($request) {
                $q->where('kitchens', '>=', (int) $request->kitchens);
            });
        }

        if ($request->filled('floors')) {
            $query->whereHas('detail', function($q) use ($request) {
                $q->where('floors', '>=', (int) $request->floors);
            });
        }

        // Certificate type (di properties table)
        if ($request->filled('certificate_type')) {
            $query->where('certificate_type', $request->certificate_type);
        }

        // Water source (di property_details)
        if ($request->filled('water')) {
            $query->whereHas('detail', function($q) use ($request) {
                $q->where('water', $request->water);
            });
        }

        // Listrik type (di property_details)
        if ($request->filled('listrik_type')) {
            $query->whereHas('detail', function($q) use ($request) {
                $q->where('listrik_type', $request->listrik_type);
            });
        }

        // ✅ Amenities checkboxes (di property_details)
        if ($request->filled('amenities')) {
            $amenities = explode(',', $request->amenities);
            foreach ($amenities as $amenity) {
                $amenity = trim($amenity);
                if (!empty($amenity)) {
                    $query->whereHas('detail', function($q) use ($amenity) {
                        // Handle boolean amenities: carport, garden, dll
                        $q->where($amenity, true);
                    });
                }
            }
        }

        // Filter status: hanya published untuk non-admin
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            $query->where('status', 'published')->where('is_verified', true);
        }

        $per_page = $request->input('per_page', 12);
        $properties = $this->applySortOrder($query, $request)->paginate($per_page);

        // ✅ TRIGGER ACCESSOR untuk full_url
        $this->appendImageUrls($properties);

        if (!$user || !$user->isAdmin()) {
            $this->stripPrivateFields($properties);
        }

        return response()->json($properties);
    }

    /**
     * Admin index
     */
    public function adminIndex(Request $request): \Illuminate\Http\JsonResponse
    {
        if (!$request->user()?->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Property::with(['user', 'detail', 'images']);

        // Basic filters
        if ($request->filled('type')) $query->where('type', $request->type);
        if ($request->filled('listing_type')) $query->where('listing_type', $request->listing_type);
        if ($request->filled('city')) $query->where('city', $request->city);
        if ($request->filled('min_price')) $query->where('price', '>=', (int) $request->min_price);
        if ($request->filled('max_price')) $query->where('price', '<=', (int) $request->max_price);
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('title', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%")
                  ->orWhere('kecamatan', 'like', "%{$request->search}%");
            });
        }

        // ✅ Advanced filters (sama seperti public index)
        if ($request->filled('kecamatan')) {
            $query->where('kecamatan', 'like', "%{$request->kecamatan}%");
        }
        if ($request->filled('bedrooms')) {
            $query->whereHas('detail', function($q) use ($request) {
                $q->where('bedrooms', '>=', (int) $request->bedrooms);
            });
        }
        if ($request->filled('bathrooms')) {
            $query->whereHas('detail', function($q) use ($request) {
                $q->where('bathrooms', '>=', (int) $request->bathrooms);
            });
        }
        if ($request->filled('living_rooms')) {
            $query->whereHas('detail', function($q) use ($request) {
                $q->where('living_rooms', '>=', (int) $request->living_rooms);
            });
        }
        if ($request->filled('kitchens')) {
            $query->whereHas('detail', function($q) use ($request) {
                $q->where('kitchens', '>=', (int) $request->kitchens);
            });
        }
        if ($request->filled('floors')) {
            $query->whereHas('detail', function($q) use ($request) {
                $q->where('floors', '>=', (int) $request->floors);
            });
        }
        if ($request->filled('certificate_type')) {
            $query->where('certificate_type', $request->certificate_type);
        }
        if ($request->filled('water')) {
            $query->whereHas('detail', function($q) use ($request) {
                $q->where('water', $request->water);
            });
        }
        if ($request->filled('listrik_type')) {
            $query->whereHas('detail', function($q) use ($request) {
                $q->where('listrik_type', $request->listrik_type);
            });
        }
        if ($request->filled('amenities')) {
            $amenities = explode(',', $request->amenities);
            foreach ($amenities as $amenity) {
                $amenity = trim($amenity);
                if (!empty($amenity)) {
                    $query->whereHas('detail', function($q) use ($amenity) {
                        $q->where($amenity, true);
                    });
                }
            }
        }

        $per_page = $request->input('per_page', 12);
        $properties = $this->applySortOrder($query, $request)->paginate($per_page);
        $this->appendImageUrls($properties);

        return response()->json($properties);
    }

    /**
     * Display the specified property (Public)
     */
    public function show(string $slug): \Illuminate\Http\JsonResponse
    {
        $property = Property::with(['user', 'detail', 'images'])
            ->where('slug', $slug)
            ->firstOrFail();

        $this->appendImageUrls($property);

        if (!request()->user()?->isAdmin()) {
            if ($property->status !== 'published' || !$property->is_verified) {
                return response()->json(['message' => 'Not found'], 404);
            }
            $this->stripPrivateFields($property);
        } else {
            $this->appendDocumentUrls($property);
        }

        if (!request()->user()?->isAdmin()) {
            $property->increment('views');
        }

        return response()->json($property);
    }

    /**
     * Store a newly created property (Admin Only)
     */
    public function store(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            Log::info('=== CREATE PROPERTY START ===');
            Log::info('User ID: ' . $request->user()->id);

            // Pre-process: Normalize detail input
            $rawDetail = $request->input('detail', []);
            $normalizedDetail = $this->normalizeDetailInput($rawDetail);
            $request->merge(['detail' => $normalizedDetail]);

            // Validation
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'type' => 'required|in:rumah,perumahan,ruko,kos,tanah',
                'building_type' => 'nullable|integer|min:0',
                'listing_type' => 'required|in:jual,sewa',
                'kecamatan' => 'required|string|max:100',
                'city' => 'required|string|max:100',
                'price' => 'required|integer|min:0',
                'certificate_type' => 'required|in:SHM,SHGB',
                'certificate_status' => 'nullable|in:lunas,bank',
                'certificate_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
                'electric_bill_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
                'water_bill_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
                'status' => 'nullable|in:draft,published,sold',
                'description' => 'nullable|string',
                'detail' => 'required|array',
                'detail.luas_tanah' => 'required|integer|min:0',
                'detail.luas_bangunan' => 'nullable|integer|min:0',
                'detail.bedrooms' => 'nullable|integer|min:0',
                'detail.bathrooms' => 'nullable|integer|min:0',
                'detail.floors' => 'nullable|integer|min:0',
                'detail.kitchens' => 'nullable|integer|min:0',
                'detail.living_rooms' => 'nullable|integer|min:0',
                'detail.electricity_capacity' => 'nullable|integer|min:0',
                'detail.carport' => 'nullable|boolean',
                'detail.garden' => 'nullable|boolean',
                'detail.one_gate_system' => 'nullable|boolean',
                'detail.security_24jam' => 'nullable|boolean',
                'detail.water' => 'nullable|in:pdam,sumur',
                'detail.listrik_type' => 'nullable|in:overground,underground',
                'detail.wifi_provider' => 'nullable|string|max:255',
                'images' => 'nullable',
                'primary_new_index' => 'nullable|integer|min:0',
            ]);

            Log::info('Validation passed');

            // Create Property
            $property = $request->user()->properties()->create([
                'title' => $validated['title'],
                'slug' => Str::slug($validated['title']) . '-' . Str::random(5),
                'type' => $validated['type'],
                'building_type' => $validated['building_type'] ?? null,
                'listing_type' => $validated['listing_type'],
                'kecamatan' => $validated['kecamatan'],
                'city' => $validated['city'],
                'price' => $validated['price'],
                'certificate_type' => $validated['certificate_type'],
                'certificate_status' => $validated['certificate_status'] ?? 'lunas',
                'status' => $validated['status'] ?? 'draft',
                'is_verified' => true,
                'description' => $validated['description'] ?? null,
            ]);

            Log::info('Property created with ID: ' . $property->id);

            // Create Property Detail
            $detailData = $this->prepareDetailData($validated['detail'], $property->id);
            $property->detail()->create($detailData);

            Log::info('Property detail created');

            // ✅ Upload Images ke Cloudflare R2
            $primaryNewIndex = $request->input('primary_new_index');
            $uploadedCount = $this->handleImageUpload(
                $property,
                $request,
                0,
                $primaryNewIndex,
                $primaryNewIndex !== null
            );

            $this->handleDocumentUpload($request, $property, 'certificate_file');
            $this->handleDocumentUpload($request, $property, 'electric_bill_file');
            $this->handleDocumentUpload($request, $property, 'water_bill_file');

            if ($uploadedCount === 0 && $request->hasFile('images')) {
                Log::warning('⚠️ Images uploaded to R2 but NOT saved to database! Count: 0');
            }

            // Load relationships
            $property->load(['detail', 'images', 'user']);

            // ✅ TRIGGER ACCESSOR untuk full_url sebelum return
            $this->appendImageUrls($property);
            $this->appendDocumentUrls($property);

            Log::info('=== CREATE PROPERTY SUCCESS ===');

            return response()->json([
                'message' => 'Property created successfully',
                'property' => $property
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Validation failed: ' . json_encode($e->errors()));
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            Log::error('=== CREATE PROPERTY ERROR ===');
            Log::error('Message: ' . $e->getMessage());
            Log::error('File: ' . $e->getFile() . ':' . $e->getLine());
            Log::error('Trace: ' . $e->getTraceAsString());

            return response()->json([
                'message' => 'Server error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update the specified property (Admin Only)
     */
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

            $validated = $request->validate([
                'title' => 'sometimes|required|string|max:255',
                'type' => 'sometimes|required|in:rumah,perumahan,ruko,kos,tanah',
                'building_type' => 'nullable|integer|min:0',
                'listing_type' => 'sometimes|required|in:jual,sewa',
                'kecamatan' => 'sometimes|required|string|max:100',
                'city' => 'sometimes|required|string|max:100',
                'price' => 'sometimes|required|integer|min:0',
                'certificate_type' => 'sometimes|required|in:SHM,SHGB',
                'certificate_status' => 'nullable|in:lunas,bank',
                'certificate_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
                'electric_bill_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
                'water_bill_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
                'status' => 'sometimes|required|in:draft,published,sold',
                'is_verified' => 'nullable|boolean',
                'description' => 'nullable|string',
                'detail' => 'nullable|array',
                'detail.luas_tanah' => 'nullable|integer|min:0',
                'detail.luas_bangunan' => 'nullable|integer|min:0',
                'detail.bedrooms' => 'nullable|integer|min:0',
                'detail.bathrooms' => 'nullable|integer|min:0',
                'detail.floors' => 'nullable|integer|min:0',
                'detail.kitchens' => 'nullable|integer|min:0',
                'detail.living_rooms' => 'nullable|integer|min:0',
                'detail.electricity_capacity' => 'nullable|integer|min:0',
                'detail.carport' => 'nullable|boolean',
                'detail.garden' => 'nullable|boolean',
                'detail.one_gate_system' => 'nullable|boolean',
                'detail.security_24jam' => 'nullable|boolean',
                'detail.water' => 'nullable|in:pdam,sumur',
                'detail.listrik_type' => 'nullable|in:overground,underground',
                'detail.wifi_provider' => 'nullable|string|max:255',
                'images_to_delete' => 'nullable|array',
                'images_to_delete.*' => 'integer|exists:property_images,id',
                'images' => 'nullable|array',
                'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:5120',
                'primary_image_id' => 'nullable|integer|exists:property_images,id',
                'primary_new_index' => 'nullable|integer|min:0',
            ]);

            // Update main property fields
            $updatableFields = [
                'title', 'type', 'building_type', 'listing_type',
                'kecamatan', 'city', 'price', 'certificate_type',
                'certificate_status', 'status', 'description'
            ];

            foreach ($updatableFields as $field) {
                if (isset($validated[$field])) {
                    $property->{$field} = $validated[$field];
                }
            }

            if ($request->user()->isAdmin() && array_key_exists('is_verified', $validated)) {
                $property->is_verified = (bool) $validated['is_verified'];
            }

            if (isset($validated['title'])) {
                $property->slug = Str::slug($validated['title']) . '-' . Str::random(5);
            }

            $property->save();

            if ($request->filled('primary_image_id')) {
                $primaryImage = $property->images()
                    ->where('id', $request->primary_image_id)
                    ->first();

                if (!$primaryImage) {
                    return response()->json([
                        'message' => 'Primary image not found for this property',
                    ], 422);
                }

                $property->images()->update(['is_primary' => false]);
                $primaryImage->update(['is_primary' => true]);
            }

            // Update detail
            if (isset($validated['detail'])) {
                $detailData = $this->prepareDetailData($validated['detail'], $property->id);
                $property->detail()->updateOrCreate(
                    ['property_id' => $property->id],
                    $detailData
                );
            }

            // ✅ Delete selected images dari R2
            if (!empty($validated['images_to_delete'])) {
                $imagesToDelete = $property->images()
                    ->whereIn('id', $validated['images_to_delete'])
                    ->get();

                foreach ($imagesToDelete as $image) {
                    if (Storage::disk('s3')->exists($image->image_url)) {
                        Storage::disk('s3')->delete($image->image_url);
                    }
                    $image->delete();
                    Log::info('Image deleted from R2: ' . $image->id);
                }
            }

            // ✅ Handle new images upload ke R2
            $primaryNewIndex = $request->input('primary_new_index');
            if ($primaryNewIndex !== null) {
                $property->images()->update(['is_primary' => false]);
            }

            $uploadedCount = $this->handleImageUpload(
                $property,
                $request,
                $property->images()->count(),
                $primaryNewIndex,
                $primaryNewIndex !== null
            );

            if ($request->user()->isAdmin()) {
                $this->handleDocumentUpload($request, $property, 'certificate_file');
                $this->handleDocumentUpload($request, $property, 'electric_bill_file');
                $this->handleDocumentUpload($request, $property, 'water_bill_file');
            }

            if ($uploadedCount === 0 && $request->hasFile('images')) {
                Log::warning('⚠️ Update: Images uploaded to R2 but NOT saved to database!');
            }

            // Load relationships
            $property->load(['detail', 'images', 'user']);

            // ✅ TRIGGER ACCESSOR untuk full_url sebelum return
            $this->appendImageUrls($property);
            $this->appendDocumentUrls($property);

            Log::info('=== UPDATE PROPERTY SUCCESS ===');

            return response()->json([
                'message' => 'Property updated successfully',
                'property' => $property
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Validation failed: ' . json_encode($e->errors()));
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            Log::error('=== UPDATE PROPERTY ERROR ===: ' . $e->getMessage());
            return response()->json([
                'message' => 'Server error: ' . $e->getMessage(),
            ], 500);
        }

        Log::info($request->all());
        Log::info('FILES:', $request->allFiles());
    }

    /**
     * Submit a property (User)
     */
    public function submit(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            Log::info('=== SUBMIT PROPERTY START ===');

            $rawDetail = $request->input('detail', []);
            $normalizedDetail = $this->normalizeDetailInput($rawDetail);
            $request->merge(['detail' => $normalizedDetail]);

            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'type' => 'required|in:rumah,perumahan,ruko,kos,tanah',
                'building_type' => 'nullable|integer|min:0',
                'listing_type' => 'required|in:jual,sewa',
                'kecamatan' => 'required|string|max:100',
                'city' => 'required|string|max:100',
                'price' => 'required|integer|min:0',
                'certificate_type' => 'required|in:SHM,SHGB',
                'certificate_status' => 'nullable|in:lunas,bank',
                'description' => 'nullable|string',
                'detail' => 'required|array',
                'detail.luas_tanah' => 'required|integer|min:0',
                'detail.luas_bangunan' => 'nullable|integer|min:0',
                'detail.bedrooms' => 'nullable|integer|min:0',
                'detail.bathrooms' => 'nullable|integer|min:0',
                'detail.floors' => 'nullable|integer|min:0',
                'detail.kitchens' => 'nullable|integer|min:0',
                'detail.living_rooms' => 'nullable|integer|min:0',
                'detail.electricity_capacity' => 'nullable|integer|min:0',
                'detail.carport' => 'nullable|boolean',
                'detail.garden' => 'nullable|boolean',
                'detail.one_gate_system' => 'nullable|boolean',
                'detail.security_24jam' => 'nullable|boolean',
                'detail.water' => 'nullable|in:pdam,sumur',
                'detail.listrik_type' => 'nullable|in:overground,underground',
                'detail.wifi_provider' => 'nullable|string|max:255',
                'images' => 'required|array|min:1',
                'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:5120',
                'primary_new_index' => 'nullable|integer|min:0',
                'certificate_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
                'electric_bill_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
                'water_bill_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            ]);

            $property = $request->user()->properties()->create([
                'title' => $validated['title'],
                'slug' => Str::slug($validated['title']) . '-' . Str::random(5),
                'type' => $validated['type'],
                'building_type' => $validated['building_type'] ?? null,
                'listing_type' => $validated['listing_type'],
                'kecamatan' => $validated['kecamatan'],
                'city' => $validated['city'],
                'price' => $validated['price'],
                'certificate_type' => $validated['certificate_type'],
                'certificate_status' => $validated['certificate_status'] ?? 'lunas',
                'status' => 'draft',
                'is_verified' => false,
                'description' => $validated['description'] ?? null,
            ]);

            $detailData = $this->prepareDetailData($validated['detail'], $property->id);
            $property->detail()->create($detailData);

            $primaryNewIndex = $request->input('primary_new_index');
            $this->handleImageUpload(
                $property,
                $request,
                0,
                $primaryNewIndex,
                $primaryNewIndex !== null
            );

            $this->handleDocumentUpload($request, $property, 'certificate_file');
            $this->handleDocumentUpload($request, $property, 'electric_bill_file');
            $this->handleDocumentUpload($request, $property, 'water_bill_file');

            $property->load(['detail', 'images', 'user']);
            $this->appendImageUrls($property);
            $this->appendDocumentUrls($property);

            Log::info('=== SUBMIT PROPERTY SUCCESS ===');

            return response()->json([
                'message' => 'Pengajuan properti berhasil dikirim',
                'property' => $property,
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('=== SUBMIT PROPERTY ERROR ===: ' . $e->getMessage());
            return response()->json([
                'message' => 'Server error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Admin: list pending property submissions
     */
    public function submissions(Request $request): \Illuminate\Http\JsonResponse
    {
        if (!$request->user()?->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Property::with(['user', 'detail', 'images'])
            ->where('is_verified', false)
            ->orderByDesc('created_at');

        $submissions = $query->paginate(20);
        $this->appendImageUrls($submissions);
        $this->appendDocumentUrls($submissions);

        return response()->json($submissions);
    }

    /**
     * Admin: approve submission
     */
    public function approveSubmission(Request $request, Property $property): \Illuminate\Http\JsonResponse
    {
        if (!$request->user()?->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $property->is_verified = true;
        $property->status = 'published';
        $property->save();

        $property->load(['detail', 'images', 'user']);
        $this->appendImageUrls($property);
        $this->appendDocumentUrls($property);

        return response()->json([
            'message' => 'Pengajuan properti disetujui',
            'property' => $property,
        ]);
    }

    /**
     * Remove the specified property (Admin Only)
     */
    public function destroy(Request $request, Property $property): \Illuminate\Http\JsonResponse
    {
        try {
            if (!$request->user()->isAdmin() && $property->user_id !== $request->user()->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            Log::info('=== DELETE PROPERTY START === ID: ' . $property->id);

            // ✅ Delete all images dari Cloudflare R2
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
            return response()->json([
                'message' => 'Server error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete specific image from property
     */
    public function deleteImage(Request $request, PropertyImage $image): \Illuminate\Http\JsonResponse
    {
        try {
            if (!$request->user()->isAdmin() && $image->property->user_id !== $request->user()->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // ✅ HAPUS FILE DARI CLOUDFLARE R2
            if (Storage::disk('s3')->exists($image->image_url)) {
                Storage::disk('s3')->delete($image->image_url);
            }

            $imageId = $image->id;
            $image->delete();

            Log::info('Image deleted from R2: ' . $imageId);

            return response()->json(['message' => 'Image deleted successfully']);

        } catch (\Exception $e) {
            Log::error('Failed to delete image: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete image',
            ], 500);
        }
    }

    /**
     * ✅ HANDLE IMAGE UPLOAD KE CLOUDFLARE R2
     */
    private function handleImageUpload(
        Property $property,
        Request $request,
        int $startIndex = 0,
        ?int $primaryNewIndex = null,
        bool $forcePrimary = false
    ): int
    {
        if (!$request->hasFile('images')) {
            return 0;
        }

        $images = $request->file('images');
        if (!is_array($images)) {
            $images = [$images];
        }

        $images = array_filter($images, fn($img) => $img !== null && $img instanceof \Illuminate\Http\UploadedFile);

        if (count($images) === 0) {
            return 0;
        }

        Log::info('Uploading ' . count($images) . ' images to R2 for property #' . $property->id);

        $successCount = 0;
        $hasPrimary = $property->images()->where('is_primary', true)->exists();

        if ($forcePrimary) {
            $hasPrimary = false;
        }

        foreach ($images as $index => $image) {
            try {
                if (!$image->isValid()) {
                    Log::error('Invalid file: ' . $image->getClientOriginalName());
                    continue;
                }

                // Generate unique filename
                $filename = time() . '_' . Str::random(10) . '.' . $image->getClientOriginalExtension();

                // ✅ UPLOAD KE CLOUDFLARE R2
                $r2Path = 'properties/' . $filename;

                // Put file ke R2 dengan visibility public
                $uploaded = Storage::disk('s3')->put($r2Path, file_get_contents($image->getRealPath()), 'public');

                if (!$uploaded) {
                    Log::error('R2 upload failed for: ' . $filename);
                    continue;
                }

                // ✅ SIMPAN PATH RELATIF KE DATABASE
                $isPrimary = $primaryNewIndex !== null
                    ? $index === (int) $primaryNewIndex
                    : (!$hasPrimary && $index === 0);

                $imageRecord = $property->images()->create([
                    'image_url' => $r2Path,
                    'is_primary' => $isPrimary,
                ]);

                if ($isPrimary) {
                    $hasPrimary = true;
                }

                Log::info('✅ Image record created! ID: ' . $imageRecord->id . ' | R2 Path: ' . $r2Path);
                $successCount++;
                $hasPrimary = true;

            } catch (\Illuminate\Database\QueryException $qe) {
                Log::error('❌ DATABASE QUERY ERROR: ' . $qe->getMessage());
                Log::error('SQL: ' . $qe->getSql());
                Log::error('Bindings: ' . json_encode($qe->getBindings()));

                if (app()->environment('local')) {
                    throw $qe;
                }
            } catch (\Exception $e) {
                Log::error('❌ GENERAL ERROR: ' . $e->getMessage());
                Log::error('Trace: ' . $e->getTraceAsString());

                if (app()->environment('local')) {
                    throw $e;
                }
            }
        }

        Log::info('R2 Upload completed: ' . $successCount . '/' . count($images) . ' images saved');
        return $successCount;
    }

    /**
     * ✅ HANDLE DOCUMENT UPLOAD KE CLOUDFLARE R2
     */
    private function handleDocumentUpload(Request $request, Property $property, string $field): void
    {
        if (!$request->hasFile($field)) {
            return;
        }

        $file = $request->file($field);
        if (!$file || !$file->isValid()) {
            return;
        }

        $filename = time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
        $r2Path = 'property-docs/' . $filename;

        $uploaded = Storage::disk('s3')->put($r2Path, file_get_contents($file->getRealPath()), 'private');
        if (!$uploaded) {
            Log::error('R2 upload failed for doc: ' . $filename);
            return;
        }

        if ($property->{$field}) {
            if (Storage::disk('s3')->exists($property->{$field})) {
                Storage::disk('s3')->delete($property->{$field});
            }
        }

        $property->{$field} = $r2Path;
        $property->save();
    }

    /**
     * Normalize detail input: convert string 'null' / '' to actual null
     */
    private function normalizeDetailInput(array $detail): array
    {
        $integerFields = [
            'luas_tanah', 'luas_bangunan', 'bedrooms', 'bathrooms',
            'floors', 'kitchens', 'living_rooms', 'electricity_capacity',
        ];

        foreach ($integerFields as $field) {
            if (array_key_exists($field, $detail)) {
                $value = $detail[$field];
                if ($value === 'null' || $value === '' || $value === null || (is_string($value) && trim($value) === '')) {
                    $detail[$field] = null;
                }
            }
        }

        $booleanFields = ['carport', 'garden', 'one_gate_system', 'security_24jam'];
        foreach ($booleanFields as $field) {
            if (array_key_exists($field, $detail)) {
                $detail[$field] = filter_var($detail[$field], FILTER_VALIDATE_BOOLEAN);
            }
        }

        return $detail;
    }

    /**
     * Prepare detail data for database insert/update
     */
    private function prepareDetailData(array $detail, int $propertyId): array
    {
        $data = ['property_id' => $propertyId];

        $integerFields = [
            'luas_tanah' => ['required' => true, 'default' => 0],
            'luas_bangunan' => ['required' => false, 'default' => 0],
            'bedrooms' => ['required' => false, 'default' => 0],
            'bathrooms' => ['required' => false, 'default' => 0],
            'floors' => ['required' => false, 'default' => 1],
            'kitchens' => ['required' => false, 'default' => 0],
            'living_rooms' => ['required' => false, 'default' => 0],
            'electricity_capacity' => ['required' => false, 'default' => 0],
        ];

        foreach ($integerFields as $field => $config) {
            $value = $detail[$field] ?? null;
            if ($value === null || $value === '' || $value === 'null') {
                $data[$field] = $config['default'];
            } else {
                $data[$field] = (int) $value;
            }
        }

        $booleanFields = ['carport', 'garden', 'one_gate_system', 'security_24jam'];
        foreach ($booleanFields as $field) {
            $val = $detail[$field] ?? false;
            $data[$field] = filter_var($val, FILTER_VALIDATE_BOOLEAN);
        }

        $data['water'] = $detail['water'] ?? 'pdam';
        $data['listrik_type'] = $detail['listrik_type'] ?? 'overground';
        $data['wifi_provider'] = $detail['wifi_provider'] ?? null;

        return $data;
    }
}
