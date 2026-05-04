<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProjectTechnologySeeder extends Seeder
{
    public function run(): void
    {
        $technologies = [
            'JavaScript',
            'React',
            'Python',
            'Java',
            'Node.js',
            'MongoDB',
            'Docker',
            'TypeScript',
            'Tailwind CSS',
            'Laravel',
            'PHP',
            'PostgreSQL',
            'MySQL',
            'Vue',
            'Angular',
        ];

        foreach ($technologies as $technology) {
            DB::table('project_technologies')->updateOrInsert(
                ['name' => $technology]
            );
        }
    }
}
