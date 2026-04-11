<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;

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

    return response()->json($user);
}
    /**
     * Actualizar datos del usuario autenticado
     */
   public function update(Request $request)
{
    $user = $request->user();

    $validated = $request->validate([
        'name'         => 'required|string|max:255',
        'profession'   => 'nullable|string|max:100',
        'biography'    => 'nullable|string|max:1000',
        'github_url'   => [
            'nullable', 'url', 'max:200',
            'regex:/^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/i'
        ],
        'linkedin_url' => [
            'nullable', 'url', 'max:200',
            'regex:/^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/i'
        ],
    ]);

    $sanitized = array_map(function($value) {
        return is_string($value) ? strip_tags($value) : $value;
    }, $validated);

   
    $isComplete = $this->checkIfProfileIsComplete($user, $sanitized);
    
    
    $sanitized['profile_completed'] = $isComplete;

    
    $user->fill($sanitized);
    $user->save();

    return response()->json([
        'message' => 'Información actualizada',
        
        'user' => $user->fresh() 
    ]);
}
private function checkIfProfileIsComplete(User $user, array $newData): bool
    {
        $requiredFields = ['name', 'profession', 'biography'];

        foreach ($requiredFields as $field) {
            // Buscamos en los datos nuevos, si no están, buscamos en los que ya tiene el usuario
            $value = $newData[$field] ?? $user->$field;

            if (empty($value)) {
                return false; 
            }
        }

        return true; 
    }
}
