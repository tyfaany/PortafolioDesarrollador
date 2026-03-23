<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExperienciaLaboral extends Model
{
    protected $table = 'experiencias_laborales';
    protected $fillable = ['id_desarrollador', 'nombre_empresa', 'puesto', 'ubicacion_trabajo', 'fecha_inicio', 'fecha_fin', 'logros', 'enlace_linkedin', 'enlace_github'];
}
