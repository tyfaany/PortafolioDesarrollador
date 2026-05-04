import { useEffect, useMemo, useState } from 'react';
import Icon from '@mdi/react';
import {
  mdiBriefcaseOutline,
  mdiClose,
  mdiContentSaveOutline,
  mdiDeleteOutline,
  mdiOpenInNew,
  mdiPencilOutline,
  mdiPlus,
} from '@mdi/js';
import useAuth from '../hooks/useAuth';
import useFeedback from '../hooks/useFeedback';
import { actualizarJob, crearJob, eliminarJob, obtenerJobs } from '../services/authService';
import { getPortfolioCache, setPortfolioCache } from '../services/portfolioCache';
import { extractApiMessageByStatus, getApiStatus } from '../utils/apiError';

const FORMULARIO_LABORAL_INICIAL = {
  id: null,
  company_name: '',
  position: '',
  start_month: '',
  start_year: '',
  end_month: '',
  end_year: '',
  is_current_job: false,
  description: '',
  evidence_url: '',
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

function sanitizarUrl(valor) {
  return String(valor || '').trim();
}

function esUrlValida(valor) {
  if (!valor) {
    return true;
  }

  try {
    const url = new URL(valor);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
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

function construirValorMesInput(anio, mes) {
  if (!anio || !mes) {
    return '';
  }

  return `${String(anio).slice(0, 4)}-${String(mes).slice(0, 2)}`;
}

function descomponerValorMesInput(valor) {
  const valorNormalizado = String(valor || '');
  if (!/^\d{4}-\d{2}$/.test(valorNormalizado)) {
    return { year: '', month: '' };
  }

  return {
    year: valorNormalizado.slice(0, 4),
    month: valorNormalizado.slice(5, 7),
  };
}

function mesNombreANumero(nombreMes) {
  const mesComoNumero = Number.parseInt(String(nombreMes || '').trim(), 10);
  if (!Number.isNaN(mesComoNumero) && mesComoNumero >= 1 && mesComoNumero <= 12) {
    return String(mesComoNumero).padStart(2, '0');
  }

  const mapaMeses = {
    Enero: '01',
    Febrero: '02',
    Marzo: '03',
    Abril: '04',
    Mayo: '05',
    Junio: '06',
    Julio: '07',
    Agosto: '08',
    Septiembre: '09',
    Octubre: '10',
    Noviembre: '11',
    Diciembre: '12',
  };

  const nombreNormalizado = String(nombreMes || '').trim();
  const nombreConFormato = nombreNormalizado
    ? `${nombreNormalizado.charAt(0).toUpperCase()}${nombreNormalizado.slice(1).toLowerCase()}`
    : '';

  return mapaMeses[nombreConFormato] || '01';
}

function obtenerNombreMes(valorMes) {
  return MESES.find((mes) => mes.value === valorMes)?.label;
}

function construirPayloadTrabajo(formulario) {
  return {
    company_name: sanitizarTexto(formulario.company_name),
    position: sanitizarTexto(formulario.position),
    achievements: sanitizarTexto(formulario.description) || null,
    start_month: obtenerNombreMes(formulario.start_month),
    start_year: Number(formulario.start_year),
    end_month: formulario.is_current_job ? null : obtenerNombreMes(formulario.end_month),
    end_year: formulario.is_current_job ? null : Number(formulario.end_year),
    is_current_job: formulario.is_current_job,
    evidence_url: sanitizarUrl(formulario.evidence_url) || null,
  };
}

function extraerMensajeErrorTrabajo(error) {
  return extractApiMessageByStatus(error, 'No se pudo guardar la experiencia laboral.');
}

function normalizarTrabajos(trabajos) {
  if (!Array.isArray(trabajos)) {
    return [];
  }

  const trabajosNormalizados = trabajos.map((trabajo, indice) => {
    const startYear = trabajo.start_year ?? trabajo.startYear;
    const endYear = trabajo.end_year ?? trabajo.endYear;
    const startMonth = trabajo.start_month ?? trabajo.startMonth;
    const endMonth = trabajo.end_month ?? trabajo.endMonth;
    const startDateRaw = trabajo.start_date ?? trabajo.startDate;
    const endDateRaw = trabajo.end_date ?? trabajo.endDate;
    const isCurrentRaw = trabajo.is_current_job ?? trabajo.isCurrentJob;
    const isCurrent = Boolean(isCurrentRaw === true || isCurrentRaw === 1 || isCurrentRaw === '1');

    return {
    // Prioriza fechas ya normalizadas (start_date/end_date), útil al reconstruir desde caché local.
    ...trabajo,
    id: trabajo.id || `local-job-${indice}`,
    company_name: trabajo.company_name || '',
    position: trabajo.position || '',
    start_date: startDateRaw
      ? String(startDateRaw).slice(0, 10)
      : (startYear && startMonth
        ? `${startYear}-${mesNombreANumero(startMonth)}-01`
        : ''),
    end_date: isCurrent
      ? null
      : (endDateRaw
        ? String(endDateRaw).slice(0, 10)
        : (endYear && endMonth
          ? `${endYear}-${mesNombreANumero(endMonth)}-01`
          : null)),
    is_current_job: isCurrent,
    description: trabajo.achievements ?? trabajo.description ?? '',
    evidence_url: trabajo.evidence_url ?? '',
    };
  });

  return ordenarTrabajosPorPeriodo(trabajosNormalizados);
}

function obtenerTimestampFecha(valorFecha) {
  if (!valorFecha) {
    return Number.NEGATIVE_INFINITY;
  }

  const marcaTiempo = Date.parse(`${String(valorFecha).slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(marcaTiempo) ? Number.NEGATIVE_INFINITY : marcaTiempo;
}

function ordenarTrabajosPorPeriodo(trabajos) {
  return [...trabajos].sort((trabajoA, trabajoB) => {
    if (trabajoA.is_current_job !== trabajoB.is_current_job) {
      return trabajoA.is_current_job ? -1 : 1;
    }

    const finA = obtenerTimestampFecha(trabajoA.end_date);
    const finB = obtenerTimestampFecha(trabajoB.end_date);
    if (finA !== finB) {
      return finB - finA;
    }

    const inicioA = obtenerTimestampFecha(trabajoA.start_date);
    const inicioB = obtenerTimestampFecha(trabajoB.start_date);
    if (inicioA !== inicioB) {
      return inicioB - inicioA;
    }

    return String(trabajoB.id).localeCompare(String(trabajoA.id));
  });
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
    evidence_url: trabajo?.evidence_url || '',
  };
}

function formatearPeriodo(fechaInicio, fechaFin) {
  const formateador = new Intl.DateTimeFormat('es-ES', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const formatear = (valor, esFechaInicio = false) => {
    if (!valor) {
      return esFechaInicio ? 'Sin fecha de inicio' : 'Presente';
    }

    const fecha = new Date(`${String(valor).slice(0, 10)}T00:00:00Z`);
    return formateador.format(fecha);
  };

  return `${formatear(fechaInicio, true)} - ${formatear(fechaFin)}`;
}

function PortfolioWorkExperienceSection() {
  const { user } = useAuth();
  const { showFeedback } = useFeedback();
  const aniosDisponibles = useMemo(() => obtenerAniosDisponibles(), []);
  const mesActual = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const trabajosDesdeContexto = useMemo(
    () => normalizarTrabajos(user?.jobs),
    [user?.jobs],
  );
  const jobsCacheKey = useMemo(
    () => (user?.id ? `portfolio:jobs:${user.id}` : null),
    [user?.id],
  );
  const [trabajos, setTrabajos] = useState(() => trabajosDesdeContexto);
  const [estaModalAbierto, setEstaModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [eliminandoTrabajo, setEliminandoTrabajo] = useState(false);
  const [trabajoPendienteEliminar, setTrabajoPendienteEliminar] = useState(null);
  const [errores, setErrores] = useState({});
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [contadorLocal, setContadorLocal] = useState(0);
  const [formulario, setFormulario] = useState(FORMULARIO_LABORAL_INICIAL);
  const modalTituloId = 'softsave-job-modal-title';
  const modalDescripcionId = 'softsave-job-modal-description';

  useEffect(() => {
    let sigueMontado = true;

    const cacheTrabajos = getPortfolioCache(jobsCacheKey);
    if (cacheTrabajos) {
      setTrabajos(normalizarTrabajos(cacheTrabajos));
      return () => {
        sigueMontado = false;
      };
    }

    if (trabajosDesdeContexto.length > 0) {
      setTrabajos(trabajosDesdeContexto);
      setPortfolioCache(jobsCacheKey, trabajosDesdeContexto);
    }

    obtenerJobs()
      .then((respuesta) => {
        if (sigueMontado) {
          const trabajosNormalizados = normalizarTrabajos(respuesta.data);
          setTrabajos(trabajosNormalizados);
          setPortfolioCache(jobsCacheKey, trabajosNormalizados);
        }
      })
      .catch(() => {
        if (sigueMontado && trabajosDesdeContexto.length === 0) {
          const trabajosNormalizados = trabajosDesdeContexto;
          setTrabajos(trabajosNormalizados);
          setPortfolioCache(jobsCacheKey, trabajosNormalizados);
        }
      });

    return () => {
      sigueMontado = false;
    };
  }, [jobsCacheKey, trabajosDesdeContexto]);

  useEffect(() => {
    if (!estaModalAbierto && !trabajoPendienteEliminar) {
      return undefined;
    }

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = overflowPrevio;
    };
  }, [estaModalAbierto, trabajoPendienteEliminar]);

  useEffect(() => {
    if (!mensajeExito) {
      return;
    }

    showFeedback(mensajeExito, 'success');
    setMensajeExito('');
  }, [mensajeExito, showFeedback]);

  const abrirModalCrear = () => {
    setFormulario(FORMULARIO_LABORAL_INICIAL);
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

  const manejarCambioMes = (campo, valor) => {
    const { year, month } = descomponerValorMesInput(valor);
    if (!year || !month) {
      return;
    }

    setFormulario((actual) => ({
      ...actual,
      [`${campo}_year`]: year,
      [`${campo}_month`]: month,
    }));

    setErrores((actual) => ({
      ...actual,
      [`${campo}_month`]: '',
      [`${campo}_year`]: '',
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

    if (!formulario.is_current_job && inicio && fin && inicio > fin) {
      nuevosErrores.end_month = 'La fecha de inicio no puede ser posterior a la fecha de fin.';
    }

    if (!esUrlValida(formulario.evidence_url)) {
      nuevosErrores.evidence_url = 'Ingresa una URL válida (http:// o https://).';
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
      const payloadTrabajo = construirPayloadTrabajo(formulario);
      const respuesta = esCreacion
        ? await crearJob(payloadTrabajo)
        : await actualizarJob(formulario.id, payloadTrabajo);

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
        evidence_url: trabajoRespuesta?.evidence_url ?? sanitizarUrl(formulario.evidence_url),
      };

      setTrabajos((actual) => {
        const sinDuplicados = actual.filter((item) => String(item.id) !== String(trabajoActualizado.id));
        const trabajosActualizados = ordenarTrabajosPorPeriodo([trabajoActualizado, ...sinDuplicados]);
        setPortfolioCache(jobsCacheKey, trabajosActualizados);
        return trabajosActualizados;
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
    } catch (error) {
      const status = getApiStatus(error);
      if (status === 403) {
        setMensajeError('No tienes permisos para realizar esta acción.');
        return;
      }

      if (status === 404 && formulario.id) {
        setTrabajos((actual) => {
          const trabajosActualizados = actual.filter((item) => String(item.id) !== String(formulario.id));
          setPortfolioCache(jobsCacheKey, trabajosActualizados);
          return trabajosActualizados;
        });
        setMensajeError('La experiencia laboral ya no existe. Se actualizó la lista.');
        setEstaModalAbierto(false);
        setFormulario(FORMULARIO_LABORAL_INICIAL);
        return;
      }

      setMensajeError(extraerMensajeErrorTrabajo(error));
    } finally {
      setGuardando(false);
    }
  };

  const solicitarEliminarTrabajo = (trabajo) => {
    if (!trabajo?.id) {
      return;
    }

    setTrabajoPendienteEliminar(trabajo);
  };

  const cerrarModalEliminarTrabajo = () => {
    if (eliminandoTrabajo) {
      return;
    }

    setTrabajoPendienteEliminar(null);
  };

  const eliminarTrabajo = async () => {
    if (!trabajoPendienteEliminar?.id) {
      return;
    }

    const idTrabajo = String(trabajoPendienteEliminar.id);
    const esLocal = idTrabajo.startsWith('local-job-');
    setEliminandoTrabajo(true);

    try {
      if (!esLocal) {
        await eliminarJob(trabajoPendienteEliminar.id);
      }

      setTrabajos((actual) => {
        const trabajosActualizados = actual.filter((item) => String(item.id) !== idTrabajo);
        setPortfolioCache(jobsCacheKey, trabajosActualizados);
        return trabajosActualizados;
      });
      setMensajeError('');
      setMensajeExito('Experiencia laboral eliminada correctamente.');
      setTrabajoPendienteEliminar(null);
    } catch (error) {
      const status = getApiStatus(error);
      if (status === 403) {
        setMensajeError('No tienes permisos para eliminar esta experiencia laboral.');
        return;
      }

      if (status === 404) {
        setTrabajos((actual) => {
          const trabajosActualizados = actual.filter((item) => String(item.id) !== idTrabajo);
          setPortfolioCache(jobsCacheKey, trabajosActualizados);
          return trabajosActualizados;
        });
        setMensajeError('');
        setMensajeExito('La experiencia laboral ya no existía. Se actualizó la lista.');
        setTrabajoPendienteEliminar(null);
        return;
      }

      setMensajeError(extractApiMessageByStatus(error, 'No se pudo eliminar la experiencia laboral.'));
    } finally {
      setEliminandoTrabajo(false);
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
          </div>
        </div>

        {trabajos.length > 0 ? (
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
                  {trabajo.evidence_url ? (
                    <a
                      href={trabajo.evidence_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="softsave-portafolio-evidence-link"
                    >
                      <Icon path={mdiOpenInNew} size={0.75} />
                      Ver evidencia
                    </a>
                  ) : null}
                </div>

                <div className="softsave-portafolio-study-card__actions">
                  <button
                    type="button"
                    className="softsave-portafolio-module-card__action softsave-portafolio-module-card__action--secondary"
                    aria-label={`Editar ${trabajo.company_name}`}
                    onClick={() => abrirModalEditar(trabajo)}
                  >
                    <Icon path={mdiPencilOutline} size={0.85} />
                  </button>
                  <button
                    type="button"
                    className="softsave-portafolio-module-card__action softsave-portafolio-module-card__action--secondary softsave-portafolio-module-card__action--danger"
                    aria-label={`Eliminar ${trabajo.company_name}`}
                    onClick={() => solicitarEliminarTrabajo(trabajo)}
                  >
                    <Icon path={mdiDeleteOutline} size={0.85} />
                  </button>
                </div>
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
          aria-labelledby={modalTituloId}
          aria-describedby={modalDescripcionId}
          onClick={cerrarModal}
        >
          <div className="softsave-profile__modal softsave-profile__modal--portfolio" onClick={(evento) => evento.stopPropagation()}>
            <header className="softsave-profile__modal-header">
              <div className="softsave-profile__modal-content">
                <h3 id={modalTituloId} className="softsave-profile__modal-title">
                  {formulario.id ? 'Editar Experiencia Laboral' : 'Añadir Experiencia Laboral'}
                </h3>
                <p id={modalDescripcionId} className="softsave-profile__modal-text">
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
              <div className="softsave-portafolio-job-form__basic-grid">
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
              </div>

              <div className="softsave-portafolio-job-form__dates">
                <div className="softsave-profile__field">
                  <span className="softsave-profile__label">Fecha de Inicio</span>
                  <input
                    type="month"
                    value={construirValorMesInput(formulario.start_year, formulario.start_month)}
                    onChange={(evento) => manejarCambioMes('start', evento.target.value)}
                    className="softsave-input softsave-profile__input"
                    max={mesActual}
                    min={`${aniosDisponibles[aniosDisponibles.length - 1]}-01`}
                  />
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

                  {formulario.is_current_job ? (
                    <input
                      type="text"
                      value="Presente"
                      className="softsave-input softsave-profile__input"
                      readOnly
                      aria-label="Fecha de fin: Presente"
                    />
                  ) : (
                    <input
                      type="month"
                      value={construirValorMesInput(formulario.end_year, formulario.end_month)}
                      onChange={(evento) => manejarCambioMes('end', evento.target.value)}
                      className="softsave-input softsave-profile__input"
                      max={mesActual}
                      min={`${aniosDisponibles[aniosDisponibles.length - 1]}-01`}
                    />
                  )}
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

              <label className="softsave-profile__field">
                <span className="softsave-profile__label">Enlace de evidencia (opcional)</span>
                <input
                  type="url"
                  name="evidence_url"
                  value={formulario.evidence_url}
                  onChange={manejarCambio}
                  className="softsave-input softsave-profile__input"
                  placeholder="https://ejemplo.com/evidencia"
                />
                {errores.evidence_url ? (
                  <span className="error-text softsave-profile__error-text" role="alert">
                    {errores.evidence_url}
                  </span>
                ) : null}
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

      {trabajoPendienteEliminar ? (
        <div className="softsave-profile__modal-overlay softsave-profile__modal-overlay--centered" role="dialog" aria-modal="true" onClick={cerrarModalEliminarTrabajo}>
          <div className="softsave-profile__modal softsave-profile__modal--confirm" onClick={(evento) => evento.stopPropagation()}>
            <header className="softsave-profile__modal-header">
              <div className="softsave-profile__modal-content">
                <h3 className="softsave-profile__modal-title">Eliminar experiencia laboral</h3>
                <p className="softsave-profile__modal-text">
                  Esta acción eliminará &quot;{trabajoPendienteEliminar.company_name}&quot; de tu portafolio.
                </p>
              </div>
            </header>

            <div className="softsave-profile__modal-actions">
              <button
                type="button"
                className="softsave-profile__secondary-button softsave-profile__secondary-button--modal"
                onClick={cerrarModalEliminarTrabajo}
                disabled={eliminandoTrabajo}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="softsave-profile__danger-button"
                onClick={eliminarTrabajo}
                disabled={eliminandoTrabajo}
              >
                {eliminandoTrabajo ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </>
  );
}

export default PortfolioWorkExperienceSection;
