<?php

namespace Tests\Unit;

use App\Models\Property;
use App\Models\PropertyDetail;
use App\Services\Property\PropertyScoringService;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

class PropertyScoringServiceTest extends TestCase
{
    private PropertyScoringService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new PropertyScoringService(null);
    }

    #[Test]
    public function it_converts_annual_rent_to_a_monthly_comparable_price(): void
    {
        $property = new Property([
            'listing_type' => 'sewa',
            'rent_period' => 'tahun',
            'price' => 12000000,
        ]);

        $this->assertSame(1000000.0, $this->service->getComparablePrice($property));
    }

    #[Test]
    public function it_uses_fixed_reference_ranges_for_a_property_category(): void
    {
        $first = $this->service->buildStats('rumah', 'jual');
        $second = $this->service->buildStats('rumah', 'jual');

        $this->assertSame($first, $second);
        $this->assertSame(100000000, $first['min_price']);
        $this->assertSame(5000000000, $first['max_price']);
    }

    #[Test]
    public function it_penalizes_incomplete_data_without_excluding_the_property(): void
    {
        $property = new Property([
            'type' => 'kos',
            'listing_type' => 'sewa',
            'rent_period' => 'bulan',
            'price' => 1000000,
            'latitude' => -8.17211,
            'longitude' => 113.69953,
        ]);
        $property->setRelation('detail', new PropertyDetail([
            'total_rooms' => 10,
            'bathrooms' => 5,
        ]));

        $result = $this->service->calculateScore(
            $property,
            $this->service->buildStats('kos', 'sewa'),
            ['price' => 25, 'location' => 25, 'area' => 25, 'facilities' => 25],
        );

        $this->assertContains('panjang_ruangan', $result['detail']['missing_fields']);
        $this->assertContains('lebar_ruangan', $result['detail']['missing_fields']);
        $this->assertSame(0.1, $result['detail']['completeness_penalty']);
        $this->assertGreaterThanOrEqual(0, $result['score']);
    }

    #[Test]
    public function it_scores_equivalent_monthly_and_annual_rent_prices_equally(): void
    {
        $monthly = $this->makeCompleteRentalKos('bulan', 1000000);
        $annual = $this->makeCompleteRentalKos('tahun', 12000000);
        $stats = $this->service->buildStats('kos', 'sewa');
        $weights = ['price' => 25, 'location' => 25, 'area' => 25, 'facilities' => 25];

        $monthlyScore = $this->service->calculateScore($monthly, $stats, $weights);
        $annualScore = $this->service->calculateScore($annual, $stats, $weights);

        $this->assertSame(
            $monthlyScore['detail']['comparable_price'],
            $annualScore['detail']['comparable_price'],
        );
        $this->assertSame($monthlyScore['score'], $annualScore['score']);
    }

    #[Test]
    public function it_uses_logarithmic_normalization_for_skewed_property_values(): void
    {
        $stats = $this->service->buildStats('rumah', 'jual');
        $weights = ['price' => 50, 'location' => 0, 'area' => 50, 'facilities' => 0];
        $affordable = $this->makeCompleteHouse(500000000, 60, 60);
        $extreme = $this->makeCompleteHouse(1200000000, 144, 144);

        $affordableResult = $this->service->calculateScore($affordable, $stats, $weights);
        $extremeResult = $this->service->calculateScore($extreme, $stats, $weights);

        $this->assertSame(
            'logarithmic_clamped',
            $affordableResult['detail']['reference_profile']['normalization'],
        );
        $this->assertGreaterThan(
            0.2,
            $affordableResult['detail']['price_score'] - $extremeResult['detail']['price_score'],
        );
        $this->assertGreaterThan(
            0.2,
            $extremeResult['detail']['area_score'] - $affordableResult['detail']['area_score'],
        );
    }

    #[Test]
    public function it_clamps_extreme_values_to_the_reference_profile(): void
    {
        $stats = $this->service->buildStats('rumah', 'jual');
        $weights = ['price' => 50, 'location' => 0, 'area' => 50, 'facilities' => 0];
        $atMaximum = $this->makeCompleteHouse(5000000000, 500, 500);
        $beyondMaximum = $this->makeCompleteHouse(50000000000, 5000, 5000);

        $maximumResult = $this->service->calculateScore($atMaximum, $stats, $weights);
        $extremeResult = $this->service->calculateScore($beyondMaximum, $stats, $weights);

        $this->assertSame($maximumResult['detail']['price_score'], $extremeResult['detail']['price_score']);
        $this->assertSame($maximumResult['detail']['area_score'], $extremeResult['detail']['area_score']);
    }

    private function makeCompleteRentalKos(string $rentPeriod, int $price): Property
    {
        $property = new Property([
            'type' => 'kos',
            'listing_type' => 'sewa',
            'rent_period' => $rentPeriod,
            'price' => $price,
            'latitude' => -8.17211,
            'longitude' => 113.69953,
        ]);
        $property->setRelation('detail', new PropertyDetail([
            'panjang_ruangan' => 3,
            'lebar_ruangan' => 3,
            'total_rooms' => 10,
            'bathrooms' => 5,
        ]));

        return $property;
    }

    private function makeCompleteHouse(int $price, float $buildingArea, float $landArea): Property
    {
        $property = new Property([
            'type' => 'rumah',
            'listing_type' => 'jual',
            'price' => $price,
            'latitude' => -8.17211,
            'longitude' => 113.69953,
        ]);
        $property->setRelation('detail', new PropertyDetail([
            'luas_bangunan' => $buildingArea,
            'luas_tanah' => $landArea,
        ]));

        return $property;
    }
}
