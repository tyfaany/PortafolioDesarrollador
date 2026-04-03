<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me', [UserController::class, 'update']);
    Route::post('/logout', [AuthController::class, 'logout']);

// Estas rutas ahora tendrán el prefijo /api/ automáticamente
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Ruta protegida para probar que el token funciona
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});