<?php

namespace Tests\Unit\QueryFilters;

use App\Models\User;
use App\QueryFilters\SkillLevelFilter;
use Tests\TestCase;

class SkillLevelFilterTest extends TestCase
{
    public function test_it_filters_users_by_a_single_skill_and_level(): void
    {
        $query = User::query();

        (new SkillLevelFilter())($query, 'React,Avanzado', 'habilidadTecnica_nivel');

        $this->assertStringContainsString('technical_skills', $query->toSql());
        $this->assertSame(['%react%', 'avanzado'], $query->getBindings());
    }

    public function test_it_filters_users_by_multiple_levels_for_the_same_skill(): void
    {
        $query = User::query();

        (new SkillLevelFilter())($query, 'React,1,3', 'habilidadTecnica_nivel');

        $this->assertStringContainsString('technical_skills', $query->toSql());
        $this->assertSame(['%react%', 'basico', 'avanzado'], $query->getBindings());
    }

    public function test_it_filters_users_by_levels_without_a_skill_name(): void
    {
        $query = User::query();

        (new SkillLevelFilter())($query, '1,2', 'habilidadTecnica_nivel');

        $this->assertStringContainsString('technical_skills', $query->toSql());
        $this->assertSame(['basico', 'intermedio'], $query->getBindings());
    }

    public function test_it_filters_users_by_multiple_skill_level_entries(): void
    {
        $query = User::query();

        (new SkillLevelFilter())($query, 'React,Avanzado|Laravel,Intermedio', 'habilidadTecnica_nivel');

        $this->assertStringContainsString('technical_skills', $query->toSql());
        $this->assertSame(['%react%', 'avanzado', '%laravel%', 'intermedio'], $query->getBindings());
    }

    public function test_it_does_not_modify_query_for_empty_skill_level_values(): void
    {
        $query = User::query();
        $baseSql = $query->toSql();
        $baseBindings = $query->getBindings();

        (new SkillLevelFilter())($query, ' , ', 'habilidadTecnica_nivel');

        $this->assertSame($baseSql, $query->toSql());
        $this->assertSame($baseBindings, $query->getBindings());
    }
}
