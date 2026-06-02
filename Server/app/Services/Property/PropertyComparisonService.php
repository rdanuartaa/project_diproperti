<?php

namespace App\Services\Property;

use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PropertyComparisonService
{
    private const WEIGHT_PROFILES = [
        'rumah' => ['price' => 30, 'location' => 25, 'area' => 25, 'facilities' => 20],
        'villa' => ['price' => 25, 'location' => 25, 'area' => 20, 'facilities' => 30],
        'kos' => ['price' => 30, 'location' => 30, 'area' => 15, 'facilities' => 25],
        'ruko' => ['price' => 30, 'location' => 30, 'area' => 25, 'facilities' => 15],
        'tanah' => ['price' => 30, 'location' => 30, 'area' => 30, 'facilities' => 10],
    ];

    public function __construct(
        private PropertyScoringService $scoringService,
        private PropertyMediaService $mediaService,
        private PropertyAccessService $accessService,
    ) {}

    public function compare(Request $request, ?User $user): Collection
    {
        $request->validate(['slugs' => 'required|string']);

        $slugs = collect(explode(',', (string) $request->input('slugs')))
            ->map(fn(string $slug) => trim($slug))
            ->filter()
            ->unique()
            ->values();

        if ($slugs->count() < 2 || $slugs->count() > 3) {
            throw ValidationException::withMessages([
                'slugs' => ['Komparasi membutuhkan 2 hingga 3 properti yang berbeda.'],
            ]);
        }

        $propertiesBySlug = Property::with(['detail', 'images'])
            ->whereIn('slug', $slugs)
            ->where('status', 'published')
            ->where('is_verified', true)
            ->get()
            ->keyBy('slug');
        $properties = $slugs
            ->map(fn(string $slug) => $propertiesBySlug->get($slug))
            ->filter()
            ->values();

        if ($properties->count() !== $slugs->count()) {
            throw ValidationException::withMessages([
                'slugs' => ['Salah satu properti tidak ditemukan atau belum dapat dibandingkan.'],
            ]);
        }

        $type = (string) $properties->first()->type;
        $listingType = (string) $properties->first()->listing_type;
        if ($properties->contains(fn(Property $property) =>
            $property->type !== $type || $property->listing_type !== $listingType
        )) {
            throw ValidationException::withMessages([
                'slugs' => ['Komparasi hanya dapat dilakukan untuk tipe properti dan penawaran yang sama.'],
            ]);
        }
        if ($type === 'kos' && $listingType !== 'sewa') {
            throw ValidationException::withMessages([
                'slugs' => ['Properti kos hanya dapat dibandingkan untuk penawaran sewa.'],
            ]);
        }

        $stats = $this->scoringService->buildStats($type, $listingType);
        $weights = $this->getWeights($type);
        $scored = new Collection($properties->map(function (Property $property) use ($stats, $weights) {
            $result = $this->scoringService->calculateScore($property, $stats, $weights);
            $property->setAttribute('comparison_score', round($result['score'], 6));
            $property->setAttribute('comparison_detail', $result['detail']);
            $property->setAttribute('comparison_weights', $weights);

            return $property;
        })->all());
        $rankById = $scored
            ->sortByDesc('comparison_score')
            ->values()
            ->mapWithKeys(fn(Property $property, int $index) => [$property->id => $index + 1]);

        $scored->each(fn(Property $property) =>
            $property->setAttribute('comparison_rank', $rankById[$property->id])
        );
        $scored = new Collection($scored->values()->all());

        $this->mediaService->appendImageUrls($scored);
        $this->mediaService->appendRentPriceInfo($scored, $request);
        if (!$user || !$user->isAdmin()) {
            $this->accessService->stripPrivateFields($scored);
        }

        return $scored;
    }

    public function getWeights(string $type): array
    {
        return self::WEIGHT_PROFILES[$type];
    }
}
