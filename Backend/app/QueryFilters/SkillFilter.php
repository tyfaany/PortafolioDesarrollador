<?php

namespace App\QueryFilters;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;
use Illuminate\Support\Facades\DB;

class SkillFilter implements Filter
{
    public function __invoke(Builder $query, $value, string $property)
    {
      
        $skills = is_array($value) ? $value : preg_split('/\s*,\s*/', (string) $value, -1, PREG_SPLIT_NO_EMPTY);
        $skills = $skills === false ? [] : $skills;

       
        $skills = array_values(array_filter(array_map(
            fn ($skill) => mb_strtolower(trim((string) $skill), 'UTF-8'),
            $skills
        ), fn (string $skill) => $skill !== ''));

        // Si el filtro viene vacío, retorna la consulta original 
        if ($skills === []) {
            return $query;
        }

        
        return $query->where(function (Builder $mainQuery) use ($skills): void {
            foreach ($skills as $skill) {
                $mainQuery->whereHas('skills', function (Builder $skillQuery) use ($skill): void {
                    $skillQuery->where(DB::raw('LOWER(technical_skills.name)'), 'LIKE', '%' . $skill . '%');
                });
            }
        });
    }
}