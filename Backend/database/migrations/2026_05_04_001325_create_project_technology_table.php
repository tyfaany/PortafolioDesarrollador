<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_technology', function (Blueprint $table) {
            $table->id();
            // projects.id is bigint unsigned in current schema
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('project_technology_id')->constrained('project_technologies')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_technology');
    }
};
