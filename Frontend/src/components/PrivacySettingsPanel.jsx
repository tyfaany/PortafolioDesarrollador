import { useEffect, useMemo, useState } from 'react';
import Icon from '@mdi/react';
import { mdiLockOutline, mdiLockOpenVariantOutline } from '@mdi/js';
import { actualizarPrivacidad, obtenerPrivacidad } from '../services/authService';
import useFeedback from '../hooks/useFeedback';

const SECTIONS = [
  {
    id: 'profilePhoto',
    title: 'Foto de perfil',
    description: 'Muestra tu foto de perfil en el portafolio',
    fields: ['show_profile_photo'],
  },
  {
    id: 'socialLinks',
    title: 'Enlaces profesionales',
    description: 'Muestra GitHub, LinkedIn y enlaces relevantes',
    fields: ['show_social_links'],
  },
  {
    id: 'bio',
    title: 'Biografia',
    description: 'Muestra tu descripcion profesional',
    fields: ['show_bio'],
  },
  {
    id: 'studies',
    title: 'Estudios',
    description: 'Muestra tu formacion academica',
    fields: ['show_studies'],
  },
  {
    id: 'experience',
    title: 'Experiencia laboral',
    description: 'Muestra tu historial de trabajos',
    fields: ['show_jobs'],
  },
  {
    id: 'skills',
    title: 'Habilidades',
    description: 'Muestra tus habilidades tecnicas y blandas',
    fields: ['show_skills'],
  },
  {
    id: 'personalInfo',
    title: 'Informacion de contacto',
    description: 'Incluye email, telefono y ubicacion',
    fields: ['show_phone', 'show_mobile', 'show_contact_email', 'show_address'],
  },
];

const DEFAULT_PRIVACY = {
  show_bio: true,
  show_studies: true,
  show_jobs: true,
  show_skills: true,
  show_social_links: true,
  show_profile_photo: true,
  show_phone: true,
  show_mobile: true,
  show_contact_email: true,
  show_address: true,
};

function isSectionVisible(section, privacyConfig) {
  if (!Array.isArray(section.fields) || section.fields.length === 0) {
    return true;
  }

  return section.fields.some((field) => Boolean(privacyConfig[field]));
}

function mapSectionVisibility(section, privacyConfig) {
  return {
    ...section,
    visible: isSectionVisible(section, privacyConfig),
  };
}

function PrivacySettingsPanel() {
  const [privacyConfig, setPrivacyConfig] = useState(DEFAULT_PRIVACY);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isHidingAll, setIsHidingAll] = useState(false);
  const { showFeedback } = useFeedback();
  const sections = useMemo(
    () => SECTIONS.map((section) => mapSectionVisibility(section, privacyConfig)),
    [privacyConfig],
  );

  useEffect(() => {
    let isMounted = true;

    const loadPrivacySettings = async () => {
      setIsLoading(true);
      try {
        const response = await obtenerPrivacidad();
        const data = response?.data || {};

        if (!isMounted) {
          return;
        }

        setPrivacyConfig({
          ...DEFAULT_PRIVACY,
          ...data,
        });
      } catch {
        if (isMounted) {
          setPrivacyConfig(DEFAULT_PRIVACY);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPrivacySettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleSummary = useMemo(() => {
    const visibleCount = sections.filter((section) => section.visible).length;
    return `${visibleCount} de ${sections.length} secciones configurables visibles`;
  }, [sections]);

  const toggleSection = async (sectionId) => {
    if (isUpdating) {
      return;
    }

    const section = SECTIONS.find((item) => item.id === sectionId);
    if (!section) {
      return;
    }

    const isVisible = isSectionVisible(section, privacyConfig);
    const nextValue = !isVisible;
    const updatedConfig = { ...privacyConfig };

    section.fields.forEach((field) => {
      updatedConfig[field] = nextValue;
    });

    setPrivacyConfig(updatedConfig);

    setIsUpdating(true);
    try {
      await actualizarPrivacidad(
        section.fields.reduce((accumulator, field) => ({
          ...accumulator,
          [field]: nextValue,
        }), {}),
      );

      showFeedback('Configuracion de privacidad actualizada.');
    } catch {
      setPrivacyConfig(privacyConfig);
      showFeedback('No se pudo actualizar la privacidad. Se revirtio el cambio.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const hideAll = async () => {
    if (isHidingAll || isLoading) {
      return;
    }

    const hiddenConfig = {
      show_bio: false,
      show_studies: false,
      show_jobs: false,
      show_skills: false,
      show_social_links: false,
      show_profile_photo: false,
      show_phone: false,
      show_mobile: false,
      show_contact_email: false,
      show_address: false,
    };

    setIsHidingAll(true);
    try {
      await actualizarPrivacidad(hiddenConfig);
      setPrivacyConfig((current) => ({
        ...current,
        ...hiddenConfig,
      }));
      showFeedback('Se ocultaron todas las secciones configurables del perfil.');
    } catch {
      showFeedback('No se pudo ocultar todo. Intenta nuevamente.', 'error');
    } finally {
      setIsHidingAll(false);
    }
  };

  return (
    <section className="softsave-profile__form-card softsave-privacy">
      <div className="softsave-profile__section-head">
        <div>
          <h2 className="softsave-profile__form-title">Configuracion de Privacidad</h2>
          <p className="softsave-profile__form-subtitle">
            Controla que informacion se muestra en tu portafolio publico.
          </p>
        </div>
      </div>

      <article className="softsave-privacy__card">
        <div className="softsave-privacy__general">
          <div>
            <h3>Vista general</h3>
            <p>{isLoading ? 'Cargando configuracion...' : visibleSummary}</p>
          </div>

          <div className="softsave-privacy__general-actions">
            <button
              type="button"
              className="softsave-button softsave-button--danger"
              onClick={hideAll}
              disabled={isHidingAll || isLoading}
            >
              <Icon path={mdiLockOutline} size={0.82} />
              {isHidingAll ? 'Ocultando...' : 'Ocultar todo'}
            </button>
          </div>
        </div>
      </article>

      <article className="softsave-privacy__card">
        <div className="softsave-privacy__section-head">
          <h3>Secciones del portafolio</h3>
          <p>
            {isLoading
              ? 'Obteniendo configuracion de privacidad...'
              : 'Activa o desactiva las secciones que deseas mostrar'}
          </p>
        </div>

        <div className="softsave-privacy__list">
          {sections.map((section) => (
            <div key={section.id} className="softsave-privacy__item">
              <div className="softsave-privacy__item-copy">
                <div className="softsave-privacy__item-title">
                  <strong>{section.title}</strong>
                  <span
                    className={`softsave-privacy__item-lock ${section.visible ? 'is-visible' : 'is-hidden'}`}
                    aria-hidden="true"
                  >
                    <Icon path={section.visible ? mdiLockOpenVariantOutline : mdiLockOutline} size={0.82} />
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
                disabled={isUpdating || isLoading}
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
