<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GithubRepository extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'github_id',
        'name',
        'description',
        'html_url',
        'stars_count',
        'forks_count',
        'language',
        'is_fork',
        'is_visible',
        'pushed_at'
    ];

    // Aseguramos que los tipos de datos sean correctos al consultarlos
    protected $casts = [
        'is_fork' => 'boolean',
        'is_visible' => 'boolean',
        'pushed_at' => 'datetime',
    ];

    // Relación: Un repositorio pertenece a un usuario
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}