<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HabilidadTecnica extends Model {
    protected $table = 'habilidades_tecnicas';
    protected $fillable = ['id_desarrollador', 'nombre_habilidad', 'nivel'];
}