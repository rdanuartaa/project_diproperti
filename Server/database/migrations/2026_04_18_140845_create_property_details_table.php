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

            // ============================
            // 🌐 UNIVERSAL (Semua Properti)
            // ============================
            $table->integer('luas_tanah');
            $table->enum('water', ['pdam', 'sumur'])->default('pdam');
            $table->integer('electricity_capacity')->nullable();
            $table->enum('listrik_type', ['underground', 'overground'])->default('overground');
            $table->enum('road_access', ['aspal', 'cor', 'batu', 'belum'])->nullable();
            $table->string('wifi_provider', 255)->nullable();

            // ============================
            // 🏠 KHUSUS RUMAH & VILLA
            // ============================
            $table->integer('luas_bangunan')->nullable();
            $table->integer('bedrooms')->nullable();
            $table->integer('bathrooms')->nullable();
            $table->integer('floors')->nullable();
            $table->integer('kitchens')->nullable();
            $table->integer('living_rooms')->nullable();
            $table->boolean('carport')->default(false);
            $table->boolean('garden')->default(false);
            $table->boolean('one_gate_system')->default(false);
            $table->boolean('security_24jam')->default(false);


            // ============================
            // 🛏️ KHUSUS KOS
            // ============================
            $table->integer('total_rooms')->nullable()->default(0);
            $table->string('gender_type', 50)->nullable(); // laki-laki, perempuan, campuran
            $table->boolean('wifi_included')->default(false);
            $table->boolean('electricity_included')->default(false);
            $table->boolean('water_included')->default(false);
            $table->boolean('shared_kitchen')->default(false);
            $table->boolean('parking_area')->default(false);
            $table->boolean('cctv')->default(false);

            // ============================
            // 🏪 KHUSUS RUKO
            // ============================
            $table->integer('parking_capacity')->nullable()->default(0);
            $table->integer('warehouse_area')->nullable()->default(0);
            $table->decimal('shop_front_width', 8, 2)->nullable(); // Lebar depan toko (meter)

            // ============================
            // 🌾 KHUSUS TANAH
            // ============================
            $table->enum('land_type', ['datar', 'miring', 'bukit'])->nullable();
            $table->string('land_contour', 100)->nullable();
            $table->string('zoning', 100)->nullable();

            // ============================
            // 🏡 KHUSUS VILLA
            // ============================
            $table->boolean('swimming_pool')->default(false);
            $table->boolean('private_pool')->default(false);
            $table->string('view_type', 100)->nullable();
            $table->boolean('furnished')->default(false);
            $table->boolean('near_tourism')->default(false);

            // ============================
            // ⚙️ SYSTEM FIELDS
            // ============================
            $table->timestamps();
            $table->index('property_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('property_details');
    }
};
