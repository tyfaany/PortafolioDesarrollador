<?php

namespace Tests\Feature\Projects;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjectTechnologyCreationTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_rejects_custom_project_technology_values_and_requires_catalog_ids(): void
    {
        $user = User::factory()->create([
            'role' => 'owner',
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/user/projects', [
            'title' => 'Proyecto con Bash',
            'description' => 'Este proyecto demuestra que se pueden agregar tecnologias nuevas al crear un proyecto.',
            'technologies' => ['Bash'],
            'start_date' => now()->subDay()->format('Y-m-d'),
            'end_date' => now()->format('Y-m-d'),
            'is_in_progress' => false,
            'is_public' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['technologies.0']);

        $this->assertDatabaseMissing('project_technologies', [
            'name' => 'Bash',
        ]);

        $this->assertDatabaseMissing('projects', [
            'name' => 'Proyecto con Bash',
        ]);
    }
}
