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
        Schema::create('experiencias_laborales', function (Blueprint $table) {
        $table->id();
        // Relación con el perfil del desarrollador
        $table->foreignId('id_desarrollador')->constrained('perfiles_desarrolladores')->onDelete('cascade');
        
        $table->string('nombre_empresa', 100);
        $table->string('puesto', 100);
        $table->string('ubicacion_trabajo', 100)->nullable();
        $table->date('fecha_inicio');
        $table->date('fecha_fin')->nullable(); // Nullable por si es el trabajo actual
        $table->text('logros')->nullable();
        $table->string('enlace_linkedin', 200)->nullable();
        $table->string('enlace_github', 200)->nullable();
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('experiencias_laborales');
    }
};
