<?php

namespace App\QueryFilters;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\Filters\Filter;

class SkillLevelFilter implements Filter
{
    public function __invoke(Builder $query, $value, string $property)
    {
        [$skillName, $levels, $invalidLevel] = $this->parseValue($value);

        if ($invalidLevel) {
            return $query->whereRaw('1 = 0');
        }

        if ($skillName === '' && $levels === []) {
            return $query;
        }

        return $query->whereIn('id', function ($subQuery) use ($skillName, $levels): void {
            $subQuery->select('user_skills.user_id')
                ->from('user_skills')
                ->join('technical_skills', 'technical_skills.id', '=', 'user_skills.technical_skill_id');

            if ($skillName !== '') {
                $subQuery->whereRaw('LOWER(technical_skills.name) LIKE ?', ['%' . mb_strtolower($skillName, 'UTF-8') . '%']);
            }

            if ($levels !== []) {
                $subQuery->whereIn(
                    DB::raw('LOWER(user_skills.level)'),
                    array_map(
                        static fn (string $level) => mb_strtolower($level, 'UTF-8'),
                        $levels
                    )
                );
            }
        });
    }

    /**
     * @return array{0: string, 1: array<int, string>, 2: bool}
     */
    private function parseValue(mixed $value): array
    {
        $parts = $this->tokenizeValue($value);

        if ($parts === []) {
            return ['', [], false];
        }

        $firstPartLevel = $this->normalizeLevelLabel($parts[0]);

        if ($firstPartLevel !== null) {
            $levels = [];

            foreach ($parts as $part) {
                $level = $this->normalizeLevelLabel($part);

                if ($level === null) {
                    return ['', [], true];
                }

                $levels[] = $level;
            }

            return ['', array_values(array_unique($levels)), false];
        }

        $skillName = $parts[0];
        $levels = [];

        foreach (array_slice($parts, 1) as $part) {
            $level = $this->normalizeLevelLabel($part);

            if ($level === null) {
                return [$skillName, [], true];
            }

            $levels[] = $level;
        }

        return [$skillName, array_values(array_unique($levels)), false];
    }

    /**
     * @return array<int, string>
     */
    private function tokenizeValue(mixed $value): array
    {
        if (is_array($value)) {
            $tokens = [];

            foreach ($value as $item) {
                $tokens = array_merge($tokens, $this->tokenizeString((string) $item));
            }

            return array_values(array_filter($tokens, static fn (string $item) => $item !== ''));
        }

        return array_values(array_filter($this->tokenizeString((string) $value), static fn (string $item) => $item !== ''));
    }

    /**
     * @return array<int, string>
     */
    private function tokenizeString(string $value): array
    {
        $parts = preg_split('/\s*[|,]\s*/', trim($value), -1, PREG_SPLIT_NO_EMPTY);

        return $parts === false ? [] : array_map('trim', $parts);
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
