import { useState } from 'react';
import AcademicExperienceSection from '../components/AcademicExperienceSection';
import PortfolioPersonalInfoCard from '../components/PortfolioPersonalInfoCard';
import PortfolioSkillsSection from '../components/PortfolioSkillsSection';
import PortfolioWorkExperienceSection from '../components/PortfolioWorkExperienceSection';
import '../styles/ProfileSettings.css';
import '../styles/portafolio.css';

const TABS_PORTAFOLIO = [
  { id: 'general', label: 'Información General' },
  { id: 'proyectos', label: 'Proyectos personales' },
];

function Portfolio() {
  const [tabActiva, setTabActiva] = useState('general');
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
            className="softsave-portafolio-grid"
          >
            <div className="softsave-portafolio-card">
              <h3>Proyecto 1</h3>
              <p>Esta información es privada y solo tú puedes verla.</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default Portfolio;
