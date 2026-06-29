<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserVisibility;
use App\QueryFilters\JobExperienceFilter;
use App\QueryFilters\ProfileTechnologyFilter;
use App\QueryFilters\SkillFilter;
use App\QueryFilters\SkillLevelFilter;
use App\Sorts\ProjectsCountSort;
use App\Sorts\StableTextSort;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use App\Http\Requests\UpdateContactRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedSort;
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

        // Normalizamos URLs si vienen en la petición
        $request->merge([
            'github_url' => $this->normalizarUrlExterna($request->input('github_url')),
            'linkedin_url' => $this->normalizarUrlExterna($request->input('linkedin_url')),
        ]);

        // Validación estricta pero tolerante a expresiones regulares limpias
        $validated = $request->validate([
            'name'         => "required|string|max:255|regex:/^\pL+(?: \pL+)*$/u",
            'profession'   => 'required|string|max:100|regex:/^(?=.*\pL)[\pL\pN]+(?:[ .,&()\/-][\pL\pN]+)*$/u',
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
            'name.required'       => 'El nombre completo es obligatorio.',
            'name.regex'          => 'El nombre solo puede contener letras y espacios.',
            'profession.required' => 'La profesión es obligatoria para inicializar el portafolio.',
            'biography.required'  => 'La biografía es obligatoria.',
            'profession.regex' => 'La profesión solo puede contener letras, números y separadores simples.',
            'github_url.regex' => 'El enlace de GitHub debe tener un formato válido.',
            'linkedin_url.regex' => 'El enlace de LinkedIn debe tener un formato válido.',
            'github_url.url' => 'El enlace de GitHub debe ser una URL válida.',
            'linkedin_url.url' => 'El enlace de LinkedIn debe ser una URL válida.',
        ]);

        // Sanitización contra inyecciones HTML (XSS)
        $sanitized = array_map(function ($value) {
            return is_string($value) ? strip_tags($value) : $value;
        }, $validated);

        // Forzamos el estado completado ya que pasó las reglas 'required'
        $sanitized['profile_completed'] = true;

        try {
            // Recolectamos de forma segura solo lo que la base de datos de la migración posee
            $userData = [
                'name'              => $sanitized['name'],
                'profession'        => $sanitized['profession'],
                'biography'         => $sanitized['biography'],
                'linkedin_url'      => $sanitized['linkedin_url'] ?? $user->linkedin_url,
                'profile_completed' => true,
            ];

            $user->fill($userData);
            $user->save();

            return response()->json([
                'status'  => 'success',
                'message' => 'Información actualizada correctamente.',
                'user'    => $user->fresh(),
            ], 200);

        } catch (\Exception $e) {
            // Evitamos el Server Error 500 crudo en el Deploy e informamos con elegancia
            return response()->json([
                'status'  => 'error',
                'message' => 'Error de consistencia al inicializar el perfil en el servidor.',
                'debug'   => $e->getMessage()
            ], 200); // Retornamos 200 con bandera de error para que React pueda controlarlo sin caerse
        }
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

    private function normalizeFilterValues(mixed $value): array
    {
        if (is_array($value)) {
            $items = Arr::flatten($value);
        } else {
            $items = [$value];
        }

        $normalized = [];

        foreach ($items as $item) {
            if ($item === null || $item === false) {
                continue;
            }

            $text = trim((string) $item);

            if ($text === '') {
                continue;
            }

            foreach (preg_split('/\s*,\s*/', $text, -1, PREG_SPLIT_NO_EMPTY) as $part) {
                $part = trim($part);

                if ($part !== '') {
                    $normalized[] = $part;
                }
            }
        }

        return array_values($normalized);
    }

    /**
     * @return array<int, string>
     */
    private function tokenizeSearchValue(mixed $value): array
    {
        $text = trim((string) $value);

        if ($text === '') {
            return [];
        }

        $normalized = Str::ascii(mb_strtolower($text, 'UTF-8'));
        $normalized = preg_replace('/[^a-z0-9]+/i', ' ', $normalized) ?? '';

        return array_values(array_filter(array_map(
            static fn (string $item): string => trim($item),
            preg_split('/\s+/', trim($normalized), -1, PREG_SPLIT_NO_EMPTY) ?: []
        ), static fn (string $item): bool => mb_strlen($item, 'UTF-8') >= 2));
    }

    private function normalizedSearchExpression(string $column): string
    {
        $expression = "LOWER({$column})";

        foreach ([' ', '-', '_', '.', ',', '/', '\\', '(', ')', '[', ']', '{', '}', "'", '"', '#', '+'] as $character) {
            $quotedCharacter = "'" . str_replace("'", "''", $character) . "'";
            $expression = "REPLACE({$expression}, {$quotedCharacter}, '')";
        }

        return $expression;
    }

    private function addBroadSearchField(Builder $query, string $column, string $token): void
    {
        $like = '%' . mb_strtolower($token, 'UTF-8') . '%';
        $normalizedLike = '%' . Str::ascii($token) . '%';
        $normalizedExpression = $this->normalizedSearchExpression($column);

        $query->whereRaw("LOWER({$column}) LIKE ?", [$like])
            ->orWhereRaw("{$normalizedExpression} LIKE ?", [$normalizedLike]);
    }

    private function applyBroadSearch(Builder $query, mixed $value): void
    {
        $text = trim((string) $value);

        if ($text === '') {
            return;
        }

        $tokens = $this->tokenizeSearchValue($text);

        if (empty($tokens)) {
            $query->whereRaw('1 = 0');

            return;
        }

        $query->where(function (Builder $outerQuery) use ($tokens): void {
            foreach ($tokens as $token) {
                $outerQuery->where(function (Builder $tokenQuery) use ($token): void {
                    $tokenQuery->where(function (Builder $fieldQuery) use ($token): void {
                        $this->addBroadSearchField($fieldQuery, 'name', $token);
                    })
                        ->orWhere(function (Builder $fieldQuery) use ($token): void {
                            $this->addBroadSearchField($fieldQuery, 'profession', $token);
                        })
                        ->orWhere(function (Builder $fieldQuery) use ($token): void {
                            $this->addBroadSearchField($fieldQuery, 'address', $token);
                        })
                        ->orWhere(function (Builder $fieldQuery) use ($token): void {
                            $this->addBroadSearchField($fieldQuery, 'biography', $token);
                        })
                        ->orWhereHas('jobs', function (Builder $jobQuery) use ($token): void {
                            $jobQuery->where(function (Builder $fieldQuery) use ($token): void {
                                $this->addBroadSearchField($fieldQuery, 'company_name', $token);
                            })
                                ->orWhere(function (Builder $fieldQuery) use ($token): void {
                                    $this->addBroadSearchField($fieldQuery, 'position', $token);
                                })
                                ->orWhere(function (Builder $fieldQuery) use ($token): void {
                                    $this->addBroadSearchField($fieldQuery, 'achievements', $token);
                                });
                        })
                        ->orWhereHas('skills', function (Builder $skillQuery) use ($token): void {
                            $skillQuery->where(function (Builder $fieldQuery) use ($token): void {
                                $this->addBroadSearchField($fieldQuery, 'name', $token);
                            });
                        })
                        ->orWhereHas('softSkills', function (Builder $softSkillQuery) use ($token): void {
                            $softSkillQuery->where(function (Builder $fieldQuery) use ($token): void {
                                $this->addBroadSearchField($fieldQuery, 'name', $token);
                            });
                        })
                        ->orWhereHas('studies', function (Builder $studyQuery) use ($token): void {
                            $studyQuery->where(function (Builder $fieldQuery) use ($token): void {
                                $this->addBroadSearchField($fieldQuery, 'degree', $token);
                            })
                                ->orWhere(function (Builder $fieldQuery) use ($token): void {
                                    $this->addBroadSearchField($fieldQuery, 'academic_institution', $token);
                                });
                        })
                        ->orWhereHas('projects', function (Builder $projectQuery) use ($token): void {
                            $projectQuery->where('is_public', true)
                                ->where(function (Builder $publicProjectQuery) use ($token): void {
                                    $publicProjectQuery->where(function (Builder $fieldQuery) use ($token): void {
                                        $this->addBroadSearchField($fieldQuery, 'name', $token);
                                    })
                                        ->orWhere(function (Builder $fieldQuery) use ($token): void {
                                            $this->addBroadSearchField($fieldQuery, 'description', $token);
                                        })
                                        ->orWhereHas('technologies', function (Builder $technologyQuery) use ($token): void {
                                            $technologyQuery->where(function (Builder $fieldQuery) use ($token): void {
                                                $this->addBroadSearchField($fieldQuery, 'project_technologies.name', $token);
                                            });
                                        });
                                });
                        });
                });
            }
        });
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
                    $this->applyBroadSearch($query, $value);
                }),
                AllowedFilter::callback('profession', function (Builder $query, $value): void {
                    $professions = $this->normalizeFilterValues($value);

                    if (empty($professions)) {
                        return;
                    }

                    $query->where(function (Builder $q) use ($professions): void {
                        $first = true;
                        foreach ($professions as $profession) {
                            if ($first) {
                                $q->whereRaw('LOWER(profession) = ?', [mb_strtolower($profession, 'UTF-8')]);
                                $first = false;
                            } else {
                                $q->orWhereRaw('LOWER(profession) = ?', [mb_strtolower($profession, 'UTF-8')]);
                            }
                        }
                    });
                }),
                AllowedFilter::callback('degree', function (Builder $query, $value): void {
                    $degrees = $this->normalizeFilterValues($value);

                    if (empty($degrees)) {
                        return;
                    }

                    $query->whereHas('studies', function (Builder $studyQuery) use ($degrees): void {
                        $first = true;
                        foreach ($degrees as $degree) {
                            if ($first) {
                                $studyQuery->whereRaw('LOWER(degree) = ?', [mb_strtolower($degree, 'UTF-8')]);
                                $first = false;
                            } else {
                                $studyQuery->orWhereRaw('LOWER(degree) = ?', [mb_strtolower($degree, 'UTF-8')]);
                            }
                        }
                    });
                }),
                AllowedFilter::callback('academic_institution', function (Builder $query, $value): void {
                    $institutions = $this->normalizeFilterValues($value);

                    if (empty($institutions)) {
                        return;
                    }

                    $query->whereHas('studies', function (Builder $studyQuery) use ($institutions): void {
                        $first = true;
                        foreach ($institutions as $institution) {
                            if ($first) {
                                $studyQuery->whereRaw('LOWER(academic_institution) = ?', [mb_strtolower($institution, 'UTF-8')]);
                                $first = false;
                            } else {
                                $studyQuery->orWhereRaw('LOWER(academic_institution) = ?', [mb_strtolower($institution, 'UTF-8')]);
                            }
                        }
                    });
                }),
                AllowedFilter::custom('experiencia_cargo', new JobExperienceFilter()),
                AllowedFilter::custom('habilidadTecnica_nivel', new SkillLevelFilter()),
                AllowedFilter::custom('habilidades', new SkillFilter()),
                AllowedFilter::custom('technology', new ProfileTechnologyFilter()),
            ])
            ->allowedSorts([
                AllowedSort::custom('projects_count', new ProjectsCountSort()),
                AllowedSort::custom('name', new StableTextSort('name')),
                AllowedSort::field('created_at'),
                AllowedSort::custom('profession', new StableTextSort('profession')),
            ])
            ->defaultSort('-created_at')
            ->paginate($perPage)
            ->appends($request->query());

        $users->getCollection()->transform(function ($user) {
            return $this->filterProfilePrivacy($user);
        });

        if ($users->total() === 0) {
            return response()->json(
                array_merge($users->toArray(), [
                    'message' => 'Búsqueda no encontrada.',
                ]),
                200,
                [],
                JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
            );
        }

        return response()->json(
            $users,
            200,
            [],
            JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
        );
    }

    public function publicProfileFilters()
    {
        $baseQuery = User::query()
            ->where('profile_completed', true)
            ->where(function (Builder $query): void {
                $query->whereDoesntHave('visibility')
                    ->orWhereHas('visibility', function (Builder $visibilityQuery): void {
                        $visibilityQuery->where('show_in_search', true);
                    });
            });

        $professions = (clone $baseQuery)
            ->whereNotNull('profession')
            ->whereRaw('TRIM(profession) <> \'\'')
            ->select('profession')
            ->distinct()
            ->orderByRaw('LOWER(profession)')
            ->pluck('profession')
            ->values();

        $degrees = DB::table('studies')
            ->join('users', 'users.id', '=', 'studies.user_id')
            ->leftJoin('user_visibility', 'user_visibility.user_id', '=', 'users.id')
            ->where('users.profile_completed', true)
            ->where(function ($query): void {
                $query->whereNull('user_visibility.user_id')
                    ->orWhere('user_visibility.show_in_search', true);
            })
            ->whereNotNull('studies.degree')
            ->whereRaw('TRIM(studies.degree) <> \'\'')
            ->select('studies.degree')
            ->distinct()
            ->orderByRaw('LOWER(studies.degree)')
            ->pluck('studies.degree')
            ->values();

        $institutions = DB::table('studies')
            ->join('users', 'users.id', '=', 'studies.user_id')
            ->leftJoin('user_visibility', 'user_visibility.user_id', '=', 'users.id')
            ->where('users.profile_completed', true)
            ->where(function ($query): void {
                $query->whereNull('user_visibility.user_id')
                    ->orWhere('user_visibility.show_in_search', true);
            })
            ->whereNotNull('studies.academic_institution')
            ->whereRaw('TRIM(studies.academic_institution) <> \'\'')
            ->select('studies.academic_institution')
            ->distinct()
            ->orderByRaw('LOWER(studies.academic_institution)')
            ->pluck('studies.academic_institution')
            ->values();

        $experienceRoles = DB::table('work_experiences')
            ->join('users', 'users.id', '=', 'work_experiences.user_id')
            ->leftJoin('user_visibility', 'user_visibility.user_id', '=', 'users.id')
            ->where('users.profile_completed', true)
            ->where(function ($query): void {
                $query->whereNull('user_visibility.user_id')
                    ->orWhere('user_visibility.show_in_search', true);
            })
            ->whereNotNull('work_experiences.position')
            ->whereRaw('TRIM(work_experiences.position) <> \'\'')
            ->select('work_experiences.position')
            ->distinct()
            ->orderByRaw('LOWER(work_experiences.position)')
            ->pluck('work_experiences.position')
            ->values();

        return response()->json([
            'professions' => $professions,
            'degrees' => $degrees,
            'institutions' => $institutions,
            'experience_roles' => $experienceRoles,
        ], 200);
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
