<?php

namespace App\Services\Property;

use App\Models\Property;
use App\Models\PropertyScoringProfile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PropertyScoringProfileService
{
    private const LOWER_PERCENTILE = 0.05;
    private const UPPER_PERCENTILE = 0.95;
    private const DEFAULT_MINIMUM_SAMPLE_SIZE = 30;

    public function getActiveStats(string $type, string $listingType): ?array
    {
        if (!Schema::hasTable('property_scoring_profiles')) {
            return null;
        }

        $profile = PropertyScoringProfile::query()
            ->where('type', $type)
            ->where('listing_type', $listingType)
            ->where('is_active', true)
            ->latest('version')
            ->first();

        if (!$profile) {
            return null;
        }

        return [
            'min_price' => $profile->min_price,
            'max_price' => $profile->max_price,
            'min_area' => $profile->min_area,
            'max_area' => $profile->max_area,
            'profile_source' => $profile->source_type,
            'profile_version' => $profile->version,
            'profile_sample_count' => $profile->sample_count,
        ];
    }

    public function refresh(
        PropertyScoringService $scoringService,
        int $minimumSampleSize = self::DEFAULT_MINIMUM_SAMPLE_SIZE,
        bool $dryRun = false,
    ): array {
        $results = [];

        foreach ($scoringService->getSupportedCategories() as $category) {
            $type = $category['type'];
            $listingType = $category['listing_type'];
            $fallback = $scoringService->getFallbackStats($type, $listingType);
            $metrics = $this->getHistoricalMetrics($scoringService, $type, $listingType);
            $useHistorical = count($metrics) >= $minimumSampleSize;
            $stats = $useHistorical ? $this->buildPercentileStats($metrics) : $fallback;
            $sourceType = $useHistorical ? 'historical' : 'fallback';

            $profile = [
                'type' => $type,
                'listing_type' => $listingType,
                'version' => $this->getNextVersion($type, $listingType),
                'min_price' => $stats['min_price'],
                'max_price' => $stats['max_price'],
                'min_area' => $stats['min_area'],
                'max_area' => $stats['max_area'],
                'sample_count' => count($metrics),
                'minimum_sample_size' => $minimumSampleSize,
                'source_type' => $sourceType,
                'is_active' => true,
                'generated_at' => now(),
            ];

            if (!$dryRun) {
                DB::transaction(function () use ($profile, $type, $listingType) {
                    PropertyScoringProfile::query()
                        ->where('type', $type)
                        ->where('listing_type', $listingType)
                        ->where('is_active', true)
                        ->update(['is_active' => false]);

                    PropertyScoringProfile::query()->create($profile);
                });
            }

            $results[] = $profile;
        }

        return $results;
    }

    private function getHistoricalMetrics(
        PropertyScoringService $scoringService,
        string $type,
        string $listingType,
    ): array {
        return Property::with('detail')
            ->whereIn('status', ['published', 'sold'])
            ->where('is_verified', true)
            ->where('type', $type)
            ->where('listing_type', $listingType)
            ->get()
            ->map(function (Property $property) use ($scoringService) {
                return [
                    'price' => $scoringService->getComparablePrice($property),
                    'area' => $scoringService->getAreaValue($property),
                ];
            })
            ->filter(fn(array $metric) => $metric['price'] > 0 && $metric['area'] > 0)
            ->values()
            ->all();
    }

    private function buildPercentileStats(array $metrics): array
    {
        $prices = array_column($metrics, 'price');
        $areas = array_column($metrics, 'area');

        return [
            'min_price' => $this->percentile($prices, self::LOWER_PERCENTILE),
            'max_price' => $this->percentile($prices, self::UPPER_PERCENTILE),
            'min_area' => $this->percentile($areas, self::LOWER_PERCENTILE),
            'max_area' => $this->percentile($areas, self::UPPER_PERCENTILE),
        ];
    }

    private function percentile(array $values, float $percentile): float
    {
        sort($values, SORT_NUMERIC);
        $position = (count($values) - 1) * $percentile;
        $lowerIndex = (int) floor($position);
        $upperIndex = (int) ceil($position);

        if ($lowerIndex === $upperIndex) {
            return (float) $values[$lowerIndex];
        }

        $fraction = $position - $lowerIndex;

        return (float) $values[$lowerIndex]
            + (((float) $values[$upperIndex] - (float) $values[$lowerIndex]) * $fraction);
    }

    private function getNextVersion(string $type, string $listingType): int
    {
        if (!Schema::hasTable('property_scoring_profiles')) {
            return 1;
        }

        return ((int) PropertyScoringProfile::query()
            ->where('type', $type)
            ->where('listing_type', $listingType)
            ->max('version')) + 1;
    }
}
