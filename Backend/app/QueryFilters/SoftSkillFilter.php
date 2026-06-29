<?php

namespace App\QueryFilters;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;

class SoftSkillFilter implements Filter
{
    public function __invoke(Builder $query, $value, string $property)
    {
        $softSkills = is_array($value) ? $value : preg_split('/\s*,\s*/', (string) $value, -1, PREG_SPLIT_NO_EMPTY);
        $softSkills = $softSkills === false ? [] : $softSkills;

        $softSkills = array_values(array_filter(array_map(
            fn ($skill) => mb_strtolower(trim((string) $skill), 'UTF-8'),
            $softSkills
        ), fn (string $skill) => $skill !== ''));

        if ($softSkills === []) {
            return $query;
        }

        return $query->where(function (Builder $mainQuery) use ($softSkills): void {
            $first = true;

            foreach ($softSkills as $softSkill) {
                if ($first) {
                    $mainQuery->whereHas('softSkills', function (Builder $skillQuery) use ($softSkill): void {
                        $skillQuery->whereRaw('LOWER(soft_skills.name) LIKE ?', ['%' . $softSkill . '%']);
                    });
                    $first = false;
                } else {
                    $mainQuery->orWhereHas('softSkills', function (Builder $skillQuery) use ($softSkill): void {
                        $skillQuery->whereRaw('LOWER(soft_skills.name) LIKE ?', ['%' . $softSkill . '%']);
                    });
                }
            }
        });
    }
}
