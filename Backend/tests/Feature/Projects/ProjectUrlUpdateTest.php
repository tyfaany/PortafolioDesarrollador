<?php

namespace Tests\Feature\Projects;

use App\Models\ProjectTechnology;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjectUrlUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_clears_project_urls_when_the_user_saves_them_empty(): void
    {
        $user = User::factory()->create([
            'role' => 'owner',
        ]);

        Sanctum::actingAs($user);

        $technology = ProjectTechnology::create([
            'name' => 'React',
        ]);

        $createResponse = $this->postJson('/api/user/projects', [
            'title' => 'Proyecto con enlaces',
            'description' => 'Este proyecto sirve para validar que las URLs opcionales puedan limpiarse correctamente.',
            'technologies' => [$technology->id],
            'start_date' => now()->subMonth()->format('Y-m-d'),
            'end_date' => now()->subDay()->format('Y-m-d'),
            'is_in_progress' => false,
            'is_public' => true,
            'demo_url' => 'https://example.com/demo',
            'repo_url' => 'https://github.com/example/repo',
        ]);

        $createResponse->assertStatus(201);

        $projectId = $createResponse->json('project.id');

        $updateResponse = $this->putJson("/api/user/projects/{$projectId}", [
            'title' => 'Proyecto con enlaces',
            'description' => 'Este proyecto sirve para validar que las URLs opcionales puedan limpiarse correctamente.',
            'technologies' => [$technology->id],
            'start_date' => now()->subMonth()->format('Y-m-d'),
            'end_date' => now()->subDay()->format('Y-m-d'),
            'is_in_progress' => false,
            'is_public' => true,
            'demo_url' => null,
            'repo_url' => null,
        ]);

        $updateResponse->assertStatus(200);

        $this->assertDatabaseHas('projects', [
            'id' => $projectId,
            'demo_url' => null,
            'repository_url' => null,
        ]);
    }
}
