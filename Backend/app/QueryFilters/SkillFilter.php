<?php

namespace App\QueryFilters;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;

class SkillFilter implements Filter
{
    public function __invoke(Builder $query, $value, string $property)
    {
        $skills = is_array($value) ? $value : preg_split('/\s*,\s*/', (string) $value, -1, PREG_SPLIT_NO_EMPTY);
        $skills = $skills === false ? [] : $skills;

        $skills = array_values(array_filter(array_map('trim', $skills), fn (string $skill) => $skill !== ''));

        if ($skills === []) {
            return $query;
        }

        return $query->whereHas('skills', function (Builder $skillQuery) use ($skills): void {
            $skillQuery->whereIn('name', $skills);
        });
    }
}
