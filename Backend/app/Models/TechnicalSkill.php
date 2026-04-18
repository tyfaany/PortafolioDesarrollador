<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TechnicalSkill extends Model
{
    use HasFactory;

    // Agrega esta línea para permitir que el controlador cree habilidades nuevas
    protected $fillable = ['name'];
}
