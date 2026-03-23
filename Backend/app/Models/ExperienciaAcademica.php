<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExperienciaAcademica extends Model
{
   protected $table = 'experiencias_academicas';
    protected $fillable = [
        'id_desarrollador', 
        'institucion_academica', 
        'titulo', 
        'fecha_inicio', 
        'fecha_fin', 
        'logros'
    ];
}
