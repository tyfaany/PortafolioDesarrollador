<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE projects MODIFY demo_url VARCHAR(2048) NULL');
            DB::statement('ALTER TABLE projects MODIFY repository_url VARCHAR(2048) NULL');
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE projects MODIFY demo_url VARCHAR(200) NULL');
            DB::statement('ALTER TABLE projects MODIFY repository_url VARCHAR(200) NULL');
        }
    }
};
