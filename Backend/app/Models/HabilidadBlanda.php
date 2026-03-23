<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HabilidadBlanda extends Model
{
    protected $table = 'habilidades_blandas';
    protected $fillable = [
        'id_desarrollador', 
        'nombre_habilidad', 
        'nivel'
    ];
}
