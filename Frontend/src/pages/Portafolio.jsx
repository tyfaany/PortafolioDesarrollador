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

  return (
    <div className="softsave-portafolio-shell softsave-portafolio-shell--portfolio">
      <div className="softsave-portafolio-content">
        <div className="softsave-portafolio-tabs" role="tablist" aria-label="Secciones de portafolio">
          {TABS_PORTAFOLIO.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={tabActiva === tab.id}
              className={`softsave-portafolio-tab ${tabActiva === tab.id ? 'is-active' : ''}`}
              onClick={() => setTabActiva(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {tabActiva === 'general' ? (
          <div className="softsave-portafolio-stack">
            <PortfolioPersonalInfoCard />
            <AcademicExperienceSection variant="portfolio" />
            <PortfolioWorkExperienceSection />
            <PortfolioSkillsSection />
          </div>
        ) : (
          <section className="softsave-portafolio-grid">
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
