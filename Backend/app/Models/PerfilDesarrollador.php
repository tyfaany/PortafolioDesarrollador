<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PerfilDesarrollador extends Model {
    protected $table = 'perfiles_desarrolladores'; // Nombre exacto de tu tabla
    protected $fillable = ['nombre', 'profesion', 'biografia', 'correo', 'contraseña', 'telefono', 'nombre_usuario_github'];
}
