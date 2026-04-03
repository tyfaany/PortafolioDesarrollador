<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    
    public function up(): void
    {
        Schema::dropIfExists('months');
        Schema::dropIfExists('years');
    }

    public function down(): void
    {
         Schema::create('months', function ($table) {
            $table->id();
            $table->string('month', 50);
            $table->timestamps();
        });
        Schema::create('years', function ($table) {
             
            $table->id();
            $table->unsignedSmallInteger('year');
            $table->timestamps();
        });
    }
};
