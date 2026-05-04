import PropTypes from 'prop-types';
import Icon from '@mdi/react';
import {
  mdiEyeOffOutline,
  mdiEyeOutline,
  mdiImageOutline,
  mdiPencilOutline,
  mdiSwapHorizontal,
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
  const endLabel = inProgress ? 'En progreso' : endDate || 'Sin fin';

  return `${startLabel} - ${endLabel}`;
}

function resolveImageUrl(project) {
  return project?.image_url || project?.image_path || project?.currentImagePreview || '';
}

function ProjectCard({
  project,
  onEdit = () => {},
  onDelete = () => {},
  onToggleVisibility = () => {},
}) {
  const technologies = normalizeTechnologies(project?.technologies);
  const isPublic = Boolean(project?.is_public ?? project?.visibility === 'public');
  const imageUrl = resolveImageUrl(project);

  return (
    <article className="softsave-projects-card" aria-label={`Proyecto ${project?.title || ''}`}>
      <div className="softsave-projects-card__header">
        <div className="softsave-projects-card__title-wrap">
          <h3 className="softsave-projects-card__title">{project?.title || 'Proyecto sin titulo'}</h3>
          <p className="softsave-project-form__hint">{formatDateRange(project)}</p>
        </div>

        <span className="softsave-projects-card__badge" aria-label={`Visibilidad ${isPublic ? 'publica' : 'privada'}`}>
          <Icon path={isPublic ? mdiEyeOutline : mdiEyeOffOutline} size={0.7} />
          {isPublic ? 'Publico' : 'Privado'}
        </span>
      </div>

      <div className="softsave-project-form__upload-preview">
        <div className="softsave-project-form__image-thumb" aria-hidden="true">
          {imageUrl ? (
            <img src={imageUrl} alt={`Vista previa de ${project?.title || 'proyecto'}`} />
          ) : (
            <Icon path={mdiImageOutline} size={1.1} />
          )}
        </div>

        <p>{truncateDescription(project?.description || '')}</p>
      </div>

      <div className="softsave-project-form__chips" aria-label="Tecnologias del proyecto">
        {technologies.map((technology) => (
          <span key={technology} className="softsave-project-form__chip softsave-project-form__chip--selected">
            {technology}
          </span>
        ))}
      </div>

      <div className="softsave-projects-card__actions">
        <button
          type="button"
          className="softsave-project-form__mini-button"
          onClick={() => onToggleVisibility(project)}
        >
          <Icon path={mdiSwapHorizontal} size={0.8} />
          {isPublic ? 'Volver privado' : 'Hacer publico'}
        </button>

        <button
          type="button"
          className="softsave-project-form__mini-button"
          onClick={() => onEdit(project)}
        >
          <Icon path={mdiPencilOutline} size={0.8} />
          Editar
        </button>

        <button
          type="button"
          className="softsave-project-form__mini-button softsave-project-form__mini-button--danger"
          onClick={() => onDelete(project)}
        >
          <Icon path={mdiTrashCanOutline} size={0.8} />
          Eliminar
        </button>
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
  }).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onToggleVisibility: PropTypes.func,
};

export default ProjectCard;
