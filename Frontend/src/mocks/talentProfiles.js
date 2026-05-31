export const technicalFilters = [
  {
    id: 'frontend',
    title: 'Frontend',
    options: ['React', 'TypeScript', 'Tailwind', 'Bootstrap', 'Vite'],
  },
  {
    id: 'backend',
    title: 'Backend',
    options: ['Laravel', 'Node.js', 'PHP', 'REST API', 'MySQL'],
  },
  {
    id: 'product',
    title: 'Producto',
    options: ['UI Design', 'UX Writing', 'SEO', 'Testing', 'Analytics'],
  },
];

export const talentProfiles = [
  {
    id: 1,
    nombre: 'Ana Mora',
    rol: 'Frontend Engineer',
    bio: 'Construyo interfaces claras, rapidas y accesibles para productos que necesitan crecer sin perder personalidad.',
    calificacion: 4.9,
    proyectos: 18,
    email: 'ana.mora@devstack.dev',
    github: 'https://github.com/ana-mora',
    linkedin: 'https://linkedin.com/in/ana-mora',
    avatar: {
      initials: 'AM',
      from: '#E67E22',
      to: '#D35400',
    },
    habilidades: ['React', 'Vite', 'Bootstrap', 'UI Design', 'Testing'],
    experienciaLaboral: [
      {
        puesto: 'Senior Frontend Developer',
        empresa: 'Studio Atlas',
        anios: '2023 - Actualidad',
        descripcion: 'Lidera la evolucion visual de dashboards con foco en performance y consistencia de componentes.',
      },
      {
        puesto: 'UI Engineer',
        empresa: 'Spark Labs',
        anios: '2021 - 2023',
        descripcion: 'Implemento sistemas de diseno y flujos responsive para productos SaaS de alta interaccion.',
      },
    ],
    formacionAcademica: [
      {
        titulo: 'Ingenieria de Sistemas',
        institucion: 'Universidad Central',
        anio: '2020',
      },
      {
        titulo: 'Especializacion en UX',
        institucion: 'Academia Pixel',
        anio: '2022',
      },
    ],
    focus: 'React + accesibilidad',
  },
  {
    id: 2,
    nombre: 'Diego Salas',
    rol: 'Full Stack Developer',
    bio: 'Aterrizo funcionalidades de punta a punta con una mirada practica sobre negocio, integracion y mantenibilidad.',
    calificacion: 4.8,
    proyectos: 22,
    email: 'diego.salas@devstack.dev',
    github: 'https://github.com/diego-salas',
    linkedin: 'https://linkedin.com/in/diego-salas',
    avatar: {
      initials: 'DS',
      from: '#2C3E50',
      to: '#4C6580',
    },
    habilidades: ['Laravel', 'React', 'REST API', 'MySQL', 'Testing'],
    experienciaLaboral: [
      {
        puesto: 'Full Stack Developer',
        empresa: 'Northwind Digital',
        anios: '2022 - Actualidad',
        descripcion: 'Diseño integraciones web con APIs robustas y experiencias consistentes en escritorio y movil.',
      },
      {
        puesto: 'Backend Developer',
        empresa: 'Soft Peak',
        anios: '2020 - 2022',
        descripcion: 'Optimizo modelos y endpoints para sistemas de contenido, usuarios y permisos.',
      },
    ],
    formacionAcademica: [
      {
        titulo: 'Ingenieria en Software',
        institucion: 'Instituto Tecnologico del Valle',
        anio: '2019',
      },
    ],
    focus: 'Integraciones y datos',
  },
  {
    id: 3,
    nombre: 'Laura Ponce',
    rol: 'Product Designer',
    bio: 'Conecto estrategia, contenido y jerarquia visual para que cada pantalla cuente una historia facil de seguir.',
    calificacion: 5.0,
    proyectos: 14,
    email: 'laura.ponce@devstack.dev',
    github: 'https://github.com/laura-ponce',
    linkedin: 'https://linkedin.com/in/laura-ponce',
    avatar: {
      initials: 'LP',
      from: '#27AE60',
      to: '#58D68D',
    },
    habilidades: ['UI Design', 'UX Writing', 'Analytics', 'React', 'Bootstrap'],
    experienciaLaboral: [
      {
        puesto: 'Product Designer',
        empresa: 'Green Room',
        anios: '2023 - Actualidad',
        descripcion: 'Define flujos de interfaz y microcopy que reducen friccion en productos de autoservicio.',
      },
      {
        puesto: 'Design System Specialist',
        empresa: 'Mosaic Apps',
        anios: '2021 - 2023',
        descripcion: 'Formaliza componentes y reglas visuales para equipos que trabajan con multiples squads.',
      },
    ],
    formacionAcademica: [
      {
        titulo: 'Diseno de Interaccion',
        institucion: 'Escuela de Artes Digitales',
        anio: '2021',
      },
    ],
    focus: 'Contenido y jerarquia',
  },
  {
    id: 4,
    nombre: 'Carlos Vega',
    rol: 'Backend Engineer',
    bio: 'Me enfoco en APIs confiables, reglas de negocio claras y entregas que no rompen el flujo del equipo.',
    calificacion: 4.7,
    proyectos: 16,
    email: 'carlos.vega@devstack.dev',
    github: 'https://github.com/carlos-vega',
    linkedin: 'https://linkedin.com/in/carlos-vega',
    avatar: {
      initials: 'CV',
      from: '#3498DB',
      to: '#5DADE2',
    },
    habilidades: ['PHP', 'Laravel', 'MySQL', 'REST API', 'Testing'],
    experienciaLaboral: [
      {
        puesto: 'Backend Engineer',
        empresa: 'CloudNest',
        anios: '2022 - Actualidad',
        descripcion: 'Mantiene servicios de autenticacion y datos con una base estable para frontend de alto trafico.',
      },
    ],
    formacionAcademica: [
      {
        titulo: 'Ingenieria Informatica',
        institucion: 'Universidad del Centro',
        anio: '2018',
      },
      {
        titulo: 'Curso de Arquitectura Web',
        institucion: 'Code Academy',
        anio: '2021',
      },
    ],
    focus: 'APIs y validacion',
  },
  {
    id: 5,
    nombre: 'Mariana Ruiz',
    rol: 'QA Automation',
    bio: 'Aseguro que cada release llegue con confianza mediante pruebas utiles, repetibles y faciles de mantener.',
    calificacion: 4.6,
    proyectos: 11,
    email: 'mariana.ruiz@devstack.dev',
    github: 'https://github.com/mariana-ruiz',
    linkedin: 'https://linkedin.com/in/mariana-ruiz',
    avatar: {
      initials: 'MR',
      from: '#8E44AD',
      to: '#B39DDB',
    },
    habilidades: ['Testing', 'Analytics', 'React', 'Bootstrap', 'REST API'],
    experienciaLaboral: [
      {
        puesto: 'QA Automation Engineer',
        empresa: 'Orbit Works',
        anios: '2022 - Actualidad',
        descripcion: 'Cubre rutas criticas con suites de regresion orientadas a flujos reales de usuario.',
      },
    ],
    formacionAcademica: [
      {
        titulo: 'Ingenieria de Software',
        institucion: 'Instituto Central',
        anio: '2020',
      },
    ],
    focus: 'Calidad y regresion',
  },
  {
    id: 6,
    nombre: 'Sergio Luna',
    rol: 'Mobile Developer',
    bio: 'Transformo experiencias web en interfaces ligeras que funcionan con la misma claridad en pantallas pequenas.',
    calificacion: 4.8,
    proyectos: 19,
    email: 'sergio.luna@devstack.dev',
    github: 'https://github.com/sergio-luna',
    linkedin: 'https://linkedin.com/in/sergio-luna',
    avatar: {
      initials: 'SL',
      from: '#F39C12',
      to: '#F8C471',
    },
    habilidades: ['React', 'TypeScript', 'Bootstrap', 'Vite', 'Analytics'],
    experienciaLaboral: [
      {
        puesto: 'Mobile Web Developer',
        empresa: 'Pocket Studio',
        anios: '2021 - Actualidad',
        descripcion: 'Optimiza interfaces compactas para navegacion tactil y cargas rapidas en redes inestables.',
      },
    ],
    formacionAcademica: [
      {
        titulo: 'Desarrollo Movil Hibrido',
        institucion: 'Academia Mobile Pro',
        anio: '2022',
      },
    ],
    focus: 'Responsive mobile first',
  },
];
