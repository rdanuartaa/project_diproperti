<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('view_events', function (Blueprint $table) {
            $table->id();
            $table->string('viewable_type', 30);
            $table->unsignedBigInteger('viewable_id')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('visitor_hash', 64);
            $table->string('ip_hash', 64)->nullable();
            $table->string('user_agent_hash', 64)->nullable();
            $table->string('url')->nullable();
            $table->timestamp('viewed_at')->useCurrent();
            $table->timestamps();

            $table->index(['viewable_type', 'viewable_id']);
            $table->index(['viewed_at']);
            $table->index(['visitor_hash', 'viewable_type', 'viewable_id', 'viewed_at'], 'view_events_dedupe_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('view_events');
    }
};
