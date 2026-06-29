import { useEffect, useId, useMemo, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Icon from '@mdi/react';
import PropTypes from 'prop-types';
import CatalogSearchInput from './CatalogSearchInput';
import {
  mdiCheckCircleOutline,
  mdiClose,
  mdiFileDocumentOutline,
  mdiFormatFontSizeDecrease,
  mdiFormatFontSizeIncrease,
  mdiImageOutline,
  mdiPencilOutline,
  mdiPlus,
  mdiTrashCanOutline,
} from '@mdi/js';
import { actualizarProyecto, crearProyecto, obtenerTecnologias } from '../services/authService';
import useFeedback from '../hooks/useFeedback';

const DESCRIPTION_MIN_LENGTH = 20;
const DESCRIPTION_MAX_LENGTH = 500;

function normalizeTechnologyName(technology) {
  if (technology && typeof technology === 'object') {
    return String(technology.name ?? '').trim();
  }

  return typeof technology === 'string' ? technology.trim() : '';
}

function normalizeTechnologyId(technology) {
  if (technology && typeof technology === 'object') {
    const numericId = Number(technology.id ?? null);
    return Number.isInteger(numericId) && numericId > 0 ? numericId : null;
  }

  const numericId = Number(technology);
  return Number.isInteger(numericId) && numericId > 0 ? numericId : null;
}

function toTechnologyOption(technology) {
  const id = normalizeTechnologyId(technology);
  const name = normalizeTechnologyName(technology);

  return id && name ? { id, name } : null;
}

function getTechnologyName(technology, suggestions = []) {
  const id = normalizeTechnologyId(technology);
  const source = Array.isArray(suggestions) ? suggestions : [];

  if (id) {
    const match = source.find((item) => normalizeTechnologyId(item) === id);
    if (match) {
      return normalizeTechnologyName(match);
    }
  }

  return normalizeTechnologyName(technology);
}

function normalizeSelectedTechnologies(technologies) {
  if (!Array.isArray(technologies)) {
    return [];
  }

  return technologies
    .map((technology) => {
      const id = normalizeTechnologyId(technology);
      if (!id) {
        return null;
      }

      return {
        id,
        name: normalizeTechnologyName(technology),
      };
    })
    .filter(Boolean);
}

function getDescriptionText(description) {
  if (!description) {
    return '';
  }

  const container = document.createElement('div');
  container.innerHTML = String(description);

  return (container.innerText || container.textContent || '')
    .replace(/\u00a0/g, ' ')
    .trim();
}

function getDescriptionLength(description) {
  return getDescriptionText(description).length;
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
    currentImageName: project.image_original_name || (project.image_path ? String(project.image_path).split('/').pop() : ''),
    currentImagePreview: resolveProjectImageUrl(project.image_url || project.image_path || ''),
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

function normalizeTechnologyValues(technologies) {
  if (!Array.isArray(technologies)) {
    return [];
  }

  return technologies
    .map((technology) => {
      const id = normalizeTechnologyId(technology);
      return id ? String(id) : null;
    })
    .filter(Boolean);
}

function resolveProjectImageUrl(rawUrl) {
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

function buildFormData(formData, imageFile) {
  const payload = new FormData();
  const technologies = normalizeTechnologyValues(formData.technologies);
  const isInProgress = Boolean(formData.inProgress);
  const isPublic = formData.visibility !== 'private';

  payload.append('title', formData.title.trim());
  payload.append('description', formData.description.trim());

  technologies.forEach((technology) => {
    payload.append('technologies[]', technology);
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
  useModalLayout = false,
}) {
  const [formData, setFormData] = useState(() => (
    mode === 'edit' && project ? mapProjectToFormState(project) : createInitialFormState(initialData)
  ));
  const [errors, setErrors] = useState({});
  const [submitMessage, setSubmitMessage] = useState('');
  const [imageError, setImageError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    mode === 'edit' && project ? resolveProjectImageUrl(project.image_url || project.image_path || '') : (initialData?.currentImagePreview || ''),
  );
  const [imageRemoved, setImageRemoved] = useState(false);
  const [technologySuggestions, setTechnologySuggestions] = useState([]);
  const [technologySearch, setTechnologySearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editorToolbarId = useId().replace(/:/g, '');
  const quillModules = useMemo(() => ({
    toolbar: {
      container: `#${editorToolbarId}`,
      handlers: {
        sizeDecrease() {
          const sizes = ['small', false, 'large', 'huge'];
          const currentSize = this.quill.getFormat().size ?? false;
          const currentIndex = sizes.findIndex((size) => size === currentSize);
          const nextIndex = currentIndex <= 0 ? 0 : currentIndex - 1;
          this.quill.format('size', sizes[nextIndex] || false);
        },
        sizeIncrease() {
          const sizes = ['small', false, 'large', 'huge'];
          const currentSize = this.quill.getFormat().size ?? false;
          const currentIndex = sizes.findIndex((size) => size === currentSize);
          const nextIndex = currentIndex < 0 ? 2 : Math.min(currentIndex + 1, sizes.length - 1);
          this.quill.format('size', sizes[nextIndex] || false);
        },
      },
    },
  }), [editorToolbarId]);
  const quillFormats = [
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'script',
  ];
  const [isDirty, setIsDirty] = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  const { showFeedback } = useFeedback();
  const fechaActualIso = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);
  const fechaInicioMax = fechaActualIso;
  const fechaFinMax = fechaActualIso;
  const fechaFinMin = useMemo(() => (
    formData.startDate && formData.startDate <= fechaActualIso ? formData.startDate : fechaActualIso
  ), [formData.startDate, fechaActualIso]);

  useEffect(() => {
    const nextState = mode === 'edit' && project
      ? mapProjectToFormState(project)
      : createInitialFormState(initialData);

    setFormData(nextState);
    setErrors({});
    setSubmitMessage('');
    setImageError('');
    setImageFile(null);
    setImagePreview(nextState.currentImagePreview || '');
    setImageRemoved(false);
    setIsDirty(false);
    setTechnologySearch('');
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
            id: normalizeTechnologyId(technology),
            name: normalizeTechnologyName(technology),
          }))
          .filter((technology) => technology.id && technology.name);

        if (isMounted && normalizedSuggestions.length > 0) {
          setTechnologySuggestions(normalizedSuggestions);
        }
      } catch {
        if (isMounted) {
          setTechnologySuggestions([]);
        }
      }
    };

    loadTechnologies();

    return () => {
      isMounted = false;
    };
  }, []);

  const cardTitle = mode === 'create' ? 'Nuevo proyecto' : formData.title || 'Proyecto personal';
  const selectedTechs = formData.technologies;
  const availableTechnologySuggestions = useMemo(() => (
    technologySuggestions.filter((technology) => (
      !selectedTechs.some((selected) => Number(selected.id) === Number(technology.id))
    ))
  ), [selectedTechs, technologySuggestions]);

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

  const handleDescriptionChange = (value, editor) => {
    const plainText = editor?.getText ? editor.getText().trim() : getDescriptionText(value);

    if (plainText.length > DESCRIPTION_MAX_LENGTH) {
      setErrors((current) => ({
        ...current,
        description: `La descripcion debe tener entre ${DESCRIPTION_MIN_LENGTH} y ${DESCRIPTION_MAX_LENGTH} caracteres.`,
      }));
      return;
    }

    updateField('description', value);
  };

  const handleAddTechnology = (technology) => {
    const normalizedTechnology = toTechnologyOption(technology);

    if (!normalizedTechnology) {
      setErrors((current) => ({
        ...current,
        technologies: 'Selecciona una tecnologia valida del catalogo.',
      }));
      return;
    }

    if (selectedTechs.some((item) => (
      Number(item.id) === Number(normalizedTechnology.id)
    ))) {
      setErrors((current) => ({
        ...current,
        technologies: 'Esa tecnologia ya fue agregada.',
      }));
      setTechnologySearch('');
      return;
    }

    if (selectedTechs.length >= 15) {
      setErrors((current) => ({
        ...current,
        technologies: 'Puedes seleccionar un maximo de 15 tecnologias.',
      }));
      setTechnologySearch('');
      return;
    }

    updateField('technologies', [...selectedTechs, normalizedTechnology]);
    setTechnologySearch('');
  };

  const handleRemoveTechnology = (technologyToRemove) => {
    updateField(
      'technologies',
      selectedTechs.filter((technology) => {
        return Number(technology.id) !== Number(technologyToRemove.id);
      }),
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
    const trimmedDescription = getDescriptionText(formData.description);

    if (trimmedTitle.length < 5 || trimmedTitle.length > 100) {
      nextErrors.title = 'El titulo debe tener entre 5 y 100 caracteres.';
    }

    if (trimmedDescription.length < DESCRIPTION_MIN_LENGTH || trimmedDescription.length > DESCRIPTION_MAX_LENGTH) {
      nextErrors.description = `La descripcion debe tener entre ${DESCRIPTION_MIN_LENGTH} y ${DESCRIPTION_MAX_LENGTH} caracteres.`;
    }

    if (selectedTechs.length < 1 || selectedTechs.length > 15) {
      nextErrors.technologies = 'Debes seleccionar entre 1 y 15 tecnologias.';
    }

    if (!formData.startDate) {
      nextErrors.startDate = 'La fecha de inicio es obligatoria.';
    } else if (formData.startDate > fechaActualIso) {
      nextErrors.startDate = 'La fecha de inicio no puede ser posterior a la fecha actual.';
    }

    if (!formData.inProgress && !formData.endDate) {
      nextErrors.endDate = 'La fecha de fin es obligatoria.';
    } else if (!formData.inProgress && formData.endDate > fechaActualIso) {
      nextErrors.endDate = 'La fecha de fin no puede ser posterior a la fecha actual.';
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      nextErrors.endDate = 'La fecha de inicio no puede ser mayor a la fecha fin.';
    }

    if (formData.demoUrl && !isValidHttpUrl(formData.demoUrl)) {
      nextErrors.demoUrl = 'Ingresa una URL demo valida con HTTP o HTTPS.';
    }

    if (formData.repositoryUrl && !isValidHttpUrl(formData.repositoryUrl)) {
      nextErrors.repositoryUrl = 'Ingresa una URL de repositorio valida con HTTP o HTTPS.';
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
        setTechnologySearch('');
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
        setTechnologySearch('');
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
        if (backendErrors.start_date?.[0]) {
          nextErrors.startDate = backendErrors.start_date[0];
        }
        if (backendErrors.end_date?.[0]) {
          nextErrors.endDate = backendErrors.end_date[0];
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
    setImageFile(null);
    setImagePreview(resetState.currentImagePreview || '');
    setImageRemoved(false);
    setIsDirty(false);
    setTechnologySearch('');
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
    <section className={`softsave-projects-card ${useModalLayout ? 'softsave-projects-card--modal' : ''}`}>
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
          <span className="softsave-project-form__label">
            {useModalLayout ? 'Nombre del proyecto *' : 'Titulo del proyecto *'}
          </span>
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

        <div className="softsave-project-form__field">
          <span className="softsave-project-form__label">
            {useModalLayout ? 'Descripcion detallada *' : 'Descripcion *'}
          </span>
          <div id={editorToolbarId} className="ql-toolbar ql-snow softsave-project-form__toolbar">
            <span className="ql-formats">
              <button type="button" className="ql-bold" aria-label="Negrita" />
              <button type="button" className="ql-italic" aria-label="Cursiva" />
              <button type="button" className="ql-underline" aria-label="Subrayado" />
              <button type="button" className="ql-strike" aria-label="Tachado" />
            </span>
            <span className="ql-formats">
              <button type="button" className="ql-list" value="ordered" aria-label="Lista ordenada" />
              <button type="button" className="ql-list" value="bullet" aria-label="Lista con viñetas" />
            </span>
            <span className="ql-formats">
              <button type="button" className="ql-script" value="sub" aria-label="Subindice" />
              <button type="button" className="ql-script" value="super" aria-label="Superindice" />
            </span>
            <span className="ql-formats">
              <button type="button" className="ql-sizeDecrease" aria-label="Reducir tamano de texto">
                <Icon path={mdiFormatFontSizeDecrease} size={0.78} />
              </button>
              <button type="button" className="ql-sizeIncrease" aria-label="Aumentar tamano de texto">
                <Icon path={mdiFormatFontSizeIncrease} size={0.78} />
              </button>
            </span>
          </div>
          <ReactQuill
            theme="snow"
            value={formData.description}
            onChange={handleDescriptionChange}
            modules={quillModules}
            formats={quillFormats}
            className="softsave-project-form__textarea softsave-project-form__textarea--compact"
            placeholder="Describe tu proyecto... (min. 20, max. 500 caracteres visibles)"
          />
          <span className="softsave-project-form__hint">
            {getDescriptionLength(formData.description)}/500
          </span>
          {errors.description ? <span className="error-text">{errors.description}</span> : null}
        </div>

        <div className="softsave-project-form__field">
          <span className="softsave-project-form__label">Tecnologias utilizadas *</span>
          <CatalogSearchInput
            label="Buscar tecnología"
            catalog={availableTechnologySuggestions}
            value={technologySearch}
            onChange={setTechnologySearch}
            onSelect={(technology) => handleAddTechnology(technology)}
            placeholder="Escribe para buscar en el catálogo..."
            helperText="Solo puedes seleccionar tecnologías del catálogo."
            emptyText="No hay coincidencias en el catálogo de tecnologías."
            hideExactMatch={false}
            hideLabel
          />
          <div className="softsave-project-form__chips">
            {selectedTechs.map((technology) => (
              <span
                key={technology.id}
                className="softsave-project-form__chip softsave-project-form__chip--selected"
              >
                {getTechnologyName(technology, technologySuggestions)}
                <button
                  type="button"
                  className="softsave-project-form__chip-remove"
                  aria-label={`Eliminar ${getTechnologyName(technology, technologySuggestions)}`}
                  onClick={() => handleRemoveTechnology(technology)}
                >
                  <Icon path={mdiClose} size={0.7} />
                </button>
              </span>
            ))}
          </div>

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
            <span className="softsave-project-form__label">Fecha inicio *</span>
            <input
              type="date"
              className="softsave-input"
              value={formData.startDate}
              max={fechaInicioMax}
              onChange={(event) => updateField('startDate', event.target.value)}
            />
            {!useModalLayout ? <span className="softsave-project-form__hint">DD/MM/AAAA</span> : null}
            {errors.startDate ? <span className="error-text">{errors.startDate}</span> : null}
          </label>

          <div className="softsave-project-form__field">
            <div className="softsave-project-form__end-header">
              <span className="softsave-project-form__label">Fecha fin *</span>
              <label className="softsave-project-form__checkbox softsave-project-form__checkbox--project-end">
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
            </div>
            {formData.inProgress ? (
              <input
                type="text"
                className="softsave-input"
                value="Presente"
                readOnly
                aria-label="Estado de fecha fin"
              />
            ) : (
              <input
                type="date"
                className="softsave-input"
                value={formData.endDate}
                min={fechaFinMin}
                max={fechaFinMax}
                onChange={(event) => updateField('endDate', event.target.value)}
              />
            )}
            {!useModalLayout ? <span className="softsave-project-form__hint">DD/MM/AAAA</span> : null}
            {errors.endDate ? <span className="error-text">{errors.endDate}</span> : null}
          </div>
        </div>

        <div className={`softsave-project-form__url-grid ${useModalLayout ? 'is-modal' : ''}`}>
          <label className="softsave-project-form__field">
            <span className="softsave-project-form__label">URL demo</span>
            <input
              type="url"
              className="softsave-input"
              value={formData.demoUrl}
              maxLength={2048}
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
              maxLength={2048}
              placeholder="https://github.com/usuario/repositorio"
              onChange={(event) => updateField('repositoryUrl', event.target.value)}
            />
            {errors.repositoryUrl ? <span className="error-text">{errors.repositoryUrl}</span> : null}
          </label>
        </div>

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

ProjectForm.propTypes = {
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  initialData: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    technologies: PropTypes.array,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    inProgress: PropTypes.bool,
    demoUrl: PropTypes.string,
    repositoryUrl: PropTypes.string,
    visibility: PropTypes.oneOf(['public', 'private']),
    currentImageName: PropTypes.string,
    currentImagePreview: PropTypes.string,
  }),
  onSwitchMode: PropTypes.func,
  onProjectSaved: PropTypes.func,
  project: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    description: PropTypes.string,
    technologies: PropTypes.array,
    start_date: PropTypes.string,
    end_date: PropTypes.string,
    is_in_progress: PropTypes.bool,
    demo_url: PropTypes.string,
    repo_url: PropTypes.string,
    is_public: PropTypes.bool,
    image_path: PropTypes.string,
    image_original_name: PropTypes.string,
    image_url: PropTypes.string,
  }),
  showModeActions: PropTypes.bool,
  onCancel: PropTypes.func,
  showHeader: PropTypes.bool,
  useModalLayout: PropTypes.bool,
};

export default ProjectForm;
