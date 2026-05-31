<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Verifica que el usuario autenticado tenga uno de los roles permitidos.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $userRole = $request->user()?->role;

        if (! $userRole || ! in_array($userRole, $roles, true)) {
            abort(403, 'No autorizado.');
        }

        return $next($request);
    }
}
