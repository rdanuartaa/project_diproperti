<?php

namespace App\Services\Property;

use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PropertySubmissionService
{
    public function __construct(
        private PropertyDetailService $detailService,
        private PropertyMediaService $mediaService,
    ) {}

    public function submit(Request $request): Property
    {
        $rawDetail = $request->input('detail', []);
        $normalizedDetail = $this->detailService->normalizeDetailInput($rawDetail);
        $request->merge(['detail' => $normalizedDetail]);

        $validated = $request->validate(array_merge(
            $this->submissionRules(),
            $this->detailService->getCertificateRules($request->input('type', 'rumah')),
            $this->detailService->getDetailValidationRules($request->input('type', 'rumah'))
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
            'is_verified' => false,
            'description' => $validated['description'] ?? null,
        ]);

        $detailData = $this->detailService->prepareDetailData($validated['detail'], $property->id);
        $property->detail()->create($detailData);

        $primaryNewIndex = $request->input('primary_new_index');
        $this->mediaService->handleImageUpload($property, $request, 0, $primaryNewIndex, $primaryNewIndex !== null);
        $this->mediaService->handleDocumentUpload($request, $property, 'certificate_file');
        $this->mediaService->handleDocumentUpload($request, $property, 'electric_bill_file');
        $this->mediaService->handleDocumentUpload($request, $property, 'water_bill_file');

        return $this->hydrateForResponse($property, $request);
    }

    public function adminPaginate(Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);

        $submissions = Property::with(['user', 'detail', 'images'])
            ->orderBy('is_verified', 'asc')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        $this->mediaService->appendImageUrls($submissions);
        $this->mediaService->appendDocumentUrls($submissions);
        $this->mediaService->appendRentPriceInfo($submissions, $request);

        return $submissions;
    }

    public function userPaginate(Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);

        $submissions = Property::with(['user', 'detail', 'images'])
            ->where('user_id', $request->user()->id)
            ->orderByRaw('CASE WHEN status = "sold" THEN 0 WHEN is_verified = 0 THEN 1 ELSE 2 END')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        $this->mediaService->appendImageUrls($submissions);
        $this->mediaService->appendDocumentUrls($submissions);
        $this->mediaService->appendRentPriceInfo($submissions, $request);

        return $submissions;
    }

    public function approve(Property $property, Request $request): Property
    {
        $property->is_verified = true;
        $property->status = 'published';
        $property->save();

        return $this->hydrateForResponse($property, $request);
    }

    public function updateDraft(Request $request, int $id): Property
    {
        $property = Property::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->where('is_verified', false)
            ->where('status', '!=', 'sold')
            ->firstOrFail();

        $validated = $request->validate($this->draftUpdateRules());

        $updatable = [
            'title',
            'price',
            'description',
            'kecamatan',
            'city',
            'address',
            'certificate_type',
            'certificate_status',
            'rent_period',
        ];

        foreach ($updatable as $field) {
            if (array_key_exists($field, $validated)) {
                $property->{$field} = $validated[$field];
            }
        }

        $property->save();

        $primaryNewIndex = $request->input('primary_new_index');
        $this->mediaService->handleImageUpload(
            $property,
            $request,
            $property->images()->count(),
            $primaryNewIndex,
            $primaryNewIndex !== null
        );

        return $this->hydrateForResponse($property, $request);
    }

    public function assertSellerProfileReady(Request $request): ?array
    {
        if ($request->user()->id_card_file) {
            return null;
        }

        return [
            'message' => 'Foto KTP wajib diunggah pada profil penjual sebelum mengirim pengajuan.',
            'errors' => [
                'id_card_file' => ['Foto KTP wajib diunggah pada profil penjual sebelum mengirim pengajuan.'],
            ],
        ];
    }

    private function hydrateForResponse(Property $property, Request $request): Property
    {
        $property->load(['detail', 'images', 'user']);
        $this->mediaService->appendImageUrls($property);
        $this->mediaService->appendDocumentUrls($property);
        $this->mediaService->appendRentPriceInfo($property, $request);

        return $property;
    }

    private function submissionRules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'type' => 'required|in:rumah,villa,ruko,kos,tanah',
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
    }

    private function draftUpdateRules(): array
    {
        return [
            'title' => 'sometimes|required|string|max:255',
            'price' => 'sometimes|required|integer|min:0',
            'description' => 'nullable|string',
            'kecamatan' => 'sometimes|required|string|max:100',
            'city' => 'sometimes|required|string|max:100',
            'address' => 'nullable|string|max:255',
            'certificate_type' => 'nullable|in:SHM,SHGB',
            'certificate_status' => 'nullable|in:lunas,bank',
            'rent_period' => 'nullable|string',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:5120',
            'primary_new_index' => 'nullable|integer|min:0',
        ];
    }
}
