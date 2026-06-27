<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SoftSkill;

class SoftSkillController extends Controller
{
    /**
     * Obtener lista de habilidades blandas del usuario
     */
    public function index(Request $request)
    {
        return response()->json($request->user()->softSkills, 200);
    }

    /**
     * Catálogo global de habilidades blandas.
     */
    public function catalog()
    {
        $skills = SoftSkill::query()
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json($skills, 200);
    }

    /**
     * HU-14: Asignar y crear habilidades blandas dinámicamente
     */
    public function sync(Request $request)
    {
        $request->validate([
            'skills' => 'present|array',
            'skills.*.id' => 'required|integer|exists:soft_skills,id',
            'skills.*.evidence_url' => 'nullable|url|max:255',
        ]);

        $user = $request->user();
        $syncData = [];

        foreach ($request->skills as $skillItem) {
            $softSkill = SoftSkill::find((int) ($skillItem['id'] ?? 0));
            $evidenceUrl = $skillItem['evidence_url'] ?? null;

            if (!$softSkill) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Selecciona una habilidad blanda del catálogo.',
                ], 422);
            }

            $syncData[$softSkill->id] = [
                'evidence_url' => $evidenceUrl
            ];
        }

        // Sincronizamos los IDs con su metadata de pivot (asigna, actualiza o elimina)
        $user->softSkills()->sync($syncData);

        return response()->json([
            'status' => 'success',
            'message' => 'Habilidades blandas actualizadas correctamente.',
            'soft_skills' => $user->softSkills()->get()
        ], 200);
    }
}
