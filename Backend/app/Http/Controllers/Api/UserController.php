<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserVisibility;
use App\QueryFilters\JobExperienceFilter;
use App\QueryFilters\ProfileTechnologyFilter;
use App\QueryFilters\SkillFilter;
use App\QueryFilters\SkillLevelFilter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use App\Http\Requests\UpdateContactRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

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

        $request->merge([
            'github_url' => $this->normalizarUrlExterna($request->input('github_url')),
            'linkedin_url' => $this->normalizarUrlExterna($request->input('linkedin_url')),
        ]);

        $validated = $request->validate([
            'name'         => "required|string|max:255|regex:/^\pL+(?: \pL+)*$/u",
            'profession'   => 'nullable|string|max:100|regex:/^(?=.*\pL)[\pL\pN]+(?:[ .,&()\/-][\pL\pN]+)*$/u',
            'biography'    => 'required|string|max:1000',
            'github_url'   => [
                'nullable',
                'url',
                'max:200',
                'regex:/^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+/i',
            ],
            'linkedin_url' => [
                'nullable',
                'url',
                'max:200',
                'regex:/^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i',
            ],
        ], [
            'name.regex' => 'El nombre solo puede contener letras y espacios.',
        ]);

        $sanitized = array_map(function ($value) {
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
            'user' => $user->fresh(),
        ], 200);
    }

    private function normalizarUrlExterna(mixed $value): mixed
    {
        if (! is_string($value)) {
            return $value;
        }

        $limpio = trim($value);

        if ($limpio === '') {
            return $limpio;
        }

        if (preg_match('/^[a-z][a-z0-9+.-]*:\/\//i', $limpio) === 1) {
            return $limpio;
        }

        return 'https://' . ltrim($limpio, '/');
    }

    private function checkIfProfileIsComplete(User $user, array $newData): bool
    {
        $requiredFields = ['name', 'profession', 'biography'];

        foreach ($requiredFields as $field) {
            $value = $newData[$field] ?? $user->$field;

            if (trim((string) $value) === '') {
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
        $sanitized = array_map(function ($value) {
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

        $users = QueryBuilder::for(
            User::query()->with([
                'projects.technologies',
                'studies',
                'jobs',
                'skills',
                'softSkills',
                'visibility',
            ])->where('profile_completed', true)
                ->where(function (Builder $query): void {
                    $query->whereDoesntHave('visibility')
                        ->orWhereHas('visibility', function (Builder $visibilityQuery): void {
                            $visibilityQuery->where('show_in_search', true);
                        });
                })
        )
            ->allowedFilters([
                AllowedFilter::callback('search', function (Builder $query, $value): void {
                    $value = trim((string) $value);

                    if ($value === '') {
                        return;
                    }

                    $query->where(function (Builder $subQuery) use ($value): void {
                        $subQuery->where('name', 'LIKE', "%{$value}%")
                            ->orWhere('profession', 'LIKE', "%{$value}%")
                            ->orWhere('biography', 'LIKE', "%{$value}%")
                            ->orWhereHas('jobs', function (Builder $jobQuery) use ($value): void {
                                $jobQuery->where('achievements', 'LIKE', "%{$value}%");
                        });
                    });
                }),
                AllowedFilter::callback('profession', function (Builder $query, $value): void {
                    $profession = trim((string) $value);

                    if ($profession === '') {
                        return;
                    }

                    $query->whereRaw('LOWER(profession) = ?', [mb_strtolower($profession, 'UTF-8')]);
                }),
                AllowedFilter::callback('degree', function (Builder $query, $value): void {
                    $degree = trim((string) $value);

                    if ($degree === '') {
                        return;
                    }

                    $query->whereHas('studies', function (Builder $studyQuery) use ($degree): void {
                        $studyQuery->whereRaw('LOWER(degree) = ?', [mb_strtolower($degree, 'UTF-8')]);
                    });
                }),
                AllowedFilter::callback('academic_institution', function (Builder $query, $value): void {
                    $institution = trim((string) $value);

                    if ($institution === '') {
                        return;
                    }

                    $query->whereHas('studies', function (Builder $studyQuery) use ($institution): void {
                        $studyQuery->whereRaw('LOWER(academic_institution) = ?', [mb_strtolower($institution, 'UTF-8')]);
                    });
                }),
                AllowedFilter::custom('experiencia_cargo', new JobExperienceFilter()),
                AllowedFilter::custom('habilidadTecnica_nivel', new SkillLevelFilter()),
                AllowedFilter::custom('habilidades', new SkillFilter()),
                AllowedFilter::custom('technology', new ProfileTechnologyFilter()),
            ])
            ->allowedSorts(['name', 'created_at', 'profession'])
            ->defaultSort('-created_at')
            ->paginate($perPage)
            ->appends($request->query());

        $users->getCollection()->transform(function ($user) {
            return $this->filterProfilePrivacy($user);
        });

        if ($users->total() === 0) {
            return response()->json(array_merge($users->toArray(), [
                'message' => 'Búsqueda no encontrada.',
            ]), 200);
        }

        return response()->json($users, 200);
    }

    public function showPublicProfile(User $user)
    {
        $user->load([
            'projects.technologies',
            'studies',
            'jobs',
            'skills',
            'softSkills',
            'visibility',
            'githubRepositories',
        ]);

        $profile = $this->filterProfilePrivacy($user);

        return response()->json($profile, 200);
    }

    public function showPublicProfilePhoto(User $user)
    {
        if (! $user->show_profile_photo || empty($user->profile_photo)) {
            return response()->json([
                'status' => 'error',
                'message' => 'La foto de perfil no está disponible.',
            ], 404);
        }

        $source = $user->profile_photo;

        try {
            if (preg_match('/^https?:\\/\\//i', $source)) {
                $response = Http::timeout(15)->get($source);

                if (! $response->successful()) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'No se pudo obtener la foto de perfil.',
                    ], 404);
                }

                $mimeType = $response->header('Content-Type') ?: 'image/jpeg';

                return response($response->body(), 200)
                    ->header('Content-Type', $mimeType)
                    ->header('Cache-Control', 'public, max-age=86400');
            }

            $disk = Storage::disk('public');
            $path = ltrim($source, '/');

            if (! $disk->exists($path)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No se pudo obtener la foto de perfil.',
                ], 404);
            }

            $absolutePath = storage_path('app/public/' . $path);
            $mimeType = mime_content_type($absolutePath) ?: 'image/jpeg';

            return response($disk->get($path), 200)
                ->header('Content-Type', $mimeType)
                ->header('Cache-Control', 'public, max-age=86400');
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'No se pudo obtener la foto de perfil.',
            ], 500);
        }
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
