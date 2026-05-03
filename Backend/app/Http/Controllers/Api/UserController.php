<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Http\Requests\UpdateContactRequest;

class UserController extends Controller
{
    public function show(Request $request)
{
    $user = $request->user();
    $user->load([
        'studies', 
        'jobs', 
        'skills',
        'softSkills',
    ]);

    return response()->json($user, 200);
}
    /**
     * Actualizar datos del usuario autenticado
     */
   public function update(Request $request)
{
    $user = $request->user();

    $validated = $request->validate([
        'name'         => 'required|string|max:255',
        'profession'   => 'nullable|string|max:100|regex:/^(?=.*\pL)[\pL\pN]+(?:[ .,&()\/-][\pL\pN]+)*$/u',
        'biography'    => 'nullable|string|max:1000',
        'github_url'   => [
            'nullable', 'url', 'max:200',
            'regex:/^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+/i'
        ],
        'linkedin_url' => [
            'nullable', 'url', 'max:200',
            'regex:/^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i'
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
        'status' => 'success',
        'message' => 'Información actualizada.',
        
        'user' => $user->fresh() 
    ], 200);
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
   public function showContact(Request $request)
{
    $user = $request->user();

    return response()->json([
        'phone' => $user->phone,
        'mobile' => $user->mobile,
        'contact_email' => $user->contact_email,
        'address' => $user->address,

        'show_phone' => $user->show_phone,
        'show_mobile' => $user->show_mobile,
        'show_contact_email' => $user->show_contact_email,
        'show_address' => $user->show_address,
    ]);
}
     public function updateContact(UpdateContactRequest $request)
{
    $user = $request->user();

    $data = $request->validated();

    // Sanitizar strings
    $sanitized = array_map(function($value) {
        return is_string($value) ? strip_tags($value) : $value;
    }, $data);

    $user->update($sanitized);

    return response()->json([
        'message' => 'Información de contacto actualizada correctamente',
        'contact' => [
            'phone' => $user->phone,
            'mobile' => $user->mobile,
            'contact_email' => $user->contact_email,
            'address' => $user->address,
            'show_phone' => $user->show_phone,
            'show_mobile' => $user->show_mobile,
            'show_contact_email' => $user->show_contact_email,
            'show_address' => $user->show_address,
        ]
    ]);
}
   public function showPublicContact($id)
{
    $user = \App\Models\User::findOrFail($id);

    $data = [];

    if ($user->show_phone) {
        $data['phone'] = $user->phone;
    }

    if ($user->show_mobile) {
        $data['mobile'] = $user->mobile;
    }

    if ($user->show_contact_email) {
        $data['contact_email'] = $user->contact_email;
    }

    if ($user->show_address) {
        $data['address'] = $user->address;
    }

    return response()->json($data);
}
}
