<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
        public function up(): void
        {
            Schema::create('property_details', function (Blueprint $table) {
                $table->id();
                $table->foreignId('property_id')->constrained()->onDelete('cascade');
                $table->integer('luas_tanah');
                $table->integer('luas_bangunan')->nullable();
                $table->integer('floors')->nullable();
                $table->integer('bedrooms')->nullable();
                $table->integer('bathrooms')->nullable();
                $table->integer('kitchens')->nullable();
                $table->integer('living_rooms')->nullable();
                $table->integer('electricity_capacity')->nullable();
                $table->boolean('carport')->default(false);
                $table->boolean('garden')->default(false);
                $table->boolean('one_gate_system')->default(false);
                $table->boolean('security_24jam')->default(false);
                $table->enum('water', ['pdam', 'sumur'])->default('pdam');
                $table->enum('listrik_type', ['underground', 'overground'])->default('overground');
                $table->string('wifi_provider', 100)->nullable();
                $table->timestamps();
                $table->index('property_id');
            });
        }

    public function down(): void
    {
        Schema::dropIfExists('property_details');
    }
};
