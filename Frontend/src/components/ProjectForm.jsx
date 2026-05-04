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
import { actualizarProyecto, crearProyecto, obtenerTecnologias } from '../services/authService';
import useFeedback from '../hooks/useFeedback';

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

function toTechnologyOption(technology) {
  if (technology && typeof technology === 'object') {
    const id = technology.id ?? null;
    const name = technology.name ?? '';
    return id && name ? { id, name } : null;
  }

  return null;
}

function resolveTechnologyOption(technology, suggestions) {
  const directOption = toTechnologyOption(technology);
  if (directOption) {
    return directOption;
  }

  const name = getTechnologyName(technology).trim().toLowerCase();
  if (!name) {
    return null;
  }

  const source = Array.isArray(suggestions) ? suggestions : [];
  const match = source.find((item) => {
    const option = toTechnologyOption(item);
    return option ? option.name.trim().toLowerCase() === name : false;
  });

  return match ? toTechnologyOption(match) : null;
}

function getTechnologyName(technology) {
  if (technology && typeof technology === 'object') {
    return technology.name ?? '';
  }

  return typeof technology === 'string' ? technology : '';
}

function normalizeSelectedTechnologies(technologies) {
  if (!Array.isArray(technologies)) {
    return [];
  }

  return technologies
    .map((technology) => {
      if (technology && typeof technology === 'object' && technology.id && technology.name) {
        return {
          id: technology.id,
          name: technology.name,
        };
      }

      if (typeof technology === 'string' && technology.trim()) {
        return null;
      }

      return null;
    })
    .filter(Boolean);
}

function createInitialFormState(initialData) {
  return {
    title: initialData?.title || '',
    description: initialData?.description || '',
    technologies: normalizeSelectedTechnologies(initialData?.technologies),
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

function mapProjectToFormState(project) {
  if (!project) {
    return createInitialFormState(null);
  }

  return {
    title: project.title || '',
    description: project.description || '',
    technologies: normalizeSelectedTechnologies(project.technologies),
    startDate: project.start_date ? String(project.start_date).slice(0, 10) : '',
    endDate: project.end_date ? String(project.end_date).slice(0, 10) : '',
    inProgress: Boolean(project.is_in_progress),
    demoUrl: project.demo_url || '',
    repositoryUrl: project.repo_url || '',
    visibility: project.is_public ? 'public' : 'private',
    currentImageName: project.image_path ? String(project.image_path).split('/').pop() : '',
    currentImagePreview: project.image_url || project.image_path || '',
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

function normalizeTechnologyIds(technologies) {
  if (!Array.isArray(technologies)) {
    return [];
  }

  return technologies
    .map((technology) => {
      if (technology && typeof technology === 'object') {
        const rawId = technology.id ?? null;
        const numericId = Number(rawId);
        return Number.isInteger(numericId) && numericId > 0 ? numericId : null;
      }
      return null;
    })
    .filter((technology) => technology !== null && technology !== undefined && technology !== '');
}

function buildFormData(formData, imageFile) {
  const payload = new FormData();
  const technologyIds = normalizeTechnologyIds(formData.technologies);
  const isInProgress = Boolean(formData.inProgress);
  const isPublic = formData.visibility !== 'private';

  payload.append('title', formData.title.trim());
  payload.append('description', formData.description.trim());

  technologyIds.forEach((technologyId) => {
    payload.append('technologies[]', technologyId);
  });

  payload.append('is_in_progress', isInProgress ? '1' : '0');
  payload.append('is_public', isPublic ? '1' : '0');

  if (formData.startDate) {
    payload.append('start_date', formData.startDate);
  }

  if (!isInProgress && formData.endDate) {
    payload.append('end_date', formData.endDate);
  }

  if (formData.demoUrl) {
    payload.append('demo_url', formData.demoUrl.trim());
  }

  if (formData.repositoryUrl) {
    payload.append('repo_url', formData.repositoryUrl.trim());
  }

  if (imageFile) {
    payload.append('image', imageFile);
  }

  return payload;
}

function ProjectForm({
  mode,
  initialData,
  onSwitchMode = () => {},
  onProjectSaved = () => {},
  project = null,
  showModeActions = true,
  onCancel = () => {},
  showHeader = true,
}) {
  const [formData, setFormData] = useState(() => (
    mode === 'edit' && project ? mapProjectToFormState(project) : createInitialFormState(initialData)
  ));
  const [errors, setErrors] = useState({});
  const [submitMessage, setSubmitMessage] = useState('');
  const [imageError, setImageError] = useState('');
  const [techInput, setTechInput] = useState('');
  const [showTechInput, setShowTechInput] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    mode === 'edit' && project ? (project.image_url || project.image_path || '') : (initialData?.currentImagePreview || ''),
  );
  const [imageRemoved, setImageRemoved] = useState(false);
  const [technologySuggestions, setTechnologySuggestions] = useState(TECHNOLOGY_SUGGESTIONS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  const { showFeedback } = useFeedback();

  useEffect(() => {
    const nextState = mode === 'edit' && project
      ? mapProjectToFormState(project)
      : createInitialFormState(initialData);

    setFormData(nextState);
    setErrors({});
    setSubmitMessage('');
    setImageError('');
    setTechInput('');
    setShowTechInput(false);
    setImageFile(null);
    setImagePreview(nextState.currentImagePreview || '');
    setImageRemoved(false);
    setIsDirty(false);
  }, [initialData, mode, project]);

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

  useEffect(() => {
    let isMounted = true;

    const loadTechnologies = async () => {
      try {
        const response = await obtenerTecnologias();
        const technologies = Array.isArray(response?.data) ? response.data : [];
        const normalizedSuggestions = technologies
          .map((technology) => ({
            id: technology?.id,
            name: technology?.name,
          }))
          .filter((technology) => technology.id && technology.name);

        if (isMounted && normalizedSuggestions.length > 0) {
          setTechnologySuggestions(normalizedSuggestions);
        }
      } catch {
        if (isMounted) {
          setTechnologySuggestions(TECHNOLOGY_SUGGESTIONS);
        }
      }
    };

    loadTechnologies();

    return () => {
      isMounted = false;
    };
  }, []);

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
    setIsDirty(true);
  };

  const handleAddTechnology = (technology) => {
    const normalizedTechnology = resolveTechnologyOption(technology, technologySuggestions);

    if (!normalizedTechnology) {
      setErrors((current) => ({
        ...current,
        technologies: 'Selecciona tecnologias del catalogo disponible.',
      }));
      return;
    }

    if (selectedTechs.some((item) => item.id === normalizedTechnology.id)) {
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
      selectedTechs.filter((technology) => technology.id !== technologyToRemove.id),
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
    setIsDirty(true);
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
    setIsDirty(true);
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const payload = buildFormData(formData, imageFile);

      if (mode === 'create') {
        const response = await crearProyecto(payload);
        const createdProject = response?.data?.project;

        setSubmitMessage('Proyecto guardado exitosamente.');
        showFeedback('Proyecto guardado exitosamente.');
        onProjectSaved(createdProject);
        setIsDirty(false);
      } else {
        if (!project?.id) {
          showFeedback('No se encontro el proyecto a editar.', 'error');
          return;
        }

        const response = await actualizarProyecto(project.id, payload);
        const updatedProject = response?.data?.project;

        setSubmitMessage('Cambios guardados exitosamente');
        showFeedback('Cambios guardados exitosamente');
        onProjectSaved(updatedProject);
        setIsDirty(false);
      }
    } catch (requestError) {
      const status = requestError?.response?.status;
      const backendErrors = requestError?.response?.data?.errors || {};
      const backendMessage = requestError?.response?.data?.message;

      if (status === 422) {
        const nextErrors = {};

        if (backendErrors.title?.[0]) {
          nextErrors.title = backendErrors.title[0];
        }

        if (backendErrors.description?.[0]) {
          nextErrors.description = backendErrors.description[0];
        }

        if (backendErrors.technologies?.[0] || backendErrors['technologies.0']?.[0]) {
          nextErrors.technologies = backendErrors.technologies?.[0] || backendErrors['technologies.0'][0];
        }

        if (backendErrors.image?.[0]) {
          nextErrors.image = backendErrors.image[0];
        }

        setErrors((current) => ({
          ...current,
          ...nextErrors,
        }));
        setImageError(nextErrors.image || '');
        showFeedback('Revisa los campos marcados e intenta de nuevo.', 'error');
      } else {
        showFeedback(
          backendMessage || (
            mode === 'create'
              ? 'No se pudo guardar el proyecto. Intenta nuevamente.'
              : 'No se pudo actualizar el proyecto. Intenta nuevamente.'
          ),
          'error',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    const resetState = mode === 'edit' && project
      ? mapProjectToFormState(project)
      : createInitialFormState(initialData);

    setFormData(resetState);
    setErrors({});
    setSubmitMessage('');
    setImageError('');
    setTechInput('');
    setShowTechInput(false);
    setImageFile(null);
    setImagePreview(resetState.currentImagePreview || '');
    setImageRemoved(false);
    setIsDirty(false);
  };

  const openConfirmModal = ({ title, message, confirmText, onConfirm }) => {
    setConfirmState({
      title,
      message,
      confirmText,
      onConfirm,
    });
  };

  const closeConfirmModal = () => {
    setConfirmState(null);
  };

  const requestDiscardChanges = (onConfirm) => {
    if (!isDirty) {
      onConfirm();
      return;
    }

    openConfirmModal({
      title: 'Descartar cambios',
      message: 'Tienes cambios sin guardar. Si continuas, perderas las modificaciones pendientes.',
      confirmText: 'Descartar',
      onConfirm,
    });
  };

  const runReset = () => {
    handleReset();
  };

  const handleSwitchMode = (nextMode) => {
    if (!showModeActions) {
      return;
    }

    if (nextMode === mode) {
      return;
    }

    requestDiscardChanges(() => {
      onSwitchMode(nextMode);
    });
  };

  return (
    <section className="softsave-projects-card">
      {showHeader ? (
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

          {showModeActions ? (
            <div className="softsave-projects-card__actions">
              <button
                type="button"
                className={`softsave-projects-card__icon-button ${mode === 'create' ? 'is-active' : ''}`}
                onClick={() => handleSwitchMode('create')}
                aria-label="Abrir formulario de nuevo proyecto"
              >
                <Icon path={mdiPlus} size={0.9} />
              </button>
              <button
                type="button"
                className={`softsave-projects-card__icon-button softsave-projects-card__icon-button--ghost ${mode === 'edit' ? 'is-active' : ''}`}
                onClick={() => handleSwitchMode('edit')}
                aria-label="Abrir formulario de edicion"
              >
                <Icon path={mdiPencilOutline} size={0.9} />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

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
              <span key={technology.id} className="softsave-project-form__chip softsave-project-form__chip--selected">
                {getTechnologyName(technology)}
                <button
                  type="button"
                  className="softsave-project-form__chip-remove"
                  aria-label={`Eliminar ${getTechnologyName(technology)}`}
                  onClick={() => handleRemoveTechnology(technology)}
                >
                  <Icon path={mdiClose} size={0.72} />
                </button>
              </span>
            ))}

            {technologySuggestions.filter((technology) => {
              const option = toTechnologyOption(technology);
              if (option) {
                return !selectedTechs.some((selected) => selected.id === option.id);
              }

              if (typeof technology === 'string') {
                return !selectedTechs.some((selected) => selected.name === technology);
              }

              return false;
            })
              .slice(0, 5)
              .map((technology) => (
                <button
                  key={typeof technology === 'object' ? technology.id : technology}
                  type="button"
                  className="softsave-project-form__chip"
                  onClick={() => handleAddTechnology(technology)}
                >
                  {typeof technology === 'object' ? technology.name : technology}
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
                <span>{imageFile ? formatFileSize(imageFile.size) : 'JPEG o PNG hasta 10MB'}</span>
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
                <span>{formatFileSize(imageFile.size)}</span>
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
            <span className="softsave-project-form__hint">DD/MM/AAAA</span>
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
            <span className="softsave-project-form__hint">DD/MM/AAAA</span>
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
                onChange={() => {
                  if (formData.visibility === 'public') {
                    openConfirmModal({
                      title: 'Cambiar visibilidad',
                      message: 'Al pasar a privado, este proyecto dejara de verse en tu perfil publico.',
                      confirmText: 'Cambiar a privado',
                      onConfirm: () => updateField('visibility', 'private'),
                    });
                    return;
                  }

                  updateField('visibility', 'private');
                }}
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
            onClick={() => requestDiscardChanges(() => {
              runReset();
              onCancel();
            })}
            disabled={isSubmitting}
          >
            {mode === 'edit' ? 'Cerrar edicion' : 'Cancelar'}
          </button>
          <button type="submit" className="softsave-button softsave-project-form__submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : (mode === 'create' ? 'Guardar proyecto' : 'Guardar cambios')}
          </button>
        </div>
      </form>

      {confirmState ? (
        <div
          className="softsave-profile__modal-overlay softsave-profile__modal-overlay--centered"
          role="dialog"
          aria-modal="true"
          onClick={closeConfirmModal}
        >
          <div className="softsave-profile__modal softsave-profile__modal--confirm" onClick={(event) => event.stopPropagation()}>
            <header className="softsave-profile__modal-header">
              <div className="softsave-profile__modal-content">
                <h3 className="softsave-profile__modal-title">{confirmState.title}</h3>
                <p className="softsave-profile__modal-text">{confirmState.message}</p>
              </div>
            </header>
            <div className="softsave-profile__modal-actions">
              <button
                type="button"
                className="softsave-profile__secondary-button softsave-profile__secondary-button--modal"
                onClick={closeConfirmModal}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="softsave-button softsave-button--danger"
                onClick={() => {
                  const action = confirmState.onConfirm;
                  closeConfirmModal();
                  if (typeof action === 'function') {
                    action();
                  }
                }}
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function formatFileSize(sizeInBytes) {
  if (!sizeInBytes) {
    return '';
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default ProjectForm;
