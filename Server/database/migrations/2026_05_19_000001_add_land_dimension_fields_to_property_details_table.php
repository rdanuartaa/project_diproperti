<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('property_details', function (Blueprint $table) {
            if (!Schema::hasColumn('property_details', 'panjang_tanah')) {
                $table->decimal('panjang_tanah', 8, 2)->nullable()->after('shop_front_width');
            }

            if (!Schema::hasColumn('property_details', 'lebar_tanah')) {
                $table->decimal('lebar_tanah', 8, 2)->nullable()->after('panjang_tanah');
            }
        });
    }

    public function down(): void
    {
        Schema::table('property_details', function (Blueprint $table) {
            if (Schema::hasColumn('property_details', 'lebar_tanah')) {
                $table->dropColumn('lebar_tanah');
            }

            if (Schema::hasColumn('property_details', 'panjang_tanah')) {
                $table->dropColumn('panjang_tanah');
            }
        });
    }
};
