<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class TechnicalSkill extends Model
{
    use HasFactory;

    
    protected $fillable = [
        'name'
    ];

    
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_technical_skill')
                    ->withPivot('level_id') // Para saber qué nivel tiene cada usuario en esta skill
                    ->withTimestamps();
    }
}