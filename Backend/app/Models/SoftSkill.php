<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class SoftSkill extends Model
{
    use HasFactory;

    
    protected $fillable = [
        'name'
    ];

    /**
     * Relación inversa: Obtener los usuarios que tienen esta habilidad blanda.
     * Permite hacer: $softSkill->users
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_soft_skill')
                    ->withTimestamps();
    }
}