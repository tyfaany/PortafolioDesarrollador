<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::table('studies', function (Blueprint $table) {

            // Solo eliminar en bases de datos que no sean SQLite (para evitar errores en tests de memoria)
            if (\Illuminate\Support\Facades\DB::getDriverName() !== 'sqlite') {
                // Eliminar foreign keys primero
                $table->dropForeign(['month_id']);
                $table->dropForeign(['year_id']);

                // Eliminar columnas
                $table->dropColumn(['month_id', 'year_id']);
            }

            // Agregar nuevas columnas
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('studies', function (Blueprint $table) {
            if (\Illuminate\Support\Facades\DB::getDriverName() !== 'sqlite') {
                $table->foreignId('month_id')->nullable()->constrained();
                $table->foreignId('year_id')->nullable()->constrained();
            }
            $table->dropColumn(['start_date', 'end_date']);
        });
    }
};
