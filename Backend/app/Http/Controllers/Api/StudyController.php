<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Study;
use App\Models\User;
use App\Support\PortfolioDateValidator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StudyController extends Controller
{
    /**
     * RUTA PÚBLICA: Ver estudios de un usuario específico.
     * Útil para cuando alguien visita un perfil.
     */
    public function indexPublic(User $user)
    {
        // Obtenemos todos los estudios de ese usuario ordenados por fecha
        $studies = $user->studies()->orderBy('start_date', 'desc')->get();

        return response()->json($studies, 200);
    }


    public function index()
    {
        $user = $this->currentUser();
        $studies = $user->studies()->orderBy('start_date', 'desc')->get();

        return response()->json($studies, 200);
    }

    /**
     * Guardar un nuevo estudio para el usuario logueado.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'academic_institution' => 'required|string|max:100',
            'degree'               => 'required|string|max:100',
            'start_date'           => 'required|date',
            'end_date'             => 'nullable|date',
            'achievements'         => 'nullable|string',
        ]);

        $dateError = PortfolioDateValidator::validateStudyDates(
            $validated['start_date'],
            $validated['end_date'] ?? null,
        );

        if ($dateError !== null) {
            return response()->json([
                'status' => 'error',
                'message' => $dateError,
            ], 422);
        }

        // Se crea asociado al usuario autenticado
        $user = $this->currentUser();
        $study = $user->studies()->create($validated);

        return response()->json($study, 201);
    }

    /**
     * Actualizar un estudio.
     */
    public function update(Request $request, Study $study)
    {
        // Verificamos que el estudio sea del usuario que intenta editar
        if ($study->user_id !== Auth::id()) {
            return response()->json([
                'status' => 'error',
                'message' => 'No autorizado.'
            ], 403);
        }

        $validated = $request->validate([
            'academic_institution' => 'required|string|max:100',
            'degree'               => 'required|string|max:100',
            'start_date'           => 'required|date',
            'end_date'             => 'nullable|date',
            'achievements'         => 'nullable|string',
        ]);

        $dateError = PortfolioDateValidator::validateStudyDates(
            $validated['start_date'],
            $validated['end_date'] ?? null,
        );

        if ($dateError !== null) {
            return response()->json([
                'status' => 'error',
                'message' => $dateError,
            ], 422);
        }

        $study->update($validated);

        return response()->json($study, 200);
    }

    /**
     * Eliminar un estudio.
     */
    public function destroy(Study $study)
    {
        if ($study->user_id !== Auth::id()) {
            return response()->json([
                'status' => 'error',
                'message' => 'No autorizado.'
            ], 403);
        }

        $study->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Estudio eliminado correctamente.'
        ], 200);
    }

    private function currentUser(): User
    {
        /** @var User $user */
        $user = Auth::user();

        return $user;
    }
}
