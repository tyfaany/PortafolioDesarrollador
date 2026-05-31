<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function normalizeName(string $name): string
    {
        return mb_strtolower(trim($name), 'UTF-8');
    }

    private function deduplicateSkillTable(string $table, ?string $pivotTable = null, ?string $pivotColumn = null): void
    {
        $duplicates = DB::select(
            "SELECT LOWER(TRIM(name)) AS normalized_name, COUNT(*) AS total
             FROM {$table}
             GROUP BY LOWER(TRIM(name))
             HAVING COUNT(*) > 1"
        );

        foreach ($duplicates as $duplicate) {
            $normalizedName = $duplicate->normalized_name;

            $rows = DB::table($table)
                ->select('id', 'name')
                ->whereRaw('LOWER(TRIM(name)) = ?', [$normalizedName])
                ->orderBy('id')
                ->get();

            if ($rows->isEmpty()) {
                continue;
            }

            $keepId = $rows->first()->id;
            $duplicateIds = $rows->pluck('id')->slice(1)->values()->all();

            DB::table($table)
                ->where('id', $keepId)
                ->update(['name' => $this->normalizeName($rows->first()->name)]);

            if ($pivotTable && $pivotColumn && ! empty($duplicateIds)) {
                DB::table($pivotTable)
                    ->whereIn($pivotColumn, $duplicateIds)
                    ->update([$pivotColumn => $keepId]);
            }

            if (! empty($duplicateIds)) {
                DB::table($table)
                    ->whereIn('id', $duplicateIds)
                    ->delete();
            }
        }

        DB::table($table)->get()->each(function ($row) use ($table) {
            $normalizedName = $this->normalizeName($row->name);
            if ($row->name !== $normalizedName) {
                DB::table($table)
                    ->where('id', $row->id)
                    ->update(['name' => $normalizedName]);
            }
        });
    }

    public function up(): void
    {
        if (Schema::hasTable('soft_skills')) {
            $this->deduplicateSkillTable('soft_skills', 'soft_skill_user', 'soft_skill_id');

            Schema::table('soft_skills', function (Blueprint $table) {
                $table->unique('name');
            });
        }

        if (Schema::hasTable('technical_skills')) {
            $this->deduplicateSkillTable('technical_skills', 'user_skills', 'technical_skill_id');

            Schema::table('technical_skills', function (Blueprint $table) {
                $table->unique('name');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('soft_skills')) {
            Schema::table('soft_skills', function (Blueprint $table) {
                $table->dropUnique(['name']);
            });
        }

        if (Schema::hasTable('technical_skills')) {
            Schema::table('technical_skills', function (Blueprint $table) {
                $table->dropUnique(['name']);
            });
        }
    }
};
