<?php

namespace App\QueryFilters;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;

class JobExperienceFilter implements Filter
{
    public function __invoke(Builder $query, $value, string $property)
    {
        if (is_array($value)) {
            $value = reset($value);
        }

        $value = (string) $value;

        if (str_contains($value, ',')) {
            [$position, $years] = explode(',', $value, 2);
        } else {
            $position = $value;
            $years = null;
        }

        $position = trim($position);
        $years = ($years !== null && $years !== '') ? trim($years) : null;

        if ($years === '0' || $years === 0 || $years === '') {
            $years = null;
        }

        if ($position === '') {
            return $query;
        }

        if ($years !== null && ! is_numeric($years)) {
            $years = null;
        }

        if ($years === null) {
            return $query->whereHas('jobs', function (Builder $jobQuery) use ($position): void {
                $jobQuery->whereRaw('LOWER(position) LIKE ?', ['%' . mb_strtolower($position, 'UTF-8') . '%']);
            });
        }

        $monthsRequired = (int) $years * 12;
        $now = Carbon::now();
        $currentYear = (int) $now->year;
        $currentMonth = (int) $now->month;
        $positionLike = '%' . mb_strtolower($position, 'UTF-8') . '%';

        return $query->whereIn('id', function ($subQuery) use ($positionLike, $monthsRequired, $currentYear, $currentMonth): void {
            $subQuery->select('user_id')
                ->from('work_experiences')
                ->whereRaw('LOWER(position) LIKE ?', [$positionLike])
                ->groupBy('user_id')
                ->havingRaw('
                    SUM((((COALESCE(end_year, ?) - start_year) * 12) + (COALESCE(end_month, ?) - start_month) + 1)) >= ?
                ', [$currentYear, $currentMonth, $monthsRequired]);
        });
    }
}
