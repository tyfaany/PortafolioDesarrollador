<?php

namespace Tests\Feature\Projects;

use App\Models\Project;
use App\Models\ProjectTechnology;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class QueryBuilderProjectsTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_returns_only_the_authenticated_users_projects(): void
    {
        $user = User::factory()->create([
            'role' => 'owner',
        ]);

        $otherUser = User::factory()->create([
            'role' => 'owner',
        ]);

        Project::create([
            'user_id' => $user->id,
            'name' => 'Portfolio',
            'description' => 'Project description for the portfolio',
            'start_date' => now()->subMonth(),
            'end_date' => now(),
            'demo_url' => null,
            'repository_url' => null,
            'is_in_progress' => false,
            'is_public' => true,
        ]);

        Project::create([
            'user_id' => $otherUser->id,
            'name' => 'Other Project',
            'description' => 'Other description',
            'start_date' => now()->subMonth(),
            'end_date' => now(),
            'demo_url' => null,
            'repository_url' => null,
            'is_in_progress' => false,
            'is_public' => true,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/user/projects');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Portfolio');
    }

    public function test_it_filters_projects_by_search_visibility_and_technology(): void
    {
        $user = User::factory()->create([
            'role' => 'owner',
        ]);

        $project = Project::create([
            'user_id' => $user->id,
            'name' => 'Personal API',
            'description' => 'Project description for testing',
            'start_date' => now()->subMonth(),
            'end_date' => now(),
            'demo_url' => null,
            'repository_url' => null,
            'is_in_progress' => false,
            'is_public' => true,
        ]);

        $technology = ProjectTechnology::create([
            'name' => 'React',
        ]);

        $project->technologies()->attach($technology->id);

        Sanctum::actingAs($user);

        $searchResponse = $this->getJson('/api/user/projects?filter[search]=Personal');

        $searchResponse->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Personal API');

        $visibilityResponse = $this->getJson('/api/user/projects?filter[is_public]=true');

        $visibilityResponse->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Personal API');

        $techResponse = $this->getJson('/api/user/projects?filter[tech_filter]=React');

        $techResponse->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Personal API');
    }
}
