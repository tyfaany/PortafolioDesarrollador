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
        $table->boolean('show_phone')->default(false);
        $table->boolean('show_mobile')->default(false);
        $table->boolean('show_contact_email')->default(false);
        $table->boolean('show_address')->default(false);
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn([
            'show_phone',
            'show_mobile',
            'show_contact_email',
            'show_address',
        ]);
    });
}
};
