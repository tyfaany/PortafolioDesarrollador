<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

// Estas rutas ahora tendrán el prefijo /api/ automáticamente
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Ruta protegida para probar que el token funciona
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});