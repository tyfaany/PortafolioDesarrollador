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
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('linkedin_linked')->default(false)->after('linkedin_url');
        });

        DB::table('users')
            ->whereIn('id', function ($query) {
                $query->select('user_id')
                    ->from('social_accounts')
                    ->where('provider', 'linkedin');
            })
            ->update(['linkedin_linked' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('linkedin_linked');
        });
    }
};
