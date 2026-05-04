<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('show_bio')->default(true);
            $table->boolean('show_studies')->default(true);
            $table->boolean('show_jobs')->default(true);
            $table->boolean('show_skills')->default(true);
            $table->boolean('show_social_links')->default(true);
            $table->boolean('show_profile_photo')->default(true);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'show_bio',
                'show_studies',
                'show_jobs',
                'show_skills',
                'show_social_links',
                'show_profile_photo',
            ]);
        });
    }
};
