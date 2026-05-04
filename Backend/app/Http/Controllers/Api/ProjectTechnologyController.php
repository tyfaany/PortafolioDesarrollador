<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProjectTechnology;

class ProjectTechnologyController extends Controller
{
    public function index()
    {
        $technologies = ProjectTechnology::all();

        return response()->json($technologies, 200);
    }
}
