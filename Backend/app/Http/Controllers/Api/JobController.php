<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Job;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class JobController extends Controller
{
    private const MONTHS = [
        'enero' => 1,
        'febrero' => 2,
        'marzo' => 3,
        'abril' => 4,
        'mayo' => 5,
        'junio' => 6,
        'julio' => 7,
        'agosto' => 8,
        'septiembre' => 9,
        'octubre' => 10,
        'noviembre' => 11,
        'diciembre' => 12,
    ];

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

        if (!$this->checkDateLogic($request)) {
            return response()->json([
                'status' => 'error',
                'message' => 'La fecha de inicio no puede ser posterior a la fecha de fin.'
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
    public function update(Request $request, $id)
    {
        $job = $request->user()->jobs()->find($id);

        if (!$job) {
            return response()->json([
                'status' => 'error',
                'message' => 'Experiencia laboral no encontrada.'
            ], 404);
        }

        $this->validateJob($request);

        if (!$this->checkDateLogic($request)) {
            return response()->json([
                'status' => 'error',
                'message' => 'La fecha de inicio no puede ser posterior a la fecha de fin.'
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
    public function destroy(Request $request, $id)
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
            'end_month' => 'required_if:is_current_job,false|string|max:20',
            'end_year' => 'required_if:is_current_job,false',
            'achievements' => 'nullable|string',
            'evidence_url' => 'nullable|url|max:255'
        ]);
    }

    private function normalizeMonthValue($value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_numeric($value)) {
            $month = (int) $value;

            return $month >= 1 && $month <= 12 ? $month : null;
        }

        $normalized = mb_strtolower(trim((string) $value), 'UTF-8');

        return self::MONTHS[$normalized] ?? null;
    }

    private function prepareData(Request $request)
    {
        $job = new Job();
        $table = $job->getTable();
        $columnas = Schema::getColumnListing($table);
        $startMonth = $this->normalizeMonthValue($request->input('start_month'));
        $endMonth = $this->normalizeMonthValue($request->input('end_month'));
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

    private function checkDateLogic(Request $request)
    {
        if ($request->is_current_job) return true; // Si es actual, no hay fecha de fin con qué comparar

        $sYear = $request->start_year;
        $eYear = $request->end_year;
        $sMonthNum = $this->normalizeMonthValue($request->start_month) ?? 0;
        $eMonthNum = $this->normalizeMonthValue($request->end_month) ?? 0;
        
        if ($sYear > $eYear) return false;
        
        if ($sYear == $eYear) {
            if ($sMonthNum > $eMonthNum) return false;
        }

        return true;
    }
}
