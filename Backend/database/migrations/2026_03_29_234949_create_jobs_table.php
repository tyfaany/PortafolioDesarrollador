<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jobs', function (Blueprint $table) {
            $table->id();
            
            // Relación con el usuario
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // Datos del empleo
            $table->string('company_name', 100);
            $table->string('position', 100); // Puesto o Cargo
            $table->text('achievements')->nullable(); // Logros (área de texto multilinea)
            
            // Fechas simplificadas (Sin anti-patrones de relaciones)
            // Se guardarán como strings (ej. "Enero", "Febrero") o enteros (ej. 2023)
            $table->string('start_month', 20);
            $table->integer('start_year');
            
            $table->string('end_month', 20)->nullable();
            $table->integer('end_year')->nullable();
            
            // Estado actual
            $table->boolean('is_current_job')->default(false);
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jobs');
    }
};