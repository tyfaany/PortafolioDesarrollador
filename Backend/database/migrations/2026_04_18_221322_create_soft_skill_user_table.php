<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('soft_skill_user', function (Blueprint $table) {
            $table->id();
            
            // Llaves foráneas que conectan al usuario con la habilidad blanda
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('soft_skill_id')->constrained()->onDelete('cascade');
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('soft_skill_user');
    }
};