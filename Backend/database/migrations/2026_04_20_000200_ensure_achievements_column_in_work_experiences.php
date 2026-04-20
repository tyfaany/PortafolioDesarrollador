<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('work_experiences')) {
            return;
        }

        if (!Schema::hasColumn('work_experiences', 'achievements')) {
            Schema::table('work_experiences', function (Blueprint $table) {
                $table->text('achievements')->nullable()->after('position');
            });
        }

        $possibleLegacyColumns = ['achievement', 'achivement', 'achivements', 'description', 'logros'];
        foreach ($possibleLegacyColumns as $legacyColumn) {
            if (Schema::hasColumn('work_experiences', $legacyColumn)) {
                DB::statement(
                    "UPDATE work_experiences
                     SET achievements = COALESCE(achievements, {$legacyColumn})
                     WHERE achievements IS NULL"
                );
            }
        }
    }

    public function down(): void
    {
        // No-op: evitamos borrar columnas en rollback por seguridad de datos.
    }
};
