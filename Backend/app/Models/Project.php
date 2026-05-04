<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'image_path',
        'start_date',
        'end_date',
        'is_in_progress',
        'demo_url',
        'repository_url',
        'is_public'
    ];

    protected $appends = [
        'title',
        'repo_url',
        'image_url',
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'is_in_progress' => 'boolean',
    ];

    public function getTitleAttribute()
    {
        return $this->attributes['title'] ?? $this->attributes['name'] ?? null;
    }

    public function getRepoUrlAttribute()
    {
        return $this->attributes['repo_url'] ?? $this->attributes['repository_url'] ?? null;
    }

    public function getImageUrlAttribute()
    {
        $path = $this->attributes['image_path'] ?? null;
        if (!$path) {
            return null;
        }

        return Storage::url($path);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function technologies()
    {
        return $this->belongsToMany(ProjectTechnology::class, 'project_technology');
    }
}
