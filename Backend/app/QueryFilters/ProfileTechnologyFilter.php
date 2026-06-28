<?php

namespace App\QueryFilters;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;

class ProfileTechnologyFilter implements Filter
{
    public function __invoke(Builder $query, $value, string $property)
    {
        $technology = is_array($value) ? ($value[0] ?? null) : trim((string) $value);

        if ($technology === null || $technology === '') {
            return $query;
        }

        $technology = mb_strtolower($technology, 'UTF-8');

        return $query->whereHas('projects', function (Builder $projectQuery) use ($technology): void {
            $projectQuery->where('is_public', true)
                ->whereHas('technologies', function (Builder $techQuery) use ($technology): void {
                    $techQuery->whereRaw('LOWER(project_technologies.name) = ?', [$technology]);
                });
        });
    }
}
