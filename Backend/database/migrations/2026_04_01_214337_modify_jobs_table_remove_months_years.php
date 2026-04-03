<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
     public function up(): void
    {
        Schema::table('jobs', function (Blueprint $table) {

          
            $table->dropForeign(['start_month_id']);
            $table->dropForeign(['start_year_id']);
            $table->dropForeign(['end_month_id']);
            $table->dropForeign(['end_year_id']);

   
            $table->dropColumn([
                'start_month_id',
                'start_year_id',
                'end_month_id',
                'end_year_id'
            ]);

    
            $table->date('start_date')->nullable()->after('description');
            $table->date('end_date')->nullable()->after('start_date');
        });
    }

    public function down(): void
    {
        Schema::table('jobs', function (Blueprint $table) {

            // Restaurar columnas anteriores
            $table->foreignId('start_month_id')->nullable()->constrained('months')->nullOnDelete();
            $table->foreignId('start_year_id')->nullable()->constrained('years')->nullOnDelete();
            $table->foreignId('end_month_id')->nullable()->constrained('months')->nullOnDelete();
            $table->foreignId('end_year_id')->nullable()->constrained('years')->nullOnDelete();

            // Eliminar fechas
            $table->dropColumn(['start_date', 'end_date']);
        });
    }
};
