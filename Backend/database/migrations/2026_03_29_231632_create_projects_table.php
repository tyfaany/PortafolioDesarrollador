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
            // Requerimiento HU-15: ID único (UUID)[cite: 2]
            $table->uuid('id')->primary(); 
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // Requerimiento HU-15: Título y Descripción con límites[cite: 2]
            $table->string('title', 100);
            $table->string('description', 500);
            
            // Imagen principal
            $table->string('image_path')->nullable();
            
            // Fechas y estado
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->boolean('is_in_progress')->default(false);
            
            // URLs
            $table->string('demo_url')->nullable();
            $table->string('repo_url')->nullable();
            
            // Requerimiento HU-17: Visibilidad (Público por defecto)[cite: 2]
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