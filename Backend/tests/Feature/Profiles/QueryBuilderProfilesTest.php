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
