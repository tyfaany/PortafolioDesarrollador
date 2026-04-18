<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Eliminamos la tabla que mezclaba todo
        Schema::dropIfExists('user_skills');

        // 2. Creamos la tabla pivot para Habilidades Técnicas (Con Nivel)
        Schema::create('user_technical_skill', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('technical_skill_id')->constrained()->onDelete('cascade');
            $table->foreignId('level_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });

        // 3. Creamos la tabla pivot para Habilidades Blandas (Sin Nivel)
        Schema::create('user_soft_skill', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('soft_skill_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        // Por si necesitas revertir los cambios
        Schema::dropIfExists('user_soft_skill');
        Schema::dropIfExists('user_technical_skill');
        
        // Recreamos la tabla vieja por si acaso
        Schema::create('developer_skills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('level_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('technical_skill_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('soft_skill_id')->nullable()->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }
};