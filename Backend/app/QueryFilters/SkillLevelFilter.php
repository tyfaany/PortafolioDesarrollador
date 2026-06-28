<?php

namespace App\QueryFilters;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;

class SkillLevelFilter implements Filter
{
    public function __invoke(Builder $query, $value, string $property)
    {
        if (is_array($value)) {
            $value = reset($value);
        }

        $value = (string) $value;

        if (str_contains($value, ',')) {
            [$skillName, $level] = explode(',', $value, 2);
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
            $normalizedLevel = mb_strtolower(trim($level), 'UTF-8');
            $normalizedLevel = strtr($normalizedLevel, [
                'á' => 'a',
                'é' => 'e',
                'í' => 'i',
                'ó' => 'o',
                'ú' => 'u',
            ]);

            if (is_numeric($normalizedLevel)) {
                $levelNumeric = (int) $normalizedLevel;
            } elseif ($normalizedLevel === 'basico') {
                $levelNumeric = 1;
            } elseif ($normalizedLevel === 'intermedio') {
                $levelNumeric = 2;
            } elseif ($normalizedLevel === 'avanzado') {
                $levelNumeric = 3;
            } else {
                return $query->whereRaw('1 = 0');
            }
        }

        return $query->whereHas('skills', function (Builder $skillQuery) use ($skillName, $levelNumeric): void {
            $skillQuery->whereRaw('LOWER(technical_skills.name) LIKE ?', ['%' . mb_strtolower($skillName, 'UTF-8') . '%']);

            if ($levelNumeric !== null) {
                $skillQuery->whereRaw(
                    "CASE LOWER(user_skills.level)
                        WHEN 'basico' THEN 1
                        WHEN 'intermedio' THEN 2
                        WHEN 'avanzado' THEN 3
                        ELSE 0
                    END >= ?",
                    [$levelNumeric]
                );
            }
        });
    }
}
