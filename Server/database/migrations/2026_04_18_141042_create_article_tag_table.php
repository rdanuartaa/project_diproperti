<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('article_tag', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary();
            $table->unsignedBigInteger('article_id');
            $table->unsignedBigInteger('tag_id');
            $table->timestamps();

            $table->foreign('article_id')->references('id')->on('articles')->onDelete('cascade');
            $table->foreign('tag_id')->references('id')->on('tags')->onDelete('cascade');

            $table->unique(['article_id', 'tag_id']);

            $table->index('article_id');
            $table->index('tag_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('article_tag');
    }
};
