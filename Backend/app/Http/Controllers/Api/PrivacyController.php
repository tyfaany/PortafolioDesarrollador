<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdatePrivacyRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PrivacyController extends Controller
{
    /**
     * Mostrar configuración de privacidad del usuario autenticado.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'show_bio' => $user->show_bio,
            'show_studies' => $user->show_studies,
            'show_jobs' => $user->show_jobs,
            'show_skills' => $user->show_skills,
            'show_social_links' => $user->show_social_links,
            'show_profile_photo' => $user->show_profile_photo,
            'show_phone' => $user->show_phone,
            'show_mobile' => $user->show_mobile,
            'show_contact_email' => $user->show_contact_email,
            'show_address' => $user->show_address,
        ], 200);
    }

    /**
     * Actualizar configuración de privacidad del usuario autenticado.
     */
    public function update(UpdatePrivacyRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $user->update($validated);

        return response()->json([
            'show_bio' => $user->show_bio,
            'show_studies' => $user->show_studies,
            'show_jobs' => $user->show_jobs,
            'show_skills' => $user->show_skills,
            'show_social_links' => $user->show_social_links,
            'show_profile_photo' => $user->show_profile_photo,
            'show_phone' => $user->show_phone,
            'show_mobile' => $user->show_mobile,
            'show_contact_email' => $user->show_contact_email,
            'show_address' => $user->show_address,
        ], 200);
    }
}
