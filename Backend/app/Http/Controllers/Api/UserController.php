<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserVisibility;
use App\QueryFilters\SkillFilter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use App\Http\Requests\UpdateContactRequest;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;
use App\QueryFilters\JobExperienceFilter;
use App\QueryFilters\SkillLevelFilter;

class UserController extends Controller
{
    public function show(Request $request)
{
    $user = $request->user();
    $user->load([
        'studies', 
        'jobs', 
        'skills',
        'softSkills',
        'visibility',
    ]);

    return response()->json($user, 200);
}
    /**
     * Actualizar datos del usuario autenticado
     */
   public function update(Request $request)
{
    $user = $request->user();

    $validated = $request->validate([
        'name'         => 'required|string|max:255',
        'profession'   => 'nullable|string|max:100|regex:/^(?=.*\pL)[\pL\pN]+(?:[ .,&()\/-][\pL\pN]+)*$/u',
        'biography'    => 'nullable|string|max:1000',
        'github_url'   => [
            'nullable', 'url', 'max:200',
            'regex:/^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+/i'
        ],
        'linkedin_url' => [
            'nullable', 'url', 'max:200',
            'regex:/^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i'
        ],
    ]);

    $sanitized = array_map(function($value) {
        return is_string($value) ? strip_tags($value) : $value;
    }, $validated);

    $isComplete = $this->checkIfProfileIsComplete($user, $sanitized);
    $sanitized['profile_completed'] = $isComplete;

    $contactData = Arr::only($sanitized, ['name', 'profession', 'biography', 'github_url', 'linkedin_url', 'profile_completed']);
    $user->fill($contactData);
    $user->save();

    return response()->json([
        'status' => 'success',
        'message' => 'Información actualizada.',
        
        'user' => $user->fresh() 
    ], 200);
}
private function checkIfProfileIsComplete(User $user, array $newData): bool
    {
        $requiredFields = ['name', 'profession', 'biography'];

        foreach ($requiredFields as $field) {
            // Buscamos en los datos nuevos, si no están, buscamos en los que ya tiene el usuario
            $value = $newData[$field] ?? $user->$field;

            if (empty($value)) {
                return false; 
            }
        }

        return true; 
    }
   public function showContact(Request $request)
{
    $user = $request->user();

    return response()->json([
        'phone' => $user->phone,
        'mobile' => $user->mobile,
        'contact_email' => $user->contact_email,
        'address' => $user->address,
        'instagram_url' => $user->instagram_url,
        'facebook_url' => $user->facebook_url,

        'show_phone' => $user->show_phone,
        'show_mobile' => $user->show_mobile,
        'show_contact_email' => $user->show_contact_email,
        'show_address' => $user->show_address,
        'show_instagram' => $user->show_instagram,
        'show_facebook' => $user->show_facebook,
    ]);
}
     public function updateContact(UpdateContactRequest $request)
{
    $user = $request->user();

    $data = $request->validated();

    // Sanitizar strings
    $sanitized = array_map(function($value) {
        return is_string($value) ? strip_tags($value) : $value;
    }, $data);

    $visibilityData = Arr::only($sanitized, [
        'show_phone',
        'show_mobile',
        'show_contact_email',
        'show_address',
        'show_instagram',
        'show_facebook',
    ]);
    $contactData = Arr::only($sanitized, [
        'phone',
        'mobile',
        'contact_email',
        'address',
        'instagram_url',
        'facebook_url',
    ]);

    $user->fill($contactData);
    $user->save();

    if (! empty($visibilityData)) {
        $visibility = $user->visibility()->firstOrCreate(
            ['user_id' => $user->id],
            UserVisibility::defaults()
        );

        $visibility->fill($visibilityData);
        $visibility->save();
    }

    $visibility = $user->visibility()->firstOrCreate(
        ['user_id' => $user->id],
        UserVisibility::defaults()
    );

    return response()->json([
        'message' => 'Información de contacto actualizada correctamente',
        'contact' => [
            'phone' => $user->phone,
            'mobile' => $user->mobile,
            'contact_email' => $user->contact_email,
            'address' => $user->address,
            'instagram_url' => $user->instagram_url,
            'facebook_url' => $user->facebook_url,
            'show_phone' => $visibility->show_phone,
            'show_mobile' => $visibility->show_mobile,
            'show_contact_email' => $visibility->show_contact_email,
            'show_address' => $visibility->show_address,
            'show_instagram' => $visibility->show_instagram,
            'show_facebook' => $visibility->show_facebook,
        ]
    ]);
}
   public function showPublicContact($id)
{
    $user = \App\Models\User::findOrFail($id);

    $data = [];

    if ($user->show_phone) {
        $data['phone'] = $user->phone;
    }

    if ($user->show_mobile) {
        $data['mobile'] = $user->mobile;
        $data['whatsapp_url'] = preg_replace('/\D+/', '', (string) $user->mobile)
            ? 'https://wa.me/' . preg_replace('/\D+/', '', (string) $user->mobile)
            : null;
    }

    if ($user->show_contact_email) {
        $data['contact_email'] = $user->contact_email;
    }

    if ($user->show_address) {
        $data['address'] = $user->address;
    }

    if ($user->show_instagram) {
        $data['instagram_url'] = $user->instagram_url;
    }

    if ($user->show_facebook) {
        $data['facebook_url'] = $user->facebook_url;
    }

    return response()->json($data);
    
}

 public function indexPublicProfilesFull(Request $request)
{
    $perPage = min($request->integer('per_page', 10), 100);

    $filtroExperiencia = $request->input('filter.experiencia_cargo') ?? $request->input('experiencia_cargo') ?? $request->query('experiencia_cargo');
    $filtroNivelSkill = $request->input('filter.habilidadTecnica_nivel') ?? $request->input('habilidadTecnica_nivel') ?? $request->query('habilidadTecnica_nivel');

    // 2. Consulta base
    $baseQuery = User::query()
        ->with([
            'projects.technologies',
            'studies',
            'jobs',
            'skills',
            'softSkills',
            'visibility',
        ])
        ->where('profile_completed', true)
        ->where(function (\Illuminate\Database\Eloquent\Builder $visibilityGroup): void {
            $visibilityGroup->whereDoesntHave('visibility')
                ->orWhereHas('visibility', function (\Illuminate\Database\Eloquent\Builder $visibilityQuery): void {
                    $visibilityQuery->where('show_in_search', true);
                });
        });

    if ($filtroExperiencia) {
        $filtroJob = new \App\QueryFilters\JobExperienceFilter();
        $baseQuery = $filtroJob->__invoke($baseQuery, $filtroExperiencia, 'experiencia_cargo');
    }

    
    if ($filtroNivelSkill) {
        $filtroSkill = new \App\QueryFilters\SkillLevelFilter();
        $baseQuery = $filtroSkill->__invoke($baseQuery, $filtroNivelSkill, 'habilidadTecnica_nivel');
    }
    $users = \Spatie\QueryBuilder\QueryBuilder::for($baseQuery)
        ->allowedFilters([
           
            \Spatie\QueryBuilder\AllowedFilter::callback('experiencia_cargo', function (\Illuminate\Database\Eloquent\Builder $query): void {}),
            \Spatie\QueryBuilder\AllowedFilter::callback('habilidadTecnica_nivel', function (\Illuminate\Database\Eloquent\Builder $query): void {}),
            
            \Spatie\QueryBuilder\AllowedFilter::callback('search', function (\Illuminate\Database\Eloquent\Builder $query, $value): void {
                $value = trim((string) $value);
                if ($value === '') return;
                $query->where(function (\Illuminate\Database\Eloquent\Builder $subQuery) use ($value): void {
                    $subQuery->where('name', 'LIKE', "%{$value}%")
                        ->orWhere('profession', 'LIKE', "%{$value}%")
                        ->orWhere('biography', 'LIKE', "%{$value}%");
                });
            }),
            \Spatie\QueryBuilder\AllowedFilter::custom('habilidades', new \App\QueryFilters\SkillFilter()),
        ])
        ->allowedSorts(['name', 'created_at', 'profession'])
        ->defaultSort('-created_at')
        ->paginate($perPage)
        ->appends($request->query());

    if ($users->getCollection()->isEmpty() || $users->total() === 0) {
        return response()->json([
            'current_page' => $users->currentPage(),
            'data' => [],
            'total' => 0,
            'message' => 'Búsqueda no encontrada.',
        ], 200);
    }

    $transformedData = $users->getCollection()->map(function ($user) {
        return $this->filterProfilePrivacy($user);
    });

    $users->setCollection($transformedData);

    return response()->json($users, 200);
}
private function filterProfilePrivacy(User $user): array
    {
        $profile = [
            'id'         => $user->id,
            'name'       => $user->name,
            'profession' => $user->profession,
        ];

        if ($user->show_bio) {
            $profile['biography'] = $user->biography;
        }

        if ($user->show_social_links) {
            $profile['github_url']   = $user->github_url;
            $profile['linkedin_url'] = $user->linkedin_url;
        }

        if ($user->show_profile_photo) {
            $profile['profile_photo_url'] = $user->profile_photo_url;
        }

        if ($user->show_phone) {
            $profile['phone'] = $user->phone;
        }

        if ($user->show_mobile) {
            $profile['mobile'] = $user->mobile;
        }

        if ($user->show_instagram) {
            $profile['instagram_url'] = $user->instagram_url;
        }

        if ($user->show_facebook) {
            $profile['facebook_url'] = $user->facebook_url;
        }

        if ($user->show_contact_email) {
            $profile['contact_email'] = $user->contact_email;
        }

        if ($user->show_address) {
            $profile['address'] = $user->address;
        }

        if ($user->show_studies) {
            $profile['studies'] = $user->studies;
        }

        if ($user->show_jobs) {
            $profile['jobs'] = $user->jobs;
        }

        if ($user->show_skills) {
            $profile['skills']      = $user->skills;
            $profile['soft_skills'] = $user->softSkills;
        }

        $profile['projects'] = $user->projects
            ->where('is_public', true)
            ->values();

        $profile['github_repositories'] = $user->githubRepositories
            ->where('is_visible', true)
            ->values();

        return $profile;
    }
}
