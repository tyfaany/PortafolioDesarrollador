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
      Schema::create('proyectos_personales', function (Blueprint $table) {
        $table->id(); // PK (id)
        
        // Esta línea es la "flecha" de tu Miro que conecta con el Perfil
        $table->foreignId('id_desarrollador')
              ->constrained('perfiles_desarrolladores')
              ->onDelete('cascade');

        $table->string('nombre_del_proyecto', 100);
        $table->text('descripcion')->nullable();
        $table->string('enlace_repositorio', 200)->nullable();
        $table->string('enlace_demo', 200)->nullable();
        $table->date('fecha_inicio')->nullable();
        $table->date('fecha_fin')->nullable();
        $table->integer('estrellas')->default(0); // Para estrellas de GitHub
        $table->boolean('esVisible')->default(true);
        $table->timestamps();
    });  
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proyectos_personales');
    }
};
