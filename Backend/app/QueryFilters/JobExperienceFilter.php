<?php

namespace App\QueryFilters;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;

class JobExperienceFilter implements Filter
{
    public function __invoke(Builder $query, $value, string $property)
    {
        [$position, $years] = $this->parseValue($value);
        $position = trim($position);

        if ($years === '0' || $years === 0 || $years === '') {
            $years = null;
        }

        if ($position === '' || mb_strlen($position, 'UTF-8') < 2) {
            return $query->whereRaw('1 = 0');
        }

        if ($years !== null && ! is_numeric($years)) {
            return $query->whereRaw('1 = 0');
        }

        if ($years === null) {
            $positionLike = mb_strtolower($position, 'UTF-8') . '%';

            return $query->whereHas('jobs', function (Builder $jobQuery) use ($positionLike): void {
                $jobQuery->whereRaw('LOWER(position) LIKE ?', [$positionLike]);
            });
        }

        $yearsNumeric = (int) $years;
        $positionLike = mb_strtolower($position, 'UTF-8') . '%';

        $monthsMin = $yearsNumeric * 12;
        $monthsMax = ($yearsNumeric + 1) * 12;
        $now = Carbon::now();
        $currentYear = (int) $now->year;
        $currentMonth = (int) $now->month;

        return $query->whereExists(function ($subQuery) use ($positionLike, $monthsMin, $monthsMax, $currentYear, $currentMonth): void {
            $subQuery->selectRaw('1')
                ->from('work_experiences')
                ->whereColumn('work_experiences.user_id', 'users.id')
                ->whereRaw('LOWER(position) LIKE ?', [$positionLike])
                ->whereRaw(
                    '((((COALESCE(end_year, ?) - start_year) * 12) + (COALESCE(end_month, ?) - start_month) + 1)) >= ? AND ((((COALESCE(end_year, ?) - start_year) * 12) + (COALESCE(end_month, ?) - start_month) + 1)) < ?',
                    [$currentYear, $currentMonth, $monthsMin, $currentYear, $currentMonth, $monthsMax]
                );
        });
    }

    /**
     * @return array{0: string, 1: string|null}
     */
    private function parseValue(mixed $value): array
    {
        if (is_array($value)) {
            $parts = array_values(array_filter(array_map(
                static fn ($item) => trim((string) $item),
                $value
            ), static fn (string $item) => $item !== ''));

            if ($parts === []) {
                return ['', null];
            }

            if (count($parts) >= 2) {
                return [$parts[0], $parts[1]];
            }

            $value = $parts[0];
        }

        $value = trim((string) $value);

        if ($value === '') {
            return ['', null];
        }

        if (str_contains($value, ',')) {
            [$position, $years] = explode(',', $value, 2);

            return [trim($position), trim($years)];
        }

        return [$value, null];
    }
}
