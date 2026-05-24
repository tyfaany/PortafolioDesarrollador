<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Http\Requests\UpdateContactRequest;

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

    
    $user->fill($sanitized);
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

        'show_phone' => $user->show_phone,
        'show_mobile' => $user->show_mobile,
        'show_contact_email' => $user->show_contact_email,
        'show_address' => $user->show_address,
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

    $user->update($sanitized);

    return response()->json([
        'message' => 'Información de contacto actualizada correctamente',
        'contact' => [
            'phone' => $user->phone,
            'mobile' => $user->mobile,
            'contact_email' => $user->contact_email,
            'address' => $user->address,
            'show_phone' => $user->show_phone,
            'show_mobile' => $user->show_mobile,
            'show_contact_email' => $user->show_contact_email,
            'show_address' => $user->show_address,
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
    }

    if ($user->show_contact_email) {
        $data['contact_email'] = $user->contact_email;
    }

    if ($user->show_address) {
        $data['address'] = $user->address;
    }

    return response()->json($data);
    
}

public function indexPublicProfilesFull(Request $request)
    {
        // 1. Capturamos cuántos usuarios queremos por página desde la URL (ej: ?per_page=5).
        $perPage = $request->query('per_page', 10);

        // 2. Iniciamos la consulta base cargando las relaciones con 'with'
        $query = User::with([
                'projects.technologies',
                'studies',
                'jobs',
                'skills',
                'softSkills'
            ])
            ->where('profile_completed', true); // Aquí se cierra la configuración inicial

        // 3. Pasamos la consulta por cada estación de filtrado independiente
        $query = $this->applySearchFilter($query, $request);
      
        $query = $this->applySkillFilter($query, $request);

        // 4. Ejecutamos la paginación final con el ordenamiento y lo guardamos en $users
        $users = $query->latest()->paginate($perPage)->appends($request->all());;

        // 5. Recorremos la lista de usuarios de la página actual y les aplicamos tu filtro de privacidad
        $users->getCollection()->transform(function ($user) {
            return $this->filterProfilePrivacy($user);
        });
       if ($users->total() === 0) {
            // Convertimos el paginador a un array, le sumamos el mensaje y lo enviamos
            $responseData = array_merge($users->toArray(), [
                'message' => ' Búsqueda no encontrada.'
            ]);
            return response()->json($responseData, 200);
        }
        // 6. Devolvemos la estructura de paginación completa en JSON
        return response()->json($users, 200);
    }
   public function showPublicProfile(User $user)
{
  // 1. Cargamos todas las relaciones de este usuario de forma eficiente
        $user->load([
            'projects.technologies',
            'studies',
            'jobs',
            'skills',
            'softSkills',
        ]);

        // 2. Pasamos el usuario por el filtro de privacidad común
        $profile = $this->filterProfilePrivacy($user);

        // 3. Devolvemos la respuesta
        return response()->json($profile, 200);
}
private function applySkillFilter($query, Request $request)
    {
        $skill = $request->query('skill');

        return $query->when($skill, function ($q, $skill) {
            $q->whereHas('skills', function ($sub) use ($skill) {
                $sub->where('name', 'LIKE', '%' . $skill . '%');
            });
        });
    }
    private function applySearchFilter($query, Request $request)
    {
        $search = $request->query('search');

        return $query->when($search, function ($q, $search) {
            $q->where(function ($sub) use ($search) {
                $sub->where('name', 'LIKE', '%' . $search . '%')
                    ->orWhere('profession', 'LIKE', '%' . $search . '%');
            });
        });
    }
private function filterProfilePrivacy(User $user): array
    {
        // Datos básicos que siempre son visibles
        $profile = [
            'id'         => $user->id,
            'name'       => $user->name,
            'profession' => $user->profession,
        ];

        // Filtros de privacidad condicionales basados en tu modelo
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

        // Filtrado individual de proyectos públicos
        $profile['projects'] = $user->projects
            ->where('is_public', true)
            ->values();

        return $profile;
    }
}
