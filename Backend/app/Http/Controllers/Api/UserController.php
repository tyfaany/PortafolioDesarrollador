<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function show(Request $request)
{
    $user = $request->user();

    // Agregamos manualmente la URL completa de la foto si existe
    if ($user->profile_photo) {
       $user->profile_photo_url = $request->getSchemeAndHttpHost() . '/storage/' . $user->profile_photo;
    } else {
        $user->profile_photo_url = null; // O una imagen por defecto
    }

    return response()->json([
        'user' => $user
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
