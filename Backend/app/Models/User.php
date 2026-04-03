<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

   
    protected $fillable = [
        'name',
        'email',
        'password',
        'profession',
        'biography',
        'github_username',
        'linkedin_url',
        'profile_image',
    ];

   
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Conversión de tipos automáticos.
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed', // Esto asegura que la contraseña siempre se guarde cifrada
    ];

    /*
    |--------------------------------------------------------------------------
    | RELACIONES (Eloquent Relationships)
    |--------------------------------------------------------------------------
    | Esto permite hacer: $user->projects, $user->studies, etc.
    */

    /**
     * Un usuario (programador) tiene muchos proyectos.
     */
    public function projects()
    {
        return $this->hasMany(Project::class);
    }

    /**
     * Un usuario tiene muchos estudios académicos.
     */
    public function studies()
    {
        return $this->hasMany(Study::class);
    }

    /**
     * Un usuario tiene muchas experiencias laborales.
     */
    public function jobs()
    {
        return $this->hasMany(Job::class);
    }

    /**
     * Un usuario tiene muchas habilidades (Muchos a Muchos).
     */
    public function skills()
    {
        return $this->belongsToMany(TechnicalSkill::class, 'user_skills');
    }
}