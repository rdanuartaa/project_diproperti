<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('image')->nullable();
            $table->string('title', 255);
            $table->string('slug', 255)->unique();
            $table->text('description')->nullable();
            $table->text('content');
            $table->timestamps();

            $table->index('slug');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
