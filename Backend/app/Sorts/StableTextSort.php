<?php

namespace App\Sorts;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Sorts\Sort;

class StableTextSort implements Sort
{
    public function __construct(
        private readonly string $column
    ) {
    }

    public function __invoke(Builder $query, bool $descending, string $property)
    {
        $direction = $descending ? 'desc' : 'asc';

        $query->orderByRaw('LOWER(' . $this->column . ') ' . $direction);
        $query->orderByDesc('updated_at');
        $query->orderBy('id');
    }
}
