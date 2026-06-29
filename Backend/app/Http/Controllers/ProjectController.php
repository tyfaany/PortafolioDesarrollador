<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\User;
use App\QueryFilters\TechFilter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ProjectController extends Controller
{
    /**
     * @return array<int>
     */
    private function syncProjectTechnologies(array $technologies): array
    {
        return array_values(array_unique(array_map(
            static fn ($technology) => (int) $technology,
            $technologies,
        )));
    }

    private function getPlainTextDescriptionLength(string $description): int
    {
        $normalized = html_entity_decode($description, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $normalized = preg_replace('/<\s*br\s*\/?\s*>/i', "\n", $normalized);
        $normalized = preg_replace('/<\s*\/\s*(p|div|li|h[1-6])\s*>/i', "\n", $normalized);
        $plainText = strip_tags($normalized);
        $plainText = preg_replace('/\x{00A0}/u', ' ', $plainText ?? '');

        return mb_strlen(trim($plainText ?? ''));
    }

    private function ensureDescriptionLengthIsValid(string $description): void
    {
        $descriptionLength = $this->getPlainTextDescriptionLength($description);

        if ($descriptionLength < 20 || $descriptionLength > 500) {
            throw ValidationException::withMessages([
                'description' => ['La descripción debe tener entre 20 y 500 caracteres.'],
            ]);
        }
    }

    private function projectValidationRules(): array
    {
        return [
            'title' => 'required|string|min:5|max:100',
            'description' => 'required|string',
            'technologies' => 'required|array|min:1|max:15',
            'technologies.*' => 'required|integer|exists:project_technologies,id',
            'image' => 'nullable|image|mimes:jpeg,png|max:10240',
            'start_date' => 'required|date',
            'end_date' => 'required_unless:is_in_progress,1|date',
            'is_in_progress' => 'boolean',
            'demo_url' => 'nullable|url|max:2048',
            'repo_url' => 'nullable|url|max:2048',
            'is_public' => 'boolean',
        ];
    }

    private function projectValidationMessages(): array
    {
        return [
            'title.required' => 'El título es obligatorio.',
            'title.string' => 'El título debe ser una cadena de texto.',
            'title.min' => 'El título debe tener al menos :min caracteres.',
            'title.max' => 'El título no puede superar :max caracteres.',
            'description.required' => 'La descripción es obligatoria.',
            'description.string' => 'La descripción debe ser una cadena de texto.',
            'technologies.required' => 'Debes seleccionar al menos una tecnología.',
            'technologies.array' => 'Las tecnologías deben enviarse como una lista válida.',
            'technologies.min' => 'Debes seleccionar al menos :min tecnología.',
            'technologies.max' => 'Puedes seleccionar como máximo :max tecnologías.',
            'technologies.*.required' => 'Cada tecnología es obligatoria.',
            'technologies.*.integer' => 'Cada tecnología debe ser un identificador numérico.',
            'technologies.*.exists' => 'Una o más tecnologías seleccionadas no son válidas.',
            'image.image' => 'La imagen debe ser un archivo de tipo imagen.',
            'image.mimes' => 'La imagen debe ser de tipo jpeg o png.',
            'image.max' => 'La imagen no puede superar :max kilobytes.',
            'start_date.required' => 'La fecha de inicio es obligatoria.',
            'start_date.date' => 'La fecha de inicio no es válida.',
            'end_date.required_unless' => 'La fecha de fin es obligatoria cuando el proyecto no está en progreso.',
            'end_date.date' => 'La fecha de fin no es válida.',
            'is_in_progress.boolean' => 'El estado de progreso debe ser verdadero o falso.',
            'demo_url.url' => 'La URL demo debe ser válida.',
            'demo_url.max' => 'La URL demo no puede superar :max caracteres.',
            'repo_url.url' => 'La URL del repositorio debe ser válida.',
            'repo_url.max' => 'La URL del repositorio no puede superar :max caracteres.',
            'is_public.boolean' => 'La visibilidad debe ser verdadera o falsa.',
        ];
    }

    private function projectValidationAttributes(): array
    {
        return [
            'title' => 'título',
            'description' => 'descripción',
            'technologies' => 'tecnologías',
            'technologies.*' => 'tecnología',
            'image' => 'imagen',
            'start_date' => 'fecha de inicio',
            'end_date' => 'fecha de fin',
            'is_in_progress' => 'estado en progreso',
            'demo_url' => 'URL demo',
            'repo_url' => 'URL del repositorio',
            'is_public' => 'visibilidad',
        ];
    }

    private function validateProject(Request $request): array
    {
        return $request->validate(
            $this->projectValidationRules(),
            $this->projectValidationMessages(),
            $this->projectValidationAttributes(),
        );
    }

    public function index(Request $request)
    {
        $perPage = min($request->integer('per_page', 5), 50);

        $projects = QueryBuilder::for(
            Project::query()->with('technologies')->where('user_id', auth()->id())
        )
            ->allowedFilters([
                AllowedFilter::callback('search', function (Builder $query, $value): void {
                    $value = trim((string) $value);

                    if ($value === '') {
                        return;
                    }

                    $query->where(function (Builder $subQuery) use ($value): void {
                        $subQuery->where('name', 'LIKE', "%{$value}%")
                            ->orWhereHas('technologies', function (Builder $techQuery) use ($value): void {
                                $techQuery->where('project_technologies.name', 'LIKE', "%{$value}%");
                            });
                    });
                }),
                AllowedFilter::exact('is_public'),
                AllowedFilter::custom('tech_filter', new TechFilter()),
            ])
            ->allowedSorts(['created_at', 'name', 'is_in_progress', 'end_date', 'start_date'])
            ->defaultSort('-is_in_progress', '-end_date', '-start_date', '-created_at')
            ->paginate($perPage)
            ->appends($request->query());

        return response()->json($projects, 200);
    }

    public function indexPublic(User $user)
    {
        $query = Project::with('technologies')
            ->where('user_id', $user->id)
            ->orderBy('is_in_progress', 'desc')
            ->orderBy('end_date', 'desc')
            ->orderBy('start_date', 'desc')
            ->orderBy('created_at', 'desc');

        $query->where('is_public', true);

        $projects = $query->get();

        return response()->json($projects, 200);
    }

    public function showPublicImage(Project $project)
    {
        if (!$project->is_public) {
            abort(404);
        }

        if (!$project->image_path || !Storage::disk('public')->exists($project->image_path)) {
            abort(404);
        }

        $absolutePath = storage_path('app/public/' . $project->image_path);
        $mimeType = mime_content_type($absolutePath) ?: 'image/jpeg';

        return response()->file($absolutePath, [
            'Content-Type' => $mimeType,
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateProject($request);

        $this->ensureDescriptionLengthIsValid($validated['description']);

        $isInProgress = (bool) ($validated['is_in_progress'] ?? false);
        if ($isInProgress) {
            $validated['end_date'] = null;
        } elseif (
            !empty($validated['start_date']) &&
            !empty($validated['end_date']) &&
            Carbon::parse($validated['end_date'])->lt(Carbon::parse($validated['start_date']))
        ) {
            return response()->json([
                'message' => 'La fecha de fin debe ser mayor o igual a la fecha de inicio cuando el proyecto no está en progreso.'
            ], 422);
        }

        try {
            // Usamos una transacción: Si algo falla a la mitad, no se guarda basura en la BD
            DB::beginTransaction();

            // 2. Procesamiento de la Imagen
            $imagePath = null;
            $imageOriginalName = null;
            if ($request->hasFile('image')) {
                // Guarda la imagen en storage/app/public/projects
                $imageFile = $request->file('image');
                $imagePath = $imageFile->store('projects', 'public');
                $imageOriginalName = $imageFile->getClientOriginalName();
            }

            // 3. Crear el Registro del Proyecto
            $projectData = [
                'user_id' => auth()->id(),
                'name' => $validated['title'],
                'description' => $validated['description'],
                'start_date' => $validated['start_date'] ?? null,
                'end_date' => $validated['end_date'] ?? null,
                'demo_url' => $validated['demo_url'] ?? null,
                'repository_url' => $validated['repo_url'] ?? null,
            ];

            $projectData['image_path'] = $imagePath;
            $projectData['image_original_name'] = $imageOriginalName;
            $projectData['is_in_progress'] = $validated['is_in_progress'] ?? false;
            $projectData['is_public'] = $validated['is_public'] ?? true;

            $project = Project::create($projectData);

            // 4. Guardar las tecnologías en la tabla intermedia
            $technologyIds = $this->syncProjectTechnologies($validated['technologies']);
            $project->technologies()->attach($technologyIds);

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

        $validated = $this->validateProject($request);

        $this->ensureDescriptionLengthIsValid($validated['description']);

        $isInProgress = (bool) ($validated['is_in_progress'] ?? false);
        if ($isInProgress) {
            $validated['end_date'] = null;
        } elseif (
            !empty($validated['start_date']) &&
            !empty($validated['end_date']) &&
            Carbon::parse($validated['end_date'])->lt(Carbon::parse($validated['start_date']))
        ) {
            return response()->json([
                'message' => 'La fecha de fin debe ser mayor o igual a la fecha de inicio cuando el proyecto no está en progreso.'
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Requerimiento: eliminar la imagen actual y cargar una nueva[cite: 1]
            if ($request->hasFile('image')) {
                // Si el proyecto ya tenía una imagen, la borramos del disco físico
                if ($project->image_path) {
                    Storage::disk('public')->delete($project->image_path);
                }
                // Guardamos la nueva imagen
                $imageFile = $request->file('image');
                $project->image_path = $imageFile->store('projects', 'public');

                $project->image_original_name = $imageFile->getClientOriginalName();
            }

            // Actualizamos los campos de texto y fechas
            $projectData = [
                'name' => $validated['title'],
                'description' => $validated['description'],
                'start_date' => $validated['start_date'] ?? $project->start_date,
                'end_date' => $validated['end_date'] ?? $project->end_date,
            ];

            $projectData['demo_url'] = array_key_exists('demo_url', $validated)
                ? $validated['demo_url']
                : $project->demo_url;
            $projectData['repository_url'] = array_key_exists('repo_url', $validated)
                ? $validated['repo_url']
                : $project->repository_url;

            $projectData['is_in_progress'] = $validated['is_in_progress'] ?? $project->is_in_progress;
            $projectData['is_public'] = $validated['is_public'] ?? $project->is_public;

            $project->update($projectData);

            // Sincronizamos las tecnologías (borra las viejas y pone las nuevas)
            $technologyIds = $this->syncProjectTechnologies($validated['technologies']);
            $project->technologies()->sync($technologyIds);

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
