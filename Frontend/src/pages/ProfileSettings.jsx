import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '@mdi/react';
import {
  mdiAccount,
  mdiCameraOutline,
  mdiClose,
  mdiCodeTags,
  mdiContentSaveOutline,
  mdiDeleteOutline,
  mdiGithub,
  mdiImageOutline,
  mdiLinkVariant,
  mdiPlus,
  mdiShareVariant,
  mdiWeb,
} from '@mdi/js';
import useAuth from '../hooks/useAuth';
import { actualizarPerfil, subirFoto } from '../services/authService';
import '../styles/ProfileSettings.css';

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

function normalizarUrlImagen(url) {
  if (!url) {
    return '';
  }

  if (url.startsWith('http')) {
    return url;
  }

  const baseApi = import.meta.env.VITE_LARAVEL_API_URL || '';
  const baseUrl = baseApi.replace(/\/api\/?$/, '');

  if (!baseUrl) {
    return url;
  }

  return `${baseUrl}/${url.replace(/^\/+/, '')}`;
}


function ProfileSettings() {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname } = location;
  const inputImagenRef = useRef(null);
  const [estaModalAbierto, setEstaModalAbierto] = useState(false);
  const [mensajeImagenError, setMensajeImagenError] = useState('');
  const [erroresFormulario, setErroresFormulario] = useState({});
  const [mensajeGuardadoError, setMensajeGuardadoError] = useState('');
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [estaModoEdicion, setEstaModoEdicion] = useState(false);
  const [imagenTemporal, setImagenTemporal] = useState('');
  const [imagenPerfil, setImagenPerfil] = useState(() => normalizarUrlImagen(user?.profile_photo_url));
  const [estaFormularioSkillAbierto, setEstaFormularioSkillAbierto] = useState(false);
  const [nuevaHabilidad, setNuevaHabilidad] = useState('');
  const [mensajeSkillError, setMensajeSkillError] = useState('');
  const [habilidades, setHabilidades] = useState(() => normalizarHabilidades(user?.skills));
  const [enlacesSociales, setEnlacesSociales] = useState(() => normalizarEnlacesSociales(user?.socials));
  const [zoomImagen, setZoomImagen] = useState(1);
  const [desplazamientoImagen, setDesplazamientoImagen] = useState({ x: 0, y: 0 });
  const arrastreImagenRef = useRef({ activo: false, inicioX: 0, inicioY: 0, baseX: 0, baseY: 0 });
  const modalAvatarRef = useRef(null);
  const [perfilCabecera, setPerfilCabecera] = useState({
    nombreCompleto: user?.name || '',
    profesion: user?.profession || '',
    biografia: user?.biography || '',
  });
  const [formularioPerfil, setFormularioPerfil] = useState({
    nombreCompleto: user?.name || '',
    profesion: user?.profession || '',
    biografia: user?.biography || '',
  });

  const inicialesPerfil = useMemo(
    () => obtenerIniciales(perfilCabecera.nombreCompleto || 'Usuario'),
    [perfilCabecera.nombreCompleto],
  );
  const seccionActiva = obtenerSeccionActiva(pathname);
  const [permitirCompletar, setPermitirCompletar] = useState(
    Boolean(location.state?.completarPerfil),
  );
  const completarPerfil = Boolean(location.state?.completarPerfil);
  const edicionDisponible = permitirCompletar;

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

  useEffect(() => {
    if (completarPerfil) {
      setPermitirCompletar(true);
      setEstaModoEdicion(true);
      setMensajeGuardadoError('');
    }
  }, [completarPerfil]);

  useEffect(() => {
    if (user?.profile_photo_url) {
      setImagenPerfil(normalizarUrlImagen(user.profile_photo_url));
    }
  }, [user?.profile_photo_url]);

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
  };

  const validarFormulario = () => {
    const nuevosErrores = {};
    const nombreLimpio = formularioPerfil.nombreCompleto.trim();
    const profesionLimpia = formularioPerfil.profesion.trim();
    const biografiaLimpia = formularioPerfil.biografia.trim();

    if (!nombreLimpio) {
      nuevosErrores.nombreCompleto = 'El nombre es obligatorio.';
    } else if (nombreLimpio.length > 20) {
      nuevosErrores.nombreCompleto = 'El nombre debe tener máximo 20 caracteres.';
    }

    if (!profesionLimpia) {
      nuevosErrores.profesion = 'La profesion es obligatoria.';
    } else if (profesionLimpia.length > 20) {
      nuevosErrores.profesion = 'La profesion debe tener máximo 20 caracteres.';
    }

    if (biografiaLimpia.length > 100) {
      nuevosErrores.biografia = 'La biografia debe tener máximo 100 caracteres.';
    }

    setErroresFormulario(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarGuardarCambios = async (evento) => {
    evento.preventDefault();

    if (!estaModoEdicion) {
      return;
    }

    if (!validarFormulario()) {
      return;
    }

    const payloadPerfil = {
      name: formularioPerfil.nombreCompleto.trim(),
      profession: formularioPerfil.profesion.trim(),
      biography: formularioPerfil.biografia.trim(),
    };

    setGuardandoPerfil(true);
    setMensajeGuardadoError('');

    try {
      await actualizarPerfil(payloadPerfil);
      await refreshUser();
      setPerfilCabecera({
        nombreCompleto: payloadPerfil.name,
        profesion: payloadPerfil.profession,
        biografia: payloadPerfil.biography,
      });
      setEstaModoEdicion(false);
      setPermitirCompletar(false);
      if (location.state?.completarPerfil) {
        navigate('/perfil', { replace: true });
      }
    } catch (error) {
      setMensajeGuardadoError('No se pudo guardar los cambios. Intenta de nuevo.');
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const abrirModalImagen = () => {
    setMensajeImagenError('');
    setEstaModalAbierto(true);
  };

  const cerrarModalImagen = () => {
    setEstaModalAbierto(false);
    setMensajeImagenError('');
  };

  const generarImagenRecortada = async () => {
    if (!imagenTemporal || !modalAvatarRef.current) {
      return null;
    }

    const imagen = new Image();
    imagen.src = imagenTemporal;

    await imagen.decode();

    const anchoContenedor = modalAvatarRef.current.clientWidth;
    const altoContenedor = modalAvatarRef.current.clientHeight;

    const escalaBase = Math.max(anchoContenedor / imagen.naturalWidth, altoContenedor / imagen.naturalHeight);
    const anchoBase = imagen.naturalWidth * escalaBase;
    const altoBase = imagen.naturalHeight * escalaBase;

    const zoomFinal = zoomImagen;
    const anchoFinal = anchoBase * zoomFinal;
    const altoFinal = altoBase * zoomFinal;

    const centroX = anchoContenedor / 2 + desplazamientoImagen.x;
    const centroY = altoContenedor / 2 + desplazamientoImagen.y;

    const x = centroX - anchoFinal / 2;
    const y = centroY - altoFinal / 2;

    const canvas = document.createElement('canvas');
    canvas.width = anchoContenedor;
    canvas.height = altoContenedor;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    ctx.drawImage(imagen, x, y, anchoFinal, altoFinal);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.92);
    });
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
      setZoomImagen(1);
      setDesplazamientoImagen({ x: 0, y: 0 });
    };
    lectorArchivo.readAsDataURL(archivoSeleccionado);
  };

  const confirmarNuevaImagen = async () => {
    let archivo = inputImagenRef.current?.files?.[0];

    if (!archivo) {
      setMensajeImagenError('Selecciona una imagen antes de continuar.');
      return;
    }

    try {
      if (imagenTemporal) {
        const recorte = await generarImagenRecortada();
        if (recorte) {
          archivo = new File([recorte], 'foto-perfil.webp', {
            type: recorte.type || 'image/webp',
          });
        }
      }

      const respuesta = await subirFoto(archivo);
      const nuevaUrl = respuesta?.data?.photo_url;
      await refreshUser();
      if (nuevaUrl) {
        setImagenPerfil(normalizarUrlImagen(nuevaUrl));
      } else if (imagenTemporal) {
        setImagenPerfil(imagenTemporal);
      }
      if (inputImagenRef.current) {
        inputImagenRef.current.value = '';
      }
      setImagenTemporal('');
      setEstaModalAbierto(false);
      setMensajeImagenError('');
    } catch (error) {
      setMensajeImagenError('No se pudo subir la imagen. Intenta de nuevo.');
    }
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
    setMensajeGuardadoError('');
    setEstaModoEdicion(false);
  };

  const manejarHabilitarEdicion = () => {
    setFormularioPerfil({
      nombreCompleto: perfilCabecera.nombreCompleto,
      profesion: perfilCabecera.profesion,
      biografia: perfilCabecera.biografia,
    });
    setErroresFormulario({});
    setEstaModoEdicion(true);
    setMensajeGuardadoError('');
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
  const limitarDesplazamiento = (x, y, zoom, contenedor) => {
    if (!contenedor) {
      return { x, y };
    }

    const tamanio = Math.min(contenedor.clientWidth, contenedor.clientHeight);
    const margen = Math.max(0, (tamanio * (zoom - 1)) / 2);

    return {
      x: Math.min(margen, Math.max(-margen, x)),
      y: Math.min(margen, Math.max(-margen, y)),
    };
  };
  const estiloRecorteImagen = {
    transform: `translate(${desplazamientoImagen.x}px, ${desplazamientoImagen.y}px) scale(${zoomImagen})`,
  };

  return (
    <div className="softsave-profile">
      <div className="softsave-profile__container">
        <section className="softsave-profile__card">
          <div className="softsave-profile__banner">
            <div className="softsave-profile__avatar-wrap">
              <div className="softsave-profile__avatar">
                {imagenPerfil ? (
                  <img
                    src={imagenPerfil}
                    alt="Foto de perfil"
                    className="softsave-profile__avatar-img"
                    draggable={false}
                  />
                ) : inicialesPerfil ? (
                  <span className="softsave-profile__avatar-initials">
                    {inicialesPerfil}
                  </span>
                ) : (
                  <Icon
                    path={mdiAccount}
                    size={1.6}
                    className="softsave-profile__avatar-icon"
                  />
                )}
              </div>

              <button
                type="button"
                onClick={abrirModalImagen}
                className="softsave-profile__avatar-button"
                aria-label="Añadir o actualizar fotografia de perfil"
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
                  className={`softsave-profile__tab ${seccionActiva === seccion.id ? "is-active" : ""}`}
                  aria-current={
                    seccionActiva === seccion.id ? "page" : undefined
                  }
                >
                  {seccion.label}
                </Link>
              ))}
            </div>

            <div className="softsave-profile__header-row">
              <div>
                <h1 className="softsave-profile__name">
                  {perfilCabecera.nombreCompleto || "Completa tu perfil"}
                </h1>
                <p className="softsave-profile__role">
                  {perfilCabecera.profesion ||
                    "Agrega tu profesion para mostrar tu especialidad."}
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
                <p className="softsave-profile__bio">
                  {perfilCabecera.biografia ||
                    "Tu biografia aparecera aqui cuando completes la informacion personal."}
                </p>
              </div>
            </div>
          </div>

          <div className="softsave-profile__grid softsave-profile__grid--single">
            <section className="softsave-profile__form-card">
              <h2 className="softsave-profile__form-title">
                Configuracion de Perfil
              </h2>
              <p className="softsave-profile__form-subtitle">
                Personaliza como te ven otros desarrolladores y reclutadores.
              </p>

              {edicionDisponible && estaModoEdicion ? (
                <form
                  className="softsave-profile__form"
                  onSubmit={manejarGuardarCambios}
                >
                  <label className="softsave-profile__field">
                    <span className="softsave-profile__label">
                      Nombre Completo
                    </span>
                    <input
                      type="text"
                      name="nombreCompleto"
                      value={formularioPerfil.nombreCompleto}
                      onChange={manejarCambioFormulario}
                      maxLength={20}
                      className="softsave-input softsave-profile__input"
                      placeholder="Ej. Alejandra Garcia"
                    />
                    {erroresFormulario.nombreCompleto && (
                      <span
                        className="error-text softsave-profile__error-text"
                        role="alert"
                      >
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
                      maxLength={20}
                      className="softsave-input softsave-profile__input"
                      placeholder="Ej. Senior Full Stack Developer"
                    />
                    {erroresFormulario.profesion && (
                      <span
                        className="error-text softsave-profile__error-text"
                        role="alert"
                      >
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
                      maxLength={100}
                      className="softsave-input softsave-profile__textarea"
                      placeholder="Cuentanos sobre tu trayectoria, tecnologias favoritas y que te apasiona construir."
                    />
                    {erroresFormulario.biografia && (
                      <span className="error-text softsave-profile__error-text" role="alert">
                        {erroresFormulario.biografia}
                      </span>
                    )}
                  </label>

                  <div className="softsave-profile__actions">
                    <button
                      type="submit"
                      className="softsave-button softsave-profile__primary-button"
                      disabled={guardandoPerfil}
                    >
                      <Icon path={mdiContentSaveOutline} size={0.8} />
                      {guardandoPerfil ? "Guardando..." : "Guardar cambios"}
                    </button>
                    <button
                      type="button"
                      className="softsave-profile__secondary-button"
                      onClick={manejarDescartarCambios}
                    >
                      Descartar
                    </button>
                  </div>

                  {mensajeGuardadoError ? (
                    <span
                      className="error-text softsave-profile__error-text"
                      role="alert"
                    >
                      {mensajeGuardadoError}
                    </span>
                  ) : null}
                </form>
              ) : (
                <div className="softsave-profile__view">
                  <div className="softsave-profile__view-row">
                    <span className="softsave-profile__view-label">
                      Nombre completo
                    </span>
                    <p className="softsave-profile__view-value">
                      {perfilCabecera.nombreCompleto || "Sin registrar"}
                    </p>
                  </div>
                  <div className="softsave-profile__view-row">
                    <span className="softsave-profile__view-label">
                      Profesion
                    </span>
                    <p className="softsave-profile__view-value">
                      {perfilCabecera.profesion || "Sin registrar"}
                    </p>
                  </div>
                  <div className="softsave-profile__view-row">
                    <span className="softsave-profile__view-label">
                      Biografia
                    </span>
                    <p className="softsave-profile__view-value">
                      {perfilCabecera.biografia || "Sin registrar"}
                    </p>
                  </div>
                  <div className="softsave-profile__actions">
                    <button
                      type="button"
                      className="softsave-button softsave-profile__primary-button"
                      onClick={manejarHabilitarEdicion}
                      disabled
                      title="Editar perfil"
                    >
                      Editar perfil
                    </button>
                  </div>
                </div>
              )}
            </section>

            <aside className="softsave-profile__aside softsave-profile__aside--hidden">
              {/* TODO Sprint fuera de alcance: Stack Tecnologico y Enlaces Sociales. */}
              {/*
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
              */}
            </aside>
          </div>
        </section>
      </div>

      {estaModalAbierto ? (
        <div
          className="softsave-profile__modal-overlay"
          role="dialog"
          aria-modal="true"
          >
            <div className="softsave-profile__modal softsave-profile__modal--editor">
              <header className="softsave-profile__modal-header softsave-profile__modal-header--editor">
                <h3 className="softsave-profile__modal-title">Editar imagen</h3>
                <button
                  type="button"
                  onClick={cerrarModalImagen}
                  className="softsave-profile__icon-button"
                  aria-label="Cerrar modal"
                >
                  <Icon path={mdiClose} size={1} />
                </button>
              </header>

              <div className="softsave-profile__editor">
                <section className="softsave-profile__editor-preview">
                  <div
                    ref={modalAvatarRef}
                    className="softsave-profile__editor-canvas"
                      onPointerDown={(evento) => {
                        if (!vistaPreviaModal) {
                          return;
                        }

                        if (evento.button !== 0) {
                          return;
                        }

                        evento.preventDefault();
                        arrastreImagenRef.current = {
                          activo: true,
                          inicioX: evento.clientX,
                          inicioY: evento.clientY,
                          baseX: desplazamientoImagen.x,
                          baseY: desplazamientoImagen.y,
                        };
                      }}
                      onPointerMove={(evento) => {
                        const estadoArrastre = arrastreImagenRef.current;

                        if (!estadoArrastre.activo) {
                          return;
                        }

                        const deltaX = evento.clientX - estadoArrastre.inicioX;
                        const deltaY = evento.clientY - estadoArrastre.inicioY;
                        const nuevo = limitarDesplazamiento(
                          estadoArrastre.baseX + deltaX,
                          estadoArrastre.baseY + deltaY,
                          zoomImagen,
                          modalAvatarRef.current,
                        );

                        setDesplazamientoImagen(nuevo);
                      }}
                      onPointerLeave={() => {
                        arrastreImagenRef.current.activo = false;
                      }}
                      onPointerUp={() => {
                        arrastreImagenRef.current.activo = false;
                      }}
                      onPointerCancel={() => {
                        arrastreImagenRef.current.activo = false;
                      }}
                      onWheel={(evento) => {
                        if (!vistaPreviaModal) {
                          return;
                        }

                        evento.preventDefault();
                        evento.stopPropagation();
                        const delta = -evento.deltaY * 0.0015;
                        const nuevoZoom = Math.min(
                          2.5,
                          Math.max(1, zoomImagen + delta),
                        );
                        const nuevo = limitarDesplazamiento(
                          desplazamientoImagen.x,
                          desplazamientoImagen.y,
                          nuevoZoom,
                          modalAvatarRef.current,
                        );

                        setZoomImagen(nuevoZoom);
                        setDesplazamientoImagen(nuevo);
                      }}
                  >
                    {vistaPreviaModal ? (
                      <img
                        src={vistaPreviaModal}
                        alt="Vista previa"
                        className="softsave-profile__editor-image"
                        style={estiloRecorteImagen}
                        draggable={false}
                        onDragStart={(evento) => evento.preventDefault()}
                      />
                    ) : (
                      <Icon
                        path={mdiImageOutline}
                        size={2.2}
                        className="softsave-profile__panel-icon"
                      />
                    )}
                    <div className="softsave-profile__editor-mask" aria-hidden="true" />
                  </div>
                </section>

                <aside className="softsave-profile__editor-panel">
                  <div className="softsave-profile__editor-section">
                    <span className="softsave-profile__editor-label">Zoom</span>
                    <input
                      type="range"
                      min="1"
                      max="2.5"
                      step="0.01"
                      value={zoomImagen}
                      onChange={(evento) => {
                        const nuevoZoom = Number(evento.target.value);
                        const nuevo = limitarDesplazamiento(
                          desplazamientoImagen.x,
                          desplazamientoImagen.y,
                          nuevoZoom,
                          modalAvatarRef.current,
                        );
                        setZoomImagen(nuevoZoom);
                        setDesplazamientoImagen(nuevo);
                      }}
                      className="softsave-profile__editor-range"
                    />
                    <p className="softsave-profile__editor-hint">
                      Arrastra la imagen o usa la rueda del mouse para ajustar.
                    </p>
                    <p className="softsave-profile__editor-meta">
                      Imagen máxima: 10MB. Formatos: JPG, PNG, WEBP.
                    </p>
                  </div>

                  <input
                    ref={inputImagenRef}
                    type="file"
                    accept="image/*"
                    onChange={manejarSeleccionImagen}
                    className="softsave-profile__file-input"
                  />

                  <div className="softsave-profile__modal-actions softsave-profile__modal-actions--panel">
                    <button
                      type="button"
                      className="softsave-profile__file-button"
                      onClick={manejarClickSelectorImagen}
                    >
                      <Icon path={mdiCameraOutline} size={0.8} />
                      Seleccionar Imagen
                    </button>
                    <button
                      type="button"
                      className="softsave-button"
                      onClick={confirmarNuevaImagen}
                    >
                      Guardar cambios
                    </button>
                  </div>

                  {mensajeImagenError ? (
                    <p
                      className="error-text softsave-profile__error-text softsave-profile__error-text--center"
                      role="alert"
                    >
                      {mensajeImagenError}
                    </p>
                  ) : null}
                </aside>
              </div>
            </div>
          </div>
        ) : null}
    </div>
  );
}

export default ProfileSettings;
