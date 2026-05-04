import { useState } from 'react';
import AcademicExperienceSection from '../components/AcademicExperienceSection';
import ProjectForm from '../components/ProjectForm';
import ProjectList from '../components/ProjectList';
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

function Portfolio() {
  const [tabActiva, setTabActiva] = useState('general');
  const [modoProyecto, setModoProyecto] = useState('create');
  const [proyectoEnEdicion, setProyectoEnEdicion] = useState(null);
  const [refreshProjectsKey, setRefreshProjectsKey] = useState(0);
  const panelIdActivo = `portafolio-panel-${tabActiva}`;
  const tabIdActiva = `portafolio-tab-${tabActiva}`;

  const handleEditProject = (project) => {
    setProyectoEnEdicion(project);
    setModoProyecto('edit');
  };

  const handleProjectSaved = (project) => {
    if (project?.id) {
      setProyectoEnEdicion(project);
    }

    setRefreshProjectsKey((current) => current + 1);
  };

  const handleSwitchProjectMode = (nextMode) => {
    setModoProyecto(nextMode);
    if (nextMode === 'create') {
      setProyectoEnEdicion(null);
    }
  };

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
            <ProjectList
              onEdit={handleEditProject}
              refreshKey={refreshProjectsKey}
            />
            <ProjectForm
              mode={modoProyecto}
              initialData={PROJECT_DRAFT}
              project={modoProyecto === 'edit' ? proyectoEnEdicion : null}
              onSwitchMode={handleSwitchProjectMode}
              onProjectSaved={handleProjectSaved}
            />
          </section>
        )}
      </div>
    </div>
  );
}

export default Portfolio;
