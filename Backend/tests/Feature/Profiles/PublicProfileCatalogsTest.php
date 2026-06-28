<?php

namespace Tests\Feature\Profiles;

use App\Models\Job;
use App\Models\Study;
use App\Models\User;
use App\Models\UserVisibility;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class PublicProfileCatalogsTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_returns_distinct_public_profile_catalogs_from_visible_profiles(): void
    {
        $visibleUser = User::factory()->create([
            'name' => 'Visible Dev',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $visibleUser->id,
            ...UserVisibility::defaults(),
        ]);

        $secondVisibleUser = User::factory()->create([
            'name' => 'Second Visible Dev',
            'profession' => 'Frontend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $secondVisibleUser->id,
            ...UserVisibility::defaults(),
        ]);

        $hiddenUser = User::factory()->create([
            'name' => 'Hidden Dev',
            'profession' => 'QA Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $hiddenUser->id,
            ...UserVisibility::defaults(),
            'show_in_search' => false,
        ]);

        Schema::disableForeignKeyConstraints();

        try {
            Study::create([
                'user_id' => $visibleUser->id,
                'academic_institution' => 'University A',
                'degree' => 'Licenciatura',
                'month_id' => null,
                'year_id' => null,
                'achievements' => null,
            ]);

            Study::create([
                'user_id' => $secondVisibleUser->id,
                'academic_institution' => 'University B',
                'degree' => 'Maestria',
                'month_id' => null,
                'year_id' => null,
                'achievements' => null,
            ]);

            Study::create([
                'user_id' => $hiddenUser->id,
                'academic_institution' => 'Hidden University',
                'degree' => 'Doctorado',
                'month_id' => null,
                'year_id' => null,
                'achievements' => null,
            ]);
        } finally {
            Schema::enableForeignKeyConstraints();
        }

        Job::create([
            'user_id' => $visibleUser->id,
            'position' => 'Backend Developer',
            'company_name' => 'Visible Co',
            'start_month' => 1,
            'start_year' => 2021,
            'end_month' => 12,
            'end_year' => 2023,
            'is_current_job' => false,
            'achievements' => 'Built APIs',
        ]);

        Job::create([
            'user_id' => $secondVisibleUser->id,
            'position' => 'Frontend Developer',
            'company_name' => 'Visible Co 2',
            'start_month' => 2,
            'start_year' => 2020,
            'end_month' => 11,
            'end_year' => 2023,
            'is_current_job' => false,
            'achievements' => 'Built interfaces',
        ]);

        Job::create([
            'user_id' => $hiddenUser->id,
            'position' => 'Hidden Developer',
            'company_name' => 'Hidden Co',
            'start_month' => 3,
            'start_year' => 2019,
            'end_month' => 10,
            'end_year' => 2023,
            'is_current_job' => false,
            'achievements' => 'Hidden work',
        ]);

        $response = $this->getJson('/api/profiles/catalogs');

        $response->assertOk()
            ->assertJsonPath('professions.0', 'Backend Engineer')
            ->assertJsonPath('professions.1', 'Frontend Engineer')
            ->assertJsonMissingPath('professions.2')
            ->assertJsonPath('degrees.0', 'Licenciatura')
            ->assertJsonPath('degrees.1', 'Maestria')
            ->assertJsonMissingPath('degrees.2')
            ->assertJsonPath('institutions.0', 'University A')
            ->assertJsonPath('institutions.1', 'University B')
            ->assertJsonMissingPath('institutions.2')
            ->assertJsonPath('experience_roles.0', 'Backend Developer')
            ->assertJsonPath('experience_roles.1', 'Frontend Developer')
            ->assertJsonMissingPath('experience_roles.2');
    }
}
