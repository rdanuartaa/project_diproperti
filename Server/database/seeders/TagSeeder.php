<?php

namespace Database\Seeders;

use App\Models\Tag;
use Illuminate\Database\Seeder;

class TagSeeder extends Seeder
{
    public function run(): void
    {
        $tags = [
            ['name' => 'Rumah'],
            ['name' => 'Apartemen'],
            ['name' => 'Tanah'],
            ['name' => 'Ruko'],
            ['name' => 'KPR'],
            ['name' => 'Investasi Properti'],
            ['name' => 'Tips Membeli Rumah'],
            ['name' => 'Properti Komersial'],
            ['name' => 'Interior Rumah'],
            ['name' => 'Lokasi Strategis'],
        ];

        foreach ($tags as $tag) {
            Tag::updateOrCreate(
                ['name' => $tag['name']],
                $tag
            );
        }

        $this->command->info('✅ 10 tag dummy berhasil dibuat!');
        $this->command->warn("\n📋 Tags:");
        foreach ($tags as $tag) {
            $this->command->warn("- " . $tag['name']);
        }
    }
}
