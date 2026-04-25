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
     * HU-13: Asignar o actualizar el nivel de las habilidades (VERSIÓN DINÁMICA)
     */
    public function sync(Request $request)
    {
        // Validamos que envíen el arreglo y que el nivel sea correcto
        // Fíjate que YA NO validamos 'exists:technical_skills,id'
        $request->validate([
            'skills' => 'present|array',
            'skills.*.name' => 'required|string|max:100', // Ahora pedimos el NOMBRE, no el ID
            'skills.*.level' => 'required|in:Basico,Intermedio,Avanzado',
            'skills.*.evidence_url' => 'nullable|url|max:255',
        ]);

        $user = $request->user();
        $syncData = [];

        foreach ($request->skills as $skillData) {
            // Buscamos si la habilidad ya existe en el catálogo general.
            // Si no existe, la CREAMOS al vuelo (firstOrCreate).
            $technicalSkill = TechnicalSkill::firstOrCreate([
                'name' => mb_strtolower(trim($skillData['name']), 'UTF-8')
            ]);

            // Preparamos los datos para sincronizar usando el ID que encontramos o acabamos de crear
            $syncData[$technicalSkill->id] = [
                'level' => $skillData['level'],
                'evidence_url' => $skillData['evidence_url'] ?? null
            ];
        }

        // Sincronizamos (asigna nuevas, actualiza niveles, y borra las que el usuario quitó)
        $user->skills()->sync($syncData);

        return response()->json([
            'message' => 'Habilidades actualizadas correctamente',
            'skills' => $user->skills()->get() // Devolvemos la lista fresca
        ], 200);
    }
}
