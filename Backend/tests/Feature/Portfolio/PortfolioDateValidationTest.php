<?php

namespace Tests\Feature\Portfolio;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PortfolioDateValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_study_start_date_cannot_be_in_the_future(): void
    {
        $this->actingAsOwner();

        $response = $this->postJson('/api/studies', $this->studyPayload([
            'start_date' => now()->addDay()->format('Y-m-d'),
            'end_date' => now()->format('Y-m-d'),
        ]));

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'La fecha de inicio no puede ser posterior a la fecha actual.',
            ]);
    }

    public function test_study_end_date_cannot_be_in_the_future(): void
    {
        $this->actingAsOwner();

        $response = $this->postJson('/api/studies', $this->studyPayload([
            'start_date' => now()->subMonth()->format('Y-m-d'),
            'end_date' => now()->addDay()->format('Y-m-d'),
        ]));

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'La fecha de fin no puede ser posterior a la fecha actual.',
            ]);
    }

    public function test_job_start_date_cannot_be_in_the_future(): void
    {
        $this->actingAsOwner();

        $nextYear = (int) now()->addYear()->format('Y');

        $response = $this->postJson('/api/user/jobs', $this->jobPayload([
            'start_year' => $nextYear,
            'start_month' => 'enero',
            'end_year' => $nextYear,
            'end_month' => 'enero',
        ]));

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'La fecha de inicio no puede ser posterior a la fecha actual.',
            ]);
    }

    public function test_job_end_date_cannot_be_in_the_future(): void
    {
        $this->actingAsOwner();

        $currentYear = (int) now()->format('Y');
        $nextYear = $currentYear + 1;

        $response = $this->postJson('/api/user/jobs', $this->jobPayload([
            'start_year' => $currentYear,
            'start_month' => 'enero',
            'end_year' => $nextYear,
            'end_month' => 'enero',
        ]));

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'La fecha de fin no puede ser posterior a la fecha actual.',
            ]);
    }

    private function actingAsOwner(): User
    {
        $user = User::factory()->create([
            'role' => 'owner',
        ]);

        Sanctum::actingAs($user);

        return $user;
    }

    private function studyPayload(array $overrides = []): array
    {
        return array_merge([
            'academic_institution' => 'Universidad de Prueba',
            'degree' => 'Ingeniería de Sistemas',
            'start_date' => now()->subMonth()->format('Y-m-d'),
            'end_date' => now()->format('Y-m-d'),
            'achievements' => 'Logro de ejemplo',
        ], $overrides);
    }

    private function jobPayload(array $overrides = []): array
    {
        return array_merge([
            'company_name' => 'Empresa de Prueba',
            'position' => 'Desarrollador',
            'start_month' => 'enero',
            'start_year' => (int) now()->subYear()->format('Y'),
            'end_month' => 'febrero',
            'end_year' => (int) now()->format('Y'),
            'is_current_job' => false,
            'achievements' => 'Logro de ejemplo',
            'evidence_url' => 'https://example.com',
        ], $overrides);
    }
}
