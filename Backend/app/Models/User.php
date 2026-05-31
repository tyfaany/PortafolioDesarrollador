<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

//use App\Models\SocialAccount;
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'profession',
        'biography',
        'github_url',
        'linkedin_url',
        'linkedin_linked',
        'profile_photo',
        'profile_completed',
        'phone',
        'mobile',
        'contact_email',
        'address',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'visibility',
    ];

    // --- NUEVO
    protected $appends = [
        'profile_photo_url',
        'show_bio',
        'show_studies',
        'show_jobs',
        'show_skills',
        'show_social_links',
        'show_profile_photo',
        'show_phone',
        'show_mobile',
        'show_contact_email',
        'show_address',
    ];

    /**
     * Conversión de tipos automáticos.
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed', // Esto asegura que la contraseña siempre se guarde cifrada
        'role' => 'string',
        'linkedin_linked' => 'boolean',
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
        return $this->belongsToMany(TechnicalSkill::class, 'user_skills')
                ->withPivot('level', 'evidence_url') // <-- Añadir aquí
                ->withTimestamps();
    }
    /**
     * Un usuario tiene muchas habilidades blandas (Muchos a Muchos).
     * Laravel asume por defecto que la tabla intermedia se llama 'soft_skill_user'
     */
    public function softSkills()
    {
        return $this->belongsToMany(SoftSkill::class, 'soft_skill_user')
                ->withPivot('evidence_url') // <-- Añadir aquí
                ->withTimestamps();
    }

    public function socialAccounts()
{
    return $this->hasMany(SocialAccount::class);
}

    public function visibility(): HasOne
    {
        return $this->hasOne(UserVisibility::class);
    }

    protected function visibilityValue(string $key): bool
    {
        return (bool) ($this->visibility?->{$key} ?? UserVisibility::defaults()[$key]);
    }

    public function getShowBioAttribute(): bool
    {
        return $this->visibilityValue('show_bio');
    }

    public function getShowStudiesAttribute(): bool
    {
        return $this->visibilityValue('show_studies');
    }

    public function getShowJobsAttribute(): bool
    {
        return $this->visibilityValue('show_jobs');
    }

    public function getShowSkillsAttribute(): bool
    {
        return $this->visibilityValue('show_skills');
    }

    public function getShowSocialLinksAttribute(): bool
    {
        return $this->visibilityValue('show_social_links');
    }

    public function getShowProfilePhotoAttribute(): bool
    {
        return $this->visibilityValue('show_profile_photo');
    }

    public function getShowPhoneAttribute(): bool
    {
        return $this->visibilityValue('show_phone');
    }

    public function getShowMobileAttribute(): bool
    {
        return $this->visibilityValue('show_mobile');
    }

    public function getShowContactEmailAttribute(): bool
    {
        return $this->visibilityValue('show_contact_email');
    }

    public function getShowAddressAttribute(): bool
    {
        return $this->visibilityValue('show_address');
    }

    // --- NUEVO: Agregamos la función del Accessor al final ---
    /**
     * Accessor para obtener la URL completa de la foto de perfil automáticamente
     */
    
    public function getProfilePhotoUrlAttribute()
    {
        if (!$this->profile_photo) {
            return null;
        }

        if (preg_match('/^https?:\/\//i', $this->profile_photo)) {
            return $this->profile_photo;
        }

        $relativePath = 'storage/' . ltrim($this->profile_photo, '/');
        $request = request();

        if ($request) {
            return rtrim($request->getSchemeAndHttpHost(), '/') . '/' . $relativePath;
        }

        return asset($relativePath);
    }
}
