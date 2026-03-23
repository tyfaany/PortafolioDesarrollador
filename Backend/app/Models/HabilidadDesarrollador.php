<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HabilidadDesarrollador extends Model
{
    protected $table = 'habilidades_desarrollador';
    protected $fillable = [
        'id_desarrollador', 
        'id_habilidad_tecnica', 
        'id_habilidad_blanda'
    ];
}