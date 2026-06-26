<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB; // Importante para que funcione DB::statement

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Renombrar y cambiar tamaño de github_url
        if (DB::getDriverName() === 'sqlite') {
            DB::statement("ALTER TABLE users RENAME COLUMN github_username TO github_url");
        } else {
            DB::statement("ALTER TABLE users CHANGE github_username github_url VARCHAR(200) NULL");
        }

        // 2. Modificar biography a TEXT (SQLite no lo necesita ya que no tiene límites estrictos de VARCHAR)
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE users MODIFY COLUMN biography TEXT NULL");
        }

        Schema::table('users', function (Blueprint $table) {
            // 3. Crear el nuevo campo
            $table->boolean('profile_completed')->default(false);

            // 4. Eliminar la columna de imagen
            $table->dropColumn('profile_image');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // 1. Recreamos la columna de imagen para no romper el rollback
            $table->string('profile_image')->nullable();

            // 2. Eliminamos el campo que creamos en el up
            $table->dropColumn('profile_completed');
        });

        // 3. Revertimos biography a su estado anterior (VARCHAR 255)
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE users MODIFY COLUMN biography VARCHAR(255) NULL");
        }

        // 4. Revertimos el nombre de la columna de GitHub
        if (DB::getDriverName() === 'sqlite') {
            DB::statement("ALTER TABLE users RENAME COLUMN github_url TO github_username");
        } else {
            DB::statement("ALTER TABLE users CHANGE github_url github_username VARCHAR(100) NULL");
        }
    }
};
