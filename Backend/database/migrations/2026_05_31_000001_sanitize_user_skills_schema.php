<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('user_skills')) {
            Schema::table('user_skills', function (Blueprint $table) {
                if (Schema::hasColumn('user_skills', 'level_id')) {
                    $table->dropForeign('developer_skills_level_id_foreign');
                    $table->dropColumn('level_id');
                }

                if (Schema::hasColumn('user_skills', 'soft_skill_id')) {
                    $table->dropForeign('developer_skills_soft_skill_id_foreign');
                    $table->dropColumn('soft_skill_id');
                }

                if (Schema::hasColumn('user_skills', 'user_id')) {
                    $table->dropForeign('developer_skills_user_id_foreign');
                    $table->foreign('user_id')
                        ->references('id')
                        ->on('users')
                        ->onDelete('cascade');
                }

                if (Schema::hasColumn('user_skills', 'technical_skill_id')) {
                    $table->dropForeign('developer_skills_technical_skill_id_foreign');
                    $table->foreign('technical_skill_id')
                        ->references('id')
                        ->on('technical_skills')
                        ->onDelete('cascade');
                }
            });
        }

        if (Schema::hasTable('levels')) {
            Schema::drop('levels');
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('levels')) {
            Schema::create('levels', function (Blueprint $table) {
                $table->id();
                $table->string('level', 50);
                $table->timestamps();
            });
        }

        if (Schema::hasTable('user_skills')) {
            Schema::table('user_skills', function (Blueprint $table) {
                if (! Schema::hasColumn('user_skills', 'level_id')) {
                    $table->foreignId('level_id')
                        ->nullable()
                        ->after('technical_skill_id')
                        ->constrained('levels', 'id', 'developer_skills_level_id_foreign')
                        ->nullOnDelete();
                }

                if (! Schema::hasColumn('user_skills', 'soft_skill_id')) {
                    $table->foreignId('soft_skill_id')
                        ->nullable()
                        ->after('level_id')
                        ->constrained('soft_skills', 'id', 'developer_skills_soft_skill_id_foreign')
                        ->nullOnDelete();
                }

                if (Schema::hasColumn('user_skills', 'user_id')) {
                    $table->dropForeign('user_skills_user_id_foreign');
                }

                if (Schema::hasColumn('user_skills', 'technical_skill_id')) {
                    $table->dropForeign('user_skills_technical_skill_id_foreign');
                }

                if (Schema::hasColumn('user_skills', 'user_id')) {
                    $table->foreign('user_id', 'developer_skills_user_id_foreign')
                        ->references('id')
                        ->on('users')
                        ->onDelete('cascade');
                }

                if (Schema::hasColumn('user_skills', 'technical_skill_id')) {
                    $table->foreign('technical_skill_id', 'developer_skills_technical_skill_id_foreign')
                        ->references('id')
                        ->on('technical_skills')
                        ->onDelete('cascade');
                }
            });
        }
    }
};
