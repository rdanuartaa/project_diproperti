<?php

use App\Services\Property\PropertyScoringProfileService;
use App\Services\Property\PropertyScoringService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command(
    'properties:refresh-scoring-profiles {--min-samples=30 : Minimum usable historical records per category} {--dry-run : Show profiles without saving them}',
    function (PropertyScoringProfileService $profileService, PropertyScoringService $scoringService) {
        $minimumSampleSize = max(1, (int) $this->option('min-samples'));
        $profiles = $profileService->refresh(
            $scoringService,
            $minimumSampleSize,
            (bool) $this->option('dry-run'),
        );

        $this->table(
            ['Type', 'Listing', 'Version', 'Source', 'Samples', 'Min Price', 'Max Price', 'Min Area', 'Max Area'],
            collect($profiles)->map(fn (array $profile) => [
                $profile['type'],
                $profile['listing_type'],
                $profile['version'],
                $profile['source_type'],
                "{$profile['sample_count']}/{$profile['minimum_sample_size']}",
                number_format($profile['min_price'], 2, ',', '.'),
                number_format($profile['max_price'], 2, ',', '.'),
                number_format($profile['min_area'], 4, ',', '.'),
                number_format($profile['max_area'], 4, ',', '.'),
            ]),
        );

        $this->info($this->option('dry-run')
            ? 'Dry run selesai. Tidak ada profil yang disimpan.'
            : 'Profil skoring aktif berhasil diperbarui.');
    },
)->purpose('Build stable P5-P95 scoring profiles from verified historical properties');

Schedule::command('properties:refresh-scoring-profiles --min-samples=30')
    ->cron('0 2 1 * *')
    ->withoutOverlapping();
