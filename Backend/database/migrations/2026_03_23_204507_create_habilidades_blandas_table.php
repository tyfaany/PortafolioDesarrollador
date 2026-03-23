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
        Schema::create('habilidades_blandas', function (Blueprint $table) {
        $table->id();
        $table->foreignId('id_desarrollador')->constrained('perfiles_desarrolladores')->onDelete('cascade');
        $table->string('nombre_habilidad', 100);
        $table->string('nivel', 50);
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('habilidades_blandas');
    }
};
