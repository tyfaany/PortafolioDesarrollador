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
    public function update(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'profession' => 'nullable|string|max:255',
            'biography' => 'nullable|string',
            'github_username' => 'nullable|string|max:255',
            'linkedin_url' => 'nullable|url|max:255',
            'profile_image' => 'nullable|string'
        ]);

        $user->update($request->only([
            'name',
            'profession',
            'biography',
            'github_username',
            'linkedin_url',
            'profile_image'
        ]));

        return response()->json([
            'message' => 'Perfil actualizado correctamente',
            'user' => $user
        ]);
    }
}
