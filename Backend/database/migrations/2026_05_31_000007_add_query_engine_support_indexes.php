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
        Schema::table('users', function (Blueprint $table): void {
            $table->index('profile_completed', 'users_profile_completed_index');
        });

        Schema::table('projects', function (Blueprint $table): void {
            $table->index('is_public', 'projects_is_public_index');
            $table->index(['user_id', 'created_at'], 'projects_user_id_created_at_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table): void {
            $table->dropIndex('projects_user_id_created_at_index');
            $table->dropIndex('projects_is_public_index');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex('users_profile_completed_index');
        });
    }
};
