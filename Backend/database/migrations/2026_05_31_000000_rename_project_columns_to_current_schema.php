<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('projects', 'title') && ! Schema::hasColumn('projects', 'name')) {
            DB::statement('ALTER TABLE projects RENAME COLUMN title TO name');
        }

        if (Schema::hasColumn('projects', 'repo_url') && ! Schema::hasColumn('projects', 'repository_url')) {
            DB::statement('ALTER TABLE projects RENAME COLUMN repo_url TO repository_url');
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('projects', 'name') && ! Schema::hasColumn('projects', 'title')) {
            DB::statement('ALTER TABLE projects RENAME COLUMN name TO title');
        }

        if (Schema::hasColumn('projects', 'repository_url') && ! Schema::hasColumn('projects', 'repo_url')) {
            DB::statement('ALTER TABLE projects RENAME COLUMN repository_url TO repo_url');
        }
    }
};
