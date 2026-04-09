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

const COLOR_PRIMARIO = '#E65100';
const COLOR_PIZARRA = '#2C3E50';
const COLOR_FONDO = '#F4F7FB';
const COLOR_BANNER = '#7A8694';
const COLOR_EXITO = '#27AE60';
const COLOR_ERROR = '#E74C3C';

const SECCIONES_PERFIL = [
  { id: 'contacto', label: 'Información de contacto', route: '/perfil/contacto' },
  { id: 'academica', label: 'Trayectoria académica', route: '/perfil/academica' },
  { id: 'github', label: 'Ecosistema de GitHub', route: '/perfil/github' },
];

const estilos = {
  pagina: {
    minHeight: '100vh',
    backgroundColor: COLOR_FONDO,
    padding: '32px 20px 48px',
    color: COLOR_PIZARRA,
  },
  contenedor: {
    maxWidth: '1120px',
    margin: '0 auto',
    fontFamily: 'Roboto, sans-serif',
  },
  barraSuperior: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '24px',
  },
  marca: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logo: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'grid',
    placeItems: 'center',
    background: `linear-gradient(135deg, ${COLOR_PRIMARIO} 0%, #ffb36b 100%)`,
    color: '#FFFFFF',
    fontFamily: 'Poppins, sans-serif',
    fontWeight: 700,
    fontSize: '1.1rem',
  },
  marcaTexto: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1.05,
  },
  marcaTitulo: {
    fontFamily: 'Poppins, sans-serif',
    fontWeight: 700,
    fontSize: '1.3rem',
  },
  marcaSubtitulo: {
    color: '#73808C',
    fontSize: '0.82rem',
  },
  navegacion: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    flexWrap: 'wrap',
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    color: '#44515E',
    fontSize: '0.78rem',
    fontWeight: 600,
  },
  navActivo: {
    color: COLOR_PIZARRA,
    borderBottom: `2px solid ${COLOR_PIZARRA}`,
    paddingBottom: '4px',
  },
  tarjetaPrincipal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '18px',
    boxShadow: '0 14px 32px rgba(44, 62, 80, 0.08)',
    overflow: 'hidden',
  },
  banner: {
    position: 'relative',
    height: '138px',
    backgroundColor: COLOR_BANNER,
  },
  avatarContenedor: {
    position: 'absolute',
    left: '28px',
    bottom: '-34px',
  },
  avatar: {
    width: '76px',
    height: '76px',
    borderRadius: '999px',
    backgroundColor: COLOR_PRIMARIO,
    display: 'grid',
    placeItems: 'center',
    overflow: 'hidden',
    border: '4px solid #FFFFFF',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.14)',
  },
  avatarImagen: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarBoton: {
    position: 'absolute',
    top: '0',
    right: '-2px',
    width: '28px',
    height: '28px',
    borderRadius: '999px',
    border: '2px solid #E5E7EB',
    backgroundColor: '#FFFFFF',
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 8px 14px rgba(0, 0, 0, 0.12)',
  },
  contenidoCabecera: {
    padding: '44px 28px 22px',
  },
  tabs: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    flexWrap: 'wrap',
    marginBottom: '10px',
  },
  tabLink: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 2px 8px',
    borderBottom: '2px solid transparent',
    color: '#44515E',
    fontSize: '0.9rem',
    fontWeight: 700,
    textDecoration: 'none',
  },
  tabActivo: {
    color: COLOR_PIZARRA,
    borderBottom: `2px solid ${COLOR_PRIMARIO}`,
  },
  filaCabecera: {
    display: 'grid',
    gridTemplateColumns: 'minmax(180px, 230px) minmax(0, 1fr)',
    gap: '18px',
    alignItems: 'start',
  },
  nombrePerfil: {
    fontFamily: 'Poppins, sans-serif',
    fontSize: '1.7rem',
    fontWeight: 700,
    margin: 0,
  },
  profesionPerfil: {
    margin: '6px 0 10px',
    color: '#5F6C7B',
    fontWeight: 500,
  },
  enlacePerfil: {
    color: '#6C5CE7',
    fontSize: '0.82rem',
    fontWeight: 500,
    textDecoration: 'none',
  },
  descripcionPerfil: {
    margin: '12px 0 0',
    color: '#708090',
    fontSize: '0.95rem',
    lineHeight: 1.6,
  },
  grillaContenido: {
    display: 'grid',
    gridTemplateColumns: '180px minmax(0, 1fr) 300px',
    gap: '28px',
    padding: '0 28px 28px',
    alignItems: 'start',
  },
  botonLateralLink: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: '70px',
    border: 'none',
    borderRadius: '16px',
    backgroundColor: COLOR_PRIMARIO,
    color: '#FFFFFF',
    padding: '12px 18px',
    fontSize: '1rem',
    fontWeight: 700,
    textAlign: 'center',
    textDecoration: 'none',
    boxShadow: '0 14px 24px rgba(230, 81, 0, 0.24)',
  },
  formularioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    boxShadow: '0 14px 28px rgba(44, 62, 80, 0.08)',
    padding: '28px',
  },
  tituloFormulario: {
    margin: 0,
    fontFamily: 'Poppins, sans-serif',
    fontSize: '2rem',
    fontWeight: 700,
  },
  subtituloFormulario: {
    marginTop: '6px',
    color: '#73808C',
    fontSize: '0.9rem',
  },
  formulario: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    marginTop: '22px',
  },
  grupoCampo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  etiquetaCampo: {
    fontSize: '0.78rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  campoEntrada: {
    width: '100%',
    border: 'none',
    borderBottom: '2px solid #D7DEE6',
    padding: '10px 0',
    fontSize: '0.98rem',
    outline: 'none',
    color: COLOR_PIZARRA,
    backgroundColor: 'transparent',
  },
  campoArea: {
    minHeight: '110px',
    resize: 'vertical',
    border: '1px solid #D7DEE6',
    borderRadius: '12px',
    padding: '12px 14px',
    fontSize: '0.95rem',
    outline: 'none',
    color: COLOR_PIZARRA,
    backgroundColor: '#FBFCFD',
  },
  textoAyuda: {
    fontSize: '0.8rem',
    color: '#8A97A4',
  },
  errorTexto: {
    fontSize: '0.8rem',
    color: COLOR_ERROR,
    fontWeight: 600,
  },
  filaAcciones: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap',
    marginTop: '8px',
  },
  botonPrincipal: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    border: 'none',
    borderRadius: '10px',
    backgroundColor: COLOR_PRIMARIO,
    color: '#FFFFFF',
    padding: '12px 18px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 10px 18px rgba(230, 81, 0, 0.24)',
  },
  botonSecundario: {
    border: 'none',
    backgroundColor: 'transparent',
    color: '#44515E',
    padding: '10px 0',
    fontWeight: 700,
    cursor: 'pointer',
  },
  estadoCompletado: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '999px',
    padding: '8px 12px',
    backgroundColor: 'rgba(39, 174, 96, 0.12)',
    color: COLOR_EXITO,
    fontSize: '0.84rem',
    fontWeight: 700,
  },
  miniPaneles: {
    display: 'grid',
    gap: '18px',
  },
  miniPanel: {
    backgroundColor: '#EAF1FF',
    borderRadius: '18px',
    padding: '20px',
    boxShadow: '0 10px 18px rgba(44, 62, 80, 0.06)',
  },
  miniTitulo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: 700,
    fontSize: '1.05rem',
    marginBottom: '16px',
  },
  listaAcciones: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  chipContenedor: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  botonChip: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '36px',
    padding: '8px 14px',
    borderRadius: '999px',
    border: 'none',
    backgroundColor: '#CFE7FF',
    color: COLOR_PIZARRA,
    fontSize: '0.92rem',
    fontWeight: 500,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  botonEliminarChip: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    border: 'none',
    borderRadius: '999px',
    backgroundColor: '#FFFFFF',
    color: COLOR_ERROR,
    cursor: 'pointer',
  },
  botonAnadir: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '38px',
    padding: '8px 18px',
    borderRadius: '999px',
    border: '1.5px solid #1170B8',
    backgroundColor: '#FFFFFF',
    color: '#1170B8',
    fontSize: '0.96rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  formularioMini: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '14px',
  },
  entradaMini: {
    width: '100%',
    border: '1px solid #BCD2F3',
    borderRadius: '12px',
    padding: '10px 12px',
    fontSize: '0.92rem',
    outline: 'none',
    color: COLOR_PIZARRA,
    backgroundColor: '#FFFFFF',
  },
  filaMiniAcciones: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  botonMiniPrimario: {
    border: 'none',
    borderRadius: '10px',
    backgroundColor: COLOR_PRIMARIO,
    color: '#FFFFFF',
    padding: '9px 14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  botonMiniSecundario: {
    border: 'none',
    borderRadius: '10px',
    backgroundColor: 'transparent',
    color: '#4B5A69',
    padding: '9px 6px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  textoVacio: {
    margin: 0,
    color: '#728194',
    fontSize: '0.92rem',
    lineHeight: 1.5,
  },
  overlayModal: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 50,
  },
  modal: {
    width: 'min(100%, 460px)',
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    boxShadow: '0 18px 40px rgba(15, 23, 42, 0.25)',
    padding: '24px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '20px',
  },
  modalTitulo: {
    margin: 0,
    fontFamily: 'Poppins, sans-serif',
    fontSize: '1.25rem',
    fontWeight: 700,
    color: COLOR_PIZARRA,
  },
  modalTexto: {
    margin: '6px 0 0',
    fontSize: '0.9rem',
    color: '#73808C',
    lineHeight: 1.5,
  },
  modalAvatar: {
    width: '116px',
    height: '116px',
    margin: '0 auto 18px',
    borderRadius: '999px',
    border: `2px dashed ${COLOR_PRIMARIO}`,
    backgroundColor: '#FFF4EC',
    display: 'grid',
    placeItems: 'center',
    overflow: 'hidden',
  },
  modalAcciones: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: '12px',
  },
  botonArchivo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    border: `1px solid ${COLOR_PRIMARIO}`,
    borderRadius: '10px',
    backgroundColor: '#FFFFFF',
    color: COLOR_PRIMARIO,
    padding: '12px 16px',
    fontWeight: 700,
    cursor: 'pointer',
  },
};

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

  const eliminarHabilidad = (habilidadAEliminar) => {
    setHabilidades((estadoActual) =>
      estadoActual.filter((habilidad) => habilidad !== habilidadAEliminar),
    );
  };

  const eliminarEnlaceSocial = (idEnlace) => {
    setEnlacesSociales((estadoActual) =>
      estadoActual.filter((enlaceSocial) => enlaceSocial.id !== idEnlace),
    );
  };

  const vistaPreviaModal = imagenTemporal || imagenPerfil;

  return (
    <div style={estilos.pagina}>
      <div style={estilos.contenedor}>
        <header style={estilos.barraSuperior}>
          <div style={estilos.marca}>
            <div style={estilos.logo}>{'{S}'}</div>
            <div style={estilos.marcaTexto}>
              <span style={estilos.marcaTitulo}>DevStack</span>
              <span style={estilos.marcaSubtitulo}>Perfil profesional</span>
            </div>
          </div>

          <nav style={estilos.navegacion} aria-label="Navegacion principal del perfil">
            <div style={estilos.navItem}>
              <Icon path={mdiHome} size={1} />
              <span>Inicio</span>
            </div>
            <div style={estilos.navItem}>
              <Icon path={mdiCodeTags} size={1} />
              <span>Mi portafolio</span>
            </div>
            <div style={{ ...estilos.navItem, ...estilos.navActivo }}>
              <Icon path={mdiAccount} size={1} />
              <span>Mi perfil</span>
            </div>
          </nav>
        </header>

        <section style={estilos.tarjetaPrincipal}>
          <div style={estilos.banner}>
            <div style={estilos.avatarContenedor}>
              <div style={estilos.avatar}>
                {imagenPerfil ? (
                  <img src={imagenPerfil} alt="Foto de perfil" style={estilos.avatarImagen} />
                ) : inicialesPerfil ? (
                  <span
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '1.35rem',
                    }}
                  >
                    {inicialesPerfil}
                  </span>
                ) : (
                  <Icon path={mdiAccount} size={1.6} color="#FFFFFF" />
                )}
              </div>

              <button
                type="button"
                onClick={abrirModalImagen}
                style={estilos.avatarBoton}
                aria-label="Anadir o actualizar fotografia de perfil"
              >
                <Icon path={mdiPlus} size={0.7} color={COLOR_PRIMARIO} />
              </button>
            </div>
          </div>

          <div style={estilos.contenidoCabecera}>
            <div style={estilos.tabs}>
              {SECCIONES_PERFIL.map((seccion) => (
                <Link
                  key={seccion.id}
                  to={seccion.route}
                  style={{
                    ...estilos.tabLink,
                    ...(seccionActiva === seccion.id ? estilos.tabActivo : {}),
                  }}
                >
                  {seccion.label}
                </Link>
              ))}
            </div>

            <div style={estilos.filaCabecera}>
              <div>
                <h1 style={estilos.nombrePerfil}>
                  {perfilCabecera.nombreCompleto || 'Completa tu perfil'}
                </h1>
                <p style={estilos.profesionPerfil}>
                  {perfilCabecera.profesion || 'Agrega tu profesion para mostrar tu especialidad.'}
                </p>
                {enlacesSociales[0]?.url ? (
                  <a href={enlacesSociales[0].url} style={estilos.enlacePerfil} target="_blank" rel="noreferrer">
                    {enlacesSociales[0].label}
                  </a>
                ) : null}
              </div>

              <div>
                {estadoHu07 === 'completado' && (
                  <span style={estilos.estadoCompletado}>Estado HU-07: completado</span>
                )}
                <p style={estilos.descripcionPerfil}>
                  {perfilCabecera.biografia || 'Tu biografia aparecera aqui cuando completes la informacion personal.'}
                </p>
              </div>
            </div>
          </div>

          <div style={estilos.grillaContenido}>
            <aside>
              <Link to="/perfil/contacto" style={estilos.botonLateralLink}>
                Información de contacto
              </Link>
            </aside>

            <section style={estilos.formularioCard}>
              <h2 style={estilos.tituloFormulario}>Configuracion de Perfil</h2>
              <p style={estilos.subtituloFormulario}>
                Personaliza como te ven otros desarrolladores y reclutadores.
              </p>

              <form style={estilos.formulario} onSubmit={manejarGuardarCambios}>
                <label style={estilos.grupoCampo}>
                  <span style={estilos.etiquetaCampo}>Nombre Completo</span>
                  <input
                    type="text"
                    name="nombreCompleto"
                    value={formularioPerfil.nombreCompleto}
                    onChange={manejarCambioFormulario}
                    style={estilos.campoEntrada}
                    placeholder="Ej. Alejandra Garcia"
                  />
                  {erroresFormulario.nombreCompleto && (
                    <span style={estilos.errorTexto}>{erroresFormulario.nombreCompleto}</span>
                  )}
                </label>

                <label style={estilos.grupoCampo}>
                  <span style={estilos.etiquetaCampo}>Profesion</span>
                  <input
                    type="text"
                    name="profesion"
                    value={formularioPerfil.profesion}
                    onChange={manejarCambioFormulario}
                    style={estilos.campoEntrada}
                    placeholder="Ej. Senior Full Stack Developer"
                  />
                  {erroresFormulario.profesion && (
                    <span style={estilos.errorTexto}>{erroresFormulario.profesion}</span>
                  )}
                </label>

                <label style={estilos.grupoCampo}>
                  <span style={estilos.etiquetaCampo}>Biografia</span>
                  <textarea
                    name="biografia"
                    value={formularioPerfil.biografia}
                    onChange={manejarCambioFormulario}
                    style={estilos.campoArea}
                    placeholder="Cuentanos sobre tu trayectoria, tecnologias favoritas y que te apasiona construir."
                  />
                  <span style={estilos.textoAyuda}>
                    Esta vista implementa exclusivamente la HU-07 y la HU-13.
                  </span>
                </label>

                <div style={estilos.filaAcciones}>
                  <button type="submit" style={estilos.botonPrincipal}>
                    <Icon path={mdiContentSaveOutline} size={0.8} />
                    Guardar cambios
                  </button>
                  <button
                    type="button"
                    style={estilos.botonSecundario}
                    onClick={() => {
                      setFormularioPerfil({
                        nombreCompleto: perfilCabecera.nombreCompleto,
                        profesion: perfilCabecera.profesion,
                        biografia: perfilCabecera.biografia,
                      });
                      setErroresFormulario({});
                      setMensajeGuardado('');
                    }}
                  >
                    Descartar
                  </button>
                </div>

                {mensajeGuardado ? <span style={estilos.estadoCompletado}>{mensajeGuardado}</span> : null}
              </form>
            </section>

            <aside style={estilos.miniPaneles}>
              <div style={estilos.miniPanel}>
                <div style={estilos.miniTitulo}>
                  <Icon path={mdiCodeTags} size={0.92} color={COLOR_PRIMARIO} />
                  <span>Stack Tecnologico</span>
                </div>

                {habilidades.length > 0 ? (
                  <div style={estilos.listaAcciones}>
                    {habilidades.map((habilidad) => (
                      <div key={habilidad} style={estilos.chipContenedor}>
                        <button type="button" style={estilos.botonChip}>
                          {habilidad}
                        </button>
                        <button
                          type="button"
                          style={estilos.botonEliminarChip}
                          onClick={() => eliminarHabilidad(habilidad)}
                          aria-label={`Eliminar ${habilidad}`}
                        >
                          <Icon path={mdiDeleteOutline} size={0.7} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={estilos.textoVacio}>Aun no agregaste tecnologias a tu perfil.</p>
                )}

                <div style={{ marginTop: '14px' }}>
                  <button
                    type="button"
                    style={estilos.botonAnadir}
                    onClick={() => {
                      setEstaFormularioSkillAbierto((estadoActual) => !estadoActual);
                      setMensajeSkillError('');
                    }}
                  >
                    + Añadir
                  </button>
                </div>

                {estaFormularioSkillAbierto ? (
                  <div style={estilos.formularioMini}>
                    <input
                      type="text"
                      value={nuevaHabilidad}
                      onChange={(evento) => {
                        setNuevaHabilidad(evento.target.value);
                        setMensajeSkillError('');
                      }}
                      placeholder="Ej. React, Node.js, Docker"
                      style={estilos.entradaMini}
                    />
                    <div style={estilos.filaMiniAcciones}>
                      <button type="button" style={estilos.botonMiniPrimario} onClick={manejarAgregarHabilidad}>
                        Guardar
                      </button>
                      <button
                        type="button"
                        style={estilos.botonMiniSecundario}
                        onClick={() => {
                          setEstaFormularioSkillAbierto(false);
                          setNuevaHabilidad('');
                          setMensajeSkillError('');
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                    {mensajeSkillError ? <span style={estilos.errorTexto}>{mensajeSkillError}</span> : null}
                  </div>
                ) : null}
              </div>

              <div style={estilos.miniPanel}>
                <div style={estilos.miniTitulo}>
                  <Icon path={mdiShareVariant} size={0.92} color={COLOR_PRIMARIO} />
                  <span>Enlaces Sociales</span>
                </div>

                {enlacesSociales.length > 0 ? (
                  <div style={estilos.listaAcciones}>
                    {enlacesSociales.map((social) => (
                      <div key={social.id} style={estilos.chipContenedor}>
                        <a
                          href={social.url}
                          target="_blank"
                          rel="noreferrer"
                          style={estilos.botonChip}
                        >
                          <Icon path={social.icono} size={0.82} color={COLOR_PRIMARIO} />
                          <span style={{ marginLeft: '8px' }}>{social.label}</span>
                        </a>
                        <button
                          type="button"
                          style={estilos.botonEliminarChip}
                          onClick={() => eliminarEnlaceSocial(social.id)}
                          aria-label={`Eliminar ${social.label}`}
                        >
                          <Icon path={mdiDeleteOutline} size={0.7} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={estilos.textoVacio}>No hay enlaces sociales cargados todavia.</p>
                )}
              </div>
            </aside>
          </div>
        </section>
      </div>

      {estaModalAbierto ? (
        <div style={estilos.overlayModal} role="dialog" aria-modal="true">
          <div style={estilos.modal}>
            <div style={estilos.modalHeader}>
              <div>
                <h3 style={estilos.modalTitulo}>Anadir o Actualizar Fotografia de Perfil</h3>
                <p style={estilos.modalTexto}>
                  Selecciona una imagen de hasta 10MB. La previsualizacion se actualiza de inmediato.
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarModalImagen}
                style={{ ...estilos.botonSecundario, padding: 0 }}
                aria-label="Cerrar modal"
              >
                <Icon path={mdiClose} size={1} />
              </button>
            </div>

            <div style={estilos.modalAvatar}>
              {vistaPreviaModal ? (
                <img src={vistaPreviaModal} alt="Vista previa" style={estilos.avatarImagen} />
              ) : (
                <Icon path={mdiImageOutline} size={2.2} color={COLOR_PRIMARIO} />
              )}
            </div>

            <input
              ref={inputImagenRef}
              type="file"
              accept="image/*"
              onChange={manejarSeleccionImagen}
              style={{ display: 'none' }}
            />

            <div style={estilos.modalAcciones}>
              <button
                type="button"
                style={estilos.botonArchivo}
                onClick={() => inputImagenRef.current?.click()}
              >
                <Icon path={mdiCameraOutline} size={0.8} />
                Seleccionar Imagen
              </button>
              <button type="button" style={estilos.botonPrincipal} onClick={confirmarNuevaImagen}>
                Guardar foto
              </button>
            </div>

            {mensajeImagenError ? (
              <p style={{ ...estilos.errorTexto, textAlign: 'center', marginTop: '14px' }}>
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
