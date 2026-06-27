<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserVisibility extends Model
{
    use HasFactory;

    protected $table = 'user_visibility';

    protected $primaryKey = 'user_id';

    public $incrementing = false;

    protected $keyType = 'int';

    protected $fillable = [
        'user_id',
        'show_in_search',
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
        'show_instagram',
        'show_facebook',
    ];

    protected $casts = [
        'show_in_search' => 'boolean',
        'show_bio' => 'boolean',
        'show_studies' => 'boolean',
        'show_jobs' => 'boolean',
        'show_skills' => 'boolean',
        'show_social_links' => 'boolean',
        'show_profile_photo' => 'boolean',
        'show_phone' => 'boolean',
        'show_mobile' => 'boolean',
        'show_contact_email' => 'boolean',
        'show_address' => 'boolean',
        'show_instagram' => 'boolean',
        'show_facebook' => 'boolean',
    ];

    public static function defaults(): array
    {
        return [
            'show_in_search' => true,
            'show_bio' => true,
            'show_studies' => true,
            'show_jobs' => true,
            'show_skills' => true,
            'show_social_links' => true,
            'show_profile_photo' => true,
            'show_phone' => true,
            'show_mobile' => true,
            'show_contact_email' => true,
            'show_address' => true,
            'show_instagram' => true,
            'show_facebook' => true,
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
