<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255);
            $table->string('slug', 255)->unique();
            $table->enum('type', ['rumah', 'perumahan', 'ruko', 'kos', 'tanah']);
            $table->string('building_type', 100)->nullable();
            $table->enum('listing_type', ['jual', 'sewa']);
            $table->string('kecamatan', 100);
            $table->string('city', 100)->default('Jember');
            $table->unsignedBigInteger('price');
            $table->enum('certificate_type', ['SHM', 'SHGB']);
            $table->enum('certificate_status', ['lunas', 'bank'])->default('lunas');
            $table->enum('status', ['draft', 'published', 'sold'])->default('draft');
            $table->unsignedBigInteger('views')->default(0);
            $table->text('description')->nullable();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            $table->index('slug');
            $table->index(['type', 'listing_type', 'price']);
            $table->index(['kecamatan', 'city']);
            $table->index('user_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('properties');
    }
};
