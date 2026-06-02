<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            if (!Schema::hasColumn('properties', 'rent_period')) {
                $table->enum('rent_period', [
                    'hari',
                    'minggu',
                    'bulan',
                    '3bulan',
                    '6bulan',
                    'tahun',
                ])->nullable()->default('bulan')->after('listing_type');
            }
        });

        DB::table('properties')
            ->where('listing_type', '!=', 'sewa')
            ->update(['rent_period' => null]);
    }

    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            if (Schema::hasColumn('properties', 'rent_period')) {
                $table->dropColumn('rent_period');
            }
        });
    }
};
