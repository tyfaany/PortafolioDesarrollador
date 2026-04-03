<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    
    public function up(): void
    {
        Schema::table('studies', function (Blueprint $table) {
            
            // Eliminar foreign keys primero
            $table->dropForeign(['month_id']);
            $table->dropForeign(['year_id']);

            // Eliminar columnas
            $table->dropColumn(['month_id', 'year_id']);

            // Agregar nuevas columnas
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('studies', function (Blueprint $table) {
            $table->foreignId('month_id')->nullable()->constrained();
            $table->foreignId('year_id')->nullable()->constrained();
            $table->dropColumn(['start_date', 'end_date']);
        });
    }
};
