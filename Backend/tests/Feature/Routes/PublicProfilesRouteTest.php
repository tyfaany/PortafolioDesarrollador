<?php

namespace Tests\Feature\Routes;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class PublicProfilesRouteTest extends TestCase
{
    public function test_public_profiles_route_is_registered_without_auth_middleware(): void
    {
        $route = collect(Route::getRoutes()->getRoutes())
            ->first(fn ($route) => $route->uri() === 'api/profiles' && $route->methods() === ['GET', 'HEAD']);

        $this->assertNotNull($route);
        $this->assertContains('api', $route->gatherMiddleware());
        $this->assertNotContains('auth:sanctum', $route->gatherMiddleware());
        $this->assertNotContains('role:owner,admin', $route->gatherMiddleware());
    }

    public function test_profiles_search_route_is_not_registered_anymore(): void
    {
        $route = collect(Route::getRoutes()->getRoutes())
            ->first(fn ($route) => $route->uri() === 'api/profiles/search');

        $this->assertNull($route);
    }
}
