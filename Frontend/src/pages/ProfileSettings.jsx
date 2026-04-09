import { useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '@mdi/react';
import {
  mdiAccount,
  mdiCameraOutline,
  mdiClose,
  mdiCodeTags,
  mdiContentSaveOutline,
  mdiDeleteOutline,
  mdiGithub,
  mdiHome,
  mdiImageOutline,
  mdiLinkVariant,
  mdiPlus,
  mdiShareVariant,
  mdiWeb,
} from '@mdi/js';
import useAuth from '../hooks/useAuth';
import './ProfileSettings.css';

const SECCIONES_PERFIL = [
  { id: 'contacto', label: 'Información de contacto', route: '/perfil/contacto' },
  { id: 'academica', label: 'Trayectoria académica', route: '/perfil/academica' },
  { id: 'github', label: 'Ecosistema de GitHub', route: '/perfil/github' },
];

function obtenerIniciales(nombreCompleto) {
  return nombreCompleto
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parteNombre) => parteNombre[0]?.toUpperCase())
    .join('');
}

function normalizarHabilidades(skillsUsuario) {
  if (!Array.isArray(skillsUsuario)) {
    return [];
  }

  return skillsUsuario
    .map((skill) => {
      if (typeof skill === 'string') {
        return skill.trim();
      }

      if (skill && typeof skill === 'object') {
        return String(skill.name || skill.label || '').trim();
      }

      return '';
    })
    .filter(Boolean);
}

function normalizarEnlacesSociales(socialsUsuario) {
  if (Array.isArray(socialsUsuario)) {
    return socialsUsuario
      .map((social) => {
        if (!social || typeof social !== 'object') {
          return null;
        }

        return {
          id: social.id || social.label || social.platform || social.url,
          label: social.label || social.platform || 'Link',
          url: social.url || '#',
          icono: social.icono || mdiLinkVariant,
        };
      })
      .filter(Boolean);
  }

  if (socialsUsuario && typeof socialsUsuario === 'object') {
    return Object.entries(socialsUsuario)
      .filter(([, url]) => Boolean(url))
      .map(([plataforma, url]) => {
        const nombrePlataforma = plataforma.toLowerCase();

        return {
          id: plataforma,
          label: plataforma.toUpperCase(),
          url,
          icono: nombrePlataforma.includes('github')
            ? mdiGithub
            : nombrePlataforma.includes('linkedin')
              ? mdiAccount
              : mdiWeb,
        };
      });
  }

  return [];
}

function obtenerSeccionActiva(pathname) {
  const seccionActiva = SECCIONES_PERFIL.find(({ route }) => pathname === route);
  return seccionActiva?.id || 'contacto';
}

function ProfileSettings() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const inputImagenRef = useRef(null);
  const [estaModalAbierto, setEstaModalAbierto] = useState(false);
  const [mensajeImagenError, setMensajeImagenError] = useState('');
  const [mensajeGuardado, setMensajeGuardado] = useState('');
  const [estadoHu07, setEstadoHu07] = useState('pendiente');
  const [erroresFormulario, setErroresFormulario] = useState({});
  const [imagenTemporal, setImagenTemporal] = useState('');
  const [imagenPerfil, setImagenPerfil] = useState('');
  const [estaFormularioSkillAbierto, setEstaFormularioSkillAbierto] = useState(false);
  const [nuevaHabilidad, setNuevaHabilidad] = useState('');
  const [mensajeSkillError, setMensajeSkillError] = useState('');
  const [habilidades, setHabilidades] = useState(() => normalizarHabilidades(user?.skills));
  const [enlacesSociales, setEnlacesSociales] = useState(() => normalizarEnlacesSociales(user?.socials));
  const [perfilCabecera, setPerfilCabecera] = useState({
    nombreCompleto: user?.name || '',
    profesion: user?.profession || '',
    biografia: user?.bio || '',
  });
  const [formularioPerfil, setFormularioPerfil] = useState({
    nombreCompleto: user?.name || '',
    profesion: user?.profession || '',
    biografia: user?.bio || '',
  });

  const inicialesPerfil = useMemo(
    () => obtenerIniciales(perfilCabecera.nombreCompleto || 'Usuario'),
    [perfilCabecera.nombreCompleto],
  );
  const seccionActiva = obtenerSeccionActiva(pathname);

  const manejarCambioFormulario = (evento) => {
    const { name, value } = evento.target;

    setFormularioPerfil((estadoActual) => ({
      ...estadoActual,
      [name]: value,
    }));

    setErroresFormulario((estadoActual) => ({
      ...estadoActual,
      [name]: '',
    }));
    setMensajeGuardado('');
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formularioPerfil.nombreCompleto.trim()) {
      nuevosErrores.nombreCompleto = 'El nombre es obligatorio.';
    }

    if (!formularioPerfil.profesion.trim()) {
      nuevosErrores.profesion = 'La profesion es obligatoria.';
    }

    setErroresFormulario(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarGuardarCambios = (evento) => {
    evento.preventDefault();

    if (!validarFormulario()) {
      setEstadoHu07('pendiente');
      setMensajeGuardado('');
      return;
    }

    setPerfilCabecera({
      nombreCompleto: formularioPerfil.nombreCompleto.trim(),
      profesion: formularioPerfil.profesion.trim(),
      biografia: formularioPerfil.biografia.trim(),
    });
    setEstadoHu07('completado');
    setMensajeGuardado('HU-07 completada: la cabecera refleja la informacion personal guardada.');
  };

  const abrirModalImagen = () => {
    setMensajeImagenError('');
    setEstaModalAbierto(true);
  };

  const cerrarModalImagen = () => {
    setEstaModalAbierto(false);
    setMensajeImagenError('');
  };

  const manejarSeleccionImagen = (evento) => {
    const archivoSeleccionado = evento.target.files?.[0];

    if (!archivoSeleccionado) {
      return;
    }

    if (archivoSeleccionado.size > 10 * 1024 * 1024) {
      setMensajeImagenError('La imagen no puede superar los 10MB.');
      return;
    }

    if (!archivoSeleccionado.type.startsWith('image/')) {
      setMensajeImagenError('Selecciona un archivo de imagen valido.');
      return;
    }

    const lectorArchivo = new FileReader();
    lectorArchivo.onload = () => {
      setImagenTemporal(String(lectorArchivo.result || ''));
      setMensajeImagenError('');
    };
    lectorArchivo.readAsDataURL(archivoSeleccionado);
  };

  const confirmarNuevaImagen = () => {
    if (!imagenTemporal) {
      setMensajeImagenError('Selecciona una imagen antes de continuar.');
      return;
    }

    setImagenPerfil(imagenTemporal);
    setImagenTemporal('');
    setEstaModalAbierto(false);
    setMensajeImagenError('');
  };

  const manejarAgregarHabilidad = () => {
    const habilidadNormalizada = nuevaHabilidad.trim();

    if (!habilidadNormalizada) {
      setMensajeSkillError('Ingresa una tecnologia antes de anadirla.');
      return;
    }

    if (habilidades.some((habilidad) => habilidad.toLowerCase() === habilidadNormalizada.toLowerCase())) {
      setMensajeSkillError('Esa tecnologia ya fue agregada.');
      return;
    }

    setHabilidades((estadoActual) => [...estadoActual, habilidadNormalizada]);
    setNuevaHabilidad('');
    setMensajeSkillError('');
    setEstaFormularioSkillAbierto(false);
  };

  const manejarEliminarHabilidad = (evento) => {
    const habilidadAEliminar = evento.currentTarget.dataset.habilidad;

    if (!habilidadAEliminar) {
      return;
    }

    setHabilidades((estadoActual) =>
      estadoActual.filter((habilidad) => habilidad !== habilidadAEliminar),
    );
  };

  const manejarEliminarEnlaceSocial = (evento) => {
    const idEnlace = evento.currentTarget.dataset.enlace;

    if (!idEnlace) {
      return;
    }

    setEnlacesSociales((estadoActual) =>
      estadoActual.filter((enlaceSocial) => String(enlaceSocial.id) !== String(idEnlace)),
    );
  };

  const manejarDescartarCambios = () => {
    setFormularioPerfil({
      nombreCompleto: perfilCabecera.nombreCompleto,
      profesion: perfilCabecera.profesion,
      biografia: perfilCabecera.biografia,
    });
    setErroresFormulario({});
    setMensajeGuardado('');
  };

  const manejarToggleFormularioSkill = () => {
    setEstaFormularioSkillAbierto((estadoActual) => !estadoActual);
    setMensajeSkillError('');
  };

  const manejarCambioNuevaHabilidad = (evento) => {
    setNuevaHabilidad(evento.target.value);
    setMensajeSkillError('');
  };

  const manejarCancelarSkill = () => {
    setEstaFormularioSkillAbierto(false);
    setNuevaHabilidad('');
    setMensajeSkillError('');
  };

  const manejarClickSelectorImagen = () => {
    inputImagenRef.current?.click();
  };

  const vistaPreviaModal = imagenTemporal || imagenPerfil;

  return (
    <div className="softsave-profile">
      <div className="softsave-profile__container">
        <header className="softsave-profile__topbar">
          <div className="softsave-profile__brand">
            <div className="softsave-profile__logo">{'{S}'}</div>
            <div className="softsave-profile__brand-text">
              <span className="softsave-profile__brand-title">DevStack</span>
              <span className="softsave-profile__brand-subtitle">Perfil profesional</span>
            </div>
          </div>

          <nav className="softsave-profile__nav" aria-label="Navegacion principal del perfil">
            <div className="softsave-profile__nav-item">
              <Icon path={mdiHome} size={1} />
              <span>Inicio</span>
            </div>
            <div className="softsave-profile__nav-item">
              <Icon path={mdiCodeTags} size={1} />
              <span>Mi portafolio</span>
            </div>
            <div className="softsave-profile__nav-item is-active" aria-current="page">
              <Icon path={mdiAccount} size={1} />
              <span>Mi perfil</span>
            </div>
          </nav>
        </header>

        <section className="softsave-profile__card">
          <div className="softsave-profile__banner">
            <div className="softsave-profile__avatar-wrap">
              <div className="softsave-profile__avatar">
                {imagenPerfil ? (
                  <img src={imagenPerfil} alt="Foto de perfil" className="softsave-profile__avatar-img" />
                ) : inicialesPerfil ? (
                  <span className="softsave-profile__avatar-initials">{inicialesPerfil}</span>
                ) : (
                  <Icon path={mdiAccount} size={1.6} className="softsave-profile__avatar-icon" />
                )}
              </div>

              <button
                type="button"
                onClick={abrirModalImagen}
                className="softsave-profile__avatar-button"
                aria-label="Anadir o actualizar fotografia de perfil"
              >
                <Icon path={mdiPlus} size={0.7} />
              </button>
            </div>
          </div>

          <div className="softsave-profile__header">
            <div className="softsave-profile__tabs">
              {SECCIONES_PERFIL.map((seccion) => (
                <Link
                  key={seccion.id}
                  to={seccion.route}
                  className={`softsave-profile__tab ${seccionActiva === seccion.id ? 'is-active' : ''}`}
                  aria-current={seccionActiva === seccion.id ? 'page' : undefined}
                >
                  {seccion.label}
                </Link>
              ))}
            </div>

            <div className="softsave-profile__header-row">
              <div>
                <h1 className="softsave-profile__name">
                  {perfilCabecera.nombreCompleto || 'Completa tu perfil'}
                </h1>
                <p className="softsave-profile__role">
                  {perfilCabecera.profesion || 'Agrega tu profesion para mostrar tu especialidad.'}
                </p>
                {enlacesSociales[0]?.url ? (
                  <a
                    href={enlacesSociales[0].url}
                    className="softsave-profile__link"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {enlacesSociales[0].label}
                  </a>
                ) : null}
              </div>

              <div>
                {estadoHu07 === 'completado' && (
                  <span className="softsave-profile__status" role="status">
                    Estado HU-07: completado
                  </span>
                )}
                <p className="softsave-profile__bio">
                  {perfilCabecera.biografia || 'Tu biografia aparecera aqui cuando completes la informacion personal.'}
                </p>
              </div>
            </div>
          </div>

          <div className="softsave-profile__grid">
            <aside>
              <Link to="/perfil/contacto" className="softsave-button softsave-profile__side-link">
                Información de contacto
              </Link>
            </aside>

            <section className="softsave-profile__form-card">
              <h2 className="softsave-profile__form-title">Configuracion de Perfil</h2>
              <p className="softsave-profile__form-subtitle">
                Personaliza como te ven otros desarrolladores y reclutadores.
              </p>

              <form className="softsave-profile__form" onSubmit={manejarGuardarCambios}>
                <label className="softsave-profile__field">
                  <span className="softsave-profile__label">Nombre Completo</span>
                  <input
                    type="text"
                    name="nombreCompleto"
                    value={formularioPerfil.nombreCompleto}
                    onChange={manejarCambioFormulario}
                    className="softsave-input softsave-profile__input"
                    placeholder="Ej. Alejandra Garcia"
                  />
                  {erroresFormulario.nombreCompleto && (
                    <span className="error-text softsave-profile__error-text" role="alert">
                      {erroresFormulario.nombreCompleto}
                    </span>
                  )}
                </label>

                <label className="softsave-profile__field">
                  <span className="softsave-profile__label">Profesion</span>
                  <input
                    type="text"
                    name="profesion"
                    value={formularioPerfil.profesion}
                    onChange={manejarCambioFormulario}
                    className="softsave-input softsave-profile__input"
                    placeholder="Ej. Senior Full Stack Developer"
                  />
                  {erroresFormulario.profesion && (
                    <span className="error-text softsave-profile__error-text" role="alert">
                      {erroresFormulario.profesion}
                    </span>
                  )}
                </label>

                <label className="softsave-profile__field">
                  <span className="softsave-profile__label">Biografia</span>
                  <textarea
                    name="biografia"
                    value={formularioPerfil.biografia}
                    onChange={manejarCambioFormulario}
                    className="softsave-input softsave-profile__textarea"
                    placeholder="Cuentanos sobre tu trayectoria, tecnologias favoritas y que te apasiona construir."
                  />
                  <span className="softsave-profile__help">
                    Esta vista implementa exclusivamente la HU-07 y la HU-13.
                  </span>
                </label>

                <div className="softsave-profile__actions">
                  <button type="submit" className="softsave-button softsave-profile__primary-button">
                    <Icon path={mdiContentSaveOutline} size={0.8} />
                    Guardar cambios
                  </button>
                  <button
                    type="button"
                    className="softsave-profile__secondary-button"
                    onClick={manejarDescartarCambios}
                  >
                    Descartar
                  </button>
                </div>

                {mensajeGuardado ? (
                  <span className="success-alert softsave-profile__success" role="status">
                    {mensajeGuardado}
                  </span>
                ) : null}
              </form>
            </section>

            <aside className="softsave-profile__aside">
              <div className="softsave-profile__panel">
                <div className="softsave-profile__panel-title">
                  <Icon path={mdiCodeTags} size={0.92} className="softsave-profile__panel-icon" />
                  <span>Stack Tecnologico</span>
                </div>

                {habilidades.length > 0 ? (
                  <div className="softsave-profile__list">
                    {habilidades.map((habilidad) => (
                      <div key={habilidad} className="softsave-profile__chip">
                        <button type="button" className="softsave-profile__chip-button">
                          {habilidad}
                        </button>
                        <button
                          type="button"
                          className="softsave-profile__chip-remove"
                          data-habilidad={habilidad}
                          onClick={manejarEliminarHabilidad}
                          aria-label={`Eliminar ${habilidad}`}
                        >
                          <Icon path={mdiDeleteOutline} size={0.7} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="softsave-profile__empty">Aun no agregaste tecnologias a tu perfil.</p>
                )}

                <div className="softsave-profile__panel-actions">
                  <button
                    type="button"
                    className="softsave-profile__add-button"
                    onClick={manejarToggleFormularioSkill}
                  >
                    + Añadir
                  </button>
                </div>

                {estaFormularioSkillAbierto ? (
                  <div className="softsave-profile__mini-form">
                    <input
                      type="text"
                      value={nuevaHabilidad}
                      onChange={manejarCambioNuevaHabilidad}
                      placeholder="Ej. React, Node.js, Docker"
                      className="softsave-input softsave-profile__mini-input"
                    />
                    <div className="softsave-profile__mini-actions">
                      <button
                        type="button"
                        className="softsave-button softsave-profile__mini-primary"
                        onClick={manejarAgregarHabilidad}
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        className="softsave-profile__mini-secondary"
                        onClick={manejarCancelarSkill}
                      >
                        Cancelar
                      </button>
                    </div>
                    {mensajeSkillError ? (
                      <span className="error-text softsave-profile__error-text" role="alert">
                        {mensajeSkillError}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="softsave-profile__panel">
                <div className="softsave-profile__panel-title">
                  <Icon path={mdiShareVariant} size={0.92} className="softsave-profile__panel-icon" />
                  <span>Enlaces Sociales</span>
                </div>

                {enlacesSociales.length > 0 ? (
                  <div className="softsave-profile__list">
                    {enlacesSociales.map((social) => (
                      <div key={social.id} className="softsave-profile__chip">
                        <a
                          href={social.url}
                          target="_blank"
                          rel="noreferrer"
                          className="softsave-profile__chip-button softsave-profile__chip-button--link"
                        >
                          <Icon path={social.icono} size={0.82} className="softsave-profile__panel-icon" />
                          <span className="softsave-profile__chip-label">{social.label}</span>
                        </a>
                        <button
                          type="button"
                          className="softsave-profile__chip-remove"
                          data-enlace={social.id}
                          onClick={manejarEliminarEnlaceSocial}
                          aria-label={`Eliminar ${social.label}`}
                        >
                          <Icon path={mdiDeleteOutline} size={0.7} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="softsave-profile__empty">No hay enlaces sociales cargados todavia.</p>
                )}
              </div>
            </aside>
          </div>
        </section>
      </div>

      {estaModalAbierto ? (
        <div className="softsave-profile__modal-overlay" role="dialog" aria-modal="true">
          <div className="softsave-profile__modal">
            <div className="softsave-profile__modal-header">
              <div>
                <h3 className="softsave-profile__modal-title">Anadir o Actualizar Fotografia de Perfil</h3>
                <p className="softsave-profile__modal-text">
                  Selecciona una imagen de hasta 10MB. La previsualizacion se actualiza de inmediato.
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarModalImagen}
                className="softsave-profile__icon-button"
                aria-label="Cerrar modal"
              >
                <Icon path={mdiClose} size={1} />
              </button>
            </div>

            <div className="softsave-profile__modal-avatar">
              {vistaPreviaModal ? (
                <img src={vistaPreviaModal} alt="Vista previa" className="softsave-profile__avatar-img" />
              ) : (
                <Icon path={mdiImageOutline} size={2.2} className="softsave-profile__panel-icon" />
              )}
            </div>

            <input
              ref={inputImagenRef}
              type="file"
              accept="image/*"
              onChange={manejarSeleccionImagen}
              className="softsave-profile__file-input"
            />

            <div className="softsave-profile__modal-actions">
              <button
                type="button"
                className="softsave-profile__file-button"
                onClick={manejarClickSelectorImagen}
              >
                <Icon path={mdiCameraOutline} size={0.8} />
                Seleccionar Imagen
              </button>
              <button type="button" className="softsave-button" onClick={confirmarNuevaImagen}>
                Guardar foto
              </button>
            </div>

            {mensajeImagenError ? (
              <p className="error-text softsave-profile__error-text softsave-profile__error-text--center" role="alert">
                {mensajeImagenError}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ProfileSettings;
