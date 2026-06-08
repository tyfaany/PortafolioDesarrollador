<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdatePrivacyRequest;
use App\Models\UserVisibility;
use Illuminate\Support\Arr;
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
            'show_in_search' => $user->show_in_search,
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
            'show_instagram' => $user->show_instagram,
            'show_facebook' => $user->show_facebook,
        ], 200);
    }

    /**
     * Actualizar configuración de privacidad del usuario autenticado.
     */
    public function update(UpdatePrivacyRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $visibility = $user->visibility()->firstOrCreate(
            ['user_id' => $user->id],
            UserVisibility::defaults()
        );

        $visibility->fill($validated);
        $visibility->save();

        return response()->json(Arr::only($visibility->toArray(), [
            'show_in_search',
            'show_bio',
            'show_studies',
            'show_jobs',
            'show_skills',
            'show_social_links',
            'show_profile_photo',
            'show_phone',
            'show_mobile',
            'show_contact_email',
            'show_address',
            'show_instagram',
            'show_facebook',
        ]), 200);
    }
}
