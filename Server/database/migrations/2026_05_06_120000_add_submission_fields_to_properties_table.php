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
            $table->string('certificate_file', 255)->nullable()->after('certificate_status');
            $table->string('electric_bill_file', 255)->nullable()->after('certificate_file');
            $table->string('water_bill_file', 255)->nullable()->after('electric_bill_file');
            $table->boolean('is_verified')->default(false)->after('status');
        });

        // Existing properties are assumed valid/published by admins.
        DB::table('properties')->update(['is_verified' => true]);
    }

    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->dropColumn([
                'certificate_file',
                'electric_bill_file',
                'water_bill_file',
                'is_verified',
            ]);
        });
    }
};
