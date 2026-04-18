<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TechnicalSkillSeeder extends Seeder
{
    public function run(): void
    {
        $skills = [
            // Programación y Web
            'Laravel', 'React', 'Node.js', 'Python', 'Java', 'C++', 'JavaScript',
            // Diseño y Multimedia
            'Adobe Photoshop', 'Adobe Illustrator', 'Figma', 'Premiere Pro', 'Blender',
            // Arquitectura e Ingeniería
            'AutoCAD', 'Revit', 'SolidWorks', 'SketchUp',
            // Datos y Negocios
            'Excel', 'Power BI', 'Tableau', 'SPSS', 'Google Analytics',
            // Sistemas e Infraestructura
            'Docker', 'AWS', 'Linux', 'Git'
        ];

        // Insertamos cada habilidad en la base de datos si no existe
        foreach ($skills as $skill) {
            DB::table('technical_skills')->updateOrInsert(
                ['name' => $skill]
            );
        }
    }
}