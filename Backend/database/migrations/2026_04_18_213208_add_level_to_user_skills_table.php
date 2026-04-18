<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_skills', function (Blueprint $table) {
            // Agregamos la columna 'level' con un valor por defecto
            $table->enum('level', ['Basico', 'Intermedio', 'Avanzado'])->default('Basico')->after('technical_skill_id');
        });
    }

    public function down(): void
    {
        Schema::table('user_skills', function (Blueprint $table) {
            $table->dropColumn('level');
        });
    }
};