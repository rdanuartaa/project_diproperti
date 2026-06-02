<?php

namespace App\Services\Property;

use App\Models\Property;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class PropertyRecommendationService
{
    private const DEFAULT_PER_PAGE = 10;
    private const MAX_PER_PAGE = 50;

    public function __construct(
        private PropertyScoringService $scoringService,
        private PropertyFilterService $filterService,
        private PropertyMediaService $mediaService,
        private PropertyAccessService $accessService,
    ) {}

    public function paginate(Request $request, ?User $user): LengthAwarePaginator
    {
        $filters = $request->validate([
            'type' => 'required|in:rumah,villa,ruko,kos,tanah',
            'listing_type' => 'required|in:jual,sewa',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:' . self::MAX_PER_PAGE,
            'price_weight' => 'nullable|numeric|min:0|max:100',
            'location_weight' => 'nullable|numeric|min:0|max:100',
            'area_weight' => 'nullable|numeric|min:0|max:100',
            'facilities_weight' => 'nullable|numeric|min:0|max:100',
            'min_price' => 'nullable|numeric|min:0',
            'max_price' => 'nullable|numeric|min:0',
        ]);

        if ($filters['type'] === 'kos' && $filters['listing_type'] !== 'sewa') {
            throw ValidationException::withMessages([
                'listing_type' => ['Properti kos hanya dapat direkomendasikan untuk penawaran sewa.'],
            ]);
        }

        $query = Property::with(['user', 'detail', 'images'])
            ->where('is_verified', true)
            ->where('type', $filters['type'])
            ->where('listing_type', $filters['listing_type']);
        if ($request->filled('city')) {
            $query->where('city', $request->city);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
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

        $properties = $query->get()
            ->filter(function (Property $property) use ($request) {
                $price = $this->scoringService->getComparablePrice($property);

                return (!$request->filled('min_price') || $price >= (float) $request->min_price)
                    && (!$request->filled('max_price') || $price <= (float) $request->max_price);
            })
            ->values();
        $perPage = (int) $request->input('per_page', self::DEFAULT_PER_PAGE);
        $page = LengthAwarePaginator::resolveCurrentPage();

        if ($properties->isEmpty()) {
            return new LengthAwarePaginator([], 0, $perPage, $page, [
                'path' => $request->url(),
                'query' => $request->query(),
            ]);
        }

        $weights = $this->scoringService->normalizeWeights([
            'price' => max(0, (float) $request->input('price_weight', 25)),
            'location' => max(0, (float) $request->input('location_weight', 25)),
            'area' => max(0, (float) $request->input('area_weight', 25)),
            'facilities' => max(0, (float) $request->input('facilities_weight', 25)),
        ]);
        $stats = $this->scoringService->buildStats($filters['type'], $filters['listing_type']);

        $sorted = $properties->map(function (Property $property) use ($stats, $weights) {
            $result = $this->scoringService->calculateScore($property, $stats, $weights);
            $property->setAttribute('recommendation_score', round($result['score'], 6));
            $property->setAttribute('recommendation_detail', $result['detail']);

            return $property;
        })->sortByDesc('recommendation_score')->values()->map(function (Property $property, int $index) {
            $property->setAttribute('recommendation_rank', $index + 1);

            return $property;
        });

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
}
