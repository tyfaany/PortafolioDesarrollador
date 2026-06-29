<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Job;
use App\Support\PortfolioDateValidator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class JobController extends Controller
{
    /**
     * Obtener todos los trabajos del usuario logueado (Para que el frontend los dibuje)
     */
    public function index(Request $request)
    {
        // Traemos los trabajos ordenados por año y mes descendente (los más recientes primero)
        $jobs = $request->user()->jobs()->orderBy('start_year', 'desc')->get();
        return response()->json($jobs, 200);
    }

    /**
     * HU-11: Añadir Experiencia Laboral
     */
    public function store(Request $request)
    {
        $this->validateJob($request);

        $dateError = PortfolioDateValidator::validateJobDates(
            $request->start_year,
            $request->start_month,
            $request->end_year,
            $request->end_month,
            (bool) $request->is_current_job,
        );
        if ($dateError !== null) {
            return response()->json([
                'status' => 'error',
                'message' => $dateError
            ], 422);
        }

        // Creamos el trabajo enlazado automáticamente al usuario actual
        $job = $request->user()->jobs()->create($this->prepareData($request));

        return response()->json([
            'status' => 'success',
            'message' => 'Datos guardados correctamente.',
            'job' => $job
        ], 201);
    }

    /**
     * HU-12: Editar Experiencia Laboral
     */
    public function update(Request $request, string $id)
    {
        $job = $request->user()->jobs()->find($id);

        if (!$job) {
            return response()->json([
                'status' => 'error',
                'message' => 'Experiencia laboral no encontrada.'
            ], 404);
        }

        $this->validateJob($request);

        $dateError = PortfolioDateValidator::validateJobDates(
            $request->start_year,
            $request->start_month,
            $request->end_year,
            $request->end_month,
            (bool) $request->is_current_job,
        );
        if ($dateError !== null) {
            return response()->json([
                'status' => 'error',
                'message' => $dateError
            ], 422);
        }

        $job->update($this->prepareData($request));

        return response()->json([
            'status' => 'success',
            'message' => 'Datos actualizados correctamente.',
            'job' => $job
        ], 200);
    }

    /**
     * Eliminar experiencia laboral.
     */
    public function destroy(Request $request, string $id)
    {
        $job = $request->user()->jobs()->find($id);

        if (!$job) {
            return response()->json([
                'status' => 'error',
                'message' => 'Experiencia laboral no encontrada.'
            ], 404);
        }

        $job->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Experiencia laboral eliminada correctamente.'
        ], 200);
    }

    // --- MÉTODOS AUXILIARES (Para no repetir código) ---

    private function validateJob(Request $request)
    {
        $request->validate([
            'company_name' => 'required|string|max:100',
            'position' => 'required|string|max:100',
            'start_month' => 'required|string|max:20',
            'start_year' => 'required|integer',
            'is_current_job' => 'boolean',
            'end_month' => 'nullable|string|max:20',
            'end_year' => 'nullable|integer',
            'achievements' => 'nullable|string|max:500',
            'evidence_url' => 'nullable|url|max:255'
        ], [
            'company_name.required' => 'El nombre de la empresa es obligatorio.',
            'company_name.string' => 'El nombre de la empresa debe ser una cadena de texto.',
            'company_name.max' => 'El nombre de la empresa no puede superar :max caracteres.',
            'position.required' => 'El cargo / puesto es obligatorio.',
            'position.string' => 'El cargo / puesto debe ser una cadena de texto.',
            'position.max' => 'El cargo / puesto no puede superar :max caracteres.',
            'start_month.required' => 'La fecha de inicio es obligatoria.',
            'start_month.string' => 'La fecha de inicio debe ser una cadena de texto.',
            'start_month.max' => 'La fecha de inicio no puede superar :max caracteres.',
            'start_year.required' => 'El año de inicio es obligatorio.',
            'start_year.integer' => 'El año de inicio debe ser un número entero.',
            'is_current_job.boolean' => 'El estado del trabajo actual debe ser verdadero o falso.',
            'end_month.string' => 'La fecha de fin debe ser una cadena de texto.',
            'end_month.max' => 'La fecha de fin no puede superar :max caracteres.',
            'end_year.integer' => 'El año de fin debe ser un número entero.',
            'achievements.string' => 'Los logros deben ser una cadena de texto.',
            'achievements.max' => 'Los logros no pueden superar :max caracteres.',
            'evidence_url.url' => 'El enlace de evidencia debe ser una URL válida.',
            'evidence_url.max' => 'El enlace de evidencia no puede superar :max caracteres.',
        ], [
            'company_name' => 'nombre de la empresa',
            'position' => 'cargo / puesto',
            'start_month' => 'fecha de inicio',
            'start_year' => 'año de inicio',
            'end_month' => 'fecha de fin',
            'end_year' => 'año de fin',
            'achievements' => 'logros',
            'evidence_url' => 'enlace de evidencia',
        ]);
    }

    private function prepareData(Request $request)
    {
        $job = new Job();
        $table = $job->getTable();
        $columnas = Schema::getColumnListing($table);
        $startMonth = PortfolioDateValidator::normalizeMonthValue($request->input('start_month'));
        $endMonth = PortfolioDateValidator::normalizeMonthValue($request->input('end_month'));
        $data = $request->only([
            'company_name',
            'position',
            'achievements',
            'start_year',
            'end_year',
            'is_current_job',
            'evidence_url',
        ]);

        $data['start_month'] = $startMonth;
        $data['end_month'] = $request->is_current_job ? null : $endMonth;

        // Si es trabajo actual, forzamos que las fechas de fin sean nulas para no guardar basura en la BD
        if ($request->is_current_job) {
            $data['end_month'] = null;
            $data['end_year'] = null;
        }

        // Compatibilidad con esquemas legacy.
        // Si existen columnas alternativas, también las rellenamos para evitar errores
        // cuando sean NOT NULL en bases antiguas.
        $positionValor = $request->input('position');
        foreach (['role', 'job_title', 'title', 'cargo'] as $legacyColumn) {
            if (in_array($legacyColumn, $columnas, true)) {
                $data[$legacyColumn] = $positionValor;
            }
        }
        if (!in_array('position', $columnas, true)) {
            unset($data['position']);
        }

        $achievementsValor = $request->input('achievements');
        foreach (['achievement', 'achivement', 'achivements', 'description', 'logros'] as $legacyColumn) {
            if (in_array($legacyColumn, $columnas, true)) {
                $data[$legacyColumn] = $achievementsValor;
            }
        }
        if (!in_array('achievements', $columnas, true)) {
            unset($data['achievements']);
        }

        return array_intersect_key($data, array_flip($columnas));
    }

}
