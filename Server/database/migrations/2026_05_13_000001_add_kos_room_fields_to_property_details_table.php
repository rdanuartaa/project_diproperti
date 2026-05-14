<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('property_details', function (Blueprint $table) {
            if (!Schema::hasColumn('property_details', 'panjang_ruangan')) {
                $table->decimal('panjang_ruangan', 8, 2)->nullable()->after('total_rooms');
            }
            if (!Schema::hasColumn('property_details', 'lebar_ruangan')) {
                $table->decimal('lebar_ruangan', 8, 2)->nullable()->after('panjang_ruangan');
            }
            if (!Schema::hasColumn('property_details', 'bathroom_position')) {
                $table->enum('bathroom_position', ['dalam', 'luar'])->nullable()->after('bathrooms');
            }
        });
    }

    public function down(): void
    {
        Schema::table('property_details', function (Blueprint $table) {
            if (Schema::hasColumn('property_details', 'bathroom_position')) {
                $table->dropColumn('bathroom_position');
            }
            if (Schema::hasColumn('property_details', 'lebar_ruangan')) {
                $table->dropColumn('lebar_ruangan');
            }
            if (Schema::hasColumn('property_details', 'panjang_ruangan')) {
                $table->dropColumn('panjang_ruangan');
            }
        });
    }
};
