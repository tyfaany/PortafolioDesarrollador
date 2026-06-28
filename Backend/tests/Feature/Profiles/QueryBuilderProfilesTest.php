<?php

namespace Tests\Feature\Profiles;

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
