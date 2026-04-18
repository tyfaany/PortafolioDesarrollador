<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\TechnicalSkillController;
use App\Http\Controllers\Api\SoftSkillController;

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
    Route::get('/user/jobs', [JobController::class, 'index']);
    Route::post('/user/jobs', [JobController::class, 'store']);
    Route::put('/user/jobs/{id}', [JobController::class, 'update']);
    Route::get('/user/technical-skills', [TechnicalSkillController::class, 'index']);
    Route::post('/user/technical-skills/sync', [TechnicalSkillController::class, 'sync']);
    Route::get('/user/soft-skills', [SoftSkillController::class, 'index']);
Route::post('/user/soft-skills/sync', [SoftSkillController::class, 'sync']);
});