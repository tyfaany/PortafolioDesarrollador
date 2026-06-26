<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function normalizeMonthCaseSql(string $column, bool $allowNull = false): string
    {
        $fallback = $allowNull ? 'NULL' : '1';

        return "CASE
            WHEN {$column} IS NULL OR TRIM({$column}) = '' THEN {$fallback}
            WHEN LOWER(TRIM({$column})) IN ('1', '01', 'enero') THEN 1
            WHEN LOWER(TRIM({$column})) IN ('2', '02', 'febrero') THEN 2
            WHEN LOWER(TRIM({$column})) IN ('3', '03', 'marzo') THEN 3
            WHEN LOWER(TRIM({$column})) IN ('4', '04', 'abril') THEN 4
            WHEN LOWER(TRIM({$column})) IN ('5', '05', 'mayo') THEN 5
            WHEN LOWER(TRIM({$column})) IN ('6', '06', 'junio') THEN 6
            WHEN LOWER(TRIM({$column})) IN ('7', '07', 'julio') THEN 7
            WHEN LOWER(TRIM({$column})) IN ('8', '08', 'agosto') THEN 8
            WHEN LOWER(TRIM({$column})) IN ('9', '09', 'septiembre') THEN 9
            WHEN LOWER(TRIM({$column})) IN ('10', 'octubre') THEN 10
            WHEN LOWER(TRIM({$column})) IN ('11', 'noviembre') THEN 11
            WHEN LOWER(TRIM({$column})) IN ('12', 'diciembre') THEN 12
            ELSE {$fallback}
        END";
    }

    public function up(): void
    {
        if (! Schema::hasTable('work_experiences')) {
            return;
        }

        if (Schema::hasColumn('work_experiences', 'start_month')) {
            DB::statement(
                'UPDATE work_experiences SET start_month = '.$this->normalizeMonthCaseSql('start_month', false)
            );
        }

        if (Schema::hasColumn('work_experiences', 'end_month')) {
            DB::statement(
                'UPDATE work_experiences SET end_month = '.$this->normalizeMonthCaseSql('end_month', true)
            );
        }

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE work_experiences MODIFY start_month TINYINT UNSIGNED NOT NULL');
            DB::statement('ALTER TABLE work_experiences MODIFY end_month TINYINT UNSIGNED NULL');
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('work_experiences')) {
            return;
        }

        if (Schema::hasColumn('work_experiences', 'start_month')) {
            DB::statement(
                "UPDATE work_experiences SET start_month = CASE
                    WHEN start_month = 1 THEN 'Enero'
                    WHEN start_month = 2 THEN 'Febrero'
                    WHEN start_month = 3 THEN 'Marzo'
                    WHEN start_month = 4 THEN 'Abril'
                    WHEN start_month = 5 THEN 'Mayo'
                    WHEN start_month = 6 THEN 'Junio'
                    WHEN start_month = 7 THEN 'Julio'
                    WHEN start_month = 8 THEN 'Agosto'
                    WHEN start_month = 9 THEN 'Septiembre'
                    WHEN start_month = 10 THEN 'Octubre'
                    WHEN start_month = 11 THEN 'Noviembre'
                    WHEN start_month = 12 THEN 'Diciembre'
                    ELSE 'Enero'
                END"
            );
        }

        if (Schema::hasColumn('work_experiences', 'end_month')) {
            DB::statement(
                "UPDATE work_experiences SET end_month = CASE
                    WHEN end_month IS NULL THEN NULL
                    WHEN end_month = 1 THEN 'Enero'
                    WHEN end_month = 2 THEN 'Febrero'
                    WHEN end_month = 3 THEN 'Marzo'
                    WHEN end_month = 4 THEN 'Abril'
                    WHEN end_month = 5 THEN 'Mayo'
                    WHEN end_month = 6 THEN 'Junio'
                    WHEN end_month = 7 THEN 'Julio'
                    WHEN end_month = 8 THEN 'Agosto'
                    WHEN end_month = 9 THEN 'Septiembre'
                    WHEN end_month = 10 THEN 'Octubre'
                    WHEN end_month = 11 THEN 'Noviembre'
                    WHEN end_month = 12 THEN 'Diciembre'
                    ELSE NULL
                END"
            );
        }

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE work_experiences MODIFY start_month VARCHAR(20) NOT NULL');
            DB::statement('ALTER TABLE work_experiences MODIFY end_month VARCHAR(20) NULL');
        }
    }
};
