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
            $query->where('status', 'published');
        }

        $per_page = $request->input('per_page', 12);
        $properties = $this->applySortOrder($query, $request)->paginate($per_page);

        // ✅ TRIGGER ACCESSOR untuk full_url
        $this->appendImageUrls($properties);

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

            if ($uploadedCount === 0 && $request->hasFile('images')) {
                Log::warning('⚠️ Images uploaded to R2 but NOT saved to database! Count: 0');
            }

            // Load relationships
            $property->load(['detail', 'images', 'user']);

            // ✅ TRIGGER ACCESSOR untuk full_url sebelum return
            $this->appendImageUrls($property);

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
                'status' => 'sometimes|required|in:draft,published,sold',
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

            if ($uploadedCount === 0 && $request->hasFile('images')) {
                Log::warning('⚠️ Update: Images uploaded to R2 but NOT saved to database!');
            }

            // Load relationships
            $property->load(['detail', 'images', 'user']);

            // ✅ TRIGGER ACCESSOR untuk full_url sebelum return
            $this->appendImageUrls($property);

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
