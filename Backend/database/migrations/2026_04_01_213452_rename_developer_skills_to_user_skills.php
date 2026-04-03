<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
     public function up(): void
    {
        Schema::rename('developer_skills', 'user_skills');
    }

    public function down(): void
    {
        Schema::rename('user_skills', 'developer_skills');
    }
};
