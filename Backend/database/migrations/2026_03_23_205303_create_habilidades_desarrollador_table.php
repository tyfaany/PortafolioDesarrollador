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
        Schema::create('habilidades_desarrollador', function (Blueprint $table) {
        $table->id();
        // Conecta con el Perfil
        $table->foreignId('id_desarrollador')->constrained('perfiles_desarrolladores')->onDelete('cascade');
        
        // Conecta con Habilidades Técnicas (puede ser nulo si solo es blanda)
        $table->foreignId('id_habilidad_tecnica')->nullable()->constrained('habilidades_tecnicas')->onDelete('cascade');
        
        // Conecta con Habilidades Blandas (puede ser nulo si solo es técnica)
        $table->foreignId('id_habilidad_blanda')->nullable()->constrained('habilidades_blandas')->onDelete('cascade');
        
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('habilidades_desarrollador');
    }
};
