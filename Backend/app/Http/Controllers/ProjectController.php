<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class ProjectController extends Controller
{
    public function index()
    {
        // Obtenemos los proyectos del usuario (usando el ID 1 por ahora) 
        // y adjuntamos las tecnologías que usó en cada uno.
        // Los ordenamos para que los más recientes salgan primero.
        $projects = Project::with('technologies')
            ->where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($projects, 200);
    }

    public function store(Request $request)
    {
        // 1. Validaciones estrictas según Criterios de Aceptación (HU-15)
        $validated = $request->validate([
            'title' => 'required|string|min:5|max:100', // Mínimo 5, máximo 100 caracteres[cite: 2]
            'description' => 'required|string|min:20|max:500', // Mínimo 20, máximo 500 caracteres[cite: 2]
            'technologies' => 'required|array|min:1|max:15', // Selector múltiple, mín 1, máx 15[cite: 2]
            'technologies.*' => 'exists:project_technologies,id', // Verifica que las tecnologías existan en el catálogo
            'image' => 'nullable|image|mimes:jpeg,png|max:10240', // Formato JPEG/PNG, máx 10MB[cite: 2]
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date', // Inicio no mayor a fin[cite: 2]
            'is_in_progress' => 'boolean',
            'demo_url' => 'nullable|url', // URLs válidas[cite: 2]
            'repo_url' => 'nullable|url', // URLs válidas[cite: 2]
            'is_public' => 'boolean'
        ]);

        try {
            // Usamos una transacción: Si algo falla a la mitad, no se guarda basura en la BD
            DB::beginTransaction();

            // 2. Procesamiento de la Imagen
            $imagePath = null;
            if ($request->hasFile('image')) {
                // Guarda la imagen en storage/app/public/projects
                $imagePath = $request->file('image')->store('projects', 'public');
            }

            // 3. Crear el Registro del Proyecto
            $project = Project::create([
                'user_id' => auth()->id(),
                'title' => $validated['title'],
                'description' => $validated['description'],
                'image_path' => $imagePath,
                'start_date' => $validated['start_date'] ?? null,
                'end_date' => $validated['end_date'] ?? null,
                'is_in_progress' => $validated['is_in_progress'] ?? false,
                'demo_url' => $validated['demo_url'] ?? null,
                'repo_url' => $validated['repo_url'] ?? null,
                'is_public' => $validated['is_public'] ?? true,
            ]);

            // 4. Guardar las tecnologías en la tabla intermedia
            $project->technologies()->attach($validated['technologies']);

            DB::commit();

            // Mensaje de éxito requerido por el cliente[cite: 2]
            return response()->json([
                'message' => 'Proyecto guardado exitosamente',
                'project' => $project->load('technologies')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            // Si la imagen se subió al disco pero la base de datos falló, la borramos
            if (isset($imagePath)) {
                Storage::disk('public')->delete($imagePath);
            }
            
            return response()->json(['message' => 'Error al guardar el proyecto: ' . $e->getMessage()], 500);
        }
    }

    public function update(Request $request, string $id)
    {
        // Buscamos el proyecto por su UUID
        $project = Project::findOrFail($id);

        if ($project->user_id !== auth()->id()) {
            return response()->json(['message' => 'No tienes permiso para editar este proyecto'], 403);
        }

        // Las mismas validaciones de creación se aplican a la edición[cite: 1]
        $validated = $request->validate([
            'title' => 'required|string|min:5|max:100',
            'description' => 'required|string|min:20|max:500',
            'technologies' => 'required|array|min:1|max:15',
            'technologies.*' => 'exists:project_technologies,id',
            'image' => 'nullable|image|mimes:jpeg,png|max:10240',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_in_progress' => 'boolean',
            'demo_url' => 'nullable|url',
            'repo_url' => 'nullable|url',
            'is_public' => 'boolean'
        ]);

        try {
            DB::beginTransaction();

            // Requerimiento: eliminar la imagen actual y cargar una nueva[cite: 1]
            if ($request->hasFile('image')) {
                // Si el proyecto ya tenía una imagen, la borramos del disco físico
                if ($project->image_path) {
                    Storage::disk('public')->delete($project->image_path);
                }
                // Guardamos la nueva imagen
                $project->image_path = $request->file('image')->store('projects', 'public');
            }

            // Actualizamos los campos de texto y fechas
            $project->update([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'start_date' => $validated['start_date'] ?? $project->start_date,
                'end_date' => $validated['end_date'] ?? $project->end_date,
                'is_in_progress' => $validated['is_in_progress'] ?? $project->is_in_progress,
                'demo_url' => $validated['demo_url'] ?? $project->demo_url,
                'repo_url' => $validated['repo_url'] ?? $project->repo_url,
                'is_public' => $validated['is_public'] ?? $project->is_public,
            ]);

            // Sincronizamos las tecnologías (borra las viejas y pone las nuevas)
            $project->technologies()->sync($validated['technologies']);

            DB::commit();

            return response()->json([
                'message' => 'Cambios guardados exitosamente', // Mensaje exacto exigido en la HU-16[cite: 1]
                'project' => $project->load('technologies')
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error al actualizar: ' . $e->getMessage()], 500);
        }
    }

    public function destroy(Project $project)
    {
        if ($project->user_id !== auth()->id()) {
            return response()->json(['message' => 'No tienes permiso para eliminar este proyecto'], 403);
        }

        if ($project->image_path) {
            Storage::disk('public')->delete($project->image_path);
        }

        $project->delete();

        return response()->json(['message' => 'Proyecto eliminado correctamente'], 200);
    }
}
