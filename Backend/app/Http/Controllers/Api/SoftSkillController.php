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
        // Validamos que sea un arreglo de textos (strings)
        $request->validate([
            'skills' => 'required|array',
            'skills.*' => 'required|string|max:50',
        ]);

        $user = $request->user();
        $syncIds = [];

        foreach ($request->skills as $skillName) {
            // Buscamos o creamos la habilidad en el catálogo global
            $softSkill = SoftSkill::firstOrCreate([
                'name' => mb_strtolower(trim($skillName), 'UTF-8')
            ]);

            // Solo guardamos los IDs para sincronizar
            $syncIds[] = $softSkill->id;
        }

        // Sincronizamos los IDs con el usuario (asigna, actualiza o elimina)
        $user->softSkills()->sync($syncIds);

        return response()->json([
            'message' => 'Habilidades blandas actualizadas correctamente',
            'soft_skills' => $user->softSkills()->get()
        ], 200);
    }
}
