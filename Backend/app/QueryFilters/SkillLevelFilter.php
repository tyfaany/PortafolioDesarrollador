<?php

namespace App\QueryFilters;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;
use Illuminate\Support\Facades\DB;

class SkillLevelFilter implements Filter
{
    public function __invoke(Builder $query, $value, string $property)
    {
        if (is_array($value)) {
            $value = reset($value);
        }

        $value = (string) $value;

        if (str_contains($value, ',')) {
            [$skillName, $level] = explode(',', $value);
        } else {
            $skillName = $value;
            $level = null;
        }

        $skillName = trim($skillName);
        $level = ($level !== null && $level !== '') ? trim($level) : null;

        if ($skillName === '') {
            return $query;
        }


        $levelNumeric = null;
        if ($level !== null) {
            $levelLower = strtolower($level);
            
            if ($levelLower === 'basico' || $levelLower === 'básico') {
                $levelNumeric = 1;
            } elseif ($levelLower === 'intermedio') {
                $levelNumeric = 2;
            } elseif ($levelLower === 'avanzado') {
                $levelNumeric = 3;
            } else {
                
                return $query->whereRaw('1 = 0');
            }
        }

        return $query->whereHas('skills', function (Builder $skillQuery) use ($skillName, $levelNumeric): void {
          
            $skillQuery->where(DB::raw('LOWER(technical_skills.name)'), 'LIKE', '%' . mb_strtolower($skillName, 'UTF-8') . '%');

            if ($levelNumeric !== null) {
                
                $skillQuery->whereRaw('(user_skills.level + 0) >= ?', [$levelNumeric]);
            }
        });
    }
}