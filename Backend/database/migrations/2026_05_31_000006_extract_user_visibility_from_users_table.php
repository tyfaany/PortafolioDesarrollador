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
        Schema::create('user_visibility', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->boolean('show_bio')->default(true);
            $table->boolean('show_studies')->default(true);
            $table->boolean('show_jobs')->default(true);
            $table->boolean('show_skills')->default(true);
            $table->boolean('show_social_links')->default(true);
            $table->boolean('show_profile_photo')->default(true);
            $table->boolean('show_phone')->default(false);
            $table->boolean('show_mobile')->default(false);
            $table->boolean('show_contact_email')->default(false);
            $table->boolean('show_address')->default(false);
            $table->timestamps();
        });

        DB::table('users')
            ->select([
                'id',
                'show_bio',
                'show_studies',
                'show_jobs',
                'show_skills',
                'show_social_links',
                'show_profile_photo',
                'show_phone',
                'show_mobile',
                'show_contact_email',
                'show_address',
            ])
            ->orderBy('id')
            ->chunkById(100, function ($users) {
                $rows = [];

                foreach ($users as $user) {
                    $rows[] = [
                        'user_id' => $user->id,
                        'show_bio' => (bool) $user->show_bio,
                        'show_studies' => (bool) $user->show_studies,
                        'show_jobs' => (bool) $user->show_jobs,
                        'show_skills' => (bool) $user->show_skills,
                        'show_social_links' => (bool) $user->show_social_links,
                        'show_profile_photo' => (bool) $user->show_profile_photo,
                        'show_phone' => (bool) $user->show_phone,
                        'show_mobile' => (bool) $user->show_mobile,
                        'show_contact_email' => (bool) $user->show_contact_email,
                        'show_address' => (bool) $user->show_address,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }

                if (! empty($rows)) {
                    DB::table('user_visibility')->insert($rows);
                }
            }, 'id');

        $columnsToDrop = array_values(array_filter([
            'show_bio',
            'show_studies',
            'show_jobs',
            'show_skills',
            'show_social_links',
            'show_profile_photo',
            'show_phone',
            'show_mobile',
            'show_contact_email',
            'show_address',
            'linkedin_id',
        ], fn (string $column) => Schema::hasColumn('users', $column)));

        if (! empty($columnsToDrop) && \Illuminate\Support\Facades\DB::getDriverName() !== 'sqlite') {
            Schema::table('users', function (Blueprint $table) use ($columnsToDrop) {
                $table->dropColumn($columnsToDrop);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $columnsToAdd = array_values(array_filter([
            'show_bio',
            'show_studies',
            'show_jobs',
            'show_skills',
            'show_social_links',
            'show_profile_photo',
            'show_phone',
            'show_mobile',
            'show_contact_email',
            'show_address',
            'linkedin_id',
        ], fn (string $column) => ! Schema::hasColumn('users', $column)));

        if (! empty($columnsToAdd) && \Illuminate\Support\Facades\DB::getDriverName() !== 'sqlite') {
            Schema::table('users', function (Blueprint $table) use ($columnsToAdd) {
                foreach ($columnsToAdd as $column) {
                    match ($column) {
                        'linkedin_id' => $table->string('linkedin_id')->nullable()->unique(),
                        'show_bio', 'show_studies', 'show_jobs', 'show_skills', 'show_social_links', 'show_profile_photo' => $table->boolean($column)->default(true),
                        default => $table->boolean($column)->default(false),
                    };
                }
            });
        }

        if (Schema::hasTable('user_visibility')) {
            DB::table('user_visibility')
                ->select([
                    'user_id',
                    'show_bio',
                    'show_studies',
                    'show_jobs',
                    'show_skills',
                    'show_social_links',
                    'show_profile_photo',
                    'show_phone',
                    'show_mobile',
                    'show_contact_email',
                    'show_address',
                ])
                ->orderBy('user_id')
                ->chunkById(100, function ($visibilities) {
                    foreach ($visibilities as $visibility) {
                        DB::table('users')
                            ->where('id', $visibility->user_id)
                            ->update([
                                'show_bio' => (bool) $visibility->show_bio,
                                'show_studies' => (bool) $visibility->show_studies,
                                'show_jobs' => (bool) $visibility->show_jobs,
                                'show_skills' => (bool) $visibility->show_skills,
                                'show_social_links' => (bool) $visibility->show_social_links,
                                'show_profile_photo' => (bool) $visibility->show_profile_photo,
                                'show_phone' => (bool) $visibility->show_phone,
                                'show_mobile' => (bool) $visibility->show_mobile,
                                'show_contact_email' => (bool) $visibility->show_contact_email,
                                'show_address' => (bool) $visibility->show_address,
                            ]);
                    }
                }, 'user_id');

            Schema::dropIfExists('user_visibility');
        }
    }
};
