<?php

namespace App\QueryFilters;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\Filters\Filter;

class SkillLevelFilter implements Filter
{
    public function __invoke(Builder $query, $value, string $property)
    {
        [$skillName, $levelLabel, $invalidLevel] = $this->parseValue($value);

        if ($invalidLevel) {
            return $query->whereRaw('1 = 0');
        }

        if ($skillName === '' && $levelLabel === null) {
            return $query;
        }

        return $query->whereIn('id', function ($subQuery) use ($skillName, $levelLabel): void {
            $subQuery->select('user_skills.user_id')
                ->from('user_skills')
                ->join('technical_skills', 'technical_skills.id', '=', 'user_skills.technical_skill_id');

            if ($skillName !== '') {
                $subQuery->whereRaw('LOWER(technical_skills.name) LIKE ?', ['%' . mb_strtolower($skillName, 'UTF-8') . '%']);
            }

            if ($levelLabel !== null) {
                $subQuery->where(DB::raw('LOWER(user_skills.level)'), '=', mb_strtolower($levelLabel, 'UTF-8'));
            }
        });
    }

    /**
     * @return array{0: string, 1: string|null, 2: bool}
     */
    private function parseValue(mixed $value): array
    {
        if (is_array($value)) {
            $parts = array_values(array_filter(array_map(
                static fn ($item) => trim((string) $item),
                $value
            ), static fn (string $item) => $item !== ''));

            if ($parts === []) {
                return ['', null, false];
            }

            if (count($parts) >= 2) {
                $skillName = $parts[0];
                $level = $parts[1];
                $levelLabel = $this->normalizeLevelLabel($level);

                return [$skillName, $levelLabel, $level !== '' && $levelLabel === null];
            }

            $value = $parts[0];
        }

        $value = trim((string) $value);

        if ($value === '') {
            return ['', null, false];
        }

        if (str_contains($value, ',')) {
            [$skillName, $level] = explode(',', $value, 2);
            $skillName = trim($skillName);
            $level = trim($level);

            $levelLabel = $this->normalizeLevelLabel($level);

            return [$skillName, $levelLabel, $level !== '' && $levelLabel === null];
        }

        $levelLabel = $this->normalizeLevelLabel($value);

        if ($levelLabel !== null) {
            return ['', $levelLabel, false];
        }

        return [$value, null, false];
    }

    private function normalizeLevelLabel(string $level): ?string
    {
        $normalized = mb_strtolower(trim($level), 'UTF-8');
        $normalized = strtr($normalized, [
            'á' => 'a',
            'é' => 'e',
            'í' => 'i',
            'ó' => 'o',
            'ú' => 'u',
        ]);

        return match ($normalized) {
            '1', 'basico' => 'Basico',
            '2', 'intermedio' => 'Intermedio',
            '3', 'avanzado' => 'Avanzado',
            default => null,
        };
    }
}
