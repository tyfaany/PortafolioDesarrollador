function avatarDataUri(name, background, accent) {
  const initials = name
    .split(' ')
    .map((word) => word.at(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${background}" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect width="240" height="240" rx="52" fill="url(#bg)" />
      <circle cx="120" cy="94" r="44" fill="rgba(255,255,255,0.88)" />
      <path d="M48 214c10-48 42-75 72-75s62 27 72 75" fill="rgba(255,255,255,0.82)" />
      <text x="120" y="132" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="700" fill="#0f172a">${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const talentProfiles = [
  {
    id: 1,
    nombre: 'Ana García',
    rol: 'Full Stack Developer',
    calificacion: 4.9,
    proyectos: 42,
    bio: 'Apasionada por la arquitectura de microservicios y la creación de experiencias de usuario fluidas con React y Node.js.',
    habilidades: ['React', 'Node.js', 'PostgreSQL', 'JavaScript', 'TypeScript', 'Docker'],
    foto: avatarDataUri('Ana García', '#f97316', '#f9a8d4'),
    github: 'https://github.com/ana-garcia-dev',
    linkedin: 'https://linkedin.com/in/anagarcia',
    email: 'ana.garcia@example.com',
    experienciaLaboral: [
      {
        puesto: 'Lead Frontend Developer',
        empresa: 'Naranja Labs',
        anios: '2022 - Actualidad',
        descripcion: 'Lidera el desarrollo de dashboards corporativos con React, TypeScript y sistemas de diseno reutilizables.',
      },
      {
        puesto: 'Full Stack Developer',
        empresa: 'CloudBridge',
        anios: '2019 - 2022',
        descripcion: 'Construyo APIs Node.js y modulos web para automatizar procesos de seguimiento de proyectos.',
      },
    ],
    formacionAcademica: [
      {
        titulo: 'Ingeniería de Sistemas',
        institucion: 'Universidad Mayor de San Simon',
        anio: '2014 - 2019',
      },
      {
        titulo: 'Certificacion React Avanzado',
        institucion: 'Frontend Masters',
        anio: '2023',
      },
    ],
  },
  {
    id: 2,
    nombre: 'Mateo Ruiz',
    rol: 'Backend Engineer',
    calificacion: 4.8,
    proyectos: 29,
    bio: 'Especialista en escalabilidad, rendimiento y servicios distribuidos con Python, Java y Docker.',
    habilidades: ['Python', 'Java', 'Node.js', 'Docker', 'AWS', 'PostgreSQL'],
    foto: avatarDataUri('Mateo Ruiz', '#1f2937', '#60a5fa'),
    github: 'https://github.com/mateoruiz',
    linkedin: 'https://linkedin.com/in/mateoruiz',
    email: 'mateo.ruiz@example.com',
    experienciaLaboral: [
      {
        puesto: 'Backend Engineer',
        empresa: 'Fintech Pulse',
        anios: '2021 - Actualidad',
        descripcion: 'Disena servicios de alta disponibilidad y optimiza pipelines de datos para productos financieros.',
      },
      {
        puesto: 'Software Developer',
        empresa: 'Andes Code',
        anios: '2018 - 2021',
        descripcion: 'Implemento integraciones REST y procesos batch con Python para clientes regionales.',
      },
    ],
    formacionAcademica: [
      {
        titulo: 'Licenciatura en Informática',
        institucion: 'Universidad Catolica Boliviana',
        anio: '2013 - 2018',
      },
      {
        titulo: 'AWS Developer Associate',
        institucion: 'Amazon Web Services',
        anio: '2022',
      },
    ],
  },
  {
    id: 3,
    nombre: 'Carlos Ruiz',
    rol: 'Senior Full Stack Developer',
    calificacion: 5.0,
    proyectos: 36,
    bio: 'Crea experiencias digitales escalables con foco en precisión backend, detalle frontend y performance.',
    habilidades: ['React', 'Node.js', 'TypeScript', 'JavaScript', 'GraphQL', 'Docker'],
    foto: avatarDataUri('Carlos Ruiz', '#0f172a', '#f97316'),
    github: 'https://github.com/ruiz-dev',
    linkedin: 'https://linkedin.com/in/carlosruiz',
    email: 'carlos.ruiz@example.com',
    experienciaLaboral: [
      {
        puesto: 'Lead Full Stack Architect',
        empresa: 'TechCurators Global',
        anios: '2021 - Actualidad',
        descripcion: 'Lidera micro-frontends y APIs para plataformas de curación de talento a gran escala.',
      },
      {
        puesto: 'Senior Software Engineer',
        empresa: 'Innovate Solutions',
        anios: '2018 - 2021',
        descripcion: 'Desarrolló arquitecturas robustas con Node.js y optimización de bases de datos relacionales.',
      },
    ],
    formacionAcademica: [
      {
        titulo: 'Grado en Ingeniería Informática',
        institucion: 'Universidad Tecnologica Nacional',
        anio: '2012 - 2017',
      },
      {
        titulo: 'Certificacion AWS Solutions Architect',
        institucion: 'Amazon Web Services',
        anio: '2022',
      },
    ],
  },
  {
    id: 4,
    nombre: 'Lucía Valdés',
    rol: 'Data Scientist',
    calificacion: 4.7,
    proyectos: 18,
    bio: 'Transforma datos en decisiones estratégicas con Python, análisis predictivo y visualizaciones claras.',
    habilidades: ['Python', 'JavaScript', 'React', 'SQL', 'Tableau', 'Machine Learning'],
    foto: avatarDataUri('Lucía Valdés', '#7c2d12', '#38bdf8'),
    github: 'https://github.com/luciavaldes',
    linkedin: 'https://linkedin.com/in/luciavaldes',
    email: 'lucia.valdes@example.com',
    experienciaLaboral: [
      {
        puesto: 'Data Scientist',
        empresa: 'Insight Factory',
        anios: '2022 - Actualidad',
        descripcion: 'Construye modelos predictivos y tableros ejecutivos para equipos comerciales.',
      },
      {
        puesto: 'Data Analyst',
        empresa: 'MetricLab',
        anios: '2019 - 2022',
        descripcion: 'Automatizó reportes de inteligencia de negocio con Python, SQL y visualización de datos.',
      },
    ],
    formacionAcademica: [
      {
        titulo: 'Maestría en Ciencia de Datos',
        institucion: 'Universidad de Chile',
        anio: '2021',
      },
      {
        titulo: 'Ingeniería Estadística',
        institucion: 'Universidad Mayor',
        anio: '2015 - 2019',
      },
    ],
  },
  {
    id: 5,
    nombre: 'David Chen',
    rol: 'UI/UX Developer',
    calificacion: 4.8,
    proyectos: 31,
    bio: 'Diseña interfaces accesibles, sistemas visuales consistentes y experiencias web de alto rendimiento con React.',
    habilidades: ['React', 'JavaScript', 'TypeScript', 'Tailwind CSS', 'Figma', 'Vue.js'],
    foto: avatarDataUri('David Chen', '#2C3E50', '#E67E22'),
    github: 'https://github.com/davidchen-ui',
    linkedin: 'https://linkedin.com/in/davidchenui',
    email: 'david.chen@example.com',
    experienciaLaboral: [
      {
        puesto: 'UI Engineer',
        empresa: 'Pixel Systems',
        anios: '2022 - Actualidad',
        descripcion: 'Implementa bibliotecas de componentes y flujos de prototipado para productos SaaS empresariales.',
      },
      {
        puesto: 'Frontend Developer',
        empresa: 'Studio Loop',
        anios: '2019 - 2022',
        descripcion: 'Desarrollo interfaces responsivas con React, Figma y pruebas de accesibilidad automatizadas.',
      },
    ],
    formacionAcademica: [
      {
        titulo: 'Diseño de Interacción Digital',
        institucion: 'Instituto Tecnológico Metropolitano',
        anio: '2015 - 2019',
      },
      {
        titulo: 'Certificación Design Systems',
        institucion: 'Interaction Design Foundation',
        anio: '2023',
      },
    ],
  },
  {
    id: 6,
    nombre: 'Sofía Torres',
    rol: 'Cloud Full Stack Developer',
    calificacion: 4.9,
    proyectos: 27,
    bio: 'Construye plataformas cloud seguras con Java, Node.js y TypeScript, integrando buenas prácticas DevOps.',
    habilidades: ['Java', 'Node.js', 'TypeScript', 'React', 'AWS', 'Kubernetes'],
    foto: avatarDataUri('Sofía Torres', '#D35400', '#2C3E50'),
    github: 'https://github.com/sofiatorres-cloud',
    linkedin: 'https://linkedin.com/in/sofiatorrescloud',
    email: 'sofia.torres@example.com',
    experienciaLaboral: [
      {
        puesto: 'Cloud Full Stack Developer',
        empresa: 'Atlas Cloud',
        anios: '2021 - Actualidad',
        descripcion: 'Desarrolla soluciones cloud nativas y servicios backend con monitoreo, seguridad y despliegue continuo.',
      },
      {
        puesto: 'Java Developer',
        empresa: 'Core Banking Tech',
        anios: '2018 - 2021',
        descripcion: 'Mantuvo servicios transaccionales Java y módulos frontend para operaciones financieras internas.',
      },
    ],
    formacionAcademica: [
      {
        titulo: 'Ingeniería en Computación',
        institucion: 'Universidad Nacional de Córdoba',
        anio: '2013 - 2018',
      },
      {
        titulo: 'Especialización en Arquitectura Cloud',
        institucion: 'Linux Foundation',
        anio: '2022',
      },
    ],
  },
];

export const technicalFilters = [
  {
    id: 'lenguajes',
    title: 'LENGUAJES',
    options: ['Python', 'Java', 'JavaScript', 'TypeScript'],
  },
  {
    id: 'frameworks',
    title: 'FRAMEWORKS',
    options: ['React', 'Node.js'],
  },
];
