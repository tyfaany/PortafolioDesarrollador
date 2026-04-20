<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Job;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class JobController extends Controller
{
    // Mapeo auxiliar para comparar fechas numéricamente
    private $months = [
        'Enero' => 1, 'Febrero' => 2, 'Marzo' => 3, 'Abril' => 4,
        'Mayo' => 5, 'Junio' => 6, 'Julio' => 7, 'Agosto' => 8,
        'Septiembre' => 9, 'Octubre' => 10, 'Noviembre' => 11, 'Diciembre' => 12
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
            return response()->json(['message' => 'La fecha de inicio no puede ser posterior a la fecha de fin.'], 422);
        }

        // Creamos el trabajo enlazado automáticamente al usuario actual
        $job = $request->user()->jobs()->create($this->prepareData($request));

        return response()->json([
            'message' => 'Datos guardados correctamente',
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
            return response()->json(['message' => 'Experiencia laboral no encontrada.'], 404);
        }

        $this->validateJob($request);

        if (!$this->checkDateLogic($request)) {
            return response()->json(['message' => 'La fecha de inicio no puede ser posterior a la fecha de fin.'], 422);
        }

        $job->update($this->prepareData($request));

        return response()->json([
            'message' => 'Datos actualizados correctamente',
            'job' => $job
        ], 200);
    }

    // --- MÉTODOS AUXILIARES (Para no repetir código) ---

    private function validateJob(Request $request)
    {
        $request->validate([
            'company_name' => 'required|string|max:100',
            'position' => 'required|string|max:100',
            'start_month' => 'required|string',
            'start_year' => 'required|integer',
            'is_current_job' => 'boolean',
            'end_month' => 'required_if:is_current_job,false',
            'end_year' => 'required_if:is_current_job,false',
            'achievements' => 'nullable|string'
        ]);
    }

    private function prepareData(Request $request)
    {
        $job = new Job();
        $table = $job->getTable();
        $columnas = Schema::getColumnListing($table);
        $data = $request->only([
            'company_name',
            'position',
            'achievements',
            'start_month',
            'start_year',
            'end_month',
            'end_year',
            'is_current_job',
        ]);

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
        
        if ($sYear > $eYear) return false;
        
        if ($sYear == $eYear) {
            $sMonthNum = $this->months[$request->start_month] ?? 0;
            $eMonthNum = $this->months[$request->end_month] ?? 0;
            if ($sMonthNum > $eMonthNum) return false;
        }

        return true;
    }
}
