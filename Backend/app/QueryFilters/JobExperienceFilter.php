<?php

namespace App\QueryFilters;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;

class JobExperienceFilter implements Filter
{
    public function __invoke(Builder $query, $value, string $property)
    {
        [$positions, $minYears, $maxYears, $invalidYears] = $this->parseValue($value);
        $positions = array_values(array_filter(array_map(
            static fn ($position) => trim((string) $position),
            $positions
        ), static fn ($position) => $position !== '' && mb_strlen($position, 'UTF-8') >= 2));

        if ($positions === []) {
            return $query->whereRaw('1 = 0');
        }

        if ($invalidYears) {
            return $query->whereRaw('1 = 0');
        }

        if ($minYears === null && $maxYears === null) {
            return $query->whereHas('jobs', function (Builder $jobQuery) use ($positions): void {
                $jobQuery->where(function (Builder $positionQuery) use ($positions): void {
                    $first = true;
                    foreach ($positions as $position) {
                        $positionLike = mb_strtolower($position, 'UTF-8') . '%';

                        if ($first) {
                            $positionQuery->whereRaw('LOWER(position) LIKE ?', [$positionLike]);
                            $first = false;
                        } else {
                            $positionQuery->orWhereRaw('LOWER(position) LIKE ?', [$positionLike]);
                        }
                    }
                });
            });
        }

        $now = Carbon::now();
        $currentYear = (int) $now->year;
        $currentMonth = (int) $now->month;
        $durationExpression = '((((COALESCE(end_year, ?) - start_year) * 12) + (COALESCE(end_month, ?) - start_month) + 1))';

        return $query->whereExists(function ($subQuery) use (
            $positions,
            $minYears,
            $maxYears,
            $durationExpression,
            $currentYear,
            $currentMonth
        ): void {
            $subQuery->selectRaw('1')
                ->from('work_experiences')
                ->whereColumn('work_experiences.user_id', 'users.id')
                ->where(function ($positionQuery) use ($positions): void {
                    $first = true;
                    foreach ($positions as $position) {
                        $positionLike = mb_strtolower($position, 'UTF-8') . '%';

                        if ($first) {
                            $positionQuery->whereRaw('LOWER(position) LIKE ?', [$positionLike]);
                            $first = false;
                        } else {
                            $positionQuery->orWhereRaw('LOWER(position) LIKE ?', [$positionLike]);
                        }
                    }
                });

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
     * @return array{0: list<string>, 1: int|null, 2: int|null, 3: bool}
     */
    private function parseValue(mixed $value): array
    {
        $parts = $this->tokenizeValue($value);

        if ($parts === []) {
            return [[], null, null, false];
        }

        $minYears = null;
        $maxYears = null;
        $invalidYears = false;

        $yearTokens = [];
        $singleYearWithGap = false;

        $reversedParts = array_reverse($parts);

        foreach ($reversedParts as $index => $candidate) {
            $candidate = (string) $candidate;

            if ($candidate === '') {
                if (count($yearTokens) === 1) {
                    $singleYearWithGap = true;
                }

                break;
            }

            $parsed = $this->parseYearToken($candidate);

            if ($parsed === '__invalid__') {
                if ($yearTokens !== []) {
                    $invalidYears = true;
                }

                break;
            }

            if ($parsed === null) {
                break;
            }

            array_unshift($yearTokens, $parsed);

            if (count($yearTokens) === 2) {
                break;
            }

            $nextCandidate = $reversedParts[$index + 1] ?? null;
            if ($nextCandidate === null) {
                break;
            }

            $nextCandidate = (string) $nextCandidate;

            if ($nextCandidate === '') {
                continue;
            }

            if (is_numeric($nextCandidate)) {
                continue;
            }

            break;
        }

        if ($invalidYears) {
            return [[], null, null, true];
        }

        if (count($yearTokens) === 2) {
            [$minYears, $maxYears] = $yearTokens;
        } elseif (count($yearTokens) === 1) {
            if ($singleYearWithGap) {
                $maxYears = $yearTokens[0];
            } else {
                $minYears = $yearTokens[0];
            }
        }

        if ($minYears !== null && $maxYears !== null && $minYears > $maxYears) {
            return [[], null, null, true];
        }

        $positions = [];
        foreach ($parts as $part) {
            foreach ($this->splitPositions((string) $part) as $position) {
                $positions[] = $position;
            }
        }

        return [$positions, $minYears, $maxYears, false];
    }

    /**
     * @return array<int, string>
     */
    private function splitPositions(string $value): array
    {
        return array_values(array_filter(array_map(
            static fn ($position) => trim((string) $position),
            preg_split('/\|/', $value, -1, PREG_SPLIT_NO_EMPTY)
        ), static fn ($position) => $position !== ''));
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
