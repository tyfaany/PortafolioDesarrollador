<?php

namespace App\QueryFilters;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\Filters\Filter;

class SkillLevelFilter implements Filter
{
    public function __invoke(Builder $query, $value, string $property)
    {
        [$entries, $invalidLevel] = $this->parseValue($value);

        if ($invalidLevel) {
            return $query->whereRaw('1 = 0');
        }

        if ($entries === []) {
            return $query;
        }

        return $query->where(function (Builder $mainQuery) use ($entries): void {
            $firstEntry = true;

            foreach ($entries as [$skillReference, $levels]) {
                $existsQuery = $this->buildSkillExistsQuery($skillReference, $levels);

                if ($firstEntry) {
                    $mainQuery->whereExists($existsQuery);
                    $firstEntry = false;
                } else {
                    $mainQuery->orWhereExists($existsQuery);
                }
            }
        });
    }

    private function buildSkillExistsQuery(string $skillReference, array $levels): QueryBuilder
    {
        $query = DB::table('user_skills')
            ->join('technical_skills', 'technical_skills.id', '=', 'user_skills.technical_skill_id')
            ->whereColumn('user_skills.user_id', 'users.id')
            ->selectRaw('1');

        if ($skillReference !== '') {
            if (ctype_digit($skillReference)) {
                $query->where('technical_skills.id', (int) $skillReference);
            } else {
                $query->whereRaw('LOWER(technical_skills.name) LIKE ?', ['%' . mb_strtolower($skillReference, 'UTF-8') . '%']);
            }
        }

        if ($levels !== []) {
            $query->whereIn(
                DB::raw('LOWER(user_skills.level)'),
                array_map(
                    static fn (string $level) => mb_strtolower($level, 'UTF-8'),
                    $levels
                )
            );
        }

        return $query;
    }

    /**
     * @return array{0: array<int, array{0: string, 1: array<int, string>}>, 1: bool}
     */
    private function parseValue(mixed $value): array
    {
        $parts = $this->tokenizeValue($value);

        if ($parts === []) {
            return [[], false];
        }

        $entries = [];

        foreach ($parts as $part) {
            [$skillName, $levels, $invalidEntry] = $this->parseEntry($part);

            if ($invalidEntry) {
                return [[], true];
            }

            if ($skillName === '' && $levels === []) {
                continue;
            }

            $entries[] = [$skillName, array_values(array_unique($levels))];
        }

        return [$entries, false];
    }

    /**
     * @return array{0: string, 1: array<int, string>, 2: bool}
     */
    private function parseEntry(string $value): array
    {
        $tokens = array_values(array_filter(array_map('trim', preg_split('/\s*[,]\s*/', trim($value), -1, PREG_SPLIT_NO_EMPTY) ?: []), static fn (string $item) => $item !== ''));

        if ($tokens === []) {
            return ['', [], false];
        }

        if (count($tokens) === 1) {
            $token = $tokens[0];

            if (ctype_digit($token)) {
                return [$token, [], false];
            }

            $level = $this->normalizeLevelLabel($token);
            if ($level !== null) {
                return ['', [$level], false];
            }

            return [$token, [], false];
        }

        if ($this->allTokensAreNumeric($tokens)) {
            $levels = array_values(array_filter(array_map(
                fn (string $token): ?string => $this->normalizeLevelLabel($token),
                $tokens
            )));

            return ['', $levels, false];
        }

        $skillReference = array_shift($tokens);
        $levels = [];

        foreach ($tokens as $token) {
            $level = $this->normalizeLevelLabel($token);

            if ($level !== null) {
                $levels[] = $level;
                continue;
            }

            return ['', [], true];
        }

        return [$skillReference, $levels, false];
    }

    /**
     * @return array<int, string>
     */
    private function tokenizeValue(mixed $value): array
    {
        if (is_array($value)) {
            $value = implode(',', array_map(
                static fn ($item): string => trim((string) $item),
                $value
            ));
        }

        return array_values(array_filter($this->tokenizeString((string) $value), static fn (string $item) => $item !== ''));
    }

    /**
     * @return array<int, string>
     */
    private function tokenizeString(string $value): array
    {
        $parts = preg_split('/\s*[|]\s*/', trim($value), -1, PREG_SPLIT_NO_EMPTY);

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

    private static function normalizeLevelToken(string $level): string
    {
        $normalized = mb_strtolower(trim($level), 'UTF-8');

        return strtr($normalized, [
            'á' => 'a',
            'é' => 'e',
            'í' => 'i',
            'ó' => 'o',
            'ú' => 'u',
        ]);
    }

    /**
     * @param array<int, string> $tokens
     */
    private function allTokensAreNumeric(array $tokens): bool
    {
        foreach ($tokens as $token) {
            if (! ctype_digit($token)) {
                return false;
            }
        }

        return true;
    }
}
