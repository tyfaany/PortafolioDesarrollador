import PropTypes from 'prop-types';
import Icon from '@mdi/react';
import {
  mdiEyeOffOutline,
  mdiEyeOutline,
  mdiGithub,
  mdiImageOutline,
  mdiLinkVariant,
  mdiPencilOutline,
  mdiTrashCanOutline,
} from '@mdi/js';

const MAX_DESCRIPTION_LENGTH = 140;

function truncateDescription(description) {
  if (!description) {
    return '';
  }

  if (description.length <= MAX_DESCRIPTION_LENGTH) {
    return description;
  }

  return `${description.slice(0, MAX_DESCRIPTION_LENGTH).trimEnd()}...`;
}

function normalizeTechnologies(technologies) {
  if (!Array.isArray(technologies)) {
    return [];
  }

  return technologies
    .map((technology) => {
      if (technology && typeof technology === 'object') {
        return technology.name || technology.label || '';
      }

      return String(technology || '');
    })
    .map((technology) => technology.trim())
    .filter(Boolean);
}

function formatDateRange(project) {
  const startDate = project?.start_date || project?.startDate;
  const endDate = project?.end_date || project?.endDate;
  const inProgress = Boolean(project?.is_in_progress ?? project?.inProgress);

  if (!startDate && !endDate) {
    return 'Sin fechas definidas';
  }

  const startLabel = startDate || 'Sin inicio';
  const endLabel = (inProgress || !endDate) ? 'En progreso' : endDate;

  return `${startLabel} - ${endLabel}`;
}

function resolveImageUrl(project) {
  const rawUrl = project?.image_url || project?.image_path || project?.currentImagePreview || '';
  if (!rawUrl) {
    return '';
  }

  if (/^https?:\/\//i.test(rawUrl) || rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) {
    return rawUrl;
  }

  const apiBase = import.meta.env.VITE_LARAVEL_API_URL;
  if (!apiBase) {
    return rawUrl;
  }

  let backendOrigin = '';
  try {
    backendOrigin = new URL(apiBase).origin;
  } catch {
    return rawUrl;
  }

  if (rawUrl.startsWith('/storage/')) {
    return `${backendOrigin}${rawUrl}`;
  }

  if (rawUrl.startsWith('storage/')) {
    return `${backendOrigin}/${rawUrl}`;
  }

  if (rawUrl.startsWith('projects/')) {
    return `${backendOrigin}/storage/${rawUrl}`;
  }

  return `${backendOrigin}/${rawUrl.replace(/^\/+/, '')}`;
}

function ProjectCard({ project, onDelete = () => {}, onToggleVisibility = () => {}, onToggleEdit = () => {} }) {
  const technologies = normalizeTechnologies(project?.technologies);
  const isPublic = Boolean(project?.is_public ?? project?.visibility === 'public');
  const imageUrl = resolveImageUrl(project);
  const demoUrl = project?.demo_url || '';
  const repoUrl = project?.repo_url || project?.repository_url || '';

  return (
    <article className="softsave-projects-card" aria-label={`Proyecto ${project?.title || ''}`}>
      <div className="softsave-projects-card__body">
        <div className="softsave-projects-card__media" aria-hidden="true">
          {imageUrl ? (
            <img src={imageUrl} alt={`Vista previa de ${project?.title || 'proyecto'}`} />
          ) : (
            <Icon path={mdiImageOutline} size={1.1} />
          )}
        </div>

        <div className="softsave-projects-card__summary">
          <div className="softsave-projects-card__header">
            <div className="softsave-projects-card__title-wrap">
              <h3 className="softsave-projects-card__title">{project?.title || 'Proyecto sin titulo'}</h3>
              <p className="softsave-project-form__hint">{formatDateRange(project)}</p>
            </div>

            <div className="softsave-projects-card__header-actions">
              <button
                type="button"
                className={`softsave-projects-card__badge ${isPublic ? 'is-public' : 'is-private'}`}
                aria-label={`Cambiar visibilidad. Actualmente ${isPublic ? 'publica' : 'privada'}`}
                onClick={() => onToggleVisibility(project)}
              >
                <Icon path={isPublic ? mdiEyeOutline : mdiEyeOffOutline} size={0.7} />
                {isPublic ? 'Publico' : 'Privado'}
              </button>
              <button
                type="button"
                className="softsave-projects-card__icon-action"
                onClick={() => onToggleEdit(project)}
                aria-label="Editar proyecto"
              >
                <Icon path={mdiPencilOutline} size={0.82} />
              </button>
              <button
                type="button"
                className="softsave-projects-card__icon-action is-danger"
                onClick={() => onDelete(project)}
                aria-label="Eliminar proyecto"
              >
                <Icon path={mdiTrashCanOutline} size={0.82} />
              </button>
            </div>
          </div>

          <p>{truncateDescription(project?.description || '')}</p>
          <div className="softsave-projects-card__links">
            {demoUrl ? (
              <a href={demoUrl} target="_blank" rel="noreferrer" aria-label="Abrir demo">
                <Icon path={mdiLinkVariant} size={0.72} />
                Demo
              </a>
            ) : <span>Demo: no disponible</span>}
            {repoUrl ? (
              <a href={repoUrl} target="_blank" rel="noreferrer" aria-label="Abrir repositorio">
                <Icon path={mdiGithub} size={0.72} />
                Repositorio
              </a>
            ) : <span>Repo: no disponible</span>}
          </div>

          <div className="softsave-project-form__chips" aria-label="Tecnologias del proyecto">
            {technologies.map((technology) => (
              <span key={technology} className="softsave-project-form__chip softsave-project-form__chip--selected">
                {technology}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

ProjectCard.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    description: PropTypes.string,
    technologies: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          name: PropTypes.string,
          label: PropTypes.string,
        }),
      ]),
    ),
    start_date: PropTypes.string,
    end_date: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    is_in_progress: PropTypes.bool,
    inProgress: PropTypes.bool,
    is_public: PropTypes.bool,
    visibility: PropTypes.string,
    image_url: PropTypes.string,
    image_path: PropTypes.string,
    currentImagePreview: PropTypes.string,
    demo_url: PropTypes.string,
    repo_url: PropTypes.string,
    repository_url: PropTypes.string,
  }).isRequired,
  onDelete: PropTypes.func,
  onToggleVisibility: PropTypes.func,
  onToggleEdit: PropTypes.func,
};

export default ProjectCard;
