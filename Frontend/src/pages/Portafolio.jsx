import { useState } from 'react';
import AcademicExperienceSection from '../components/AcademicExperienceSection';
import ProjectForm from '../components/ProjectForm';
import PortfolioPersonalInfoCard from '../components/PortfolioPersonalInfoCard';
import PortfolioSkillsSection from '../components/PortfolioSkillsSection';
import PortfolioWorkExperienceSection from '../components/PortfolioWorkExperienceSection';
import '../styles/ProfileSettings.css';
import '../styles/ProjectsPrivacyViews.css';
import '../styles/portafolio.css';

const TABS_PORTAFOLIO = [
  { id: 'general', label: 'Informacion General' },
  { id: 'proyectos', label: 'Proyectos personales' },
];

const PROJECT_DRAFT = {
  title: '',
  description: '',
  technologies: ['JavaScript', 'React'],
  startDate: '',
  endDate: '',
  inProgress: false,
  demoUrl: '',
  repositoryUrl: '',
  visibility: 'public',
  currentImageName: '',
  currentImagePreview: '',
};

const PROJECT_SAMPLE = {
  title: 'E-commerce Platform',
  description:
    'Plataforma de compras con carrito de compras y pago integrado con multiples metodos de pago.',
  technologies: ['React', 'Node.js', 'MongoDB', 'Docker'],
  startDate: '2023-06-01',
  endDate: '2023-09-30',
  inProgress: false,
  demoUrl: 'https://ecommerce-demo.com',
  repositoryUrl: 'https://github.com/john/ecommerce',
  visibility: 'public',
  currentImageName: 'Imagen_Proyecto.png',
  currentImagePreview:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='360' height='220' viewBox='0 0 360 220'%3E%3Crect width='360' height='220' rx='24' fill='%23F4F7F6'/%3E%3Crect x='30' y='26' width='300' height='168' rx='18' fill='%23FFFFFF' stroke='%23D7DEE5'/%3E%3Crect x='54' y='54' width='252' height='22' rx='11' fill='%23F2540D' fill-opacity='.14'/%3E%3Crect x='54' y='92' width='168' height='12' rx='6' fill='%232C3E50' fill-opacity='.18'/%3E%3Crect x='54' y='116' width='222' height='12' rx='6' fill='%232C3E50' fill-opacity='.12'/%3E%3Crect x='54' y='150' width='92' height='24' rx='12' fill='%23F2540D'/%3E%3C/svg%3E",
};

function Portfolio() {
  const [tabActiva, setTabActiva] = useState('general');
  const [modoProyecto, setModoProyecto] = useState('create');
  const panelIdActivo = `portafolio-panel-${tabActiva}`;
  const tabIdActiva = `portafolio-tab-${tabActiva}`;

  return (
    <div className="softsave-portafolio-shell softsave-portafolio-shell--portfolio">
      <div className="softsave-portafolio-content">
        <div className="softsave-portafolio-tabs" role="tablist" aria-label="Secciones de portafolio">
          {TABS_PORTAFOLIO.map((tab) => (
            <button
              key={tab.id}
              id={`portafolio-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-controls={`portafolio-panel-${tab.id}`}
              aria-selected={tabActiva === tab.id}
              tabIndex={tabActiva === tab.id ? 0 : -1}
              className={`softsave-portafolio-tab ${tabActiva === tab.id ? 'is-active' : ''}`}
              onClick={() => setTabActiva(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {tabActiva === 'general' ? (
          <div
            id={panelIdActivo}
            role="tabpanel"
            aria-labelledby={tabIdActiva}
            className="softsave-portafolio-stack"
          >
            <PortfolioPersonalInfoCard />
            <AcademicExperienceSection variant="portfolio" />
            <PortfolioWorkExperienceSection />
            <PortfolioSkillsSection />
          </div>
        ) : (
          <section
            id={panelIdActivo}
            role="tabpanel"
            aria-labelledby={tabIdActiva}
            className="softsave-portafolio-stack"
          >
            <ProjectForm
              mode={modoProyecto}
              initialData={modoProyecto === 'create' ? PROJECT_DRAFT : PROJECT_SAMPLE}
              onSwitchMode={setModoProyecto}
            />
          </section>
        )}
      </div>
    </div>
  );
}

export default Portfolio;
