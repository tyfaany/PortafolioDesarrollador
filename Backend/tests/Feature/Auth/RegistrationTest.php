<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_users_can_register(): void
    {
        $response = $this->post('/api/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertStatus(201);
        $response->assertJsonFragment(['status' => 'success']);
        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com'
        ]);
    }

    public function test_registration_allows_accented_letters_and_spaces_in_name(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => "María José Gómez",
            'email' => 'mariajose@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', [
            'name' => "María José Gómez",
            'email' => 'mariajose@example.com'
        ]);
    }

    public function test_registration_fails_if_name_contains_invalid_characters_or_symbols(): void
    {
        $invalidNames = [
            'John Doe 123!',
            'Jean-Luc',
            "O'Connor",
            'John Doe-',
            '-John Doe',
        ];

        foreach ($invalidNames as $index => $name) {
            $response = $this->postJson('/api/register', [
                'name' => $name,
                'email' => "invalidname{$index}@example.com",
                'password' => 'password',
                'password_confirmation' => 'password',
            ]);

            $response->assertStatus(422);
            $response->assertJsonValidationErrors(['name']);
        }
    }
}
