<?php

namespace Tests\Unit\QueryFilters;

use App\Models\Project;
use App\QueryFilters\TechFilter;
use Tests\TestCase;

class TechFilterTest extends TestCase
{
    public function test_it_filters_projects_by_technology_name(): void
    {
        $query = Project::query();

        (new TechFilter())($query, 'Laravel', 'tech_filter');

        $this->assertStringContainsString('project_technologies', $query->toSql());
        $this->assertStringContainsString('exists', strtolower($query->toSql()));
        $this->assertSame(['Laravel'], $query->getBindings());
    }

    public function test_it_does_not_modify_query_for_empty_technology_values(): void
    {
        $query = Project::query();
        $baseSql = $query->toSql();
        $baseBindings = $query->getBindings();

        (new TechFilter())($query, '   ', 'tech_filter');

        $this->assertSame($baseSql, $query->toSql());
        $this->assertSame($baseBindings, $query->getBindings());
    }
}
