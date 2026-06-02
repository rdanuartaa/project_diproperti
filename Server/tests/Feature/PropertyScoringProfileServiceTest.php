<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\PropertyDetail;
use App\Models\PropertyScoringProfile;
use App\Models\User;
use App\Services\Property\PropertyScoringProfileService;
use App\Services\Property\PropertyScoringService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PropertyScoringProfileServiceTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = User::query()->create([
            'name' => 'Pemilik Properti Historis',
            'email' => 'historis@example.test',
            'password' => Hash::make('password'),
        ]);
    }

    #[Test]
    public function it_uses_a_documented_fallback_when_the_historical_sample_is_too_small(): void
    {
        $this->createPublishedHouse(1, 100000000, 20, 20);
        $this->createPublishedHouse(2, 500000000, 100, 100);

        $profileService = app(PropertyScoringProfileService::class);
        $scoringService = app(PropertyScoringService::class);
        $profileService->refresh($scoringService, minimumSampleSize: 3);

        $stats = $scoringService->buildStats('rumah', 'jual');

        $this->assertSame('fallback', $stats['profile_source']);
        $this->assertSame(2, $stats['profile_sample_count']);
        $this->assertSame(100000000.0, $stats['min_price']);
        $this->assertSame(5000000000.0, $stats['max_price']);
        $this->assertSame(20.0, $stats['min_area']);
        $this->assertSame(500.0, $stats['max_area']);
    }

    #[Test]
    public function it_persists_stable_p5_p95_historical_profiles_when_enough_data_exists(): void
    {
        foreach (range(1, 5) as $index) {
            $value = $index * 100;
            $this->createPublishedHouse($index, $value * 1000000, $value, $value);
        }

        $profileService = app(PropertyScoringProfileService::class);
        $scoringService = app(PropertyScoringService::class);
        $profileService->refresh($scoringService, minimumSampleSize: 5);

        $stats = $scoringService->buildStats('rumah', 'jual');

        $this->assertSame('historical', $stats['profile_source']);
        $this->assertSame(5, $stats['profile_sample_count']);
        $this->assertSame(120000000.0, $stats['min_price']);
        $this->assertSame(480000000.0, $stats['max_price']);
        $this->assertSame(120.0, $stats['min_area']);
        $this->assertSame(480.0, $stats['max_area']);
    }

    #[Test]
    public function it_keeps_only_the_latest_profile_version_active(): void
    {
        $profileService = app(PropertyScoringProfileService::class);
        $scoringService = app(PropertyScoringService::class);

        $profileService->refresh($scoringService);
        $profileService->refresh($scoringService);

        $profiles = PropertyScoringProfile::query()
            ->where('type', 'rumah')
            ->where('listing_type', 'jual')
            ->orderBy('version')
            ->get();

        $this->assertCount(2, $profiles);
        $this->assertFalse($profiles[0]->is_active);
        $this->assertTrue($profiles[1]->is_active);
        $this->assertSame(2, $profiles[1]->version);
    }

    private function createPublishedHouse(int $index, int $price, float $buildingArea, float $landArea): void
    {
        $property = Property::query()->create([
            'title' => "Rumah Historis {$index}",
            'type' => 'rumah',
            'listing_type' => 'jual',
            'kecamatan' => 'Kaliwates',
            'city' => 'Jember',
            'price' => $price,
            'status' => 'published',
            'is_verified' => true,
            'user_id' => $this->owner->id,
        ]);

        PropertyDetail::query()->create([
            'property_id' => $property->id,
            'luas_bangunan' => $buildingArea,
            'luas_tanah' => $landArea,
        ]);
    }
}
