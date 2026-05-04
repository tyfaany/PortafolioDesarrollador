<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            if (!Schema::hasColumn('projects', 'image_path')) {
                $table->string('image_path')->nullable()->after('description');
            }

            if (!Schema::hasColumn('projects', 'is_in_progress')) {
                $table->boolean('is_in_progress')->default(false)->after('end_date');
            }

            if (!Schema::hasColumn('projects', 'is_public')) {
                $table->boolean('is_public')->default(true)->after('repository_url');
            }
        });

        if (Schema::hasColumn('projects', 'is_in_progress')) {
            DB::statement('UPDATE projects SET is_in_progress = 1 WHERE end_date IS NULL AND start_date IS NOT NULL');
        }
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            if (Schema::hasColumn('projects', 'is_public')) {
                $table->dropColumn('is_public');
            }

            if (Schema::hasColumn('projects', 'is_in_progress')) {
                $table->dropColumn('is_in_progress');
            }

            if (Schema::hasColumn('projects', 'image_path')) {
                $table->dropColumn('image_path');
            }
        });
    }
};

