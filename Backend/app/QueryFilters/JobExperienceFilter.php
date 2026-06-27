<?php

namespace App\QueryFilters;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;
use Illuminate\Support\Facades\DB;

class JobExperienceFilter implements Filter
{
    public function __invoke(Builder $query, $value, string $property)
    {
        if (is_array($value)) {
            $value = reset($value);
        }

        $value = (string) $value;

        if (str_contains($value, ',')) {
            [$position, $years] = explode(',', $value);
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

      
        if ($years === null) {
            return $query->whereHas('jobs', function (Builder $jobQuery) use ($position): void {
                
                $jobQuery->where(DB::raw('LOWER(work_experiences.position)'), 'LIKE', '%' . mb_strtolower($position, 'UTF-8') . '%');
            });
        }

        // años mínimos
        $monthsRequired = (int) $years * 12;

        return $query->whereHas('jobs', function (Builder $jobQuery) use ($position): void {
            
            $jobQuery->where(DB::raw('LOWER(work_experiences.position)'), 'LIKE', '%' . mb_strtolower($position, 'UTF-8') . '%');
        }, '>=', 1)
        ->whereIn('id', function ($subQuery) use ($position, $monthsRequired): void {
            $subQuery->select('user_id')
               
                ->from('work_experiences')
                ->where(DB::raw('LOWER(position)'), 'LIKE', '%' . mb_strtolower($position, 'UTF-8') . '%')
                ->groupBy('user_id')
                ->havingRaw('
                    SUM(
                        PERIOD_DIFF(
                            EXTRACT(YEAR_MONTH FROM COALESCE(STR_TO_DATE(CONCAT(end_year, "-", end_month, "-01"), "%Y-%m-%d"), NOW())),
                            EXTRACT(YEAR_MONTH FROM STR_TO_DATE(CONCAT(start_year, "-", start_month, "-01"), "%Y-%m-%d"))
                        ) + 1
                    ) >= ?
                ', [$monthsRequired]);
        });
    }
}