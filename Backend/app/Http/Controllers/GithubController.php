<?php

namespace App\Http\Controllers;

use App\Models\GithubRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

class GithubController extends Controller
{
    public function syncRepositories(Request $request)
    {
        // 1. Validamos que el frontend nos envíe el nombre de usuario de GitHub
        $request->validate([
            'github_username' => 'required|string'
        ]);

        $username = $request->github_username;
        $userId = auth()->id();

        try {
            // 2. Consumimos la API pública de GitHub
            $response = Http::get("https://api.github.com/users/{$username}/repos");

            // Si GitHub responde con error (ej. usuario no existe)
            if ($response->failed()) {
                return response()->json([
                    'message' => 'No se pudo conectar con GitHub o el usuario no existe.'
                ], 400);
            }

            $repos = $response->json();

            // Iniciamos transacción por seguridad
            DB::beginTransaction();

            // 3. Procesamos y guardamos cada repositorio
            foreach ($repos as $repo) {
                GithubRepository::updateOrCreate(
                    [
                        // Condición para buscar si ya existe
                        'github_id' => $repo['id'], 
                        'user_id' => $userId
                    ],
                    [
                        // Datos a actualizar o crear
                        'name' => $repo['name'],
                        'description' => $repo['description'],
                        'html_url' => $repo['html_url'],
                        'stars_count' => $repo['stargazers_count'],
                        'forks_count' => $repo['forks_count'],
                        'language' => $repo['language'],
                        'is_fork' => $repo['fork'], // Booleano: true si es un fork
                        'pushed_at' => date('Y-m-d H:i:s', strtotime($repo['pushed_at'])),
                        // NOTA: No tocamos 'is_visible' aquí. Si el usuario ya lo había marcado para mostrar, se respeta.
                    ]
                );
            }

            DB::commit();

            return response()->json([
                'message' => 'Repositorios sincronizados exitosamente desde GitHub.'
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error al sincronizar: ' . $e->getMessage()], 500);
        }
    }

    // Función para enviar los repositorios al Frontend
    public function index()
    {
        $userId = auth()->id();
        
        // Obtenemos los repositorios ordenados por la actualización más reciente 
        $repos = GithubRepository::where('user_id', $userId)
                    ->orderBy('pushed_at', 'desc')
                    ->get();

        return response()->json($repos, 200);
    }

    // Función para guardar los repositorios seleccionados (Máximo 15)
    public function saveSelection(Request $request)
    {
        // Validamos que sea un arreglo y que máximo tenga 15 elementos 
        $request->validate([
            'selected_repos' => 'present|array|max:15', 
            'selected_repos.*' => 'exists:github_repositories,id'
        ]);

        $userId = auth()->id();

        try {
            DB::beginTransaction();

            // 1. Primero, ponemos TODOS los repositorios del usuario como NO visibles
            GithubRepository::where('user_id', $userId)->update(['is_visible' => false]);

            // 2. Luego, si envió IDs, marcamos SOLO esos como visibles
            if (!empty($request->selected_repos)) {
                GithubRepository::whereIn('id', $request->selected_repos)
                                ->where('user_id', $userId)
                                ->update(['is_visible' => true]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Selección guardada exitosamente' // Mensaje exacto requerido por el PDF 
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error al guardar la selección: ' . $e->getMessage()], 500);
        }
    }
}
