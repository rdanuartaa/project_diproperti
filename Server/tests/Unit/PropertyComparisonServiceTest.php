<?php

namespace Tests\Unit;

use App\Services\Property\PropertyComparisonService;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

class PropertyComparisonServiceTest extends TestCase
{
    #[Test]
    public function it_uses_business_weight_profiles_for_property_comparisons(): void
    {
        $expected = [
            'rumah' => ['price' => 30, 'location' => 25, 'area' => 25, 'facilities' => 20],
            'villa' => ['price' => 25, 'location' => 25, 'area' => 20, 'facilities' => 30],
            'kos' => ['price' => 30, 'location' => 30, 'area' => 15, 'facilities' => 25],
            'ruko' => ['price' => 30, 'location' => 30, 'area' => 25, 'facilities' => 15],
            'tanah' => ['price' => 30, 'location' => 30, 'area' => 30, 'facilities' => 10],
        ];

        $reflection = new ReflectionClass(PropertyComparisonService::class);
        $service = $reflection->newInstanceWithoutConstructor();

        foreach ($expected as $type => $weights) {
            $actual = $service->getWeights($type);

            $this->assertSame($weights, $actual);
            $this->assertSame(100, array_sum($actual));
        }
    }
}
