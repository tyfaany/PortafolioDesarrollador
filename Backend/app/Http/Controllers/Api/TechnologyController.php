<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TechnicalSkill;
use Illuminate\Http\Request;

class TechnologyController extends Controller
{
    
    public function index()
    {
        $skills = TechnicalSkill::orderBy('name', 'asc')->get();
        return response()->json($skills, 200);
    }

    
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:technical_skills,name',
        ]);

        
        $skill = TechnicalSkill::create([
            'name' => trim($validated['name'])
        ]);

        return response()->json([
            'message' => 'Habilidad técnica añadida al catálogo global correctamente.',
            'data' => $skill
        ], 201);
    }

  
    public function show($id)
    {
        $skill = TechnicalSkill::findOrFail($id);
        return response()->json($skill, 200);
    }

  
    public function update(Request $request, $id)
    {
        $skill = TechnicalSkill::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:technical_skills,name,' . $skill->id,
        ]);

        $skill->update([
            'name' => trim($validated['name'])
        ]);

        return response()->json([
            'message' => 'Habilidad técnica actualizada con éxito.',
            'data' => $skill
        ], 200);
    }

    
    public function destroy($id)
    {
        $skill = TechnicalSkill::findOrFail($id);
        
        
        $skill->delete();

        return response()->json([
            'message' => 'Habilidad técnica eliminada del catálogo global.'
        ], 200);
    }
}