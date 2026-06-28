<?php

namespace App\QueryFilters;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;

class JobExperienceFilter implements Filter
{
    public function __invoke(Builder $query, $value, string $property)
    {
        [$position, $minYears, $maxYears, $invalidYears] = $this->parseValue($value);
        $position = trim($position);

        if ($position === '' || mb_strlen($position, 'UTF-8') < 2) {
            return $query->whereRaw('1 = 0');
        }

        if ($invalidYears) {
            return $query->whereRaw('1 = 0');
        }

        if ($minYears === null && $maxYears === null) {
            $positionLike = mb_strtolower($position, 'UTF-8') . '%';

            return $query->whereHas('jobs', function (Builder $jobQuery) use ($positionLike): void {
                $jobQuery->whereRaw('LOWER(position) LIKE ?', [$positionLike]);
            });
        }

        $positionLike = mb_strtolower($position, 'UTF-8') . '%';
        $now = Carbon::now();
        $currentYear = (int) $now->year;
        $currentMonth = (int) $now->month;

        $durationExpression = '((((COALESCE(end_year, ?) - start_year) * 12) + (COALESCE(end_month, ?) - start_month) + 1))';

        return $query->whereExists(function ($subQuery) use (
            $positionLike,
            $minYears,
            $maxYears,
            $durationExpression,
            $currentYear,
            $currentMonth
        ): void {
            $subQuery->selectRaw('1')
                ->from('work_experiences')
                ->whereColumn('work_experiences.user_id', 'users.id')
                ->whereRaw('LOWER(position) LIKE ?', [$positionLike]);

            if ($minYears !== null) {
                $subQuery->whereRaw($durationExpression . ' >= ?', [
                    $currentYear,
                    $currentMonth,
                    $minYears * 12,
                ]);
            }

            if ($maxYears !== null) {
                $subQuery->whereRaw($durationExpression . ' < ?', [
                    $currentYear,
                    $currentMonth,
                    $maxYears * 12,
                ]);
            }
        });
    }

    /**
     * @return array{0: string, 1: int|null, 2: int|null, 3: bool}
     */
    private function parseValue(mixed $value): array
    {
        $parts = $this->tokenizeValue($value);

        if ($parts === []) {
            return ['', null, null, false];
        }

        $position = array_shift($parts);

        if ($position === null) {
            return ['', null, null, false];
        }

        if ($position === '') {
            return ['', null, null, false];
        }

        $yearTokens = array_slice($parts, 0, 2);
        $yearTokens = array_map(static fn ($item) => trim((string) $item), $yearTokens);

        if ($yearTokens === [] || $yearTokens === ['', '']) {
            return [$position, null, null, false];
        }

        $firstYear = $this->parseYearToken($yearTokens[0]);
        $secondYear = $this->parseYearToken($yearTokens[1] ?? null);

        if ($this->isInvalidYearToken($firstYear) || $this->isInvalidYearToken($secondYear)) {
            return [$position, null, null, true];
        }

        if ($yearTokens[0] === '' && $secondYear !== null) {
            return [$position, null, $secondYear, false];
        }

        if ($firstYear !== null && ($yearTokens[1] ?? '') === '') {
            return [$position, $firstYear, null, false];
        }

        if ($firstYear !== null && $secondYear !== null) {
            if ($firstYear >= $secondYear) {
                return [$position, null, null, true];
            }

            return [$position, $firstYear, $secondYear, false];
        }

        if ($firstYear !== null && $secondYear === null) {
            return [$position, $firstYear, null, false];
        }

        return [$position, null, null, true];
    }

    /**
     * @return array<int, string>
     */
    private function tokenizeValue(mixed $value): array
    {
        if (is_array($value)) {
            return array_values(array_map(
                static fn ($item) => trim((string) $item),
                $value
            ));
        }

        $value = trim((string) $value);

        if ($value === '') {
            return [];
        }

        return array_map('trim', explode(',', $value));
    }

    /**
     * @return int|string|null
     */
    private function parseYearToken(?string $value)
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (! is_numeric($value)) {
            return '__invalid__';
        }

        $year = (int) $value;

        if ($year < 0) {
            return '__invalid__';
        }

        return $year;
    }

    private function isInvalidYearToken(mixed $value): bool
    {
        return $value === '__invalid__';
    }
}
