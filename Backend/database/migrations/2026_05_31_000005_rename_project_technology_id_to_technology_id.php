<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('project_technology')
            && Schema::hasColumn('project_technology', 'project_technology_id')
            && ! Schema::hasColumn('project_technology', 'technology_id')) {
            DB::statement('ALTER TABLE project_technology CHANGE COLUMN project_technology_id technology_id BIGINT UNSIGNED NOT NULL');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('project_technology')
            && Schema::hasColumn('project_technology', 'technology_id')
            && ! Schema::hasColumn('project_technology', 'project_technology_id')) {
            DB::statement('ALTER TABLE project_technology CHANGE COLUMN technology_id project_technology_id BIGINT UNSIGNED NOT NULL');
        }
    }
};
