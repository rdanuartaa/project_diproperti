<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\PropertyImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class PropertyController extends Controller
{
    /**
     * Display a listing of properties (Public)
     */
    public function index(Request $request)
    {
        $query = Property::with(['user', 'detail', 'images']);

        // Filter
        if ($request->has('type')) $query->where('type', $request->type);
        if ($request->has('listing_type')) $query->where('listing_type', $request->listing_type);
        if ($request->has('city')) $query->where('city', $request->city);
        if ($request->has('min_price')) $query->where('price', '>=', $request->min_price);
        if ($request->has('max_price')) $query->where('price', '<=', $request->max_price);
        if ($request->has('search')) {
            $query->where(function($q) use ($request) {
                $q->where('title', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%")
                  ->orWhere('kecamatan', 'like', "%{$request->search}%");
            });
        }

        // Hanya tampilkan published (kecuali admin)
        if (!$request->user()?->isAdmin()) {
            $query->where('status', 'published');
        }

        $properties = $query->latest()->paginate($request->get('per_page', 12));

        return response()->json($properties);
    }

    /**
     * Display the specified property (Public)
     */
    public function show($slug)
    {
        $property = Property::with(['user', 'detail', 'images'])
            ->where('slug', $slug)
            ->firstOrFail();

        // Tambah counter views (kecuali admin)
        if (!request()->user()?->isAdmin()) {
            $property->increment('views');
        }

        return response()->json($property);
    }

    /**
     * Store a newly created property (Admin Only)
     */
    public function store(Request $request)
    {
        try {
            Log::info('=== CREATE PROPERTY START ===');
            Log::info('User ID: ' . $request->user()->id);

            // ✅ PRE-PROCESS: Normalize detail input BEFORE validation
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

                // Detail validation
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

                // Images validation
                'images' => 'nullable|array',
                'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:5120',
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

            // ✅ CREATE PROPERTY DETAIL - dengan sanitasi ekstra
            $detailData = $this->prepareDetailData($validated['detail'], $property->id);
            $property->detail()->create($detailData);
            Log::info('Property detail created');

            // Upload Images
            if ($request->hasFile('images')) {
                Log::info('Uploading ' . count($request->file('images')) . ' images...');

                foreach ($request->file('images') as $index => $image) {
                    try {
                        $path = $image->store('properties', 'public');

                        $property->images()->create([
                            'image_url' => Storage::url($path),
                            'is_primary' => $index === 0,
                        ]);

                        Log::info('Image ' . ($index + 1) . ' uploaded: ' . $path);
                    } catch (\Exception $e) {
                        Log::error('Failed to upload image: ' . $e->getMessage());
                        // Continue with other images
                    }
                }
            }

            // Load relationships for response
            $property->load(['detail', 'images', 'user']);

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
    public function update(Request $request, Property $property)
    {
        try {
            // Check ownership
            if (!$request->user()->isAdmin() && $property->user_id !== $request->user()->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            Log::info('=== UPDATE PROPERTY START === ID: ' . $property->id);

            // Pre-process detail input
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

                // Detail validation
                'detail' => 'sometimes|required|array',
                'detail.luas_tanah' => 'sometimes|required|integer|min:0',
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

                // Images
                'images' => 'nullable|array',
                'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            ]);

            // Update main property - only update fields that are present
            $updateData = [];
            $mainFields = ['title', 'type', 'building_type', 'listing_type', 'kecamatan', 'city', 'price', 'certificate_type', 'certificate_status', 'status', 'description'];

            foreach ($mainFields as $field) {
                if (isset($validated[$field])) {
                    $updateData[$field] = $validated[$field];
                }
            }

            if (!empty($updateData)) {
                // Regenerate slug if title changed
                if (isset($validated['title'])) {
                    $updateData['slug'] = Str::slug($validated['title']) . '-' . Str::random(5);
                }
                $property->update($updateData);
            }

            // Update detail
            if (isset($validated['detail'])) {
                $detailData = $this->prepareDetailData($validated['detail'], $property->id);
                $property->detail()->updateOrCreate(
                    ['property_id' => $property->id],
                    $detailData
                );
            }

            // Handle new images
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $image) {
                    try {
                        $path = $image->store('properties', 'public');
                        $property->images()->create([
                            'image_url' => Storage::url($path),
                            'is_primary' => false,
                        ]);
                    } catch (\Exception $e) {
                        Log::error('Failed to upload image on update: ' . $e->getMessage());
                    }
                }
            }

            Log::info('=== UPDATE PROPERTY SUCCESS ===');

            return response()->json([
                'message' => 'Property updated successfully',
                'property' => $property->load(['detail', 'images', 'user'])
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
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
    }

    /**
     * Remove the specified property (Admin Only)
     */
    public function destroy(Request $request, Property $property)
    {
        try {
            // Check ownership
            if (!$request->user()->isAdmin() && $property->user_id !== $request->user()->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            Log::info('=== DELETE PROPERTY START === ID: ' . $property->id);

            // Delete images from storage
            foreach ($property->images as $image) {
                $path = str_replace('/storage/', 'public/', $image->image_url);
                if (Storage::exists($path)) {
                    Storage::delete($path);
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
    public function deleteImage(Request $request, PropertyImage $image)
    {
        try {
            if (!$request->user()->isAdmin() && $image->property->user_id !== $request->user()->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Delete file
            $path = str_replace('/storage/', 'public/', $image->image_url);
            if (Storage::exists($path)) {
                Storage::delete($path);
            }

            $imageId = $image->id;
            $image->delete();

            Log::info('Image deleted: ' . $imageId);

            return response()->json(['message' => 'Image deleted successfully']);

        } catch (\Exception $e) {
            Log::error('Failed to delete image: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete image',
            ], 500);
        }
    }

    // ========================================
    // ✅ HELPER METHODS (FIX INT & BOOLEAN)
    // ========================================

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
                // Convert string 'null', empty, or whitespace to actual null
                if ($value === 'null' || $value === '' || $value === null || trim($value) === '') {
                    $detail[$field] = null;
                }
            }
        }

        // Handle boolean fields
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
     * Ensures integers are integers, booleans are booleans, strings are strings
     */
    private function prepareDetailData(array $detail, int $propertyId): array
    {
        $data = ['property_id' => $propertyId];

        // Integer fields: cast to int or set to null
        $integerFields = [
            'luas_tanah' => true,   // REQUIRED: default to 0 if empty
            'luas_bangunan' => false,
            'bedrooms' => false,
            'bathrooms' => false,
            'floors' => false,
            'kitchens' => false,
            'living_rooms' => false,
            'electricity_capacity' => false,
        ];

        foreach ($integerFields as $field => $isRequired) {
            $value = $detail[$field] ?? null;

            if ($value === null || $value === '' || $value === 'null') {
                $data[$field] = $isRequired ? 0 : null;
            } else {
                $data[$field] = (int) $value;
            }
        }

        // Boolean fields
        $booleanFields = ['carport', 'garden', 'one_gate_system', 'security_24jam'];
        foreach ($booleanFields as $field) {
            $val = $detail[$field] ?? false;
            $data[$field] = filter_var($val, FILTER_VALIDATE_BOOLEAN);
        }

        // String fields with defaults
        $data['water'] = $detail['water'] ?? 'pdam';
        $data['listrik_type'] = $detail['listrik_type'] ?? 'overground';
        $data['wifi_provider'] = $detail['wifi_provider'] ?? null;

        return $data;
    }
}
