<?php

namespace Tests\Feature\Projects;

use App\Models\Project;
use App\Models\ProjectTechnology;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjectTechnologyCreationTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_a_new_project_technology_when_the_user_types_a_custom_value(): void
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

        $response->assertCreated()
            ->assertJsonPath('project.technologies.0.name', 'Bash');

        $projectId = $response->json('project.id');
        $technologyId = ProjectTechnology::where('name', 'Bash')->value('id');

        $this->assertDatabaseHas('project_technologies', [
            'name' => 'Bash',
        ]);

        $this->assertDatabaseHas('project_technology', [
            'project_id' => $projectId,
            'technology_id' => $technologyId,
        ]);

        $this->assertDatabaseHas('projects', [
            'name' => 'Proyecto con Bash',
        ]);
    }
}
