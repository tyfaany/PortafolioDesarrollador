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
        Schema::table('users', function (Blueprint $table) {
            // Añadimos la columna 'profile_photo' justo después del 'email'.
            // Le ponemos nullable() porque al registrarse, el usuario aún no tiene foto.
            $table->string('profile_photo')->nullable()->after('email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Si algún día revertimos esto, borramos la columna.
            $table->dropColumn('profile_photo');
        });
    }
};