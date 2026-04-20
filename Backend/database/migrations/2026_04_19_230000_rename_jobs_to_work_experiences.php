<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('jobs') && !Schema::hasTable('work_experiences')) {
            Schema::rename('jobs', 'work_experiences');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('work_experiences') && !Schema::hasTable('jobs')) {
            Schema::rename('work_experiences', 'jobs');
        }
    }
};
