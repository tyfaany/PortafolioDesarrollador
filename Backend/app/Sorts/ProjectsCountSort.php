<?php

namespace App\Sorts;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Sorts\Sort;

class ProjectsCountSort implements Sort
{
    public function __invoke(Builder $query, bool $descending, string $property)
    {
        $query->withCount([
            'projects as projects_count' => function (Builder $projectQuery): void {
                $projectQuery->where('is_public', true);
            },
        ]);

        $query->orderBy($property, $descending ? 'desc' : 'asc');
        $query->orderByDesc('updated_at');
        $query->orderBy('name');
    }
}
