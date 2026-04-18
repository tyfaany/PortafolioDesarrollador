<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SoftSkill extends Model
{
    use HasFactory;

    // Esta es la línea clave que le da permiso a Laravel de guardar el nombre
    protected $fillable = ['name'];
}