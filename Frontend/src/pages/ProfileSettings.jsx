import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '@mdi/react';
import {
  mdiAccount,
  mdiCameraOutline,
  mdiClose,
  mdiContentSaveOutline,
  mdiGithub,
  mdiImageOutline,
  mdiOpenInNew,
  mdiPlus,
  mdiSchoolOutline,
} from '@mdi/js';
import useAuth from '../hooks/useAuth';
import { actualizarPerfil, subirFoto } from '../services/authService';
import '../styles/ProfileSettings.css';

const SECCIONES_PERFIL = [
  { id: 'contacto', label: 'Información de contacto', route: '/perfil/contacto' },
  { id: 'academica', label: 'Trayectoria académica', route: '/perfil/academica' },
  { id: 'github', label: 'Ecosistema de Git Hub', route: '/perfil/github' },
];

function obtenerIniciales(nombreCompleto) {
  return nombreCompleto
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parteNombre) => parteNombre[0]?.toUpperCase())
    .join('');
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

function sanitizarTexto(valor) {
  return String(valor || '').replace(/\s+/g, ' ').trim();
}

function normalizarEnlacesProfesionales(user) {
  const enlaces = [];

  if (user?.linkedin_url) {
    enlaces.push({
      id: 'linkedin',
      label: 'LinkedIn',
      url: user.linkedin_url,
      icono: mdiAccount,
    });
  }

  if (user?.github_url) {
    enlaces.push({
      id: 'github',
      label: 'GitHub',
      url: user.github_url,
      icono: mdiGithub,
    });
  }

  return enlaces;
}

function validarUrlProfesional(valor, plataforma) {
  const limpio = sanitizarTexto(valor);

  if (!limpio) {
    return '';
  }

  const patronGitHub = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+/i;
  const patronLinkedIn = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i;
  const patron = plataforma === 'GitHub' ? patronGitHub : patronLinkedIn;

  if (!patron.test(limpio)) {
    return `Por favor, ingresa una URL válida de ${plataforma}`;
  }

  return '';
}

function ProfileSettings() {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname } = location;
  const inputImagenRef = useRef(null);
  const botonEnlacesRef = useRef(null);
  const modalAvatarRef = useRef(null);
  const arrastreImagenRef = useRef({ activo: false, inicioX: 0, inicioY: 0, baseX: 0, baseY: 0 });

  const [estaModalAbierto, setEstaModalAbierto] = useState(false);
  const [estaModalEnlacesAbierto, setEstaModalEnlacesAbierto] = useState(false);
  const [mensajeImagenError, setMensajeImagenError] = useState('');
  const [erroresFormulario, setErroresFormulario] = useState({});
  const [erroresEnlaces, setErroresEnlaces] = useState({});
  const [mensajeGuardadoError, setMensajeGuardadoError] = useState('');
  const [mensajeGuardadoExito, setMensajeGuardadoExito] = useState('');
  const [mensajeEnlacesError, setMensajeEnlacesError] = useState('');
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [guardandoEnlaces, setGuardandoEnlaces] = useState(false);
  const [estaModoEdicion, setEstaModoEdicion] = useState(false);
  const [imagenTemporal, setImagenTemporal] = useState('');
  const [imagenPerfil, setImagenPerfil] = useState(() => normalizarUrlImagen(user?.profile_photo_url));
  const [zoomImagen, setZoomImagen] = useState(1);
  const [desplazamientoImagen, setDesplazamientoImagen] = useState({ x: 0, y: 0 });
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
  const [formularioEnlaces, setFormularioEnlaces] = useState({
    githubUrl: user?.github_url || '',
    linkedinUrl: user?.linkedin_url || '',
  });

  const inicialesPerfil = useMemo(
    () => obtenerIniciales(perfilCabecera.nombreCompleto || 'Usuario'),
    [perfilCabecera.nombreCompleto],
  );
  const seccionActiva = obtenerSeccionActiva(pathname);
  const completarPerfil = Boolean(location.state?.completarPerfil);
  const enlacesProfesionales = useMemo(() => normalizarEnlacesProfesionales(user), [user]);
  const vistaPreviaModal = imagenTemporal || imagenPerfil;

  useEffect(() => {
    const algunModalAbierto = estaModalAbierto || estaModalEnlacesAbierto;

    if (!algunModalAbierto) {
      return undefined;
    }

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = overflowPrevio;
    };
  }, [estaModalAbierto, estaModalEnlacesAbierto]);

  useEffect(() => {
    if (completarPerfil) {
      setEstaModoEdicion(true);
      setMensajeGuardadoError('');
    }
  }, [completarPerfil]);

  useEffect(() => {
    if (user?.profile_photo_url) {
      setImagenPerfil(normalizarUrlImagen(user.profile_photo_url));
    }
  }, [user?.profile_photo_url]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const datosPerfil = {
      nombreCompleto: user.name || '',
      profesion: user.profession || '',
      biografia: user.biography || '',
    };

    setPerfilCabecera(datosPerfil);

    if (!estaModoEdicion) {
      setFormularioPerfil(datosPerfil);
    }

    if (!estaModalEnlacesAbierto) {
      setFormularioEnlaces({
        githubUrl: user.github_url || '',
        linkedinUrl: user.linkedin_url || '',
      });
    }
  }, [user, estaModoEdicion, estaModalEnlacesAbierto]);

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

    setMensajeGuardadoError('');
    setMensajeGuardadoExito('');
  };

  const validarFormulario = () => {
    const nuevosErrores = {};
    const nombreLimpio = sanitizarTexto(formularioPerfil.nombreCompleto);
    const profesionLimpia = sanitizarTexto(formularioPerfil.profesion);
    const biografiaLimpia = sanitizarTexto(formularioPerfil.biografia);

    if (!nombreLimpio) {
      nuevosErrores.nombreCompleto = 'El nombre es obligatorio.';
    } else if (nombreLimpio.length > 50) {
      nuevosErrores.nombreCompleto = 'El nombre debe tener máximo 50 caracteres.';
    }

    if (!profesionLimpia) {
      nuevosErrores.profesion = 'La profesión es obligatoria.';
    } else if (profesionLimpia.length > 100) {
      nuevosErrores.profesion = 'La profesión debe tener máximo 100 caracteres.';
    }

    if (biografiaLimpia.length > 1000) {
      nuevosErrores.biografia = 'La biografía debe tener máximo 1000 caracteres.';
    }

    setErroresFormulario(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarGuardarCambios = async (evento) => {
    evento.preventDefault();

    if (!estaModoEdicion || !validarFormulario()) {
      return;
    }

    const payloadPerfil = {
      name: sanitizarTexto(formularioPerfil.nombreCompleto),
      profession: sanitizarTexto(formularioPerfil.profesion),
      biography: sanitizarTexto(formularioPerfil.biografia),
      github_url: user?.github_url || null,
      linkedin_url: user?.linkedin_url || null,
    };

    setGuardandoPerfil(true);
    setMensajeGuardadoError('');
    setMensajeGuardadoExito('');

    try {
      await actualizarPerfil(payloadPerfil);
      await refreshUser();
      setPerfilCabecera({
        nombreCompleto: payloadPerfil.name,
        profesion: payloadPerfil.profession,
        biografia: payloadPerfil.biography,
      });
      setEstaModoEdicion(false);
      setMensajeGuardadoExito('Información actualizada correctamente');

      if (location.state?.completarPerfil) {
        navigate('/perfil', { replace: true });
      }
    } catch {
      setMensajeGuardadoError('No se pudieron guardar los cambios. Intenta de nuevo.');
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
    const anchoFinal = anchoBase * zoomImagen;
    const altoFinal = altoBase * zoomImagen;
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
      setMensajeImagenError('Selecciona un archivo de imagen válido.');
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
    } catch {
      setMensajeImagenError('No se pudo subir la imagen. Intenta de nuevo.');
    }
  };

  const manejarDescartarCambios = () => {
    setFormularioPerfil({
      nombreCompleto: perfilCabecera.nombreCompleto,
      profesion: perfilCabecera.profesion,
      biografia: perfilCabecera.biografia,
    });
    setErroresFormulario({});
    setMensajeGuardadoError('');
    setMensajeGuardadoExito('');
    setEstaModoEdicion(false);
  };

  const manejarHabilitarEdicion = () => {
    setFormularioPerfil({
      nombreCompleto: perfilCabecera.nombreCompleto,
      profesion: perfilCabecera.profesion,
      biografia: perfilCabecera.biografia,
    });
    setErroresFormulario({});
    setMensajeGuardadoError('');
    setMensajeGuardadoExito('');
    setEstaModoEdicion(true);
  };

  const abrirModalEnlaces = () => {
    setFormularioEnlaces({
      githubUrl: user?.github_url || '',
      linkedinUrl: user?.linkedin_url || '',
    });
    setErroresEnlaces({});
    setMensajeEnlacesError('');
    setEstaModalEnlacesAbierto(true);
  };

  const cerrarModalEnlaces = () => {
    setFormularioEnlaces({
      githubUrl: user?.github_url || '',
      linkedinUrl: user?.linkedin_url || '',
    });
    setErroresEnlaces({});
    setMensajeEnlacesError('');
    setEstaModalEnlacesAbierto(false);
  };

  const manejarCambioEnlaces = (evento) => {
    const { name, value } = evento.target;

    setFormularioEnlaces((estadoActual) => ({
      ...estadoActual,
      [name]: value,
    }));

    setErroresEnlaces((estadoActual) => ({
      ...estadoActual,
      [name]: '',
    }));

    setMensajeEnlacesError('');
  };

  const validarEnlaces = () => {
    const nuevosErrores = {
      githubUrl: validarUrlProfesional(formularioEnlaces.githubUrl, 'GitHub'),
      linkedinUrl: validarUrlProfesional(formularioEnlaces.linkedinUrl, 'LinkedIn'),
    };

    const erroresFiltrados = Object.fromEntries(
      Object.entries(nuevosErrores).filter(([, valor]) => Boolean(valor)),
    );

    setErroresEnlaces(erroresFiltrados);
    return Object.keys(erroresFiltrados).length === 0;
  };

  const guardarEnlaces = async (evento) => {
    evento.preventDefault();

    if (!validarEnlaces()) {
      return;
    }

    const payload = {
      name: user?.name || '',
      profession: user?.profession || '',
      biography: user?.biography || '',
      github_url: sanitizarTexto(formularioEnlaces.githubUrl) || null,
      linkedin_url: sanitizarTexto(formularioEnlaces.linkedinUrl) || null,
    };

    setGuardandoEnlaces(true);
    setMensajeEnlacesError('');

    try {
      await actualizarPerfil(payload);
      await refreshUser();
      setEstaModalEnlacesAbierto(false);
    } catch {
      setMensajeEnlacesError('No se pudieron guardar los enlaces profesionales.');
    } finally {
      setGuardandoEnlaces(false);
    }
  };

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

  const renderizarSeccionContacto = () => (
    <section className="softsave-profile__form-card">
      <div className="softsave-profile__section-head">
        <div>
          <h2 className="softsave-profile__form-title">Información de contacto</h2>
          <p className="softsave-profile__form-subtitle">
            Actualiza tu presentación profesional manteniendo el diseño actual del perfil.
          </p>
        </div>

        <button
          ref={botonEnlacesRef}
          type="button"
          className="softsave-button softsave-button--compact softsave-profile__section-button"
          onClick={abrirModalEnlaces}
        >
          Enlaces profesionales
        </button>
      </div>

      {mensajeGuardadoExito ? (
        <div className="success-alert softsave-profile__section-alert" role="status">
          {mensajeGuardadoExito}
        </div>
      ) : null}

      {estaModoEdicion ? (
        <form className="softsave-profile__form" onSubmit={manejarGuardarCambios}>
          <label className="softsave-profile__field">
            <span className="softsave-profile__label">Nombre Completo</span>
            <input
              type="text"
              name="nombreCompleto"
              value={formularioPerfil.nombreCompleto}
              onChange={manejarCambioFormulario}
              maxLength={50}
              className="softsave-input softsave-profile__input"
              placeholder="Ej. Alejandra García"
            />
            {erroresFormulario.nombreCompleto && (
              <span className="error-text softsave-profile__error-text" role="alert">
                {erroresFormulario.nombreCompleto}
              </span>
            )}
          </label>

          <label className="softsave-profile__field">
            <span className="softsave-profile__label">Profesión</span>
            <input
              type="text"
              name="profesion"
              value={formularioPerfil.profesion}
              onChange={manejarCambioFormulario}
              maxLength={100}
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
            <span className="softsave-profile__label">Biografía</span>
            <textarea
              name="biografia"
              value={formularioPerfil.biografia}
              onChange={manejarCambioFormulario}
              maxLength={1000}
              className="softsave-input softsave-profile__textarea"
              placeholder="Cuéntanos sobre tu trayectoria, tecnologías favoritas y qué te apasiona construir."
            />
            {erroresFormulario.biografia && (
              <span className="error-text softsave-profile__error-text" role="alert">
                {erroresFormulario.biografia}
              </span>
            )}
          </label>

          <div className="softsave-profile__link-actions">
            <button
              type="button"
              className="softsave-profile__secondary-button softsave-profile__secondary-button--pill"
              onClick={abrirModalEnlaces}
            >
              Vincular LinkedIn
            </button>
          </div>

          <div className="softsave-profile__actions">
            <button
              type="submit"
              className="softsave-button softsave-profile__primary-button"
              disabled={guardandoPerfil}
            >
              <Icon path={mdiContentSaveOutline} size={0.8} />
              {guardandoPerfil ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              className="softsave-profile__secondary-button"
              onClick={manejarDescartarCambios}
            >
              Descartar cambios
            </button>
          </div>

          {mensajeGuardadoError ? (
            <span className="error-text softsave-profile__error-text" role="alert">
              {mensajeGuardadoError}
            </span>
          ) : null}
        </form>
      ) : (
        <div className="softsave-profile__view">
          <div className="softsave-profile__view-row">
            <span className="softsave-profile__view-label">Nombre completo</span>
            <p className="softsave-profile__view-value">
              {perfilCabecera.nombreCompleto || 'Sin registrar'}
            </p>
          </div>
          <div className="softsave-profile__view-row">
            <span className="softsave-profile__view-label">Profesión</span>
            <p className="softsave-profile__view-value">
              {perfilCabecera.profesion || 'Sin registrar'}
            </p>
          </div>
          <div className="softsave-profile__view-row">
            <span className="softsave-profile__view-label">Biografía</span>
            <p className="softsave-profile__view-value">
              {perfilCabecera.biografia || 'Sin registrar'}
            </p>
          </div>

          <div className="softsave-profile__view-row">
            <span className="softsave-profile__view-label">Redes profesionales</span>
            {enlacesProfesionales.length > 0 ? (
              <div className="softsave-profile__links-list">
                {enlacesProfesionales.map((enlace) => (
                  <a
                    key={enlace.id}
                    href={enlace.url}
                    target="_blank"
                    rel="noreferrer"
                    className="softsave-profile__inline-link"
                  >
                    <Icon path={enlace.icono} size={0.8} />
                    <span>{enlace.label}</span>
                    <Icon path={mdiOpenInNew} size={0.7} />
                  </a>
                ))}
              </div>
            ) : (
              <p className="softsave-profile__view-value">Sin registrar</p>
            )}
          </div>

          <div className="softsave-profile__actions">
            <button
              type="button"
              className="softsave-button softsave-profile__primary-button"
              onClick={manejarHabilitarEdicion}
              title="Editar perfil"
            >
              Editar perfil
            </button>
          </div>
        </div>
      )}
    </section>
  );

  const renderizarSeccionAcademicaBase = () => (
    <section className="softsave-profile__form-card">
      <div className="softsave-profile__section-head">
        <div>
          <div className="softsave-profile__title-with-icon">
            <Icon path={mdiSchoolOutline} size={0.95} className="softsave-profile__panel-icon" />
            <h2 className="softsave-profile__form-title">Trayectoria académica</h2>
          </div>
          <p className="softsave-profile__form-subtitle">
            Esta sección quedó restaurada como base de navegación del perfil.
          </p>
        </div>
      </div>

      <div className="softsave-profile__view">
        <div className="softsave-profile__view-row">
          <span className="softsave-profile__view-label">Estado</span>
          <p className="softsave-profile__view-value">
            La gestión detallada de formación académica vive actualmente en Mi Portafolio.
          </p>
        </div>
        <div className="softsave-profile__actions">
          <button
            type="button"
            className="softsave-button softsave-profile__primary-button"
            onClick={() => navigate('/portafolio')}
          >
            Ir a Mi Portafolio
          </button>
        </div>
      </div>
    </section>
  );

  const renderizarSeccionGithub = () => (
    <section className="softsave-profile__form-card">
      <div className="softsave-profile__section-head">
        <div>
          <div className="softsave-profile__title-with-icon">
            <Icon path={mdiGithub} size={0.95} className="softsave-profile__panel-icon" />
            <h2 className="softsave-profile__form-title">Ecosistema de Git Hub</h2>
          </div>
          <p className="softsave-profile__form-subtitle">
            Este espacio reutiliza los enlaces profesionales guardados para mantener consistencia.
          </p>
        </div>

        <button
          type="button"
          className="softsave-button softsave-button--compact softsave-profile__section-button"
          onClick={abrirModalEnlaces}
        >
          Enlaces profesionales
        </button>
      </div>

      {user?.github_url ? (
        <a
          href={user.github_url}
          target="_blank"
          rel="noreferrer"
          className="softsave-profile__external-card"
        >
          <Icon path={mdiGithub} size={1} className="softsave-profile__panel-icon" />
          <div>
            <strong>GitHub</strong>
            <p>{user.github_url}</p>
          </div>
          <Icon path={mdiOpenInNew} size={0.9} />
        </a>
      ) : (
        <p className="softsave-profile__empty">
          Todavía no vinculaste tu cuenta de GitHub desde enlaces profesionales.
        </p>
      )}
    </section>
  );

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
                  <span className="softsave-profile__avatar-initials">{inicialesPerfil}</span>
                ) : (
                  <Icon path={mdiAccount} size={1.6} className="softsave-profile__avatar-icon" />
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
                  {perfilCabecera.profesion || 'Agrega tu profesión para mostrar tu especialidad.'}
                </p>

                {enlacesProfesionales.length > 0 ? (
                  <div className="softsave-profile__header-links">
                    {enlacesProfesionales.map((enlace) => (
                      <a
                        key={enlace.id}
                        href={enlace.url}
                        className="softsave-profile__link softsave-profile__link--chip"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Icon path={enlace.icono} size={0.72} />
                        <span>{enlace.label}</span>
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>

              <div>
                <p className="softsave-profile__bio">
                  {perfilCabecera.biografia
                    || 'Tu biografía aparecerá aquí cuando completes la información personal.'}
                </p>
              </div>
            </div>
          </div>

          <div className="softsave-profile__grid softsave-profile__grid--single">
            {seccionActiva === 'contacto' && renderizarSeccionContacto()}
            {seccionActiva === 'academica' && renderizarSeccionAcademicaBase()}
            {seccionActiva === 'github' && renderizarSeccionGithub()}
          </div>
        </section>
      </div>

      {estaModalAbierto ? (
        <div className="softsave-profile__modal-overlay" role="dialog" aria-modal="true">
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
                    if (!vistaPreviaModal || evento.button !== 0) {
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
                    const nuevoZoom = Math.min(2.5, Math.max(1, zoomImagen + delta));
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
                    <Icon path={mdiImageOutline} size={2.2} className="softsave-profile__panel-icon" />
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
                    onClick={() => inputImagenRef.current?.click()}
                  >
                    <Icon path={mdiCameraOutline} size={0.8} />
                    Seleccionar Imagen
                  </button>
                  <button type="button" className="softsave-button" onClick={confirmarNuevaImagen}>
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

      {estaModalEnlacesAbierto ? (
        <div className="softsave-profile__modal-overlay" role="dialog" aria-modal="true">
          <div className="softsave-profile__modal">
            <header className="softsave-profile__modal-header">
              <div className="softsave-profile__modal-content">
                <h3 className="softsave-profile__modal-title">Redes profesionales</h3>
                <p className="softsave-profile__modal-text">
                  Agrega tus enlaces de LinkedIn y GitHub con la misma estética del perfil.
                </p>
              </div>

              <button
                type="button"
                className="softsave-profile__icon-button"
                onClick={cerrarModalEnlaces}
                aria-label="Cerrar modal"
              >
                <Icon path={mdiClose} size={1} />
              </button>
            </header>

            <form className="softsave-profile__mini-form" onSubmit={guardarEnlaces}>
              <label className="softsave-profile__field">
                <span className="softsave-profile__label">URL de GitHub</span>
                <input
                  type="url"
                  name="githubUrl"
                  value={formularioEnlaces.githubUrl}
                  onChange={manejarCambioEnlaces}
                  placeholder="https://github.com/tu-usuario"
                  className="softsave-input softsave-profile__input"
                />
                {erroresEnlaces.githubUrl ? (
                  <span className="error-text softsave-profile__error-text" role="alert">
                    {erroresEnlaces.githubUrl}
                  </span>
                ) : null}
              </label>

              <label className="softsave-profile__field">
                <span className="softsave-profile__label">URL de LinkedIn</span>
                <input
                  type="url"
                  name="linkedinUrl"
                  value={formularioEnlaces.linkedinUrl}
                  onChange={manejarCambioEnlaces}
                  placeholder="https://www.linkedin.com/in/tu-perfil"
                  className="softsave-input softsave-profile__input"
                />
                {erroresEnlaces.linkedinUrl ? (
                  <span className="error-text softsave-profile__error-text" role="alert">
                    {erroresEnlaces.linkedinUrl}
                  </span>
                ) : null}
              </label>

              {mensajeEnlacesError ? (
                <span className="error-text softsave-profile__error-text" role="alert">
                  {mensajeEnlacesError}
                </span>
              ) : null}

              <div className="softsave-profile__modal-actions">
                <button
                  type="button"
                  className="softsave-profile__secondary-button softsave-profile__secondary-button--modal"
                  onClick={cerrarModalEnlaces}
                >
                  Cancelar
                </button>
                <button type="submit" className="softsave-button softsave-button--compact" disabled={guardandoEnlaces}>
                  {guardandoEnlaces ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ProfileSettings;
