<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\TechnicalSkillController;
use App\Http\Controllers\Api\SoftSkillController;
use App\Http\Controllers\Api\StudyController; // Importación agregada para evitar errores del equipo

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::get('users/{user}/studies', [StudyController::class, 'indexPublic']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/user', [AuthController::class, 'updatePassword']);
    Route::put('/user/update', [UserController::class, 'update']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/user/photo', [AuthController::class, 'uploadPhoto']);
    Route::get('/user', [UserController::class, 'show']);

    // --- Tus Rutas (Experiencia y Habilidades) ---
    Route::get('/user/jobs', [JobController::class, 'index']);
    Route::post('/user/jobs', [JobController::class, 'store']);
    Route::put('/user/jobs/{id}', [JobController::class, 'update']);
    Route::get('/user/technical-skills', [TechnicalSkillController::class, 'index']);
    Route::post('/user/technical-skills/sync', [TechnicalSkillController::class, 'sync']);
    Route::get('/user/soft-skills', [SoftSkillController::class, 'index']);
    Route::post('/user/soft-skills/sync', [SoftSkillController::class, 'sync']);

    // --- Rutas del Equipo (Estudios) ---
    Route::get('studies', [StudyController::class, 'index']);
    Route::post('studies', [StudyController::class, 'store']);
    Route::put('studies/{study}', [StudyController::class, 'update']);
    Route::delete('studies/{study}', [StudyController::class, 'destroy']);
});
