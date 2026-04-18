<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\StudyController;



Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/user', [AuthController::class, 'updatePassword']);
    Route::get('/me', [AuthController::class, 'me']);
   Route::put('/user/update', [UserController::class, 'update']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/user/photo', [AuthController::class, 'uploadPhoto']);
    Route::get('/user', [UserController::class, 'show']);

    Route::get('studies', [StudyController::class, 'index']);
    Route::post('studies', [StudyController::class, 'store']);
    Route::put('studies/{study}', [StudyController::class, 'update']);
    Route::delete('studies/{study}', [StudyController::class, 'destroy']);
}); 