<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Level extends Model
{
    use HasFactory;

    /**
     * El nombre de la tabla suele ser el plural (levels).
     * El campo rellenable debe coincidir con tu migración.
     */
    protected $fillable = [
        'level'
    ];

    /**
     * Relación: Un nivel puede estar asociado a muchas habilidades técnicas de usuarios.
     * Esto te permite saber, por ejemplo, cuántos usuarios son "Sénior".
     */
    public function technicalSkills(): HasMany
    {
        // Se conecta con la tabla pivote que guarda la relación técnica
        return $this->hasMany(UserTechnicalSkill::class, 'level_id');
    }
}