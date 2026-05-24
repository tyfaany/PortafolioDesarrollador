<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class ProfileSearchController extends Controller
{
    public function index(Request $request)
    {
        // 1. Iniciamos la consulta sobre los usuarios
        $query = User::query();

        // (Opcional pero recomendado): Filtrar solo los usuarios que tienen su perfil "público"
        // $query->where('is_public', true); 

        // 2. HU-23: Búsqueda por palabra clave
        // 2. HU-23: Búsqueda por palabra clave
            if ($request->has('search') && $request->search != '') {
                $searchTerm = $request->search;
                
                // Agrupamos las condiciones OR en una función para que no rompan otros filtros
                $query->where(function($q) use ($searchTerm) {
                    $q->where('name', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('email', 'LIKE', "%{$searchTerm}%"); // Usamos solo columnas seguras por ahora
                });
            }

        // 3. Cargamos relaciones necesarias para el Frontend (las habilidades que muestra el mockup)
        // Asumiendo que la relación en el modelo User se llama 'skills'
        // $query->with('skills'); 

        // 4. Devolvemos los resultados paginados (el mockup muestra páginas 1, 2, 3)
        // Usamos paginate() en lugar de get() para no colapsar el servidor si hay 1000 usuarios
        $profiles = $query->paginate(10); 

        /* * Nota sobre el Criterio 3 (Mostrar mensaje si no hay resultados):
         * El backend simplemente devuelve la estructura de paginación con un arreglo 'data' vacío [].
         * El frontend se encargará de leer que 'data' está vacío y pintar el mensaje visualmente.
         */
        return response()->json($profiles, 200);
    }
}