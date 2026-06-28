<?php

namespace App\QueryFilters;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;

class ProfileTechnologyFilter implements Filter
{
    public function __invoke(Builder $query, $value, string $property)
    {
        $technologies = is_array($value) ? $value : preg_split('/\s*,\s*/', (string) $value, -1, PREG_SPLIT_NO_EMPTY);
        $technologies = $technologies === false ? [] : $technologies;

        $technologies = array_values(array_filter(array_map(
            fn ($tech) => mb_strtolower(trim((string) $tech), 'UTF-8'),
            $technologies
        ), fn (string $tech) => $tech !== ''));

        if ($technologies === []) {
            return $query;
        }

        return $query->whereHas('projects', function (Builder $projectQuery) use ($technologies): void {
            $projectQuery->where('is_public', true);
            $first = true;
            foreach ($technologies as $technology) {
                if ($first) {
                    $projectQuery->whereHas('technologies', function (Builder $t) use ($technology): void {
                        $t->whereRaw('LOWER(project_technologies.name) = ?', [$technology]);
                    });
                    $first = false;
                } else {
                    $projectQuery->orWhereHas('technologies', function (Builder $t) use ($technology): void {
                        $t->whereRaw('LOWER(project_technologies.name) = ?', [$technology]);
                    });
                }
            }
        });
    }
}
