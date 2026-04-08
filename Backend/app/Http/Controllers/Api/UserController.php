<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Obtener datos del usuario autenticado
     */
    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user()
        ]);
    }

    /**
     * Actualizar datos del usuario autenticado
     */
   public function updateInfo(Request $request)
{
    $user = $request->user();

    $validated = $request->validate([
        'name'            => 'filled|string|max:255',
        'profession'      => 'nullable|string|max:100',
        'biography'       => 'nullable|string',
        'github_username' => 'nullable|string|max:100',
        'linkedin_url'    => 'nullable|string|max:200',
    ]);

    $user->update($validated);

    return response()->json([
        'message' => 'Información actualizada',
        'user' => $user
    ]);
}
}
