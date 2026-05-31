<?php

namespace App\QueryFilters;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;

class TechFilter implements Filter
{
    public function __invoke(Builder $query, $value, string $property)
    {
        $technology = is_array($value) ? ($value[0] ?? null) : trim((string) $value);

        if ($technology === null || $technology === '') {
            return $query;
        }

        return $query->whereHas('technologies', function (Builder $techQuery) use ($technology): void {
            $techQuery->where('name', $technology);
        });
    }
}
