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
     * HU-14: Asignar y crear habilidades blandas dinámicamente
     */
    public function sync(Request $request)
    {
        // Validamos que sea un arreglo de strings (legacy) u objetos {name, evidence_url}
        $request->validate([
            'skills' => 'present|array',
            'skills.*' => 'required',
            'skills.*.name' => 'sometimes|required|string|max:50',
            'skills.*.evidence_url' => 'nullable|url|max:255',
        ]);

        $user = $request->user();
        $syncData = [];

        foreach ($request->skills as $skillItem) {
            $isObject = is_array($skillItem);
            $skillName = $isObject ? ($skillItem['name'] ?? null) : $skillItem;
            $evidenceUrl = $isObject ? ($skillItem['evidence_url'] ?? null) : null;

            if (!is_string($skillName) || trim($skillName) === '') {
                return response()->json([
                    'message' => 'Cada habilidad debe ser un texto o un objeto con el campo name.'
                ], 422);
            }

            $skillName = trim($skillName);
            if (mb_strlen($skillName, 'UTF-8') > 50) {
                return response()->json([
                    'message' => 'El nombre de la habilidad no puede superar los 50 caracteres.'
                ], 422);
            }

            // Buscamos o creamos la habilidad en el catálogo global.
            $softSkill = SoftSkill::firstOrCreate([
                'name' => mb_strtolower($skillName, 'UTF-8')
            ]);

            $syncData[$softSkill->id] = [
                'evidence_url' => $evidenceUrl
            ];
        }

        // Sincronizamos los IDs con su metadata de pivot (asigna, actualiza o elimina)
        $user->softSkills()->sync($syncData);

        return response()->json([
            'message' => 'Habilidades blandas actualizadas correctamente',
            'soft_skills' => $user->softSkills()->get()
        ], 200);
    }
}
