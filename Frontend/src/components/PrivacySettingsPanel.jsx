import { useMemo, useState } from 'react';
import Icon from '@mdi/react';
import {
  mdiCogOutline,
  mdiEyeOutline,
  mdiLockOutline,
  mdiLockOpenVariantOutline,
} from '@mdi/js';

const SECTIONS = [
  {
    id: 'profilePhoto',
    title: 'Foto de perfil',
    description: 'Muestra tu foto de perfil en el portafolio',
    visible: true,
  },
  {
    id: 'personalInfo',
    title: 'Informacion personal',
    description: 'Incluye email, telefono y ubicacion',
    visible: true,
  },
  {
    id: 'bio',
    title: 'Biografia',
    description: 'Muestra tu descripcion profesional',
    visible: true,
  },
  {
    id: 'experience',
    title: 'Experiencia laboral',
    description: 'Muestra tu historial de trabajos',
    visible: true,
  },
];

function PrivacySettingsPanel() {
  const [sections, setSections] = useState(SECTIONS);
  const alwaysVisibleSections = 5;

  const visibleSummary = useMemo(() => {
    const visibleCount = sections.filter((section) => section.visible).length + alwaysVisibleSections;
    return `${visibleCount} de 9 secciones visibles`;
  }, [sections]);

  const toggleSection = (sectionId) => {
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              visible: !section.visible,
            }
          : section,
      ),
    );
  };

  const hideAll = () => {
    setSections((current) =>
      current.map((section) => ({
        ...section,
        visible: false,
      })),
    );
  };

  return (
    <section className="softsave-privacy">
      <header className="softsave-privacy__header">
        <div className="softsave-privacy__title-wrap">
          <span className="softsave-privacy__icon" aria-hidden="true">
            <Icon path={mdiCogOutline} size={1.15} />
          </span>
          <div>
            <h2 className="softsave-privacy__title">Configuracion de Privacidad</h2>
            <p className="softsave-privacy__subtitle">
              Controla que informacion se muestra en tu portafolio publico
            </p>
          </div>
        </div>
      </header>

      <article className="softsave-privacy__card">
        <div className="softsave-privacy__general">
          <div>
            <h3>Vista general</h3>
            <p>{visibleSummary}</p>
          </div>

          <div className="softsave-privacy__general-actions">
            <button type="button" className="softsave-privacy__primary-action">
              <Icon path={mdiEyeOutline} size={0.9} />
              Ver portafolio publico
            </button>
            <button type="button" className="softsave-privacy__secondary-action" onClick={hideAll}>
              <Icon path={mdiLockOutline} size={0.82} />
              Ocultar todo
            </button>
          </div>
        </div>
      </article>

      <article className="softsave-privacy__card">
        <div className="softsave-privacy__section-head">
          <h3>Secciones del portafolio</h3>
          <p>Activa o desactiva las secciones que deseas mostrar</p>
        </div>

        <div className="softsave-privacy__list">
          {sections.map((section) => (
            <div key={section.id} className="softsave-privacy__item">
              <div className="softsave-privacy__item-copy">
                <div className="softsave-privacy__item-title">
                  <strong>{section.title}</strong>
                  <span className="softsave-privacy__item-lock" aria-hidden="true">
                    <Icon path={mdiLockOpenVariantOutline} size={0.82} />
                  </span>
                </div>
                <p>{section.description}</p>
              </div>

              <button
                type="button"
                className={`softsave-privacy__switch ${section.visible ? 'is-on' : ''}`}
                role="switch"
                aria-checked={section.visible}
                aria-label={`Cambiar visibilidad de ${section.title}`}
                onClick={() => toggleSection(section.id)}
              >
                <span className="softsave-privacy__switch-thumb" />
              </button>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

export default PrivacySettingsPanel;
