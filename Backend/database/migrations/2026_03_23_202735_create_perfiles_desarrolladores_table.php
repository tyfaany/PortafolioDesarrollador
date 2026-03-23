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
      Schema::create('perfiles_desarrolladores', function (Blueprint $table) {
            $table->id(); // Tu PK (id)
            $table->string('nombre', 100);
            $table->string('profesion', 100);
            $table->text('biografia')->nullable(); // Text para descripciones largas
            $table->string('correo', 100)->unique();
            $table->string('contraseña', 100);
            $table->string('telefono', 15)->nullable();
            $table->string('nombre_usuario_github', 100)->nullable();
            $table->timestamps(); // Crea created_at y updated_at
        });  
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('perfiles_desarrolladores');
    }
};
