import { useEffect, useMemo, useState } from 'react';
import Icon from '@mdi/react';
import { mdiAccount, mdiClose, mdiContentSaveOutline, mdiPencilOutline } from '@mdi/js';
import useAuth from '../hooks/useAuth';
import { actualizarPerfil } from '../services/authService';

function sanitizarTexto(valor) {
  return String(valor || '').replace(/\s+/g, ' ').trim();
}

function normalizarProfesion(valor) {
  return String(valor || '').replace(/[^\p{L}\p{N}\s.,\-\/()&]/gu, '');
}

function esProfesionValida(valor) {
  return /^(?=.*\p{L})[\p{L}\p{N}]+(?:[ .,&()\/-][\p{L}\p{N}]+)*$/u.test(valor);
}

function PortfolioPersonalInfoCard() {
  const { user, refreshUser } = useAuth();
  const [estaModalAbierto, setEstaModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState({});
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [formulario, setFormulario] = useState({
    nombreCompleto: user?.name || '',
    profesion: user?.profession || '',
    biografia: user?.biography || '',
  });

  const hayDatos = useMemo(
    () => Boolean(user?.name || user?.profession || user?.biography),
    [user?.name, user?.profession, user?.biography],
  );

  useEffect(() => {
    if (!estaModalAbierto) {
      setFormulario({
        nombreCompleto: user?.name || '',
        profesion: user?.profession || '',
        biografia: user?.biography || '',
      });
    }
  }, [user, estaModalAbierto]);

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

  const abrirModal = () => {
    setFormulario({
      nombreCompleto: user?.name || '',
      profesion: user?.profession || '',
      biografia: user?.biography || '',
    });
    setErrores({});
    setMensajeError('');
    setEstaModalAbierto(true);
  };

  const cerrarModal = () => {
    setEstaModalAbierto(false);
    setErrores({});
    setMensajeError('');
  };

  const manejarCambio = (evento) => {
    const { name, value } = evento.target;
    const valorProcesado = name === 'profesion' ? normalizarProfesion(value) : value;

    setFormulario((actual) => ({
      ...actual,
      [name]: valorProcesado,
    }));

    setErrores((actual) => ({
      ...actual,
      [name]: '',
    }));

    setMensajeError('');
  };

  const validarFormulario = () => {
    const nuevosErrores = {};
    const nombreLimpio = sanitizarTexto(formulario.nombreCompleto);
    const profesionLimpia = sanitizarTexto(formulario.profesion);
    const biografiaLimpia = sanitizarTexto(formulario.biografia);

    if (!nombreLimpio) {
      nuevosErrores.nombreCompleto = 'El nombre es obligatorio.';
    } else if (nombreLimpio.length > 50) {
      nuevosErrores.nombreCompleto = 'El nombre debe tener máximo 50 caracteres.';
    }

    if (!profesionLimpia) {
      nuevosErrores.profesion = 'El título es obligatorio.';
    } else if (profesionLimpia.length > 100) {
      nuevosErrores.profesion = 'El título debe tener máximo 100 caracteres.';
    } else if (!esProfesionValida(profesionLimpia)) {
      nuevosErrores.profesion = 'El título debe tener palabras válidas y no secuencias de símbolos.';
    }

    if (biografiaLimpia.length > 1000) {
      nuevosErrores.biografia = 'La biografía debe tener máximo 1000 caracteres.';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const guardarInformacion = async (evento) => {
    evento.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    const payload = {
      name: sanitizarTexto(formulario.nombreCompleto),
      profession: sanitizarTexto(formulario.profesion),
      biography: sanitizarTexto(formulario.biografia),
      github_url: user?.github_url || null,
      linkedin_url: user?.linkedin_url || null,
    };

    setGuardando(true);
    setMensajeError('');

    try {
      await actualizarPerfil(payload);
      await refreshUser();
      setMensajeExito('Información actualizada correctamente');
      setEstaModalAbierto(false);
    } catch {
      setMensajeError('No se pudo guardar la información personal.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <section className="softsave-portafolio-module-card">
        <div className="softsave-portafolio-module-card__header">
          <div className="softsave-portafolio-module-card__title-wrap">
            <Icon path={mdiAccount} size={1} className="softsave-portafolio-module-card__icon" />
            <h2 className="softsave-portafolio-module-card__title">Información personal</h2>
          </div>

          <div className="softsave-portafolio-module-card__actions">
            <button
              type="button"
              className="softsave-portafolio-module-card__action softsave-portafolio-module-card__action--secondary"
              onClick={abrirModal}
              aria-label="Editar información personal"
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

        {hayDatos ? (
          <div className="softsave-portafolio-module-card__content">
            <div className="softsave-portafolio-module-card__row">
              <span className="softsave-portafolio-module-card__label">Nombre:</span>
              <p className="softsave-portafolio-module-card__value">{user?.name || 'Sin registrar'}</p>
            </div>
            <div className="softsave-portafolio-module-card__row">
              <span className="softsave-portafolio-module-card__label">Título:</span>
              <p className="softsave-portafolio-module-card__value">{user?.profession || 'Sin registrar'}</p>
            </div>
            <div className="softsave-portafolio-module-card__row">
              <span className="softsave-portafolio-module-card__label">Biografía</span>
              <p className="softsave-portafolio-module-card__value softsave-portafolio-module-card__value--bio">
                {user?.biography || 'Añade aquí una breve descripción profesional.'}
              </p>
            </div>
          </div>
        ) : (
          <p className="softsave-portafolio-module-card__empty">
            Añade aquí tu nombre, título y biografía profesional
          </p>
        )}
      </section>

      {estaModalAbierto ? (
        <div className="softsave-profile__modal-overlay" role="dialog" aria-modal="true">
          <div className="softsave-profile__modal">
            <header className="softsave-profile__modal-header">
              <div className="softsave-profile__modal-content">
                <h3 className="softsave-profile__modal-title">
                  {hayDatos ? 'Editar información personal' : 'Añadir información personal'}
                </h3>
                <p className="softsave-profile__modal-text">
                  Completa los datos personales manteniendo la misma línea visual del sistema.
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

            <form className="softsave-profile__form" onSubmit={guardarInformacion}>
              <label className="softsave-profile__field">
                <span className="softsave-profile__label">Nombre</span>
                <input
                  type="text"
                  name="nombreCompleto"
                  value={formulario.nombreCompleto}
                  onChange={manejarCambio}
                  className="softsave-input softsave-profile__input"
                  placeholder="Ej. Juan Pérez"
                />
                {errores.nombreCompleto ? (
                  <span className="error-text softsave-profile__error-text" role="alert">
                    {errores.nombreCompleto}
                  </span>
                ) : null}
              </label>

              <label className="softsave-profile__field">
                <span className="softsave-profile__label">Título</span>
                <input
                  type="text"
                  name="profesion"
                  value={formulario.profesion}
                  onChange={manejarCambio}
                  className="softsave-input softsave-profile__input"
                  placeholder="Ej. Ingeniero informático"
                />
                {errores.profesion ? (
                  <span className="error-text softsave-profile__error-text" role="alert">
                    {errores.profesion}
                  </span>
                ) : null}
              </label>

              <label className="softsave-profile__field">
                <span className="softsave-profile__label">Biografía</span>
                <textarea
                  name="biografia"
                  value={formulario.biografia}
                  onChange={manejarCambio}
                  className="softsave-input softsave-profile__textarea"
                  placeholder="Describe brevemente tu perfil profesional."
                />
                {errores.biografia ? (
                  <span className="error-text softsave-profile__error-text" role="alert">
                    {errores.biografia}
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
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default PortfolioPersonalInfoCard;
