<?php

namespace Tests\Feature\Profiles;

use App\Models\Job;
use App\Models\Project;
use App\Models\ProjectTechnology;
use App\Models\SoftSkill;
use App\Models\Study;
use App\Models\TechnicalSkill;
use App\Models\User;
use App\Models\UserVisibility;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class QueryBuilderProfilesTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_returns_only_completed_public_profiles_without_email(): void
    {
        $visibleUser = User::factory()->create([
            'name' => 'Laravel Dev',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $visibleUser->id,
            ...UserVisibility::defaults(),
        ]);

        $incompleteUser = User::factory()->create([
            'name' => 'Hidden Dev',
            'profession' => 'Frontend Engineer',
            'profile_completed' => false,
        ]);

        $response = $this->getJson('/api/profiles');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonMissingPath('data.0.email')
            ->assertJsonPath('data.0.name', 'Laravel Dev');
    }

    public function test_it_filters_public_profiles_by_search_and_skill(): void
    {
        $user = User::factory()->create([
            'name' => 'John React',
            'profession' => 'Full Stack',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $user->id,
            ...UserVisibility::defaults(),
        ]);

        $skill = TechnicalSkill::create([
            'name' => 'laravel',
        ]);

        $user->skills()->attach($skill->id, [
            'level' => 'Avanzado',
            'evidence_url' => null,
        ]);

        $jobUser = User::factory()->create([
            'name' => 'Job Match',
            'profession' => 'QA Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $jobUser->id,
            ...UserVisibility::defaults(),
        ]);

        $jobUser->jobs()->create([
            'company_name' => 'Acme',
            'position' => 'Backend Engineer',
            'achievements' => 'Built APIs and services',
            'start_month' => 1,
            'start_year' => 2022,
            'end_month' => 12,
            'end_year' => 2023,
            'is_current_job' => false,
        ]);

        $softSkillUser = User::factory()->create([
            'name' => 'Soft Skill Match',
            'profession' => 'QA Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $softSkillUser->id,
            ...UserVisibility::defaults(),
        ]);

        $communication = SoftSkill::create([
            'name' => 'Communication',
        ]);

        $softSkillUser->softSkills()->attach($communication->id, [
            'evidence_url' => null,
        ]);

        $studyUser = User::factory()->create([
            'name' => 'Study Match',
            'profession' => 'QA Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $studyUser->id,
            ...UserVisibility::defaults(),
        ]);

        Schema::disableForeignKeyConstraints();

        try {
            Study::create([
                'user_id' => $studyUser->id,
                'academic_institution' => 'University A',
                'degree' => 'Licenciatura',
                'start_date' => now()->subYears(4)->toDateString(),
                'end_date' => now()->subYears(1)->toDateString(),
                'achievements' => null,
            ]);
        } finally {
            Schema::enableForeignKeyConstraints();
        }

        $projectUser = User::factory()->create([
            'name' => 'Project Match',
            'profession' => 'QA Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $projectUser->id,
            ...UserVisibility::defaults(),
        ]);

        Project::create([
            'user_id' => $projectUser->id,
            'name' => 'React Portal',
            'description' => 'Internal dashboard for teams',
            'start_date' => now()->subMonths(2),
            'end_date' => now()->subMonth(),
            'is_in_progress' => false,
            'is_public' => true,
        ]);

        $techProjectUser = User::factory()->create([
            'name' => 'Tech Project Match',
            'profession' => 'QA Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $techProjectUser->id,
            ...UserVisibility::defaults(),
        ]);

        $techProject = Project::create([
            'user_id' => $techProjectUser->id,
            'name' => 'Internal Tool',
            'description' => 'Internal dashboard for teams',
            'start_date' => now()->subMonths(2),
            'end_date' => now()->subMonth(),
            'is_in_progress' => false,
            'is_public' => true,
        ]);

        $angular = ProjectTechnology::create([
            'name' => 'Angular',
        ]);

        $techProject->technologies()->attach($angular->id);

        $response = $this->getJson('/api/profiles?filter[search]=John');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'John React');

        $jobResponse = $this->getJson('/api/profiles?filter[search]=Backend Engineer');

        $jobResponse->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Job Match');

        $studyResponse = $this->getJson('/api/profiles?filter[search]=University A');

        $studyResponse->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Study Match');

        $projectResponse = $this->getJson('/api/profiles?filter[search]=React Portal');

        $projectResponse->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Project Match');

        $skillSearchResponse = $this->getJson('/api/profiles?filter[search]=Laravel');

        $skillSearchResponse->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'John React');

        $companySearchResponse = $this->getJson('/api/profiles?filter[search]=Acme');

        $companySearchResponse->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Job Match');

        $softSkillSearchResponse = $this->getJson('/api/profiles?filter[search]=Communication');

        $softSkillSearchResponse->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Soft Skill Match');

        $techSearchResponse = $this->getJson('/api/profiles?filter[search]=Angular');

        $techSearchResponse->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Tech Project Match');

        $shortSearchResponse = $this->getJson('/api/profiles?filter[search]=a');

        $shortSearchResponse->assertOk()
            ->assertJsonCount(0, 'data');

        $skillResponse = $this->getJson('/api/profiles?filter[habilidades]=Laravel');

        $skillResponse->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'John React');
    }

    public function test_it_combines_search_with_other_filters(): void
    {
        $matchingUser = User::factory()->create([
            'name' => 'Matching Profile',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $matchingUser->id,
            ...UserVisibility::defaults(),
        ]);

        Schema::disableForeignKeyConstraints();

        try {
            Study::create([
                'user_id' => $matchingUser->id,
                'academic_institution' => 'University A',
                'degree' => 'Licenciatura',
                'start_date' => now()->subYears(4)->toDateString(),
                'end_date' => now()->subYear()->toDateString(),
                'achievements' => null,
            ]);
        } finally {
            Schema::enableForeignKeyConstraints();
        }

        $otherDegreeUser = User::factory()->create([
            'name' => 'Other Degree Profile',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $otherDegreeUser->id,
            ...UserVisibility::defaults(),
        ]);

        Schema::disableForeignKeyConstraints();

        try {
            Study::create([
                'user_id' => $otherDegreeUser->id,
                'academic_institution' => 'University A',
                'degree' => 'Maestria',
                'start_date' => now()->subYears(5)->toDateString(),
                'end_date' => now()->subYears(2)->toDateString(),
                'achievements' => null,
            ]);
        } finally {
            Schema::enableForeignKeyConstraints();
        }

        $tech = ProjectTechnology::create([
            'name' => 'Angular',
        ]);

        $matchingProject = Project::create([
            'user_id' => $matchingUser->id,
            'name' => 'Angular Dashboard',
            'description' => 'Private admin view',
            'start_date' => now()->subMonths(4),
            'end_date' => now()->subMonths(2),
            'is_in_progress' => false,
            'is_public' => true,
        ]);

        $matchingProject->technologies()->attach($tech->id);

        $otherProject = Project::create([
            'user_id' => $otherDegreeUser->id,
            'name' => 'Angular Dashboard 2',
            'description' => 'Private admin view',
            'start_date' => now()->subMonths(4),
            'end_date' => now()->subMonths(2),
            'is_in_progress' => false,
            'is_public' => true,
        ]);

        $otherProject->technologies()->attach($tech->id);

        $response = $this->getJson('/api/profiles?filter[search]=Angular&filter[degree]=Licenciatura&filter[technology]=Angular');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Matching Profile');

        $excludedResponse = $this->getJson('/api/profiles?filter[search]=Angular&filter[degree]=Maestria&filter[technology]=Angular');

        $excludedResponse->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Other Degree Profile');
    }

    public function test_it_combines_search_with_projects_count_sort(): void
    {
        $oneProjectUser = User::factory()->create([
            'name' => 'One Project Search',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $oneProjectUser->id,
            ...UserVisibility::defaults(),
        ]);

        $twoProjectsUser = User::factory()->create([
            'name' => 'Two Projects Search',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $twoProjectsUser->id,
            ...UserVisibility::defaults(),
        ]);

        $oneProjectUser->jobs()->create([
            'company_name' => 'Search Co',
            'position' => 'Backend Engineer',
            'achievements' => 'Built services',
            'start_month' => 1,
            'start_year' => 2022,
            'end_month' => 12,
            'end_year' => 2023,
            'is_current_job' => false,
        ]);

        $twoProjectsUser->jobs()->create([
            'company_name' => 'Search Co',
            'position' => 'Backend Engineer',
            'achievements' => 'Built services',
            'start_month' => 1,
            'start_year' => 2022,
            'end_month' => 12,
            'end_year' => 2023,
            'is_current_job' => false,
        ]);

        Project::create([
            'user_id' => $oneProjectUser->id,
            'name' => 'Public One',
            'description' => 'Search match',
            'start_date' => now()->subMonths(4),
            'end_date' => now()->subMonths(2),
            'is_in_progress' => false,
            'is_public' => true,
        ]);

        Project::create([
            'user_id' => $twoProjectsUser->id,
            'name' => 'Public Two A',
            'description' => 'Search match',
            'start_date' => now()->subMonths(4),
            'end_date' => now()->subMonths(2),
            'is_in_progress' => false,
            'is_public' => true,
        ]);

        Project::create([
            'user_id' => $twoProjectsUser->id,
            'name' => 'Public Two B',
            'description' => 'Search match',
            'start_date' => now()->subMonths(5),
            'end_date' => now()->subMonths(3),
            'is_in_progress' => false,
            'is_public' => true,
        ]);

        $response = $this->getJson('/api/profiles?filter[search]=Backend Engineer&sort=-projects_count');

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.name', 'Two Projects Search')
            ->assertJsonPath('data.1.name', 'One Project Search');
    }

    public function test_it_filters_public_profiles_by_project_technology(): void
    {
        $publicUser = User::factory()->create([
            'name' => 'React Builder',
            'profession' => 'Frontend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $publicUser->id,
            ...UserVisibility::defaults(),
        ]);

        $privateUser = User::factory()->create([
            'name' => 'Hidden React Builder',
            'profession' => 'Frontend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $privateUser->id,
            ...UserVisibility::defaults(),
        ]);

        $otherUser = User::factory()->create([
            'name' => 'Vue Builder',
            'profession' => 'Frontend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $otherUser->id,
            ...UserVisibility::defaults(),
        ]);

        $react = ProjectTechnology::create([
            'name' => 'React',
        ]);

        $vue = ProjectTechnology::create([
            'name' => 'Vue',
        ]);

        $publicProject = Project::create([
            'user_id' => $publicUser->id,
            'name' => 'Public React App',
            'description' => 'Project description for testing',
            'start_date' => now()->subMonth(),
            'end_date' => now(),
            'demo_url' => null,
            'repository_url' => null,
            'is_in_progress' => false,
            'is_public' => true,
        ]);

        $publicProject->technologies()->attach($react->id);

        $privateProject = Project::create([
            'user_id' => $privateUser->id,
            'name' => 'Private React App',
            'description' => 'Project description for testing',
            'start_date' => now()->subMonth(),
            'end_date' => now(),
            'demo_url' => null,
            'repository_url' => null,
            'is_in_progress' => false,
            'is_public' => false,
        ]);

        $privateProject->technologies()->attach($react->id);

        $otherProject = Project::create([
            'user_id' => $otherUser->id,
            'name' => 'Public Vue App',
            'description' => 'Project description for testing',
            'start_date' => now()->subMonth(),
            'end_date' => now(),
            'demo_url' => null,
            'repository_url' => null,
            'is_in_progress' => false,
            'is_public' => true,
        ]);

        $otherProject->technologies()->attach($vue->id);

        $response = $this->getJson('/api/profiles?filter[technology]=React');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'React Builder')
            ->assertJsonMissing(['name' => 'Hidden React Builder'])
            ->assertJsonMissing(['name' => 'Vue Builder']);
    }

    public function test_it_filters_public_profiles_by_profession(): void
    {
        $backendUser = User::factory()->create([
            'name' => 'Backend Specialist',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $backendUser->id,
            ...UserVisibility::defaults(),
        ]);

        $frontendUser = User::factory()->create([
            'name' => 'Frontend Specialist',
            'profession' => 'Frontend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $frontendUser->id,
            ...UserVisibility::defaults(),
        ]);

        $response = $this->getJson('/api/profiles?filter[profession]=Backend Engineer');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Backend Specialist');
    }

    public function test_it_filters_public_profiles_by_degree(): void
    {
        $licenciaturaUser = User::factory()->create([
            'name' => 'Licenciatura User',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $licenciaturaUser->id,
            ...UserVisibility::defaults(),
        ]);

        $maestriaUser = User::factory()->create([
            'name' => 'Maestria User',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $maestriaUser->id,
            ...UserVisibility::defaults(),
        ]);

        Schema::disableForeignKeyConstraints();

        try {
            Study::create([
                'user_id' => $licenciaturaUser->id,
                'academic_institution' => 'University A',
                'degree' => 'Licenciatura',
                'start_date' => now()->subYears(5)->toDateString(),
                'end_date' => now()->subYears(1)->toDateString(),
                'achievements' => null,
            ]);

            Study::create([
                'user_id' => $maestriaUser->id,
                'academic_institution' => 'University B',
                'degree' => 'Maestria',
                'start_date' => now()->subYears(3)->toDateString(),
                'end_date' => now()->subYear()->toDateString(),
                'achievements' => null,
            ]);
        } finally {
            Schema::enableForeignKeyConstraints();
        }

        $response = $this->getJson('/api/profiles?filter[degree]=Licenciatura');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Licenciatura User');
    }

    public function test_it_filters_public_profiles_by_academic_institution(): void
    {
        $universityAUser = User::factory()->create([
            'name' => 'University A User',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $universityAUser->id,
            ...UserVisibility::defaults(),
        ]);

        $universityBUser = User::factory()->create([
            'name' => 'University B User',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $universityBUser->id,
            ...UserVisibility::defaults(),
        ]);

        Schema::disableForeignKeyConstraints();

        try {
            Study::create([
                'user_id' => $universityAUser->id,
                'academic_institution' => 'University A',
                'degree' => 'Licenciatura',
                'start_date' => now()->subYears(5)->toDateString(),
                'end_date' => now()->subYears(1)->toDateString(),
                'achievements' => null,
            ]);

            Study::create([
                'user_id' => $universityBUser->id,
                'academic_institution' => 'University B',
                'degree' => 'Licenciatura',
                'start_date' => now()->subYears(4)->toDateString(),
                'end_date' => now()->subYears(2)->toDateString(),
                'achievements' => null,
            ]);
        } finally {
            Schema::enableForeignKeyConstraints();
        }

        $response = $this->getJson('/api/profiles?filter[academic_institution]=University A');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'University A User');
    }

    public function test_it_sorts_public_profiles_by_projects_count(): void
    {
        $oneProjectUser = User::factory()->create([
            'name' => 'One Project User',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $oneProjectUser->id,
            ...UserVisibility::defaults(),
        ]);

        $threeProjectsUser = User::factory()->create([
            'name' => 'Three Projects User',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $threeProjectsUser->id,
            ...UserVisibility::defaults(),
        ]);

        $hiddenProjectsUser = User::factory()->create([
            'name' => 'Hidden Projects User',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $hiddenProjectsUser->id,
            ...UserVisibility::defaults(),
        ]);

        Project::create([
            'user_id' => $oneProjectUser->id,
            'name' => 'Public Project 1',
            'description' => 'Testing',
            'start_date' => now()->subMonth(),
            'end_date' => now(),
            'is_in_progress' => false,
            'is_public' => true,
        ]);

        Project::create([
            'user_id' => $threeProjectsUser->id,
            'name' => 'Public Project 1',
            'description' => 'Testing',
            'start_date' => now()->subMonths(3),
            'end_date' => now()->subMonths(2),
            'is_in_progress' => false,
            'is_public' => true,
        ]);

        Project::create([
            'user_id' => $threeProjectsUser->id,
            'name' => 'Public Project 2',
            'description' => 'Testing',
            'start_date' => now()->subMonths(5),
            'end_date' => now()->subMonths(4),
            'is_in_progress' => false,
            'is_public' => true,
        ]);

        Project::create([
            'user_id' => $threeProjectsUser->id,
            'name' => 'Public Project 3',
            'description' => 'Testing',
            'start_date' => now()->subMonths(7),
            'end_date' => now()->subMonths(6),
            'is_in_progress' => false,
            'is_public' => true,
        ]);

        Project::create([
            'user_id' => $hiddenProjectsUser->id,
            'name' => 'Hidden Project',
            'description' => 'Testing',
            'start_date' => now()->subMonths(2),
            'end_date' => now()->subMonth(),
            'is_in_progress' => false,
            'is_public' => false,
        ]);

        $response = $this->getJson('/api/profiles?sort=projects_count');

        $response->assertOk()
            ->assertJsonPath('data.0.name', 'Hidden Projects User')
            ->assertJsonPath('data.1.name', 'One Project User')
            ->assertJsonPath('data.2.name', 'Three Projects User');

        $descResponse = $this->getJson('/api/profiles?sort=-projects_count');

        $descResponse->assertOk()
            ->assertJsonPath('data.0.name', 'Three Projects User')
            ->assertJsonPath('data.1.name', 'One Project User')
            ->assertJsonPath('data.2.name', 'Hidden Projects User');
    }

    public function test_it_sorts_public_profiles_by_name_with_stable_tiebreakers(): void
    {
        $olderUser = User::factory()->create([
            'name' => 'Same Name',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $olderUser->id,
            ...UserVisibility::defaults(),
        ]);

        User::whereKey($olderUser->id)->update([
            'updated_at' => now()->subDays(7),
        ]);

        $recentUser = User::factory()->create([
            'name' => 'Same Name',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $recentUser->id,
            ...UserVisibility::defaults(),
        ]);

        User::whereKey($recentUser->id)->update([
            'updated_at' => now()->subDay(),
        ]);

        $response = $this->getJson('/api/profiles?sort=name');

        $response->assertOk()
            ->assertJsonPath('data.0.id', $recentUser->id)
            ->assertJsonPath('data.1.id', $olderUser->id);
    }

    public function test_it_sorts_public_profiles_by_profession_with_stable_tiebreakers(): void
    {
        $olderUser = User::factory()->create([
            'name' => 'Older Profession User',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $olderUser->id,
            ...UserVisibility::defaults(),
        ]);

        User::whereKey($olderUser->id)->update([
            'updated_at' => now()->subDays(7),
        ]);

        $recentUser = User::factory()->create([
            'name' => 'Recent Profession User',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $recentUser->id,
            ...UserVisibility::defaults(),
        ]);

        User::whereKey($recentUser->id)->update([
            'updated_at' => now()->subDay(),
        ]);

        $response = $this->getJson('/api/profiles?sort=profession');

        $response->assertOk()
            ->assertJsonPath('data.0.id', $recentUser->id)
            ->assertJsonPath('data.1.id', $olderUser->id);
    }

    public function test_it_uses_recent_activity_as_tiebreaker_for_projects_count_sort(): void
    {
        $olderUser = User::factory()->create([
            'name' => 'Older User',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
            'updated_at' => now()->subDays(10),
        ]);

        UserVisibility::create([
            'user_id' => $olderUser->id,
            ...UserVisibility::defaults(),
        ]);
        User::whereKey($olderUser->id)->update([
            'updated_at' => now()->subDays(10),
        ]);

        $recentUser = User::factory()->create([
            'name' => 'Recent User',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
            'updated_at' => now()->subDay(),
        ]);

        UserVisibility::create([
            'user_id' => $recentUser->id,
            ...UserVisibility::defaults(),
        ]);
        User::whereKey($recentUser->id)->update([
            'updated_at' => now()->subDay(),
        ]);

        Project::create([
            'user_id' => $olderUser->id,
            'name' => 'Older Project',
            'description' => 'Testing',
            'start_date' => now()->subMonths(3),
            'end_date' => now()->subMonths(2),
            'is_in_progress' => false,
            'is_public' => true,
        ]);

        Project::create([
            'user_id' => $recentUser->id,
            'name' => 'Recent Project',
            'description' => 'Testing',
            'start_date' => now()->subMonths(2),
            'end_date' => now()->subMonth(),
            'is_in_progress' => false,
            'is_public' => true,
        ]);

        $response = $this->getJson('/api/profiles?sort=projects_count');

        $response->assertOk()
            ->assertJsonPath('data.0.name', 'Recent User')
            ->assertJsonPath('data.1.name', 'Older User');
    }

    public function test_it_filters_public_profiles_by_skill_level(): void
    {
        $advancedUser = User::factory()->create([
            'name' => 'Advanced React Dev',
            'profession' => 'Frontend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $advancedUser->id,
            ...UserVisibility::defaults(),
        ]);

        $intermediateReactUser = User::factory()->create([
            'name' => 'Intermediate React Dev',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $intermediateReactUser->id,
            ...UserVisibility::defaults(),
        ]);

        $react = TechnicalSkill::create([
            'name' => 'React',
        ]);

        $laravel = TechnicalSkill::create([
            'name' => 'Laravel',
        ]);

        $advancedUser->skills()->attach($react->id, [
            'level' => 'Avanzado',
            'evidence_url' => null,
        ]);

        $intermediateReactUser->skills()->attach($react->id, [
            'level' => 'Intermedio',
            'evidence_url' => null,
        ]);

        $intermediateUser = User::factory()->create([
            'name' => 'Intermediate Laravel Dev',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $intermediateUser->id,
            ...UserVisibility::defaults(),
        ]);

        $intermediateUser->skills()->attach($laravel->id, [
            'level' => 'Intermedio',
            'evidence_url' => null,
        ]);

        $levelResponse = $this->getJson('/api/profiles?filter[habilidadTecnica_nivel]=Avanzado');

        $levelResponse->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Advanced React Dev');

        $combinedResponse = $this->getJson('/api/profiles?filter[habilidadTecnica_nivel]=React,Avanzado');

        $combinedResponse->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Advanced React Dev');

        $intermediateResponse = $this->getJson('/api/profiles?filter[habilidadTecnica_nivel]=React,Intermedio');

        $intermediateResponse->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Intermediate React Dev');
    }

    public function test_it_filters_public_profiles_by_job_position(): void
    {
        $backendSenior = User::factory()->create([
            'name' => 'Backend Senior',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $backendSenior->id,
            ...UserVisibility::defaults(),
        ]);

        $backendJunior = User::factory()->create([
            'name' => 'Backend Junior',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $backendJunior->id,
            ...UserVisibility::defaults(),
        ]);

        $frontendDev = User::factory()->create([
            'name' => 'Frontend Dev',
            'profession' => 'Frontend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $frontendDev->id,
            ...UserVisibility::defaults(),
        ]);

        Job::create([
            'user_id' => $backendSenior->id,
            'position' => 'Backend Engineer',
            'company_name' => 'Senior Co',
            'start_month' => 1,
            'start_year' => 2021,
            'end_month' => 12,
            'end_year' => 2023,
            'is_current_job' => false,
            'achievements' => 'Built APIs',
        ]);

        Job::create([
            'user_id' => $backendJunior->id,
            'position' => 'Backend Developer',
            'company_name' => 'Junior Co',
            'start_month' => 1,
            'start_year' => 2022,
            'end_month' => 12,
            'end_year' => 2023,
            'is_current_job' => false,
            'achievements' => 'Maintained services',
        ]);

        Job::create([
            'user_id' => $frontendDev->id,
            'position' => 'Frontend Developer',
            'company_name' => 'UI Co',
            'start_month' => 1,
            'start_year' => 2021,
            'end_month' => 12,
            'end_year' => 2023,
            'is_current_job' => false,
            'achievements' => 'Built interfaces',
        ]);

        $response = $this->getJson('/api/profiles?filter[experiencia_cargo]=Backend');

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.name', 'Backend Senior')
            ->assertJsonPath('data.1.name', 'Backend Junior');
    }

    public function test_it_filters_public_profiles_by_job_position_and_years(): void
    {
        $backendSenior = User::factory()->create([
            'name' => 'Backend Senior',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $backendSenior->id,
            ...UserVisibility::defaults(),
        ]);

        $backendJunior = User::factory()->create([
            'name' => 'Backend Junior',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $backendJunior->id,
            ...UserVisibility::defaults(),
        ]);

        Job::create([
            'user_id' => $backendSenior->id,
            'position' => 'Backend Engineer',
            'company_name' => 'Senior Co',
            'start_month' => 1,
            'start_year' => 2021,
            'end_month' => 12,
            'end_year' => 2023,
            'is_current_job' => false,
            'achievements' => 'Built APIs',
        ]);

        Job::create([
            'user_id' => $backendJunior->id,
            'position' => 'Backend Developer',
            'company_name' => 'Junior Co',
            'start_month' => 1,
            'start_year' => 2022,
            'end_month' => 12,
            'end_year' => 2023,
            'is_current_job' => false,
            'achievements' => 'Maintained services',
        ]);

        $response = $this->getJson('/api/profiles?filter[experiencia_cargo]=Backend,3');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Backend Senior');
    }

    public function test_it_filters_the_two_year_job_bucket(): void
    {
        $backendTwoYears = User::factory()->create([
            'name' => 'Backend Two Years',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $backendTwoYears->id,
            ...UserVisibility::defaults(),
        ]);

        Job::create([
            'user_id' => $backendTwoYears->id,
            'position' => 'Backend Developer',
            'company_name' => 'Two Years Co',
            'start_month' => 1,
            'start_year' => 2022,
            'end_month' => 12,
            'end_year' => 2023,
            'is_current_job' => false,
            'achievements' => 'Built services',
        ]);

        $response = $this->getJson('/api/profiles?filter[experiencia_cargo]=Backend,2');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Backend Two Years');
    }

    public function test_it_filters_a_real_job_title_example_with_years(): void
    {
        $matchedUser = User::factory()->create([
            'name' => 'Desarrollador Backend Full',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $matchedUser->id,
            ...UserVisibility::defaults(),
        ]);

        Job::create([
            'user_id' => $matchedUser->id,
            'position' => 'Desarrollador Backend',
            'company_name' => 'Real Co',
            'start_month' => 3,
            'start_year' => 2019,
            'end_month' => 6,
            'end_year' => 2021,
            'is_current_job' => false,
            'achievements' => 'Built APIs',
        ]);

        Job::create([
            'user_id' => $matchedUser->id,
            'position' => 'Desarrollador Backend',
            'company_name' => 'Real Co 2',
            'start_month' => 1,
            'start_year' => 2020,
            'end_month' => 1,
            'end_year' => 2026,
            'is_current_job' => false,
            'achievements' => 'Scaled APIs',
        ]);

        $longOnlyUser = User::factory()->create([
            'name' => 'Desarrollador Backend Largo',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $longOnlyUser->id,
            ...UserVisibility::defaults(),
        ]);

        Job::create([
            'user_id' => $longOnlyUser->id,
            'position' => 'Desarrollador Backend',
            'company_name' => 'Long Co',
            'start_month' => 1,
            'start_year' => 2020,
            'end_month' => 1,
            'end_year' => 2026,
            'is_current_job' => false,
            'achievements' => 'Long running project',
        ]);

        $response = $this->getJson('/api/profiles?filter[experiencia_cargo]=Desarrollador%20Backend,2');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Desarrollador Backend Full')
            ->assertJsonMissing(['name' => 'Desarrollador Backend Largo']);
    }

    public function test_it_requires_the_full_year_threshold_for_job_filters(): void
    {
        $backendAlmostTwoYears = User::factory()->create([
            'name' => 'Backend Almost Two',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $backendAlmostTwoYears->id,
            ...UserVisibility::defaults(),
        ]);

        Job::create([
            'user_id' => $backendAlmostTwoYears->id,
            'position' => 'Backend Developer',
            'company_name' => 'Almost Co',
            'start_month' => 1,
            'start_year' => 2022,
            'end_month' => 11,
            'end_year' => 2023,
            'is_current_job' => false,
            'achievements' => 'Built services',
        ]);

        $response = $this->getJson('/api/profiles?filter[experiencia_cargo]=Backend,2');

        $response->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_it_rejects_too_short_job_position_filters(): void
    {
        $user = User::factory()->create([
            'name' => 'Backend Senior',
            'profession' => 'Backend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $user->id,
            ...UserVisibility::defaults(),
        ]);

        Job::create([
            'user_id' => $user->id,
            'position' => 'Backend Engineer',
            'company_name' => 'Senior Co',
            'start_month' => 1,
            'start_year' => 2020,
            'end_month' => 12,
            'end_year' => 2023,
            'is_current_job' => false,
            'achievements' => 'Built APIs',
        ]);

        $response = $this->getJson('/api/profiles?filter[experiencia_cargo]=a');

        $response->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_it_hides_profiles_marked_as_not_visible_in_search(): void
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

        $hiddenUser = User::factory()->create([
            'name' => 'Hidden Dev',
            'profession' => 'Frontend Engineer',
            'profile_completed' => true,
        ]);

        UserVisibility::create([
            'user_id' => $hiddenUser->id,
            ...UserVisibility::defaults(),
            'show_in_search' => false,
        ]);

        $response = $this->getJson('/api/profiles');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Visible Dev')
            ->assertJsonMissing(['name' => 'Hidden Dev']);
    }
}
