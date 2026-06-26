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
            // 1. Añadimos el campo para identificar al usuario en LinkedIn si no existe
            if (!Schema::hasColumn('users', 'linkedin_id')) {
                $table->string('linkedin_id')->nullable()->unique();
            }
            
            // 2. Modificamos tu contraseña actual para que permita valores vacíos (null)
            if (\Illuminate\Support\Facades\DB::getDriverName() !== 'sqlite') {
                $table->string('password')->nullable()->change();
            }
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('linkedin_id');
            if (\Illuminate\Support\Facades\DB::getDriverName() !== 'sqlite') {
                $table->string('password')->nullable(false)->change(); // Revierte el cambio si eliminas la migración
            }
        });
    }
};
