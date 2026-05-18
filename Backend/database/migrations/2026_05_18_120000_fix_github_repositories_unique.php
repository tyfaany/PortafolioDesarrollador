<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('github_repositories', function (Blueprint $table) {
            $table->dropUnique('github_repositories_github_id_unique');
            $table->unique(['user_id', 'github_id'], 'github_repositories_user_id_github_id_unique');
        });
    }

    public function down(): void
    {
        Schema::table('github_repositories', function (Blueprint $table) {
            $table->dropUnique('github_repositories_user_id_github_id_unique');
            $table->unique('github_id', 'github_repositories_github_id_unique');
        });
    }
};
