import { useState } from 'react';
import Icon from '@mdi/react';
import { mdiClose, mdiPlus } from '@mdi/js';
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
  technologies: [],
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshProjectsKey, setRefreshProjectsKey] = useState(0);
  const panelIdActivo = `portafolio-panel-${tabActiva}`;
  const tabIdActiva = `portafolio-tab-${tabActiva}`;

  const handleProjectSaved = () => {
    setRefreshProjectsKey((current) => current + 1);
    setIsCreateModalOpen(false);
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
            <section className="softsave-projects-card softsave-projects-card--composer">
              <div className="softsave-projects-card__header">
                <div className="softsave-projects-card__title-wrap">
                  <h2 className="softsave-projects-card__title">Agregar proyecto</h2>
                  <p className="softsave-project-form__hint">Crea un nuevo proyecto sin salir de esta vista.</p>
                </div>
                <button
                  type="button"
                  className="softsave-project-form__mini-button"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Icon path={mdiPlus} size={0.8} />
                  Nuevo
                </button>
              </div>
            </section>

            <ProjectList
              refreshKey={refreshProjectsKey}
            />

            {isCreateModalOpen ? (
              <div
                className="softsave-project-modal__overlay"
                role="dialog"
                aria-modal="true"
                onClick={() => setIsCreateModalOpen(false)}
              >
                <div className="softsave-project-modal" onClick={(event) => event.stopPropagation()}>
                  <header className="softsave-project-modal__header">
                    <h3 className="softsave-project-modal__title">Agregar proyecto</h3>
                    <p className="softsave-project-modal__subtitle">
                      Actualiza la informacion detallada de tu trabajo para el portafolio.
                    </p>
                    <button
                      type="button"
                      className="softsave-project-modal__close"
                      onClick={() => setIsCreateModalOpen(false)}
                      aria-label="Cerrar modal de agregar proyecto"
                    >
                      <Icon path={mdiClose} size={0.8} />
                    </button>
                  </header>

                  <ProjectForm
                    mode="create"
                    initialData={PROJECT_DRAFT}
                    onProjectSaved={handleProjectSaved}
                    showModeActions={false}
                    onCancel={() => setIsCreateModalOpen(false)}
                    showHeader={false}
                    useModalLayout
                  />
                </div>
              </div>
            ) : null}
          </section>
        )}
      </div>
    </div>
  );
}

export default Portfolio;
