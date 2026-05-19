<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('property_details', function (Blueprint $table) {
            if (!Schema::hasColumn('property_details', 'working_area')) {
                $table->integer('working_area')->nullable()->default(0)->after('shop_front_width');
            }
        });
    }

    public function down(): void
    {
        Schema::table('property_details', function (Blueprint $table) {
            if (Schema::hasColumn('property_details', 'working_area')) {
                $table->dropColumn('working_area');
            }
        });
    }
};
