<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('technical_skills')->truncate();
        DB::table('project_technologies')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $catalog = [
            // Lenguajes
            'Python',
            'JavaScript',
            'TypeScript',
            'Java',
            'C#',
            'C++',
            'Go',
            'Rust',
            'PHP',
            'Ruby',
            'Kotlin',
            'Swift',
            'Dart',
            'R',
            'HTML5',
            'CSS3',
            'Scala',
            'Groovy',
            'Clojure',
            'Haskell',
            'Lua',
            'Perl',
            'Julia',
            'MATLAB',
            'Assembly (x86/ARM)',
            'Bash',
            'PowerShell',
            'Elixir',
            'Erlang',
            // Frontend
            'React',
            'Angular',
            'Vue.js',
            'Svelte',
            'Next.js',
            'Nuxt.js',
            'Tailwind CSS',
            'Bootstrap',
            'jQuery',
            'Astro',
            'Remix',
            'Gatsby',
            'Alpine.js',
            'SolidJS',
            'Lit',
            'Ember.js',
            'Backbone.js',
            'Bulma',
            'Semantic UI',
            'Chakra UI',
            'Ant Design',
            'Primeng',
            // Backend / Runtime
            'Node.js',
            'Express.js',
            'NestJS',
            'Django',
            'FastAPI',
            'Flask',
            'Spring Boot',
            'Laravel',
            'ASP.NET Core',
            'Ruby on Rails',
            'Symfony',
            'CodeIgniter',
            'Koa.js',
            'Fiber (Go)',
            'Gin (Go)',
            'Actix-web (Rust)',
            'Quarkus',
            'Micronaut',
            // Mobile
            'Flutter',
            'React Native',
            'Ionic',
            'Capacitor',
            'Xamarin',
            'NativeScript',
            // Bases de datos
            'PostgreSQL',
            'MySQL',
            'Microsoft SQL Server',
            'SQLite',
            'Oracle Database',
            'MongoDB',
            'Redis',
            'Cassandra',
            'DynamoDB',
            'Firebase Realtime Database',
            'Elasticsearch',
            'Neo4j',
            'MariaDB',
            'CockroachDB',
            'InfluxDB',
            'Supabase',
            'Appwrite',
            'PocketBase',
            'Meilisearch',
            'Solr',
            // Cloud
            'Amazon Web Services (AWS)',
            'Google Cloud Platform (GCP)',
            'Microsoft Azure',
            'DigitalOcean',
            'Vercel',
            'Firebase',
            'Heroku',
            'Netlify',
            'Render',
            // DevOps / Infra
            'Docker',
            'Kubernetes',
            'Git',
            'GitHub Actions',
            'GitLab CI/CD',
            'Jenkins',
            'Terraform',
            'Ansible',
            'Helm',
            'ArgoCD',
            'Vagrant',
            // Diseño y Multimedia
            'Figma',
            'Adobe Photoshop',
            'Adobe Illustrator',
            'Adobe XD',
            'Premiere Pro',
            'After Effects',
            'Blender',
            'Canva',
            // Arquitectura e Ingeniería
            'AutoCAD',
            'Revit',
            'SolidWorks',
            'SketchUp',
            // Datos y Negocios
            'Excel',
            'Power BI',
            'Tableau',
            'SPSS',
            'Google Analytics',
            'Looker Studio',
            'Notion',
            'Jira',
            'Trello',
            // APIs y mensajería
            'GraphQL',
            'gRPC',
            'WebSockets',
            'Apache Kafka',
            'RabbitMQ',
            // Ciberseguridad
            'Kali Linux',
            'Wireshark',
            'Metasploit Framework',
            'Burp Suite',
            'Nmap',
            // Herramientas
            'Postman',
            'Insomnia',
            'Prometheus',
            'Grafana',
            'Linux',
        ];

        foreach ($catalog as $item) {
            DB::table('project_technologies')->updateOrInsert(['name' => $item]);
            DB::table('technical_skills')->updateOrInsert(['name' => $item]);
        }
    }
}
