<?php

namespace App\Support;

use Carbon\Carbon;

class PortfolioDateValidator
{
    private const MONTHS = [
        'enero' => 1,
        'febrero' => 2,
        'marzo' => 3,
        'abril' => 4,
        'mayo' => 5,
        'junio' => 6,
        'julio' => 7,
        'agosto' => 8,
        'septiembre' => 9,
        'octubre' => 10,
        'noviembre' => 11,
        'diciembre' => 12,
    ];

    public static function normalizeMonthValue($value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_numeric($value)) {
            $month = (int) $value;

            return $month >= 1 && $month <= 12 ? $month : null;
        }

        $normalized = mb_strtolower(trim((string) $value), 'UTF-8');

        return self::MONTHS[$normalized] ?? null;
    }

    public static function buildMonthYearDate($year, $month): ?Carbon
    {
        $monthNum = self::normalizeMonthValue($month);

        if ($monthNum === null || !is_numeric($year)) {
            return null;
        }

        return Carbon::createFromDate((int) $year, $monthNum, 1)->startOfMonth();
    }

    public static function validateStudyDates(string $startDate, ?string $endDate = null): ?string
    {
        $today = Carbon::today();
        $start = self::parseDate($startDate);

        if ($start === null) {
            return 'La fecha de inicio no es válida.';
        }

        if ($start->gt($today)) {
            return 'La fecha de inicio no puede ser posterior a la fecha actual.';
        }

        if ($endDate === null || $endDate === '') {
            return null;
        }

        $end = self::parseDate($endDate);

        if ($end === null) {
            return 'La fecha de fin no es válida.';
        }

        if ($end->gt($today)) {
            return 'La fecha de fin no puede ser posterior a la fecha actual.';
        }

        if ($start->gt($end)) {
            return 'La fecha de inicio no puede ser posterior a la fecha de fin.';
        }

        return null;
    }

    public static function validateJobDates($startYear, $startMonth, $endYear, $endMonth, bool $isCurrentJob): ?string
    {
        $today = Carbon::now()->startOfMonth();
        $startDate = self::buildMonthYearDate($startYear, $startMonth);

        if ($startDate === null) {
            return 'La fecha de inicio no es válida.';
        }

        if ($startDate->gt($today)) {
            return 'La fecha de inicio no puede ser posterior a la fecha actual.';
        }

        if ($isCurrentJob) {
            return null;
        }

        $endDate = self::buildMonthYearDate($endYear, $endMonth);

        if ($endDate === null) {
            return 'La fecha de fin no es válida.';
        }

        if ($endDate->gt($today)) {
            return 'La fecha de fin no puede ser posterior a la fecha actual.';
        }

        if ($startDate->gt($endDate)) {
            return 'La fecha de inicio no puede ser posterior a la fecha de fin.';
        }

        return null;
    }

    private static function parseDate(string $value): ?Carbon
    {
        try {
            return Carbon::parse($value)->startOfDay();
        } catch (\Throwable) {
            return null;
        }
    }
}
