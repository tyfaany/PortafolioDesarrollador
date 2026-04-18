<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'profession',
        'biography',
        'github_url',
        'linkedin_url',
        'profile_photo',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = [
        'profile_photo_url',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

   

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function studies(): HasMany
    {
        return $this->hasMany(Study::class);
    }

    public function jobs(): HasMany
    {
        return $this->hasMany(Job::class);
    }

    /**
     * Habilidades Técnicas: Relación Muchos a Muchos .
     */
    public function technicalSkills(): BelongsToMany
    {
        return $this->belongsToMany(TechnicalSkill::class, 'user_technical_skill')
                    ->withPivot('level_id')
                    ->withTimestamps();
    }

    /**
     * Habilidades Blandas: Relación Muchos a Muchos .
     */
    public function softSkills(): BelongsToMany
    {
        return $this->belongsToMany(SoftSkill::class, 'user_soft_skill')
                    ->withTimestamps();
    }

    /*
    |--------------------------------------------------------------------------
    | ACCESSORS
    |--------------------------------------------------------------------------
    */

    public function getProfilePhotoUrlAttribute()
    {
        if ($this->profile_photo) {
            return asset('storage/' . $this->profile_photo);
        }
        return null;
    }
}