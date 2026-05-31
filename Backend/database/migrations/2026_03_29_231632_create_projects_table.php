<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            // Clave primaria compatible con el estado real del esquema.
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            $table->string('name', 100);
            $table->text('description');
            $table->string('image_path')->nullable();
            $table->string('image_original_name')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->boolean('is_in_progress')->default(false);
            $table->string('demo_url', 2048)->nullable();
            $table->string('repository_url', 2048)->nullable();
            $table->boolean('is_public')->default(true);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
