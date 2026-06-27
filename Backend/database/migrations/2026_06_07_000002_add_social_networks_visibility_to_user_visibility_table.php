<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('user_visibility', function (Blueprint $table) {
            $table->boolean('show_instagram')->default(true)->after('show_address');
            $table->boolean('show_facebook')->default(true)->after('show_instagram');
        });

        DB::table('user_visibility')->update([
            'show_instagram' => true,
            'show_facebook' => true,
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('user_visibility', 'show_facebook')) {
            Schema::table('user_visibility', function (Blueprint $table) {
                $table->dropColumn('show_facebook');
            });
        }

        if (Schema::hasColumn('user_visibility', 'show_instagram')) {
            Schema::table('user_visibility', function (Blueprint $table) {
                $table->dropColumn('show_instagram');
            });
        }
    }
};
