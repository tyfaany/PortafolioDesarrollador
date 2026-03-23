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
        Schema::create('experiencias_academicas', function (Blueprint $table) {
        $table->id();
        $table->foreignId('id_desarrollador')->constrained('perfiles_desarrolladores')->onDelete('cascade');
        $table->string('institucion_academica', 100);
        $table->string('titulo', 100);
        $table->date('fecha_inicio');
        $table->date('fecha_fin')->nullable();
        $table->text('logros')->nullable();
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('experiencias_academicas');
    }
};
