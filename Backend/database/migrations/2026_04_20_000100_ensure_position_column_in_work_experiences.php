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

        if (!Schema::hasColumn('work_experiences', 'position')) {
            Schema::table('work_experiences', function (Blueprint $table) {
                $table->string('position', 100)->nullable()->after('company_name');
            });
        }

        $possibleLegacyColumns = ['role', 'job_title', 'title', 'cargo'];
        foreach ($possibleLegacyColumns as $legacyColumn) {
            if (Schema::hasColumn('work_experiences', $legacyColumn)) {
                DB::statement(
                    "UPDATE work_experiences
                     SET position = COALESCE(position, {$legacyColumn})
                     WHERE position IS NULL"
                );
            }
        }
    }

    public function down(): void
    {
        // No-op: evitamos borrar columnas en rollback por seguridad de datos.
    }
};
