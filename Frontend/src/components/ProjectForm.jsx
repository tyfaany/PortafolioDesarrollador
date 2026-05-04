import { useEffect, useMemo, useState } from 'react';
import Icon from '@mdi/react';
import {
  mdiCheckCircleOutline,
  mdiClose,
  mdiFileDocumentOutline,
  mdiImageOutline,
  mdiPencilOutline,
  mdiPlus,
  mdiTrashCanOutline,
} from '@mdi/js';

const TECHNOLOGY_SUGGESTIONS = [
  'JavaScript',
  'React',
  'Python',
  'Java',
  'Node.js',
  'MongoDB',
  'Docker',
  'TypeScript',
  'Tailwind CSS',
  'Laravel',
];

function createInitialFormState(initialData) {
  return {
    title: initialData?.title || '',
    description: initialData?.description || '',
    technologies: initialData?.technologies || [],
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    inProgress: Boolean(initialData?.inProgress),
    demoUrl: initialData?.demoUrl || '',
    repositoryUrl: initialData?.repositoryUrl || '',
    visibility: initialData?.visibility || 'public',
    currentImageName: initialData?.currentImageName || '',
    currentImagePreview: initialData?.currentImagePreview || '',
  };
}

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function formatDateLabel(value) {
  if (!value) {
    return 'DD/MM/AAAA';
  }

  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function ProjectForm({ mode, initialData, onSwitchMode }) {
  const [formData, setFormData] = useState(() => createInitialFormState(initialData));
  const [errors, setErrors] = useState({});
  const [submitMessage, setSubmitMessage] = useState('');
  const [imageError, setImageError] = useState('');
  const [techInput, setTechInput] = useState('');
  const [showTechInput, setShowTechInput] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(initialData?.currentImagePreview || '');
  const [imageRemoved, setImageRemoved] = useState(false);

  useEffect(() => {
    setFormData(createInitialFormState(initialData));
    setErrors({});
    setSubmitMessage('');
    setImageError('');
    setTechInput('');
    setShowTechInput(false);
    setImageFile(null);
    setImagePreview(initialData?.currentImagePreview || '');
    setImageRemoved(false);
  }, [initialData, mode]);

  useEffect(() => {
    if (!imageFile) {
      return undefined;
    }

    const localPreview = URL.createObjectURL(imageFile);
    setImagePreview(localPreview);

    return () => {
      URL.revokeObjectURL(localPreview);
    };
  }, [imageFile]);

  const cardTitle = mode === 'create' ? 'Nuevo proyecto' : formData.title || 'Proyecto personal';
  const hasImage = Boolean((imagePreview && !imageRemoved) || (formData.currentImagePreview && !imageRemoved));
  const selectedTechs = formData.technologies;

  const visiblePreview = useMemo(() => {
    if (imageRemoved) {
      return '';
    }

    return imagePreview || formData.currentImagePreview || '';
  }, [formData.currentImagePreview, imagePreview, imageRemoved]);

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: '',
    }));

    setSubmitMessage('');
  };

  const handleAddTechnology = (technology) => {
    const normalizedTechnology = technology.trim();

    if (!normalizedTechnology) {
      return;
    }

    if (selectedTechs.includes(normalizedTechnology)) {
      setShowTechInput(false);
      setTechInput('');
      return;
    }

    if (selectedTechs.length >= 15) {
      setErrors((current) => ({
        ...current,
        technologies: 'Puedes seleccionar un maximo de 15 tecnologias.',
      }));
      return;
    }

    updateField('technologies', [...selectedTechs, normalizedTechnology]);
    setShowTechInput(false);
    setTechInput('');
  };

  const handleRemoveTechnology = (technologyToRemove) => {
    updateField(
      'technologies',
      selectedTechs.filter((technology) => technology !== technologyToRemove),
    );
  };

  const validateImageFile = (file) => {
    if (!file) {
      return 'Selecciona una imagen principal en formato JPEG o PNG.';
    }

    const validTypes = ['image/jpeg', 'image/png'];

    if (!validTypes.includes(file.type)) {
      return 'La imagen principal solo acepta archivos JPEG o PNG.';
    }

    if (file.size > 10 * 1024 * 1024) {
      return 'La imagen principal no puede superar los 10MB.';
    }

    return '';
  };

  const handleImageSelection = (event) => {
    const selectedFile = event.target.files?.[0] || null;

    if (!selectedFile) {
      return;
    }

    const validationError = validateImageFile(selectedFile);

    if (validationError) {
      setImageError(validationError);
      setErrors((current) => ({
        ...current,
        image: validationError,
      }));
      return;
    }

    setImageError('');
    setImageRemoved(false);
    setImageFile(selectedFile);
    setErrors((current) => ({
      ...current,
      image: '',
    }));
    setSubmitMessage('');
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setImageRemoved(true);
    setImageError('');
    setErrors((current) => ({
      ...current,
      image: '',
    }));
  };

  const validateForm = () => {
    const nextErrors = {};
    const trimmedTitle = formData.title.trim();
    const trimmedDescription = formData.description.trim();

    if (trimmedTitle.length < 5 || trimmedTitle.length > 100) {
      nextErrors.title = 'El titulo debe tener entre 5 y 100 caracteres.';
    }

    if (trimmedDescription.length < 20 || trimmedDescription.length > 500) {
      nextErrors.description = 'La descripcion debe tener entre 20 y 500 caracteres.';
    }

    if (selectedTechs.length < 1 || selectedTechs.length > 15) {
      nextErrors.technologies = 'Debes seleccionar entre 1 y 15 tecnologias.';
    }

    if (!formData.startDate) {
      nextErrors.startDate = 'La fecha de inicio es obligatoria.';
    }

    if (!formData.inProgress && !formData.endDate) {
      nextErrors.endDate = 'La fecha fin es obligatoria si el proyecto no esta en progreso.';
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      nextErrors.endDate = 'La fecha de inicio no puede ser mayor a la fecha fin.';
    }

    if (!formData.demoUrl || !isValidHttpUrl(formData.demoUrl)) {
      nextErrors.demoUrl = 'Ingresa una URL demo valida con HTTP o HTTPS.';
    }

    if (!formData.repositoryUrl || !isValidHttpUrl(formData.repositoryUrl)) {
      nextErrors.repositoryUrl = 'Ingresa una URL de repositorio valida con HTTP o HTTPS.';
    }

    if (mode === 'create' && !imageFile) {
      nextErrors.image = 'La imagen principal es obligatoria.';
    }

    if (mode === 'edit' && !hasImage && !imageFile) {
      nextErrors.image = 'Debes conservar o cargar una imagen principal.';
    }

    setErrors(nextErrors);
    setImageError(nextErrors.image || '');
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitMessage(
      mode === 'create'
        ? 'Proyecto listo para guardar localmente.'
        : 'Cambios del proyecto listos para guardar localmente.',
    );
  };

  const handleReset = () => {
    setFormData(createInitialFormState(initialData));
    setErrors({});
    setSubmitMessage('');
    setImageError('');
    setTechInput('');
    setShowTechInput(false);
    setImageFile(null);
    setImagePreview(initialData?.currentImagePreview || '');
    setImageRemoved(false);
  };

  return (
    <section className="softsave-projects-card">
      <div className="softsave-projects-card__header">
        <div className="softsave-projects-card__title-wrap">
          {mode === 'create' ? (
            <>
              <span className="softsave-projects-card__title-icon" aria-hidden="true">
                <Icon path={mdiFileDocumentOutline} size={0.82} />
              </span>
              <h2 className="softsave-projects-card__title">{cardTitle}</h2>
            </>
          ) : (
            <div className="softsave-projects-card__edit-strip">
              <h2 className="softsave-projects-card__edit-title">{cardTitle}</h2>
              <span className="softsave-projects-card__badge">Editando</span>
            </div>
          )}
        </div>

        <div className="softsave-projects-card__actions">
          <button
            type="button"
            className={`softsave-projects-card__icon-button ${mode === 'create' ? 'is-active' : ''}`}
            onClick={() => onSwitchMode('create')}
            aria-label="Abrir formulario de nuevo proyecto"
          >
            <Icon path={mdiPlus} size={0.9} />
          </button>
          <button
            type="button"
            className={`softsave-projects-card__icon-button softsave-projects-card__icon-button--ghost ${mode === 'edit' ? 'is-active' : ''}`}
            onClick={() => onSwitchMode('edit')}
            aria-label="Abrir formulario de edicion"
          >
            <Icon path={mdiPencilOutline} size={0.9} />
          </button>
        </div>
      </div>

      <form className="softsave-project-form" onSubmit={handleSubmit} noValidate>
        <label className="softsave-project-form__field">
          <span className="softsave-project-form__label">Titulo del proyecto *</span>
          <input
            type="text"
            className="softsave-input"
            value={formData.title}
            maxLength={100}
            placeholder="Ej: Sistema de gestion de inventario"
            onChange={(event) => updateField('title', event.target.value)}
          />
          <span className="softsave-project-form__hint">{formData.title.trim().length}/100</span>
          {errors.title ? <span className="error-text">{errors.title}</span> : null}
        </label>

        <label className="softsave-project-form__field">
          <span className="softsave-project-form__label">Descripcion *</span>
          <textarea
            className="softsave-input softsave-project-form__textarea"
            value={formData.description}
            maxLength={500}
            placeholder="Describe tu proyecto... (min. 20, max. 500 caracteres)"
            onChange={(event) => updateField('description', event.target.value)}
          />
          <span className="softsave-project-form__hint">{formData.description.trim().length}/500</span>
          {errors.description ? <span className="error-text">{errors.description}</span> : null}
        </label>

        <div className="softsave-project-form__field">
          <span className="softsave-project-form__label">Tecnologias utilizadas *</span>
          <div className="softsave-project-form__chips">
            {selectedTechs.map((technology) => (
              <span key={technology} className="softsave-project-form__chip softsave-project-form__chip--selected">
                {technology}
                <button
                  type="button"
                  className="softsave-project-form__chip-remove"
                  aria-label={`Eliminar ${technology}`}
                  onClick={() => handleRemoveTechnology(technology)}
                >
                  <Icon path={mdiClose} size={0.72} />
                </button>
              </span>
            ))}

            {TECHNOLOGY_SUGGESTIONS.filter((technology) => !selectedTechs.includes(technology))
              .slice(0, 5)
              .map((technology) => (
                <button
                  key={technology}
                  type="button"
                  className="softsave-project-form__chip"
                  onClick={() => handleAddTechnology(technology)}
                >
                  {technology}
                </button>
              ))}

            <button
              type="button"
              className="softsave-project-form__chip softsave-project-form__chip--add"
              onClick={() => setShowTechInput((current) => !current)}
            >
              + Agregar
            </button>
          </div>

          {showTechInput ? (
            <div className="softsave-project-form__tech-editor">
              <input
                type="text"
                className="softsave-input"
                value={techInput}
                maxLength={30}
                placeholder="Ej: Vue, PostgreSQL, Figma"
                onChange={(event) => setTechInput(event.target.value)}
              />
              <button
                type="button"
                className="softsave-button softsave-button--compact"
                onClick={() => handleAddTechnology(techInput)}
              >
                Agregar tecnologia
              </button>
            </div>
          ) : null}

          <span className="softsave-project-form__hint">
            Seleccionadas {selectedTechs.length} de 15 tecnologias permitidas.
          </span>
          {errors.technologies ? <span className="error-text">{errors.technologies}</span> : null}
        </div>

        <div className="softsave-project-form__field">
          <span className="softsave-project-form__label">
            {mode === 'edit' ? 'Imagen actual' : 'Imagen principal'}
          </span>

          {mode === 'edit' ? (
            <div className="softsave-project-form__image-current">
              <div className="softsave-project-form__image-thumb">
                {visiblePreview ? (
                  <img src={visiblePreview} alt="Imagen actual del proyecto" />
                ) : (
                  <Icon path={mdiImageOutline} size={1.2} />
                )}
              </div>

              <div className="softsave-project-form__image-meta">
                <strong>{formData.currentImageName || imageFile?.name || 'Sin imagen seleccionada'}</strong>
                <span>JPEG o PNG hasta 10MB</span>
              </div>

              <label className="softsave-project-form__mini-button">
                Cambiar
                <input type="file" accept="image/jpeg,image/png" onChange={handleImageSelection} />
              </label>

              <button
                type="button"
                className="softsave-project-form__mini-button softsave-project-form__mini-button--danger"
                onClick={handleRemoveImage}
              >
                <Icon path={mdiTrashCanOutline} size={0.74} />
                Eliminar
              </button>
            </div>
          ) : (
            <label className="softsave-project-form__upload-box">
              <input type="file" accept="image/jpeg,image/png" onChange={handleImageSelection} />
              <strong>Seleccionar imagen</strong>
              <span>(JPEG/PNG - max. 10MB)</span>
            </label>
          )}

          {mode === 'create' && imageFile ? (
            <div className="softsave-project-form__upload-preview">
              <div className="softsave-project-form__image-thumb">
                <img src={visiblePreview} alt="Vista previa del proyecto" />
              </div>
              <div className="softsave-project-form__image-meta">
                <strong>{imageFile.name}</strong>
                <span>{(imageFile.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            </div>
          ) : null}

          {imageError ? <span className="error-text">{imageError}</span> : null}
        </div>

        <div className="softsave-project-form__grid">
          <label className="softsave-project-form__field">
            <span className="softsave-project-form__label">Fecha inicio</span>
            <input
              type="date"
              className="softsave-input"
              value={formData.startDate}
              onChange={(event) => updateField('startDate', event.target.value)}
            />
            <span className="softsave-project-form__hint">{formatDateLabel(formData.startDate)}</span>
            {errors.startDate ? <span className="error-text">{errors.startDate}</span> : null}
          </label>

          <div className="softsave-project-form__field">
            <span className="softsave-project-form__label">Fecha fin</span>
            <input
              type="date"
              className="softsave-input"
              value={formData.endDate}
              disabled={formData.inProgress}
              onChange={(event) => updateField('endDate', event.target.value)}
            />
            <label className="softsave-project-form__checkbox">
              <input
                type="checkbox"
                checked={formData.inProgress}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setFormData((current) => ({
                    ...current,
                    inProgress: checked,
                    endDate: checked ? '' : current.endDate,
                  }));
                  setErrors((current) => ({
                    ...current,
                    endDate: '',
                  }));
                }}
              />
              En progreso
            </label>
            {errors.endDate ? <span className="error-text">{errors.endDate}</span> : null}
          </div>
        </div>

        <label className="softsave-project-form__field">
          <span className="softsave-project-form__label">URL demo</span>
          <input
            type="url"
            className="softsave-input"
            value={formData.demoUrl}
            placeholder="https://mi-demo.com/proyecto"
            onChange={(event) => updateField('demoUrl', event.target.value)}
          />
          {errors.demoUrl ? <span className="error-text">{errors.demoUrl}</span> : null}
        </label>

        <label className="softsave-project-form__field">
          <span className="softsave-project-form__label">URL repositorio</span>
          <input
            type="url"
            className="softsave-input"
            value={formData.repositoryUrl}
            placeholder="https://github.com/usuario/repositorio"
            onChange={(event) => updateField('repositoryUrl', event.target.value)}
          />
          {errors.repositoryUrl ? <span className="error-text">{errors.repositoryUrl}</span> : null}
        </label>

        <div className="softsave-project-form__field">
          <span className="softsave-project-form__label">Visibilidad</span>
          <div className="softsave-project-form__radios">
            <label className="softsave-project-form__radio">
              <input
                type="radio"
                name={`visibility-${mode}`}
                checked={formData.visibility === 'public'}
                onChange={() => updateField('visibility', 'public')}
              />
              Publico
            </label>
            <label className="softsave-project-form__radio">
              <input
                type="radio"
                name={`visibility-${mode}`}
                checked={formData.visibility === 'private'}
                onChange={() => updateField('visibility', 'private')}
              />
              Privado
            </label>
          </div>
        </div>

        {submitMessage ? (
          <div className="success-alert softsave-project-form__success">
            <Icon path={mdiCheckCircleOutline} size={0.9} />
            <span>{submitMessage}</span>
          </div>
        ) : null}

        <div className="softsave-project-form__footer">
          <button
            type="button"
            className="softsave-project-form__cancel"
            onClick={handleReset}
          >
            Cancelar
          </button>
          <button type="submit" className="softsave-button softsave-project-form__submit">
            {mode === 'create' ? 'Guardar proyecto' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </section>
  );
}

export default ProjectForm;
