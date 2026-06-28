<?php

namespace Tests\Feature\Profiles;

use App\Models\Job;
use App\Models\Project;
use App\Models\ProjectTechnology;
use App\Models\TechnicalSkill;
use App\Models\User;
use App\Models\UserVisibility;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

        $response = $this->getJson('/api/profiles?filter[search]=John');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'John React');

        $skillResponse = $this->getJson('/api/profiles?filter[habilidades]=Laravel');

        $skillResponse->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'John React');
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
