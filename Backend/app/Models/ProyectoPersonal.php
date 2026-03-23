<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProyectoPersonal extends Model {
    protected $table = 'proyectos_personales';
    protected $fillable = ['id_desarrollador', 'nombre_del_proyecto', 'descripcion', 'enlace_repositorio', 'enlace_demo', 'fecha_inicio', 'esVisible'];
}
