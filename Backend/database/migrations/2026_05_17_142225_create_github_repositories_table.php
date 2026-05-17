<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('github_repositories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // El ID original que nos devuelva la API de GitHub
            $table->unsignedBigInteger('github_id')->unique(); 
            
            // Datos del repositorio según HU-22
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('html_url'); // Para el botón "Ver en GitHub"
            $table->integer('stars_count')->default(0);
            $table->integer('forks_count')->default(0);
            $table->string('language')->nullable();
            
            // Banderas lógicas
            $table->boolean('is_fork')->default(false); // Indicar visualmente si es un FORK
            $table->boolean('is_visible')->default(false); // Para controlar el máximo de 15 seleccionados
            
            // Fechas
            $table->timestamp('pushed_at')->nullable(); // Última actualización en GitHub
            $table->timestamps(); // Fechas de creación/edición en nuestro sistema
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('github_repositories');
    }
};