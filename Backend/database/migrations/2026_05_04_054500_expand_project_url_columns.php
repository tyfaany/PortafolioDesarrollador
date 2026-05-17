<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE projects MODIFY demo_url VARCHAR(2048) NULL');
        // Aquí está el cambio al nombre correcto: repo_url
        DB::statement('ALTER TABLE projects MODIFY repo_url VARCHAR(2048) NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE projects MODIFY demo_url VARCHAR(200) NULL');
        // Y aquí también: repo_url
        DB::statement('ALTER TABLE projects MODIFY repo_url VARCHAR(200) NULL');
    }
};