<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\PropertyImage;
use App\Services\Property\PropertyAccessService;
use App\Services\Property\PropertyDetailService;
use App\Services\Property\PropertyFilterService;
use App\Services\Property\PropertyMediaService;
use App\Services\Property\PropertyRecommendationService;
use App\Services\Property\PropertySubmissionService;
use App\Services\ViewTrackingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class PropertyController extends Controller
{
    public function __construct(
        private PropertyMediaService $mediaService,
        private PropertyAccessService $accessService,
        private PropertyDetailService $detailService,
        private PropertyFilterService $filterService,
        private PropertyRecommendationService $recommendationService,
        private PropertySubmissionService $submissionService,
        private ViewTrackingService $viewTrackingService,
    ) {}

    // =========================================================================
    // PUBLIC ENDPOINTS
    // =========================================================================

    public function recommendations(Request $request): \Illuminate\Http\JsonResponse
    {
        return response()->json(
            $this->recommendationService->paginate($request, $request->user())
        );
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
                  ->orWhere('kecamatan', 'like', "%{$request->search}%")
                  ->orWhere('city', 'like', "%{$request->search}%");
            });
        }
        if ($request->filled('location')) {
            $query->where(function ($q) use ($request) {
                $q->where('kecamatan', 'like', "%{$request->location}%")
                  ->orWhere('city', 'like', "%{$request->location}%");
            });
        }
        if ($request->filled('kecamatan')) $query->where('kecamatan', 'like', "%{$request->kecamatan}%");

        $this->filterService->applyDetailFilters($query, $request);
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
        $properties = $this->filterService->applySortOrder($query, $request)->paginate($perPage);

        $this->mediaService->appendImageUrls($properties);
        $this->mediaService->appendRentPriceInfo($properties, $request);
        if (!$user || !$user->isAdmin()) $this->accessService->stripPrivateFields($properties);

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
                  ->orWhere('kecamatan', 'like', "%{$request->search}%")
                  ->orWhere('city', 'like', "%{$request->search}%");
            });
        }
        if ($request->filled('location')) {
            $query->where(function ($q) use ($request) {
                $q->where('kecamatan', 'like', "%{$request->location}%")
                  ->orWhere('city', 'like', "%{$request->location}%");
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
        $properties = $this->filterService->applySortOrder($query, $request)->paginate($perPage);

        $this->mediaService->appendImageUrls($properties);
        $this->mediaService->appendRentPriceInfo($properties, $request);

        return response()->json($properties);
    }

    public function show(string $slug): \Illuminate\Http\JsonResponse
    {
        $property = Property::with(['user', 'detail', 'images'])->where('slug', $slug)->firstOrFail();

        $this->mediaService->appendImageUrls($property);
        $this->mediaService->appendRentPriceInfo($property, request());

        $viewer = request()->user();
        $isAdmin = $viewer?->isAdmin() ?? false;
        $isOwner = $viewer && (int) $property->user_id === (int) $viewer->id;
        if (!$isAdmin) {
            if (!$isOwner && ($property->status !== 'published' || !$property->is_verified)) {
                return response()->json(['message' => 'Not found'], 404);
            }
            if (!$isOwner) {
                $this->accessService->stripPrivateFields($property);
            }
        } else {
            $this->mediaService->appendDocumentUrls($property);
        }

        $this->accessService->applyLocationAccess($property, $viewer);
        if ($property->getAttribute('can_view_location')) {
            $property->makeVisible(['latitude', 'longitude']);
        }

        $this->viewTrackingService->track(request(), 'property', $property->id, $property);

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
            $normalizedDetail = $this->detailService->normalizeDetailInput($rawDetail);
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
                'certificate_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'electric_bill_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'water_bill_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'status' => 'nullable|in:draft,published,sold',
                'description' => 'nullable|string',
                'images' => 'nullable',
                'primary_new_index' => 'nullable|integer|min:0',
            ];

            $validated = $request->validate(array_merge(
                $baseRules,
                $this->detailService->getCertificateRules($request->input('type', 'rumah')),
                $this->detailService->getDetailValidationRules($request->input('type', 'rumah'))
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

            $detailData = $this->detailService->prepareDetailData($validated['detail'], $property->id);
            $property->detail()->create($detailData);
            Log::info('Property detail created');

            $primaryNewIndex = $request->input('primary_new_index');
            $uploadedCount = $this->mediaService->handleImageUpload($property, $request, 0, $primaryNewIndex, $primaryNewIndex !== null);
            $this->mediaService->handleDocumentUpload($request, $property, 'certificate_file');
            $this->mediaService->handleDocumentUpload($request, $property, 'electric_bill_file');
            $this->mediaService->handleDocumentUpload($request, $property, 'water_bill_file');

            if ($uploadedCount === 0 && $request->hasFile('images')) {
                Log::warning('Images uploaded to R2 but NOT saved to database! Count: 0');
            }

            $property->load(['detail', 'images', 'user']);
            $this->mediaService->appendImageUrls($property);
            $this->mediaService->appendDocumentUrls($property);
            $this->mediaService->appendRentPriceInfo($property, $request);

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
            $normalizedDetail = $this->detailService->normalizeDetailInput($rawDetail);
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
                'certificate_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'electric_bill_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
                'water_bill_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
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
                ? $this->detailService->getDetailValidationRules($effectiveType)
                : ['detail' => 'nullable|array'];

            $certificateRules = $this->detailService->getCertificateRules($effectiveType, true);
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
                $detailData = $this->detailService->prepareDetailData($validated['detail'], $property->id);
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

            $primaryNewIndex = $request->filled('primary_image_id')
                ? null
                : $request->input('primary_new_index');
            if ($primaryNewIndex !== null) $property->images()->update(['is_primary' => false]);
            $uploadedCount = $this->mediaService->handleImageUpload($property, $request, $property->images()->count(), $primaryNewIndex, $primaryNewIndex !== null);

            if ($request->user()->isAdmin()) {
                $this->mediaService->handleDocumentUpload($request, $property, 'certificate_file');
                $this->mediaService->handleDocumentUpload($request, $property, 'electric_bill_file');
                $this->mediaService->handleDocumentUpload($request, $property, 'water_bill_file');
            }

            if ($uploadedCount === 0 && $request->hasFile('images')) {
                Log::warning('Update: Images uploaded to R2 but NOT saved to database!');
            }

            $property->load(['detail', 'images', 'user']);
            $this->mediaService->appendImageUrls($property);
            $this->mediaService->appendDocumentUrls($property);
            $this->mediaService->appendRentPriceInfo($property, $request);

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

            if ($profileError = $this->submissionService->assertSellerProfileReady($request)) {
                return response()->json($profileError, 422);
            }

            $property = $this->submissionService->submit($request);

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

        return response()->json($this->submissionService->adminPaginate($request));
    }

    public function mySubmissions(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        return response()->json($this->submissionService->userPaginate($request));
    }

    public function approveSubmission(Request $request, Property $property): \Illuminate\Http\JsonResponse
    {
        if (!$request->user()?->isAdmin()) return response()->json(['message' => 'Unauthorized'], 403);

        $property = $this->submissionService->approve($property, $request);

        return response()->json(['message' => 'Pengajuan properti disetujui', 'property' => $property]);
    }

    public function downloadPropertyImage(Request $request, PropertyImage $image): \Symfony\Component\HttpFoundation\Response
    {
        if (!$request->user()?->isAdmin()) abort(403, 'Unauthorized');

        $propertyTitle = $image->property?->title ?? 'gambar-properti';
        $path = $image->getRawOriginal('image_url') ?: $image->image_url;
        $filename = $this->mediaService->makeDownloadFilename($propertyTitle . '-gambar-' . $image->id, $path);

        return $this->mediaService->downloadFileResponse($path, $filename);
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
        $filename = $this->mediaService->makeDownloadFilename($property->title . '-' . $label, $path);

        return $this->mediaService->downloadFileResponse($path, $filename);
    }

    public function downloadSellerIdCard(Request $request, Property $property): \Symfony\Component\HttpFoundation\Response
    {
        if (!$request->user()?->isAdmin()) abort(403, 'Unauthorized');

        $property->loadMissing('user');
        $sellerName = $property->user?->full_name ?: $property->user?->name ?: 'penjual';
        $filename = $this->mediaService->makeDownloadFilename($sellerName . '-ktp', $property->user?->id_card_file);

        return $this->mediaService->downloadFileResponse($property->user?->id_card_file, $filename);
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

    public function updateSubmission(Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        try {
            Log::info('=== UPDATE SUBMISSION START === ID: ' . $id);

            $property = $this->submissionService->updateDraft($request, $id);

            Log::info('=== UPDATE SUBMISSION SUCCESS === ID: ' . $id);
            return response()->json([
                'message' => 'Pengajuan berhasil diperbarui.',
                'data' => $property,
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Pengajuan tidak ditemukan atau tidak dapat diedit.',
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('=== UPDATE SUBMISSION ERROR ===: ' . $e->getMessage());
            return response()->json([
                'message' => 'Server error: ' . $e->getMessage(),
            ], 500);
        }
    }
}
