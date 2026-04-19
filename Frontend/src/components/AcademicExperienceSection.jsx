import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Icon from '@mdi/react';
import { mdiClose, mdiPencilOutline, mdiPlus, mdiSchoolOutline } from '@mdi/js';
import useAuth from '../hooks/useAuth';
import { actualizarEstudio, crearEstudio } from '../services/authService';

const FORMULARIO_ESTUDIO_INICIAL = {
  id: null,
  academic_institution: '',
  degree: '',
  start_month: '',
  end_month: '',
  currentlyStudying: false,
};

function sanitizarTexto(valor) {
  return String(valor || '').replace(/\s+/g, ' ').trim();
}

function transformarMesAFecha(valorMes) {
  if (!valorMes) {
    return null;
  }

  return `${valorMes}-01`;
}

function transformarFechaAMes(valorFecha) {
  if (!valorFecha) {
    return '';
  }

  return String(valorFecha).slice(0, 7);
}

function ordenarEstudios(estudios) {
  return [...estudios].sort((a, b) => {
    const fechaA = a.end_date || a.start_date || '';
    const fechaB = b.end_date || b.start_date || '';

    if (a.end_date === null && b.end_date !== null) {
      return -1;
    }

    if (a.end_date !== null && b.end_date === null) {
      return 1;
    }

    return fechaB.localeCompare(fechaA);
  });
}

function normalizarEstudios(estudios) {
  if (!Array.isArray(estudios)) {
    return [];
  }

  return ordenarEstudios(
    estudios.map((estudio) => ({
      ...estudio,
      id: estudio.id,
      academic_institution: estudio.academic_institution || '',
      degree: estudio.degree || '',
      start_date: estudio.start_date ? String(estudio.start_date).slice(0, 10) : '',
      end_date: estudio.end_date ? String(estudio.end_date).slice(0, 10) : null,
    })),
  );
}

function formatearPeriodo(fechaInicio, fechaFin) {
  const formateador = new Intl.DateTimeFormat('es-ES', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const formatear = (valor) => {
    if (!valor) {
      return 'Presente';
    }

    const fecha = new Date(`${String(valor).slice(0, 10)}T00:00:00Z`);
    return formateador.format(fecha);
  };

  return `${formatear(fechaInicio)} - ${formatear(fechaFin)}`;
}

function construirFormularioEstudio(estudio) {
  return {
    id: estudio?.id || null,
    academic_institution: estudio?.academic_institution || '',
    degree: estudio?.degree || '',
    start_month: transformarFechaAMes(estudio?.start_date),
    end_month: transformarFechaAMes(estudio?.end_date),
    currentlyStudying: !estudio?.end_date,
  };
}

function AcademicExperienceSection({
  title = 'Experiencia Académica',
  subtitle = '',
  variant = 'default',
}) {
  const { user, refreshUser } = useAuth();
  const [estudios, setEstudios] = useState(() => normalizarEstudios(user?.studies));
  const [estaModalEstudioAbierto, setEstaModalEstudioAbierto] = useState(false);
  const [erroresEstudio, setErroresEstudio] = useState({});
  const [mensajeAcademicoError, setMensajeAcademicoError] = useState('');
  const [mensajeAcademicoExito, setMensajeAcademicoExito] = useState('');
  const [guardandoEstudio, setGuardandoEstudio] = useState(false);
  const [formularioEstudio, setFormularioEstudio] = useState(FORMULARIO_ESTUDIO_INICIAL);

  const tituloModalEstudio = formularioEstudio.id
    ? 'Editar Experiencia Académica'
    : 'Registrar Formación Académica';
  const esPortafolio = variant === 'portfolio';

  useEffect(() => {
    setEstudios(normalizarEstudios(user?.studies));
  }, [user?.studies]);

  useEffect(() => {
    if (!estaModalEstudioAbierto) {
      return undefined;
    }

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = overflowPrevio;
    };
  }, [estaModalEstudioAbierto]);

  const abrirModalCrearEstudio = () => {
    setFormularioEstudio(FORMULARIO_ESTUDIO_INICIAL);
    setErroresEstudio({});
    setMensajeAcademicoError('');
    setEstaModalEstudioAbierto(true);
  };

  const abrirModalEditarEstudio = (estudio) => {
    setFormularioEstudio(construirFormularioEstudio(estudio));
    setErroresEstudio({});
    setMensajeAcademicoError('');
    setEstaModalEstudioAbierto(true);
  };

  const cerrarModalEstudio = () => {
    setFormularioEstudio(FORMULARIO_ESTUDIO_INICIAL);
    setErroresEstudio({});
    setMensajeAcademicoError('');
    setEstaModalEstudioAbierto(false);
  };

  const manejarCambioEstudio = (evento) => {
    const { name, value, type, checked } = evento.target;

    setFormularioEstudio((estadoActual) => {
      if (type === 'checkbox') {
        return {
          ...estadoActual,
          currentlyStudying: checked,
          end_month: checked ? '' : estadoActual.end_month,
        };
      }

      return {
        ...estadoActual,
        [name]: value,
      };
    });

    setErroresEstudio((estadoActual) => ({
      ...estadoActual,
      [name]: '',
      start_month: '',
      end_month: '',
    }));

    setMensajeAcademicoError('');
  };

  const validarEstudio = () => {
    const nuevosErrores = {};
    const institucion = sanitizarTexto(formularioEstudio.academic_institution);
    const titulo = sanitizarTexto(formularioEstudio.degree);
    const hoy = new Date();
    const inicio = formularioEstudio.start_month ? new Date(`${formularioEstudio.start_month}-01T00:00:00Z`) : null;
    const fin = formularioEstudio.end_month ? new Date(`${formularioEstudio.end_month}-01T00:00:00Z`) : null;
    const mesActual = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1));

    if (!institucion) {
      nuevosErrores.academic_institution = 'La institución es obligatoria.';
    }

    if (!titulo) {
      nuevosErrores.degree = 'El título obtenido es obligatorio.';
    }

    if (!formularioEstudio.start_month) {
      nuevosErrores.start_month = 'La fecha de inicio es obligatoria.';
    } else if (inicio && inicio > mesActual) {
      nuevosErrores.start_month = 'La fecha de inicio no puede ser posterior a la fecha actual.';
    }

    if (!formularioEstudio.currentlyStudying && !formularioEstudio.end_month) {
      nuevosErrores.end_month = 'La fecha de fin es obligatoria.';
    } else if (!formularioEstudio.currentlyStudying && fin && fin > mesActual) {
      nuevosErrores.end_month = 'La fecha de fin no puede ser posterior a la fecha actual.';
    }

    if (inicio && fin && inicio > fin) {
      nuevosErrores.end_month = 'La fecha de inicio no puede ser posterior a la fecha de fin.';
    }

    setErroresEstudio(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const guardarEstudio = async (evento) => {
    evento.preventDefault();

    if (!validarEstudio()) {
      return;
    }

    const payload = {
      academic_institution: sanitizarTexto(formularioEstudio.academic_institution),
      degree: sanitizarTexto(formularioEstudio.degree),
      start_date: transformarMesAFecha(formularioEstudio.start_month),
      end_date: formularioEstudio.currentlyStudying ? null : transformarMesAFecha(formularioEstudio.end_month),
      achievements: null,
    };

    setGuardandoEstudio(true);
    setMensajeAcademicoError('');

    try {
      const respuesta = formularioEstudio.id
        ? await actualizarEstudio(formularioEstudio.id, payload)
        : await crearEstudio(payload);

      const estudioActualizado = normalizarEstudios([respuesta.data])[0];

      setEstudios((estadoActual) => {
        const sinDuplicados = estadoActual.filter((item) => item.id !== estudioActualizado.id);
        return ordenarEstudios([estudioActualizado, ...sinDuplicados]);
      });

      setMensajeAcademicoExito(
        formularioEstudio.id
          ? 'Información académica actualizada correctamente.'
          : 'Formación académica registrada correctamente.',
      );
      setEstaModalEstudioAbierto(false);
      setFormularioEstudio(FORMULARIO_ESTUDIO_INICIAL);
      await refreshUser();
    } catch {
      setMensajeAcademicoError('No se pudo guardar la información académica.');
    } finally {
      setGuardandoEstudio(false);
    }
  };

  return (
    <>
      <section className={esPortafolio ? 'softsave-portafolio-module-card' : 'softsave-profile__form-card'}>
        <div className={esPortafolio ? 'softsave-portafolio-module-card__header' : 'softsave-profile__section-head'}>
          <div>
            <div className={esPortafolio ? 'softsave-portafolio-module-card__title-wrap' : 'softsave-profile__title-with-icon'}>
              <Icon
                path={mdiSchoolOutline}
                size={esPortafolio ? 1 : 0.95}
                className={esPortafolio ? 'softsave-portafolio-module-card__icon' : 'softsave-profile__panel-icon'}
              />
              <h2 className={esPortafolio ? 'softsave-portafolio-module-card__title' : 'softsave-profile__form-title'}>
                {title}
              </h2>
            </div>
            {subtitle ? (
              <p className={esPortafolio ? 'softsave-portafolio-module-card__subtitle' : 'softsave-profile__form-subtitle'}>
                {subtitle}
              </p>
            ) : null}
          </div>

          <div className={esPortafolio ? 'softsave-portafolio-module-card__actions' : ''}>
            <button
              type="button"
              className={
                esPortafolio
                  ? 'softsave-portafolio-module-card__action softsave-portafolio-module-card__action--primary'
                  : 'softsave-button softsave-button--compact softsave-profile__section-button softsave-profile__section-button--icon'
              }
              onClick={abrirModalCrearEstudio}
              aria-label="Añadir formación académica"
            >
              {esPortafolio ? <Icon path={mdiPlus} size={0.85} /> : '+'}
            </button>
            {esPortafolio ? (
              <button
                type="button"
                className="softsave-portafolio-module-card__action"
                onClick={() => abrirModalEditarEstudio(estudios[0])}
                aria-label="Editar experiencia académica"
                disabled={estudios.length === 0}
              >
                <Icon path={mdiPencilOutline} size={0.85} />
              </button>
            ) : null}
          </div>
        </div>

        {mensajeAcademicoExito ? (
          <div className={`success-alert ${esPortafolio ? 'softsave-portafolio-module-card__alert' : 'softsave-profile__section-alert'}`} role="status">
            {mensajeAcademicoExito}
          </div>
        ) : null}

        {estudios.length === 0 ? (
          <p className={esPortafolio ? 'softsave-portafolio-module-card__empty' : 'softsave-profile__empty softsave-profile__academic-empty'}>
            Añade aquí tus logros y experiencias académicas
          </p>
        ) : (
          <div className={esPortafolio ? 'softsave-portafolio-study-list' : 'softsave-profile__study-list'}>
            {estudios.map((estudio) => (
              <article key={estudio.id} className={esPortafolio ? 'softsave-portafolio-study-card' : 'softsave-profile__study-card'}>
                <div className={esPortafolio ? 'softsave-portafolio-study-card__body' : 'softsave-profile__study-body'}>
                  <h3 className={esPortafolio ? 'softsave-portafolio-study-card__title' : 'softsave-profile__study-title'}>
                    {estudio.academic_institution}
                  </h3>
                  <p className={esPortafolio ? 'softsave-portafolio-study-card__degree' : 'softsave-profile__study-degree'}>
                    {estudio.degree}
                  </p>
                  <p className={esPortafolio ? 'softsave-portafolio-study-card__period' : 'softsave-profile__study-period'}>
                    {formatearPeriodo(estudio.start_date, estudio.end_date)}
                  </p>
                </div>

                <button
                  type="button"
                  className={esPortafolio ? 'softsave-portafolio-module-card__action' : 'softsave-profile__icon-button softsave-profile__icon-button--inline'}
                  aria-label={`Editar ${estudio.academic_institution}`}
                  onClick={() => abrirModalEditarEstudio(estudio)}
                >
                  <Icon path={mdiPencilOutline} size={0.85} />
                </button>
              </article>
            ))}
          </div>
        )}

        {mensajeAcademicoError ? (
          <span className="error-text softsave-profile__error-text" role="alert">
            {mensajeAcademicoError}
          </span>
        ) : null}
      </section>

      {estaModalEstudioAbierto ? (
        <div className="softsave-profile__modal-overlay" role="dialog" aria-modal="true">
          <div className="softsave-profile__modal">
            <header className="softsave-profile__modal-header">
              <div className="softsave-profile__modal-content">
                <h3 className="softsave-profile__modal-title">{tituloModalEstudio}</h3>
                <p className="softsave-profile__modal-text">
                  Completa los datos de la institución, el título y el periodo académico.
                </p>
              </div>

              <button
                type="button"
                className="softsave-profile__icon-button"
                onClick={cerrarModalEstudio}
                aria-label="Cerrar modal"
              >
                <Icon path={mdiClose} size={1} />
              </button>
            </header>

            <form className="softsave-profile__study-form" onSubmit={guardarEstudio}>
              <div className="softsave-profile__study-grid">
                <label className="softsave-profile__field">
                  <span className="softsave-profile__label">Institución</span>
                  <input
                    type="text"
                    name="academic_institution"
                    value={formularioEstudio.academic_institution}
                    onChange={manejarCambioEstudio}
                    className="softsave-input softsave-profile__input"
                    placeholder="Ej. Universidad Mayor de San Simón"
                  />
                  {erroresEstudio.academic_institution ? (
                    <span className="error-text softsave-profile__error-text" role="alert">
                      {erroresEstudio.academic_institution}
                    </span>
                  ) : null}
                </label>

                <label className="softsave-profile__field">
                  <span className="softsave-profile__label">Título Obtenido</span>
                  <input
                    type="text"
                    name="degree"
                    value={formularioEstudio.degree}
                    onChange={manejarCambioEstudio}
                    className="softsave-input softsave-profile__input"
                    placeholder="Ej. Ingeniería de Sistemas"
                  />
                  {erroresEstudio.degree ? (
                    <span className="error-text softsave-profile__error-text" role="alert">
                      {erroresEstudio.degree}
                    </span>
                  ) : null}
                </label>

                <label className="softsave-profile__field">
                  <span className="softsave-profile__label">Fecha de Inicio (Mes/Año)</span>
                  <input
                    type="month"
                    name="start_month"
                    value={formularioEstudio.start_month}
                    onChange={manejarCambioEstudio}
                    className="softsave-input softsave-profile__input"
                    max={new Date().toISOString().slice(0, 7)}
                  />
                  {erroresEstudio.start_month ? (
                    <span className="error-text softsave-profile__error-text" role="alert">
                      {erroresEstudio.start_month}
                    </span>
                  ) : null}
                </label>

                <label className="softsave-profile__field">
                  <span className="softsave-profile__label">Fecha de Fin (Mes/Año)</span>
                  <input
                    type="month"
                    name="end_month"
                    value={formularioEstudio.currentlyStudying ? '' : formularioEstudio.end_month}
                    onChange={manejarCambioEstudio}
                    className="softsave-input softsave-profile__input"
                    disabled={formularioEstudio.currentlyStudying}
                  />
                  {formularioEstudio.currentlyStudying ? (
                    <span className="softsave-profile__help">Presente</span>
                  ) : null}
                  {erroresEstudio.end_month ? (
                    <span className="error-text softsave-profile__error-text" role="alert">
                      {erroresEstudio.end_month}
                    </span>
                  ) : null}
                </label>
              </div>

              <label className="softsave-profile__checkbox">
                <input
                  type="checkbox"
                  name="currentlyStudying"
                  checked={formularioEstudio.currentlyStudying}
                  onChange={manejarCambioEstudio}
                />
                <span>Actualmente cursando</span>
              </label>

              {mensajeAcademicoError ? (
                <span className="error-text softsave-profile__error-text" role="alert">
                  {mensajeAcademicoError}
                </span>
              ) : null}

              <div className="softsave-profile__modal-actions">
                <button
                  type="button"
                  className="softsave-profile__secondary-button softsave-profile__secondary-button--modal"
                  onClick={cerrarModalEstudio}
                >
                  Cancelar
                </button>
                <button type="submit" className="softsave-button softsave-button--compact" disabled={guardandoEstudio}>
                  {guardandoEstudio ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

AcademicExperienceSection.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'portfolio']),
};

export default AcademicExperienceSection;
