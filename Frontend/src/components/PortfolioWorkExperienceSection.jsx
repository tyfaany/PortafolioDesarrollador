import { useEffect, useMemo, useState } from 'react';
import Icon from '@mdi/react';
import {
  mdiBriefcaseOutline,
  mdiClose,
  mdiContentSaveOutline,
  mdiPencilOutline,
  mdiPlus,
} from '@mdi/js';
import useAuth from '../hooks/useAuth';
import { actualizarJob, crearJob, obtenerJobs } from '../services/authService';

const FORMULARIO_LABORAL_INICIAL = {
  id: null,
  company_name: '',
  position: '',
  start_month: '01',
  start_year: String(new Date().getFullYear()),
  end_month: '12',
  end_year: String(new Date().getFullYear()),
  is_current_job: false,
  description: '',
};

const MESES = [
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

function sanitizarTexto(valor) {
  return String(valor || '').replace(/\s+/g, ' ').trim();
}

function obtenerAniosDisponibles() {
  const anioActual = new Date().getFullYear();
  return Array.from({ length: 41 }, (_, indice) => String(anioActual - indice));
}

function construirFechaDesdePartes(anio, mes) {
  if (!anio || !mes) {
    return null;
  }

  return `${anio}-${mes}-01`;
}

function extraerPartesFecha(fecha) {
  if (!fecha) {
    return { month: '01', year: String(new Date().getFullYear()) };
  }

  const fechaTexto = String(fecha).slice(0, 10);
  return {
    month: fechaTexto.slice(5, 7),
    year: fechaTexto.slice(0, 4),
  };
}

function ordenarTrabajos(trabajos) {
  return [...trabajos].sort((a, b) => {
    const fechaA = a.end_date || a.start_date || '';
    const fechaB = b.end_date || b.start_date || '';

    if (a.is_current_job && !b.is_current_job) {
      return -1;
    }

    if (!a.is_current_job && b.is_current_job) {
      return 1;
    }

    return fechaB.localeCompare(fechaA);
  });
}

function normalizarTrabajos(trabajos) {
  if (!Array.isArray(trabajos)) {
    return [];
  }

  return ordenarTrabajos(
    trabajos.map((trabajo, indice) => ({
      ...trabajo,
      id: trabajo.id || `local-job-${indice}`,
      company_name: trabajo.company_name || '',
      position: trabajo.position || '',
      start_date: trabajo.start_date ? String(trabajo.start_date).slice(0, 10) : '',
      end_date: trabajo.end_date ? String(trabajo.end_date).slice(0, 10) : null,
      is_current_job: Boolean(trabajo.is_current_job || !trabajo.end_date),
      description: trabajo.description || '',
    })),
  );
}

function construirFormularioTrabajo(trabajo) {
  const inicio = extraerPartesFecha(trabajo?.start_date);
  const fin = extraerPartesFecha(trabajo?.end_date);

  return {
    id: trabajo?.id || null,
    company_name: trabajo?.company_name || '',
    position: trabajo?.position || '',
    start_month: inicio.month,
    start_year: inicio.year,
    end_month: fin.month,
    end_year: fin.year,
    is_current_job: Boolean(trabajo?.is_current_job || !trabajo?.end_date),
    description: trabajo?.description || '',
  };
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

function PortfolioWorkExperienceSection() {
  const { user } = useAuth();
  const aniosDisponibles = useMemo(() => obtenerAniosDisponibles(), []);
  const [trabajos, setTrabajos] = useState([]);
  const [estaModalAbierto, setEstaModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState({});
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [contadorLocal, setContadorLocal] = useState(0);
  const [formulario, setFormulario] = useState(FORMULARIO_LABORAL_INICIAL);

  const hayRegistros = trabajos.length > 0;

  useEffect(() => {
    obtenerJobs()
      .then((respuesta) => {
        setTrabajos(normalizarTrabajos(respuesta.data));
      })
      .catch(() => {
        setTrabajos(normalizarTrabajos(user?.jobs));
      });
  }, []);

  useEffect(() => {
    if (!estaModalAbierto) {
      return undefined;
    }

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = overflowPrevio;
    };
  }, [estaModalAbierto]);

  const abrirModalCrear = () => {
    setFormulario({
      ...FORMULARIO_LABORAL_INICIAL,
      start_year: aniosDisponibles[0],
      end_year: aniosDisponibles[0],
    });
    setErrores({});
    setMensajeError('');
    setMensajeExito('');
    setEstaModalAbierto(true);
  };

  const abrirModalEditar = (trabajo) => {
    if (!trabajo) {
      return;
    }

    setFormulario(construirFormularioTrabajo(trabajo));
    setErrores({});
    setMensajeError('');
    setMensajeExito('');
    setEstaModalAbierto(true);
  };

  const cerrarModal = () => {
    setFormulario(FORMULARIO_LABORAL_INICIAL);
    setErrores({});
    setMensajeError('');
    setEstaModalAbierto(false);
  };

  const manejarCambio = (evento) => {
    const { name, value, type, checked } = evento.target;

    setFormulario((actual) => {
      if (type === 'checkbox') {
        return {
          ...actual,
          is_current_job: checked,
          end_month: checked ? FORMULARIO_LABORAL_INICIAL.end_month : actual.end_month,
          end_year: checked ? FORMULARIO_LABORAL_INICIAL.end_year : actual.end_year,
        };
      }

      return {
        ...actual,
        [name]: value,
      };
    });

    setErrores((actual) => ({
      ...actual,
      [name]: '',
      start_month: '',
      start_year: '',
      end_month: '',
      end_year: '',
    }));

    setMensajeError('');
    setMensajeExito('');
  };

  const validarFormulario = () => {
    const nuevosErrores = {};
    const empresa = sanitizarTexto(formulario.company_name);
    const cargo = sanitizarTexto(formulario.position);
    const fechaInicio = construirFechaDesdePartes(formulario.start_year, formulario.start_month);
    const fechaFin = construirFechaDesdePartes(formulario.end_year, formulario.end_month);
    const inicio = fechaInicio ? new Date(`${fechaInicio}T00:00:00`) : null;
    const fin = fechaFin ? new Date(`${fechaFin}T00:00:00`) : null;

    if (!empresa) {
      nuevosErrores.company_name = 'El nombre de la empresa es obligatorio.';
    }

    if (!cargo) {
      nuevosErrores.position = 'El cargo / puesto es obligatorio.';
    }

    if (!formulario.start_month || !formulario.start_year) {
      nuevosErrores.start_month = 'La fecha de inicio es obligatoria.';
    }

    if (!formulario.is_current_job && (!formulario.end_month || !formulario.end_year)) {
      nuevosErrores.end_month = 'La fecha de fin es obligatoria.';
    }

    if (inicio && fin && inicio > fin) {
      nuevosErrores.end_month = 'La fecha de inicio no puede ser posterior a la fecha de fin.';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const guardarTrabajo = async (evento) => {
    evento.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    setGuardando(true);
    setMensajeError('');

    try {
      const esCreacion = !formulario.id;
      const respuesta = esCreacion
        ? await crearJob({
          company_name: sanitizarTexto(formulario.company_name),
          position: sanitizarTexto(formulario.position),
          achievements: sanitizarTexto(formulario.description) || null,
          start_month: MESES.find((mes) => mes.value === formulario.start_month)?.label,
          start_year: Number(formulario.start_year),
          end_month: formulario.is_current_job
            ? null
            : MESES.find((mes) => mes.value === formulario.end_month)?.label,
          end_year: formulario.is_current_job ? null : Number(formulario.end_year),
          is_current_job: formulario.is_current_job,
        })
        : await actualizarJob(formulario.id, {
          company_name: sanitizarTexto(formulario.company_name),
          position: sanitizarTexto(formulario.position),
          achievements: sanitizarTexto(formulario.description) || null,
          start_month: MESES.find((mes) => mes.value === formulario.start_month)?.label,
          start_year: Number(formulario.start_year),
          end_month: formulario.is_current_job
            ? null
            : MESES.find((mes) => mes.value === formulario.end_month)?.label,
          end_year: formulario.is_current_job ? null : Number(formulario.end_year),
          is_current_job: formulario.is_current_job,
        });

      const trabajoRespuesta = respuesta?.data?.job;

      const trabajoActualizado = {
        id: esCreacion
          ? (trabajoRespuesta?.id || `local-job-${Date.now()}-${contadorLocal + 1}`)
          : (trabajoRespuesta?.id || formulario.id),
        company_name: trabajoRespuesta?.company_name || sanitizarTexto(formulario.company_name),
        position: trabajoRespuesta?.position || sanitizarTexto(formulario.position),
        start_date: trabajoRespuesta?.start_date
          ? String(trabajoRespuesta.start_date).slice(0, 10)
          : construirFechaDesdePartes(formulario.start_year, formulario.start_month),
        end_date: trabajoRespuesta?.end_date
          ? String(trabajoRespuesta.end_date).slice(0, 10)
          : (formulario.is_current_job
          ? null
          : construirFechaDesdePartes(formulario.end_year, formulario.end_month)),
        is_current_job: trabajoRespuesta?.is_current_job ?? formulario.is_current_job,
        description: trabajoRespuesta?.description ?? sanitizarTexto(formulario.description),
      };

      setTrabajos((actual) => {
        const sinDuplicados = actual.filter((item) => String(item.id) !== String(trabajoActualizado.id));
        return ordenarTrabajos([trabajoActualizado, ...sinDuplicados]);
      });

      if (esCreacion && !trabajoRespuesta?.id) {
        setContadorLocal((actual) => actual + 1);
      }

      setMensajeExito(
        formulario.id
          ? 'Experiencia laboral actualizada correctamente.'
          : 'Experiencia laboral registrada correctamente.',
      );
      setEstaModalAbierto(false);
      setFormulario(FORMULARIO_LABORAL_INICIAL);
    } catch {
      setMensajeError('No se pudo guardar la experiencia laboral.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <section className="softsave-portafolio-module-card">
        <div className="softsave-portafolio-module-card__header">
          <div className="softsave-portafolio-module-card__title-wrap">
            <Icon path={mdiBriefcaseOutline} size={1} className="softsave-portafolio-module-card__icon" />
            <h2 className="softsave-portafolio-module-card__title">Experiencia laboral</h2>
          </div>

          <div className="softsave-portafolio-module-card__actions">
            <button
              type="button"
              className="softsave-portafolio-module-card__action softsave-portafolio-module-card__action--primary"
              aria-label="Añadir experiencia laboral"
              onClick={abrirModalCrear}
            >
              <Icon path={mdiPlus} size={0.85} />
            </button>
            <button
              type="button"
              className="softsave-portafolio-module-card__action"
              aria-label="Editar experiencia laboral"
              onClick={() => abrirModalEditar(trabajos[0])}
              disabled={!hayRegistros}
            >
              <Icon path={mdiPencilOutline} size={0.85} />
            </button>
          </div>
        </div>

        {mensajeExito ? (
          <div className="success-alert softsave-portafolio-module-card__alert" role="status">
            {mensajeExito}
          </div>
        ) : null}

        {hayRegistros ? (
          <div className="softsave-portafolio-study-list">
            {trabajos.map((trabajo) => (
              <article key={trabajo.id} className="softsave-portafolio-study-card">
                <div className="softsave-portafolio-study-card__body">
                  <h3 className="softsave-portafolio-study-card__title">{trabajo.company_name}</h3>
                  <p className="softsave-portafolio-study-card__degree">{trabajo.position}</p>
                  <p className="softsave-portafolio-study-card__period">
                    {formatearPeriodo(trabajo.start_date, trabajo.end_date)}
                  </p>
                  {trabajo.description ? (
                    <p className="softsave-portafolio-study-card__description">{trabajo.description}</p>
                  ) : null}
                </div>

                <button
                  type="button"
                  className="softsave-portafolio-module-card__action"
                  aria-label={`Editar ${trabajo.company_name}`}
                  onClick={() => abrirModalEditar(trabajo)}
                >
                  <Icon path={mdiPencilOutline} size={0.85} />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className="softsave-portafolio-module-card__empty">
            Muestra tu experiencia laboral
          </p>
        )}
      </section>

      {estaModalAbierto ? (
        <div
          className="softsave-profile__modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={cerrarModal}
        >
          <div className="softsave-profile__modal" onClick={(evento) => evento.stopPropagation()}>
            <header className="softsave-profile__modal-header">
              <div className="softsave-profile__modal-content">
                <h3 className="softsave-profile__modal-title">
                  {formulario.id ? 'Editar Experiencia Laboral' : 'Añadir Experiencia Laboral'}
                </h3>
                <p className="softsave-profile__modal-text">
                  Completa la empresa, el cargo y el periodo laboral manteniendo la interfaz actual.
                </p>
              </div>

              <button
                type="button"
                className="softsave-profile__icon-button"
                onClick={cerrarModal}
                aria-label="Cerrar modal"
              >
                <Icon path={mdiClose} size={1} />
              </button>
            </header>

            <form className="softsave-portafolio-job-form" onSubmit={guardarTrabajo}>
              <label className="softsave-profile__field">
                <span className="softsave-profile__label">Nombre de la Empresa</span>
                <input
                  type="text"
                  name="company_name"
                  value={formulario.company_name}
                  onChange={manejarCambio}
                  className="softsave-input softsave-profile__input"
                />
                {errores.company_name ? (
                  <span className="error-text softsave-profile__error-text" role="alert">
                    {errores.company_name}
                  </span>
                ) : null}
              </label>

              <label className="softsave-profile__field">
                <span className="softsave-profile__label">Puesto o Cargo</span>
                <input
                  type="text"
                  name="position"
                  value={formulario.position}
                  onChange={manejarCambio}
                  className="softsave-input softsave-profile__input"
                />
                {errores.position ? (
                  <span className="error-text softsave-profile__error-text" role="alert">
                    {errores.position}
                  </span>
                ) : null}
              </label>

              <div className="softsave-portafolio-job-form__dates">
                <div className="softsave-profile__field">
                  <span className="softsave-profile__label">Fecha de Inicio</span>
                  <div className="softsave-portafolio-job-form__date-grid">
                    <label className="softsave-profile__field">
                      <span className="softsave-portafolio-job-form__sub-label">Mes:</span>
                      <select
                        name="start_month"
                        value={formulario.start_month}
                        onChange={manejarCambio}
                        className="softsave-input softsave-profile__input"
                      >
                        {MESES.map((mes) => (
                          <option key={mes.value} value={mes.value}>{mes.label}</option>
                        ))}
                      </select>
                    </label>

                    <label className="softsave-profile__field">
                      <span className="softsave-portafolio-job-form__sub-label">Año:</span>
                      <select
                        name="start_year"
                        value={formulario.start_year}
                        onChange={manejarCambio}
                        className="softsave-input softsave-profile__input"
                      >
                        {aniosDisponibles.map((anio) => (
                          <option key={anio} value={anio}>{anio}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {errores.start_month ? (
                    <span className="error-text softsave-profile__error-text" role="alert">
                      {errores.start_month}
                    </span>
                  ) : null}
                </div>

                <div className="softsave-profile__field">
                  <div className="softsave-portafolio-job-form__end-header">
                    <span className="softsave-profile__label">Fecha de Fin</span>
                    <label className="softsave-portafolio-job-form__checkbox">
                      <input
                        type="checkbox"
                        name="is_current_job"
                        checked={formulario.is_current_job}
                        onChange={manejarCambio}
                      />
                      <span>Trabajo Actual</span>
                    </label>
                  </div>

                  <div className="softsave-portafolio-job-form__date-grid">
                    <label className="softsave-profile__field">
                      <span className="softsave-portafolio-job-form__sub-label">Mes:</span>
                      <select
                        name="end_month"
                        value={formulario.end_month}
                        onChange={manejarCambio}
                        className="softsave-input softsave-profile__input"
                        disabled={formulario.is_current_job}
                      >
                        {MESES.map((mes) => (
                          <option key={mes.value} value={mes.value}>{mes.label}</option>
                        ))}
                      </select>
                    </label>

                    <label className="softsave-profile__field">
                      <span className="softsave-portafolio-job-form__sub-label">Año:</span>
                      <select
                        name="end_year"
                        value={formulario.end_year}
                        onChange={manejarCambio}
                        className="softsave-input softsave-profile__input"
                        disabled={formulario.is_current_job}
                      >
                        {aniosDisponibles.map((anio) => (
                          <option key={anio} value={anio}>{anio}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {errores.end_month ? (
                    <span className="error-text softsave-profile__error-text" role="alert">
                      {errores.end_month}
                    </span>
                  ) : null}
                </div>
              </div>

              <label className="softsave-profile__field">
                <span className="softsave-profile__label">Logros</span>
                <textarea
                  name="description"
                  value={formulario.description}
                  onChange={manejarCambio}
                  className="softsave-input softsave-profile__textarea"
                />
              </label>

              {mensajeError ? (
                <span className="error-text softsave-profile__error-text" role="alert">
                  {mensajeError}
                </span>
              ) : null}

              <div className="softsave-profile__modal-actions">
                <button
                  type="button"
                  className="softsave-profile__secondary-button softsave-profile__secondary-button--modal"
                  onClick={cerrarModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="softsave-button softsave-button--compact" disabled={guardando}>
                  <Icon path={mdiContentSaveOutline} size={0.8} />
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default PortfolioWorkExperienceSection;
