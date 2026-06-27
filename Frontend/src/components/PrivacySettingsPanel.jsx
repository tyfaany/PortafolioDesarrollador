import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@mdi/react';
import {
  mdiAlertCircleOutline,
  mdiLockOutline,
  mdiLockOpenVariantOutline,
  mdiTrashCanOutline,
} from '@mdi/js';
import useAuth from '../hooks/useAuth';
import { actualizarPrivacidad, eliminarCuenta, obtenerPrivacidad } from '../services/authService';
import useFeedback from '../hooks/useFeedback';
import { extractApiMessageByStatus } from '../utils/apiError';

const SECTIONS = [
  {
    id: 'searchVisibility',
    title: 'Perfil en búsquedas',
    description: 'Permite que tu perfil aparezca en búsquedas y listados públicos',
    fields: ['show_in_search'],
  },
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
    description: 'Incluye email, telefono, ubicacion y el acceso a WhatsApp derivado del movil',
    fields: ['show_phone', 'show_mobile', 'show_contact_email', 'show_address'],
  },
  {
    id: 'socialNetworks',
    title: 'Redes sociales',
    description: 'Muestra tus perfiles de Instagram y Facebook',
    fields: ['show_instagram', 'show_facebook'],
  },
];

const DEFAULT_PRIVACY = {
  show_in_search: true,
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
  show_instagram: true,
  show_facebook: true,
};

const PRIVACY_FIELDS = Object.keys(DEFAULT_PRIVACY);

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
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showFeedback } = useFeedback();

  const [privacyConfig, setPrivacyConfig] = useState(DEFAULT_PRIVACY);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isHidingAll, setIsHidingAll] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

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

  const visibleCount = useMemo(
    () => sections.filter((section) => section.visible).length,
    [sections],
  );

  const visibleSummary = useMemo(
    () => `${visibleCount} de ${sections.length} secciones configurables visibles`,
    [sections.length, visibleCount],
  );

  const showAllLabel = visibleCount === 0 ? 'Mostrar todo' : 'Ocultar todo';
  const showAllLoadingLabel = visibleCount === 0 ? 'Mostrando' : 'Ocultando';
  const showAllIcon = visibleCount === 0 ? mdiLockOpenVariantOutline : mdiLockOutline;
  const showAllButtonClassName =
    visibleCount === 0 ? 'softsave-button' : 'softsave-button softsave-button--danger';

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

  const toggleAllVisibility = async () => {
    if (isHidingAll || isLoading) {
      return;
    }

    const shouldShowAll = visibleCount === 0;
    const nextConfig = PRIVACY_FIELDS.reduce(
      (accumulator, field) => ({
        ...accumulator,
        [field]: shouldShowAll,
      }),
      {},
    );

    setIsHidingAll(true);
    try {
      await actualizarPrivacidad(nextConfig);
      setPrivacyConfig((current) => ({
        ...current,
        ...nextConfig,
      }));
      showFeedback(
        shouldShowAll
          ? 'Se mostraron todas las secciones configurables del perfil.'
          : 'Se ocultaron todas las secciones configurables del perfil.',
      );
    } catch {
      showFeedback(
        shouldShowAll
          ? 'No se pudo mostrar todo. Intenta nuevamente.'
          : 'No se pudo ocultar todo. Intenta nuevamente.',
        'error',
      );
    } finally {
      setIsHidingAll(false);
    }
  };

  const abrirModalEliminarCuenta = () => {
    if (isDeletingAccount) {
      return;
    }

    setDeletePassword('');
    setIsDeleteModalOpen(true);
  };

  const cerrarModalEliminarCuenta = () => {
    if (isDeletingAccount) {
      return;
    }

    setDeletePassword('');
    setIsDeleteModalOpen(false);
  };

  const manejarEliminarCuenta = async (event) => {
    event.preventDefault();

    if (isDeletingAccount) {
      return;
    }

    const passwordLimpio = String(deletePassword || '').trim();
    if (!passwordLimpio) {
      showFeedback('Debes ingresar tu contrasena actual.', 'error');
      return;
    }

    setIsDeletingAccount(true);
    try {
      await eliminarCuenta(passwordLimpio);
      setIsDeleteModalOpen(false);
      setDeletePassword('');
      showFeedback('Cuenta eliminada correctamente.');

      try {
        await logout();
      } finally {
        navigate('/login', { replace: true });
      }
    } catch (error) {
      showFeedback(
        extractApiMessageByStatus(
          error,
          'No se pudo eliminar la cuenta. Intenta nuevamente.',
          { 422: 'La contrasena actual es incorrecta.' },
        ),
        'error',
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <section className="softsave-profile__form-card softsave-privacy">
      <div className="softsave-profile__section-head">
        <div>
          <h2 className="softsave-profile__form-title">Ajustes de privacidad y cuenta</h2>
          <p className="softsave-profile__form-subtitle">
            Controla que informacion se muestra en tu portafolio publico y administra tu cuenta.
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
              className={showAllButtonClassName}
              onClick={toggleAllVisibility}
              disabled={isHidingAll || isLoading}
              data-loading={isHidingAll ? 'true' : 'false'}
              aria-busy={isHidingAll}
            >
              <Icon path={showAllIcon} size={0.82} />
              {isHidingAll ? showAllLoadingLabel : showAllLabel}
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

      <article className="softsave-privacy__card softsave-privacy__danger-card">
        <div className="softsave-privacy__danger-copy">
          <h3>Eliminar cuenta</h3>
          <p>
            Esta accion eliminara permanentemente tu perfil, proyectos, estudios, experiencia,
            habilidades y el resto de datos asociados a tu cuenta.
          </p>
          <p className="softsave-privacy__danger-note">
            {user?.email ? `Cuenta actual: ${user.email}` : 'La accion no se puede deshacer.'}
          </p>
        </div>

        <button
          type="button"
          className="softsave-button softsave-button--danger softsave-privacy__danger-action"
          onClick={abrirModalEliminarCuenta}
          disabled={isLoading || isDeletingAccount}
        >
          <Icon path={mdiTrashCanOutline} size={0.82} />
          Eliminar mi cuenta
        </button>
      </article>

      {isDeleteModalOpen ? (
        <div
          className="softsave-profile__modal-overlay softsave-profile__modal-overlay--centered"
          role="dialog"
          aria-modal="true"
          onClick={cerrarModalEliminarCuenta}
        >
          <div
            className="softsave-profile__modal softsave-profile__modal--confirm softsave-privacy__delete-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="softsave-profile__modal-header">
              <div className="softsave-profile__modal-content">
                <div className="softsave-privacy__danger-badge softsave-privacy__danger-badge--modal">
                  <Icon path={mdiAlertCircleOutline} size={0.82} />
                  Confirmar eliminacion
                </div>
                <h3 className="softsave-profile__modal-title">Eliminar cuenta</h3>
                <p className="softsave-profile__modal-text">
                  Escribe tu contrasena actual para confirmar esta accion. Si continuas, tu cuenta
                  y sus datos asociados se eliminaran de forma permanente.
                </p>
              </div>
            </header>

            <form className="softsave-privacy__delete-form" onSubmit={manejarEliminarCuenta}>
              <label className="softsave-privacy__delete-field">
                <span>Contrasena actual</span>
                <input
                  type="password"
                  className="softsave-input softsave-profile__input"
                  value={deletePassword}
                  onChange={(event) => setDeletePassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="Ingresa tu contrasena"
                  disabled={isDeletingAccount}
                  required
                />
              </label>

              <div className="softsave-profile__modal-actions">
                <button
                  type="button"
                  className="softsave-profile__secondary-button softsave-profile__secondary-button--modal"
                  onClick={cerrarModalEliminarCuenta}
                  disabled={isDeletingAccount}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="softsave-button softsave-button--danger"
                  disabled={isDeletingAccount}
                >
                  {isDeletingAccount ? 'Eliminando...' : 'Eliminar cuenta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default PrivacySettingsPanel;
