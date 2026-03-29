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
    Schema::create('jobs', function (Blueprint $table) {
        $table->id();
        // Relación con el programador
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        
        $table->string('company_name', 100);
        $table->string('job_title', 100); // Ejemplo: Junior Developer
        $table->text('description')->nullable(); // Tareas realizadas
        
        // Fecha de Inicio
        $table->foreignId('start_month_id')->nullable()->constrained('months')->onDelete('set null');
        $table->foreignId('start_year_id')->nullable()->constrained('years')->onDelete('set null');
        
        // Fecha de Fin (puede ser null si sigue trabajando ahí)
        $table->foreignId('end_month_id')->nullable()->constrained('months')->onDelete('set null');
        $table->foreignId('end_year_id')->nullable()->constrained('years')->onDelete('set null');
        
        $table->boolean('is_current_job')->default(false); // Checkbox de "Trabajo actualmente aquí"
        
        $table->timestamps();
    });
}
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jobs');
    }
};
