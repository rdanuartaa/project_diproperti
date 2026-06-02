<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('property_scoring_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('type', 20);
            $table->string('listing_type', 10);
            $table->unsignedInteger('version');
            $table->decimal('min_price', 16, 2);
            $table->decimal('max_price', 16, 2);
            $table->decimal('min_area', 12, 4);
            $table->decimal('max_area', 12, 4);
            $table->unsignedInteger('sample_count')->default(0);
            $table->unsignedInteger('minimum_sample_size')->default(30);
            $table->string('source_type', 20);
            $table->boolean('is_active')->default(false);
            $table->timestamp('generated_at');
            $table->timestamps();

            $table->unique(['type', 'listing_type', 'version']);
            $table->index(['type', 'listing_type', 'is_active'], 'scoring_profiles_active_lookup');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('property_scoring_profiles');
    }
};
