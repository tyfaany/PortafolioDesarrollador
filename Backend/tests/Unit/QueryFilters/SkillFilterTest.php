<?php

namespace Tests\Unit\QueryFilters;

use App\Models\User;
use App\QueryFilters\SkillFilter;
use Tests\TestCase;

class SkillFilterTest extends TestCase
{
    public function test_it_filters_users_by_a_single_skill(): void
    {
        $query = User::query();

        (new SkillFilter())($query, 'Laravel', 'habilidades');

        $this->assertStringContainsString('technical_skills', $query->toSql());
        $this->assertStringContainsString('exists', strtolower($query->toSql()));
        $this->assertSame(['laravel'], $query->getBindings());
    }

    public function test_it_filters_users_by_multiple_skills_separated_by_comma(): void
    {
        $query = User::query();

        (new SkillFilter())($query, 'Laravel, React,  ', 'habilidades');

        $this->assertStringContainsString('technical_skills', $query->toSql());
        $this->assertSame(['laravel', 'react'], $query->getBindings());
    }

    public function test_it_does_not_modify_query_for_empty_skill_values(): void
    {
        $query = User::query();
        $baseSql = $query->toSql();
        $baseBindings = $query->getBindings();

        (new SkillFilter())($query, ' , ', 'habilidades');

        $this->assertSame($baseSql, $query->toSql());
        $this->assertSame($baseBindings, $query->getBindings());
    }
}
