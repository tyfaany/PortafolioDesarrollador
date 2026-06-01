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
            $table->boolean('show_in_search')->default(true)->after('user_id');
        });

        DB::table('user_visibility')->update([
            'show_in_search' => true,
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('user_visibility', 'show_in_search')) {
            Schema::table('user_visibility', function (Blueprint $table) {
                $table->dropColumn('show_in_search');
            });
        }
    }
};
