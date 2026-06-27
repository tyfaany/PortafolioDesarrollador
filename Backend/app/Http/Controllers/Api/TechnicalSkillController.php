<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\TechnicalSkill;

class TechnicalSkillController extends Controller
{
    /**
     * HU-13 (Criterio 1): Obtener lista de habilidades del usuario con su nivel
     */
    public function index(Request $request)
    {
        $skills = $request->user()->skills; // Gracias a withPivot('level'), esto trae el nivel
        return response()->json($skills, 200);
    }

    /**
     * Catálogo de habilidades técnicas disponibles en la base de datos.
     */
    public function catalog()
    {
        $skills = TechnicalSkill::query()
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json($skills, 200);
    }

    /**
     * HU-13: Asignar o actualizar el nivel de las habilidades (VERSIÓN DINÁMICA)
     */
    public function sync(Request $request)
    {
        $request->validate([
            'skills' => 'present|array',
            'skills.*.id' => 'required|integer|exists:technical_skills,id',
            'skills.*.level' => 'required|in:Basico,Intermedio,Avanzado',
            'skills.*.evidence_url' => 'nullable|url|max:255',
        ]);

        $user = $request->user();
        $syncData = [];

        foreach ($request->skills as $skillData) {
            $technicalSkill = TechnicalSkill::find((int) ($skillData['id'] ?? 0));

            if (!$technicalSkill) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Selecciona una habilidad técnica del catálogo.',
                ], 422);
            }

            $syncData[$technicalSkill->id] = [
                'level' => $skillData['level'],
                'evidence_url' => $skillData['evidence_url'] ?? null
            ];
        }

        $user->skills()->sync($syncData);

        return response()->json([
            'status' => 'success',
            'message' => 'Habilidades actualizadas correctamente.',
            'skills' => $user->skills()->get() // Devolvemos la lista fresca
        ], 200);
    }
}
