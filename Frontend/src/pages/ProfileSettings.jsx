import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Icon from "@mdi/react";
import {
  mdiAccount,
  mdiAlertCircleOutline,
  mdiCameraOutline,
  mdiCheckCircle,
  mdiClose,
  mdiCodeTags,
  mdiCogOutline,
  mdiConsoleLine,
  mdiContentSaveOutline,
  mdiFolderOutline,
  mdiGithub,
  mdiImageOutline,
  mdiLinkedin,
  mdiMagnify,
  mdiOpenInNew,
  mdiPlus,
  mdiRefresh,
  mdiSchoolOutline,
  mdiSourceBranch,
  mdiWeb,
} from "@mdi/js";
import useAuth from "../hooks/useAuth";
import useFeedback from "../hooks/useFeedback";
import PrivacySettingsPanel from "../components/PrivacySettingsPanel";
import { actualizarPerfil, subirFoto } from "../services/authService";
import { GITHUB_REPOSITORIES_MOCK } from "../mocks/githubRepositories";
import { extractApiMessageByStatus } from "../utils/apiError";
import "../styles/ProfileSettings.css";
import "../styles/ProjectsPrivacyViews.css";

const SECCIONES_PERFIL = [
  { id: "contacto", label: "Información de contacto", route: "/perfil/contacto" },
  { id: "academica", label: "Trayectoria académica", route: "/perfil/academica" },
  { id: "github", label: "Ecosistema de Git Hub", route: "/perfil/github" },
  { id: "privacidad", label: "Privacidad", route: "/perfil/privacidad" },
];

const FOTO_LINKEDIN_MOCK = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1d4e89"/>
        <stop offset="100%" stop-color="#0a66c2"/>
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="28" fill="url(#bg)"/>
    <circle cx="64" cy="45" r="22" fill="#f4f7f6"/>
    <path d="M28 108c5-22 20-34 36-34s31 12 36 34" fill="#f4f7f6"/>
  </svg>
`)}`;

const DATOS_LINKEDIN_MOCK = {
  nombreCompleto: "Juan Pérez (LinkedIn)",
  profesion: "Senior Full Stack Engineer at TechCorp",
  fotografia: FOTO_LINKEDIN_MOCK,
  linkedinUrl: "https://www.linkedin.com/in/juan-perez-dev",
};


function obtenerIniciales(nombreCompleto) {
  return String(nombreCompleto || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parteNombre) => parteNombre[0]?.toUpperCase())
    .join("");
}

function obtenerSeccionActiva(pathname) {
  /* const seccionActiva = SECCIONES_PERFIL.find(
    ({ route }) => pathname === route,
  ); */

  if (pathname === "/perfil/privacidad") {
    return "privacidad";
  }

  const seccionActiva = SECCIONES_PERFIL.find(({ route }) => pathname === route);
  return seccionActiva?.id || "contacto";
}

function sanitizarTexto(valor) {
  return String(valor || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizarProfesion(valor) {
  return String(valor || "").replace(/[^\p{L}\p{N}\s.,\-/()&]/gu, "");
}

function esProfesionValida(valor) {
  return /^(?=.*\p{L})[\p{L}\p{N}]+(?:[ .,&()/-][\p{L}\p{N}]+)*$/u.test(valor);
}

function normalizarEnlacesProfesionales(user) {
  const enlaces = [];

  if (user?.linkedin_url) {
    enlaces.push({
      id: "linkedin",
      label: "LinkedIn",
      url: user.linkedin_url,
      icono: mdiLinkedin,
    });
  }

  if (user?.github_url) {
    enlaces.push({
      id: "github",
      label: "GitHub",
      url: user.github_url,
      icono: mdiGithub,
    });
  }

  return enlaces;
}

function validarUrlProfesional(valor, plataforma) {
  const limpio = sanitizarTexto(valor);

  if (!limpio) {
    return "";
  }

  const patronGitHub = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+/i;
  const patronLinkedIn = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i;
  const patron = plataforma === "GitHub" ? patronGitHub : patronLinkedIn;

  if (!patron.test(limpio)) {
    return `Por favor, ingresa una URL válida de ${plataforma}`;
  }

  return "";
}

function formatearTiempoRelativo(dias) {
  if (dias <= 1) {
    return "hace 1 día";
  }

  if (dias < 30) {
    return `hace ${dias} días`;
  }

  const meses = Math.round(dias / 30);
  return `hace ${meses} ${meses === 1 ? "mes" : "meses"}`;
}

function iconoRepositorio(repositorio) {
  if (repositorio.lenguajes.some(({ nombre }) => nombre === "Python")) {
    return mdiConsoleLine;
  }

  if (repositorio.lenguajes.some(({ nombre }) => nombre === "React")) {
    return mdiCodeTags;
  }

  if (repositorio.lenguajes.some(({ nombre }) => nombre === "CSS")) {
    return mdiWeb;
  }

  return mdiFolderOutline;
}

function ProfileSettings() {
  const { user, refreshUser } = useAuth();
  const { showFeedback } = useFeedback();
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname } = location;
  const inputImagenRef = useRef(null);
  const modalAvatarRef = useRef(null);
  const arrastreImagenRef = useRef({
    activo: false,
    inicioX: 0,
    inicioY: 0,
    baseX: 0,
    baseY: 0,
  });

  const [estaModalAbierto, setEstaModalAbierto] = useState(false);
  const [estaModalEnlacesAbierto, setEstaModalEnlacesAbierto] = useState(false);
  const [estaPanelLinkedinAbierto, setEstaPanelLinkedinAbierto] = useState(false);
  const [estaModalReposAbierto, setEstaModalReposAbierto] = useState(false);
  const [mensajeImagenError, setMensajeImagenError] = useState("");
  const [erroresFormulario, setErroresFormulario] = useState({});
  const [erroresEnlaces, setErroresEnlaces] = useState({});
  const [mensajeGuardadoError, setMensajeGuardadoError] = useState("");
  const [mensajeGuardadoExito, setMensajeGuardadoExito] = useState("");
  const [mensajeEnlacesError, setMensajeEnlacesError] = useState("");
  const [mensajeGithubError, setMensajeGithubError] = useState("");
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [guardandoEnlaces, setGuardandoEnlaces] = useState(false);
  const [estaEditandoPerfil, setEstaEditandoPerfil] = useState(false);
  const [simulandoLinkedin, setSimulandoLinkedin] = useState(false);
  const [estaLinkedinVinculado, setEstaLinkedinVinculado] = useState(false);
  const [linkedinSincronizado, setLinkedinSincronizado] = useState(false);
  const [vistaPreviaLinkedin, setVistaPreviaLinkedin] = useState(null);
  const [estaGithubConectado, setEstaGithubConectado] = useState(false);
  const [ultimaSyncGithub, setUltimaSyncGithub] = useState("hace 2 horas");
  const [busquedaRepos, setBusquedaRepos] = useState("");
  const [filtroRepos, setFiltroRepos] = useState("Todos");
  const [ordenRepos, setOrdenRepos] = useState("Más recientes");
  const [reposSeleccionados, setReposSeleccionados] = useState([1, 2, 3, 4, 5, 6, 7, 8]);
  const [seleccionTemporalRepos, setSeleccionTemporalRepos] = useState([1, 2, 7, 8]);
  const [imagenTemporal, setImagenTemporal] = useState("");
  const [imagenPerfil, setImagenPerfil] = useState(user?.profile_photo_url || "");
  const [zoomImagen, setZoomImagen] = useState(1);
  const [desplazamientoImagen, setDesplazamientoImagen] = useState({ x: 0, y: 0 });
  const [perfilCabecera, setPerfilCabecera] = useState({
    nombreCompleto: user?.name || "",
    profesion: user?.profession || "",
    biografia: user?.biography || "",
  });
  const [formularioPerfil, setFormularioPerfil] = useState({
    nombreCompleto: user?.name || "",
    profesion: user?.profession || "",
    biografia: user?.biography || "",
    githubUrl: user?.github_url || "",
    linkedinUrl: user?.linkedin_url || "",
  });
  const [formularioEnlaces, setFormularioEnlaces] = useState({
    githubUrl: user?.github_url || "",
    linkedinUrl: user?.linkedin_url || "",
  });

  const inicialesPerfil = useMemo(
    () => obtenerIniciales(perfilCabecera.nombreCompleto || "Usuario"),
    [perfilCabecera.nombreCompleto],
  );
  const seccionActiva = obtenerSeccionActiva(pathname);
  const completarPerfil = Boolean(location.state?.completarPerfil);
  const enlacesProfesionales = useMemo(
    () => normalizarEnlacesProfesionales(user),
    [user],
  );
  const vistaPreviaModal = imagenTemporal || imagenPerfil;
  const totalRepositoriosGithub = GITHUB_REPOSITORIES_MOCK.length;
  const repositoriosSeleccionados = useMemo(
    () => GITHUB_REPOSITORIES_MOCK.filter((repo) => reposSeleccionados.includes(repo.id)),
    [reposSeleccionados],
  );
  const repositoriosGestionados = useMemo(() => {
    const termino = sanitizarTexto(busquedaRepos).toLowerCase();

    return [...GITHUB_REPOSITORIES_MOCK]
      .filter((repositorio) => {
        const coincideBusqueda =
          !termino ||
          repositorio.nombre.toLowerCase().includes(termino) ||
          repositorio.descripcion.toLowerCase().includes(termino);

        const coincideFiltro =
          filtroRepos === "Todos" ||
          (filtroRepos === "Forks" && repositorio.esFork) ||
          (filtroRepos === "Originales" && !repositorio.esFork);

        return coincideBusqueda && coincideFiltro;
      })
      .sort((a, b) => {
        if (ordenRepos === "Más populares") {
          return b.estrellas - a.estrellas;
        }

        return a.actualizadoDias - b.actualizadoDias;
      });
  }, [busquedaRepos, filtroRepos, ordenRepos]);

  useEffect(() => {
    const algunModalAbierto =
      estaModalAbierto ||
      estaModalEnlacesAbierto ||
      estaPanelLinkedinAbierto ||
      estaModalReposAbierto;

    if (!algunModalAbierto) {
      return undefined;
    }

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = overflowPrevio;
    };
  }, [
    estaModalAbierto,
    estaModalEnlacesAbierto,
    estaPanelLinkedinAbierto,
    estaModalReposAbierto,
  ]);

  useEffect(() => {
    if (!mensajeGuardadoExito) {
      return;
    }

    showFeedback(mensajeGuardadoExito, "success");
    setMensajeGuardadoExito("");
  }, [mensajeGuardadoExito, showFeedback]);

  useEffect(() => {
    if (completarPerfil) {
      setEstaEditandoPerfil(true);
    }
  }, [completarPerfil]);

  useEffect(() => {
    if (user?.profile_photo_url) {
      setImagenPerfil(user.profile_photo_url);
    }
  }, [user?.profile_photo_url]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const datosPerfil = {
      nombreCompleto: user.name || "",
      profesion: user.profession || "",
      biografia: user.biography || "",
      githubUrl: user.github_url || "",
      linkedinUrl: user.linkedin_url || "",
    };

    setPerfilCabecera(datosPerfil);
    setFormularioPerfil(datosPerfil);
    setFormularioEnlaces({
      githubUrl: user.github_url || "",
      linkedinUrl: user.linkedin_url || "",
    });

    if (user.github_url) {
      setEstaGithubConectado(true);
    }
  }, [user]);

  const manejarCambioFormulario = (evento) => {
    const { name, value } = evento.target;
    const valorProcesado = name === "profesion" ? normalizarProfesion(value) : value;

    setFormularioPerfil((estadoActual) => ({
      ...estadoActual,
      [name]: valorProcesado,
    }));
    setErroresFormulario((estadoActual) => ({
      ...estadoActual,
      [name]: "",
    }));
    setMensajeGuardadoError("");
  };

  const validarFormulario = () => {
    const nuevosErrores = {};
    const nombreLimpio = sanitizarTexto(formularioPerfil.nombreCompleto);
    const profesionLimpia = sanitizarTexto(formularioPerfil.profesion);
    const biografiaLimpia = sanitizarTexto(formularioPerfil.biografia);
    const githubError = validarUrlProfesional(formularioPerfil.githubUrl, "GitHub");
    const linkedinError = validarUrlProfesional(formularioPerfil.linkedinUrl, "LinkedIn");

    if (!nombreLimpio) {
      nuevosErrores.nombreCompleto = "El nombre es obligatorio.";
    } else if (nombreLimpio.length > 50) {
      nuevosErrores.nombreCompleto = "El nombre debe tener máximo 50 caracteres.";
    }

    if (!profesionLimpia) {
      nuevosErrores.profesion = "La profesión es obligatoria.";
    } else if (profesionLimpia.length > 100) {
      nuevosErrores.profesion = "La profesión debe tener máximo 100 caracteres.";
    } else if (!esProfesionValida(profesionLimpia)) {
      nuevosErrores.profesion = "La profesión debe contener palabras válidas.";
    }

    if (biografiaLimpia.length > 1000) {
      nuevosErrores.biografia = "La biografía debe tener máximo 1000 caracteres.";
    }
    if (githubError) {
      nuevosErrores.githubUrl = githubError;
    }
    if (linkedinError) {
      nuevosErrores.linkedinUrl = linkedinError;
    }

    setErroresFormulario(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarGuardarCambios = async (evento) => {
    evento.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    const payloadPerfil = {
      name: sanitizarTexto(formularioPerfil.nombreCompleto),
      profession: sanitizarTexto(formularioPerfil.profesion),
      biography: sanitizarTexto(formularioPerfil.biografia),
      github_url: sanitizarTexto(formularioPerfil.githubUrl) || null,
      linkedin_url: sanitizarTexto(formularioPerfil.linkedinUrl) || null,
    };

    setGuardandoPerfil(true);
    setMensajeGuardadoError("");

    try {
      await actualizarPerfil(payloadPerfil);
      await refreshUser();
      setPerfilCabecera({
        nombreCompleto: payloadPerfil.name,
        profesion: payloadPerfil.profession,
        biografia: payloadPerfil.biography,
        githubUrl: payloadPerfil.github_url || "",
        linkedinUrl: payloadPerfil.linkedin_url || "",
      });
      setEstaEditandoPerfil(false);
      setVistaPreviaLinkedin(null);
      setLinkedinSincronizado(false);
      setMensajeGuardadoExito("Información actualizada correctamente");

      if (location.state?.completarPerfil) {
        navigate("/perfil/contacto", { replace: true });
      }
    } catch (error) {
      setMensajeGuardadoError(
        extractApiMessageByStatus(error, "No se pudieron guardar los cambios. Intenta de nuevo."),
      );
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const descartarCambiosContacto = () => {
    setFormularioPerfil({
      nombreCompleto: perfilCabecera.nombreCompleto,
      profesion: perfilCabecera.profesion,
      biografia: perfilCabecera.biografia,
    });
    setEstaEditandoPerfil(Boolean(completarPerfil));
    setVistaPreviaLinkedin(null);
    setLinkedinSincronizado(false);
    setErroresFormulario({});
    setMensajeGuardadoError("");
  };

  const alternarEdicionPerfil = () => {
    if (estaEditandoPerfil) {
      descartarCambiosContacto();
      return;
    }

    setEstaEditandoPerfil(true);
    setErroresFormulario({});
    setMensajeGuardadoError("");
  };

  const abrirModalImagen = () => {
    setMensajeImagenError("");
    setEstaModalAbierto(true);
  };

  const cerrarModalImagen = () => {
    setEstaModalAbierto(false);
    setMensajeImagenError("");
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
    const escalaBase = Math.max(
      anchoContenedor / imagen.naturalWidth,
      altoContenedor / imagen.naturalHeight,
    );
    const anchoBase = imagen.naturalWidth * escalaBase;
    const altoBase = imagen.naturalHeight * escalaBase;
    const anchoFinal = anchoBase * zoomImagen;
    const altoFinal = altoBase * zoomImagen;
    const centroX = anchoContenedor / 2 + desplazamientoImagen.x;
    const centroY = altoContenedor / 2 + desplazamientoImagen.y;
    const x = centroX - anchoFinal / 2;
    const y = centroY - altoFinal / 2;

    const canvas = document.createElement("canvas");
    canvas.width = anchoContenedor;
    canvas.height = altoContenedor;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return null;
    }

    ctx.drawImage(imagen, x, y, anchoFinal, altoFinal);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/webp", 0.92);
    });
  };

  const manejarSeleccionImagen = (evento) => {
    const archivoSeleccionado = evento.target.files?.[0];

    if (!archivoSeleccionado) {
      return;
    }

    if (archivoSeleccionado.size > 10 * 1024 * 1024) {
      setMensajeImagenError("La imagen no puede superar los 10MB.");
      return;
    }

    if (!archivoSeleccionado.type.startsWith("image/")) {
      setMensajeImagenError("Selecciona un archivo de imagen válido.");
      return;
    }

    const lectorArchivo = new FileReader();
    lectorArchivo.onload = () => {
      setImagenTemporal(String(lectorArchivo.result || ""));
      setMensajeImagenError("");
      setZoomImagen(1);
      setDesplazamientoImagen({ x: 0, y: 0 });
    };
    lectorArchivo.readAsDataURL(archivoSeleccionado);
  };

  const confirmarNuevaImagen = async () => {
    let archivo = inputImagenRef.current?.files?.[0];

    if (!archivo) {
      setMensajeImagenError("Selecciona una imagen antes de continuar.");
      return;
    }

    try {
      if (imagenTemporal) {
        const recorte = await generarImagenRecortada();
        if (recorte) {
          archivo = new File([recorte], "foto-perfil.webp", {
            type: recorte.type || "image/webp",
          });
        }
      }

      const respuesta = await subirFoto(archivo);
      const nuevaUrl = respuesta?.data?.profile_photo_url;
      await refreshUser();

      if (nuevaUrl) {
        setImagenPerfil(nuevaUrl);
      } else if (imagenTemporal) {
        setImagenPerfil(imagenTemporal);
      }

      if (inputImagenRef.current) {
        inputImagenRef.current.value = "";
      }

      setImagenTemporal("");
      setEstaModalAbierto(false);
      setMensajeImagenError("");
    } catch (error) {
      setMensajeImagenError(
        extractApiMessageByStatus(error, "No se pudo subir la imagen. Intenta de nuevo."),
      );
    }
  };

  const abrirModalEnlaces = () => {
    setFormularioEnlaces({
      githubUrl: user?.github_url || "",
      linkedinUrl: user?.linkedin_url || "",
    });
    setErroresEnlaces({});
    setMensajeEnlacesError("");
    setEstaModalEnlacesAbierto(true);
  };

  const cerrarModalEnlaces = () => {
    setFormularioEnlaces({
      githubUrl: user?.github_url || "",
      linkedinUrl: user?.linkedin_url || "",
    });
    setErroresEnlaces({});
    setMensajeEnlacesError("");
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
      [name]: "",
    }));
    setMensajeEnlacesError("");
  };

  const validarEnlaces = () => {
    const nuevosErrores = {
      githubUrl: validarUrlProfesional(formularioEnlaces.githubUrl, "GitHub"),
      linkedinUrl: validarUrlProfesional(formularioEnlaces.linkedinUrl, "LinkedIn"),
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
      name: user?.name || "",
      profession: user?.profession || "",
      biography: user?.biography || "",
      github_url: sanitizarTexto(formularioEnlaces.githubUrl) || null,
      linkedin_url: sanitizarTexto(formularioEnlaces.linkedinUrl) || null,
    };

    setGuardandoEnlaces(true);
    setMensajeEnlacesError("");

    try {
      await actualizarPerfil(payload);
      await refreshUser();
      setEstaModalEnlacesAbierto(false);
      showFeedback("Enlaces profesionales actualizados.", "success");
    } catch (error) {
      setMensajeEnlacesError(
        extractApiMessageByStatus(error, "No se pudieron guardar los enlaces profesionales."),
      );
    } finally {
      setGuardandoEnlaces(false);
    }
  };

  const abrirPanelLinkedin = () => {
    setEstaPanelLinkedinAbierto(true);
  };

  const cerrarPanelLinkedin = () => {
    if (!simulandoLinkedin) {
      setEstaPanelLinkedinAbierto(false);
    }
  };

  const vincularCuentaLinkedin = () => {
    setSimulandoLinkedin(true);

    window.setTimeout(() => {
      setEstaLinkedinVinculado(true);
      setSimulandoLinkedin(false);
      setFormularioEnlaces((estadoActual) => ({
        ...estadoActual,
        linkedinUrl: DATOS_LINKEDIN_MOCK.linkedinUrl,
      }));
    }, 900);
  };

  const sincronizarDatosLinkedin = () => {
    setFormularioPerfil((estadoActual) => ({
      ...estadoActual,
      nombreCompleto: DATOS_LINKEDIN_MOCK.nombreCompleto,
      profesion: DATOS_LINKEDIN_MOCK.profesion,
    }));
    setVistaPreviaLinkedin(DATOS_LINKEDIN_MOCK);
    setLinkedinSincronizado(true);
    setEstaPanelLinkedinAbierto(false);
    setErroresFormulario((estadoActual) => ({
      ...estadoActual,
      nombreCompleto: "",
      profesion: "",
    }));
    showFeedback(
      "Datos de LinkedIn listos para aplicarse cuando guardes los cambios.",
      "success",
    );
  };

  const desvincularCuentaLinkedin = () => {
    setEstaLinkedinVinculado(false);
    setLinkedinSincronizado(false);
    setVistaPreviaLinkedin(null);
    setFormularioEnlaces((estadoActual) => ({
      ...estadoActual,
      linkedinUrl: user?.linkedin_url || "",
    }));
    setEstaPanelLinkedinAbierto(false);
  };

  const conectarGithub = () => {
    setEstaGithubConectado(true);
    setUltimaSyncGithub("justo ahora");
    setReposSeleccionados([1, 2, 3, 4, 5, 6, 7, 8]);
    setSeleccionTemporalRepos([1, 2, 3, 4, 5, 6, 7, 8]);
    showFeedback("Cuenta de GitHub conectada con repositorios importados.", "success");
  };

  const cerrarModalRepos = () => {
    setSeleccionTemporalRepos(reposSeleccionados);
    setMensajeGithubError("");
    setBusquedaRepos("");
    setFiltroRepos("Todos");
    setOrdenRepos("Más recientes");
    setEstaModalReposAbierto(false);
  };

  const alternarSeleccionRepositorio = (repoId) => {
    setSeleccionTemporalRepos((estadoActual) => {
      if (estadoActual.includes(repoId)) {
        setMensajeGithubError("");
        return estadoActual.filter((id) => id !== repoId);
      }

      if (estadoActual.length >= 15) {
        setMensajeGithubError("Solo puedes seleccionar hasta 15 repositorios.");
        return estadoActual;
      }

      setMensajeGithubError("");
      return [...estadoActual, repoId];
    });
  };

  const marcarTodosRepositorios = () => {
    const idsVisibles = repositoriosGestionados.map((repositorio) => repositorio.id);

    if (idsVisibles.length > 15) {
      setMensajeGithubError(
        "Se seleccionaron los primeros 15 repositorios. Ajusta filtros si necesitas otros.",
      );
      setSeleccionTemporalRepos(idsVisibles.slice(0, 15));
      return;
    }

    setMensajeGithubError("");
    setSeleccionTemporalRepos(idsVisibles);
  };

  const desmarcarTodosRepositorios = () => {
    setSeleccionTemporalRepos([]);
    setMensajeGithubError("");
  };

  const sincronizarGithubAhora = () => {
    setUltimaSyncGithub("justo ahora");
    showFeedback("Repositorios actualizados desde GitHub.", "success");
  };

  const guardarSeleccionRepositorios = () => {
    setReposSeleccionados(seleccionTemporalRepos);
    setUltimaSyncGithub("justo ahora");
    setEstaModalReposAbierto(false);
    showFeedback("Selección guardada exitosamente", "success");
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
    <section className="softsave-profile__form-card softsave-profile__contact-card">
      <div className="softsave-profile__contact-hero">
        <div className="softsave-profile__contact-intro">
          <h2 className="softsave-profile__contact-title">Tu identidad profesional</h2>
          <p className="softsave-profile__contact-text">
            Manten tus datos al dia y gestiona como te ven reclutadores, clientes y equipos.
          </p>
        </div>

        <div className="softsave-profile__contact-actions">
          <button
            type="button"
            className="softsave-profile__secondary-button softsave-profile__secondary-button--pill softsave-profile__privacy-link"
            onClick={() => navigate("/perfil/privacidad")}
          >
            <Icon path={mdiCogOutline} size={0.85} />
            Configuracion de Privacidad
          </button>

          <button
            type="button"
            className="softsave-button softsave-button--compact softsave-profile__section-button"
            onClick={abrirModalEnlaces}
          >
            Enlaces profesionales
          </button>

          <button
            type="button"
            className="softsave-button softsave-profile__primary-button"
            onClick={alternarEdicionPerfil}
          >
            Editar perfil
          </button>
        </div>
      </div>

      {completarPerfil ? (
        <div className="softsave-profile__complete-banner">
          <Icon path={mdiAlertCircleOutline} size={0.9} />
          Completa tu información principal para terminar la configuración del perfil.
        </div>
      ) : null}

      <form className="softsave-profile__contact-editor" onSubmit={manejarGuardarCambios}>
        <div className="softsave-profile__contact-form-grid">
          <label className="softsave-profile__field">
            <span className="softsave-profile__label">Nombre completo</span>
            <input
              type="text"
              name="nombreCompleto"
              value={formularioPerfil.nombreCompleto}
              onChange={manejarCambioFormulario}
              readOnly={!estaEditandoPerfil}
              maxLength={50}
              className="softsave-input softsave-profile__input"
              placeholder="Ej. Juan Pérez"
            />
            {erroresFormulario.nombreCompleto ? (
              <span className="error-text softsave-profile__error-text" role="alert">
                {erroresFormulario.nombreCompleto}
              </span>
            ) : null}
          </label>

          <label className="softsave-profile__field">
            <span className="softsave-profile__label">Profesión / Título</span>
            <input
              type="text"
              name="profesion"
              value={formularioPerfil.profesion}
              onChange={manejarCambioFormulario}
              readOnly={!estaEditandoPerfil}
              maxLength={100}
              className="softsave-input softsave-profile__input"
              placeholder="Ej. Senior Full Stack Engineer"
            />
            {erroresFormulario.profesion ? (
              <span className="error-text softsave-profile__error-text" role="alert">
                {erroresFormulario.profesion}
              </span>
            ) : null}
          </label>

          <label className="softsave-profile__field softsave-profile__field--full">
            <span className="softsave-profile__label">Biografía</span>
            <textarea
              name="biografia"
              value={formularioPerfil.biografia}
              onChange={manejarCambioFormulario}
              readOnly={!estaEditandoPerfil}
              maxLength={1000}
              className="softsave-input softsave-profile__textarea"
              placeholder="Cuéntanos sobre tu enfoque, experiencia y tecnologías favoritas."
            />
            {erroresFormulario.biografia ? (
              <span className="error-text softsave-profile__error-text" role="alert">
                {erroresFormulario.biografia}
              </span>
            ) : null}
          </label>
        </div>

        {vistaPreviaLinkedin ? (
          <div className="softsave-profile__sync-preview">
            <div className="softsave-profile__sync-preview-head">
              <div>
                <p className="softsave-profile__sync-preview-title">Cambios listos para sobrescribir</p>
                <p className="softsave-profile__sync-preview-text">
                  Esta información fue importada desde LinkedIn y se aplicará al guardar.
                </p>
              </div>
              <span className="softsave-profile__sync-badge">Sincronizado</span>
            </div>

            <div className="softsave-profile__sync-preview-grid">
              <article className="softsave-profile__sync-preview-item">
                <span className="softsave-profile__view-label">Nombre actual → nuevo</span>
                <strong>{perfilCabecera.nombreCompleto || "Sin registrar"}</strong>
                <span>{vistaPreviaLinkedin.nombreCompleto}</span>
              </article>

              <article className="softsave-profile__sync-preview-item">
                <span className="softsave-profile__view-label">Titular actual → nuevo</span>
                <strong>{perfilCabecera.profesion || "Sin registrar"}</strong>
                <span>{vistaPreviaLinkedin.profesion}</span>
              </article>

              <article className="softsave-profile__sync-preview-item softsave-profile__sync-preview-item--photo">
                <span className="softsave-profile__view-label">Miniatura importada</span>
                <img
                  src={vistaPreviaLinkedin.fotografia}
                  alt="Vista previa importada desde LinkedIn"
                  className="softsave-profile__sync-avatar"
                />
              </article>
            </div>
          </div>
        ) : null}

        <div className="softsave-profile__contact-grid">
          <article className="softsave-profile__contact-item softsave-profile__contact-item--links">
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
              <p className="softsave-profile__contact-value">Sin enlaces registrados</p>
            )}
          </article>
        </div>

        <div className="softsave-profile__contact-linkedin-action">
          <button
            type="button"
            className="softsave-profile__secondary-button softsave-profile__secondary-button--linkedin softsave-profile__secondary-button--full"
            onClick={abrirPanelLinkedin}
          >
            <Icon path={mdiLinkedin} size={0.9} />
            Vincular LinkedIn
          </button>
        </div>

        {mensajeGuardadoError ? (
          <span className="error-text softsave-profile__error-text" role="alert">
            {mensajeGuardadoError}
          </span>
        ) : null}

        {estaEditandoPerfil ? (
          <div className="softsave-profile__contact-footer">
            <button
              type="button"
              className="softsave-profile__secondary-button softsave-profile__secondary-button--modal"
              onClick={descartarCambiosContacto}
              disabled={guardandoPerfil}
            >
              Descartar cambios
            </button>
            <button
              type="submit"
              className="softsave-button softsave-button--compact"
              disabled={guardandoPerfil}
            >
              <Icon path={mdiContentSaveOutline} size={0.8} />
              {guardandoPerfil ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        ) : null}
      </form>
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
            onClick={() => navigate("/portafolio")}
          >
            Ir a Mi Portafolio
          </button>
        </div>
      </div>
    </section>
  );

  const renderizarSeccionGithub = () => (
    <section className="softsave-profile__form-card softsave-profile__github-section">
      <div className="softsave-profile__section-head">
        <div>
          <div className="softsave-profile__title-with-icon">
            <Icon path={mdiGithub} size={0.95} className="softsave-profile__panel-icon" />
            <h2 className="softsave-profile__form-title">Ecosistema de Git Hub</h2>
          </div>
          <p className="softsave-profile__form-subtitle">
            Importa proyectos desde GitHub y decide cuáles aparecen en tu portafolio.
          </p>
        </div>
        <div className="softsave-profile__contact-actions">
          <button
            type="button"
            className="softsave-profile__secondary-button softsave-profile__secondary-button--pill softsave-profile__privacy-link"
            onClick={() => navigate("/perfil/privacidad")}
          >
            <Icon path={mdiCogOutline} size={0.85} />
            Configuración de privacidad
          </button>

          <button
            type="button"
            className="softsave-button softsave-button--compact softsave-profile__section-button"
            onClick={abrirModalEnlaces}
          >
            Enlaces profesionales
          </button>
        </div>
      </div>

      {!estaGithubConectado ? (
        <div className="softsave-profile__github-connect-card">
          <div className="softsave-profile__github-connect-icon">
            <Icon path={mdiSourceBranch} size={1.05} />
          </div>
          <h3 className="softsave-profile__github-connect-title">Actualiza tu Portafolio</h3>
          <p className="softsave-profile__github-connect-text">
            Importa nuevos proyectos o actualiza los existentes con un solo clic. Mantén tu
            presencia profesional al día.
          </p>
          <button
            type="button"
            className="softsave-button softsave-button--compact"
            onClick={conectarGithub}
          >
            Conectar con GitHub
            <span aria-hidden="true">→</span>
          </button>
        </div>
      ) : (
        <div className="softsave-profile__github-results">
          <div className="softsave-profile__github-status-bar">
            <div>
              <span className="softsave-profile__view-label">Proyectos importados</span>
              <h3 className="softsave-profile__github-results-title">
                Selección visible en tu portafolio
              </h3>
            </div>
            <span className="softsave-profile__repo-count-badge">
              {repositoriosSeleccionados.length} REPOSITORIOS
            </span>
          </div>

          <div className="softsave-profile__github-grid">
            {repositoriosSeleccionados.map((repositorio) => (
              <article key={repositorio.id} className="softsave-profile__repo-card">
                <div className="softsave-profile__repo-card-top">
                  <Icon
                    path={iconoRepositorio(repositorio)}
                    size={0.95}
                    className="softsave-profile__repo-card-icon"
                  />
                  <span className="softsave-profile__repo-card-stack">
                    {repositorio.lenguajes.map(({ nombre }) => nombre).join(" + ")}
                  </span>
                </div>

                <h4 className="softsave-profile__repo-card-title">{repositorio.nombre}</h4>
                <p className="softsave-profile__repo-card-description">{repositorio.descripcion}</p>

                <div className="softsave-profile__repo-card-stats">
                  <span>☆ {repositorio.estrellas}</span>
                  <span>⑂ {repositorio.forks}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
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
                aria-label="Añadir o actualizar fotografía de perfil"
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
                  aria-current={seccionActiva === seccion.id ? "page" : undefined}
                >
                  {seccion.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="softsave-profile__grid softsave-profile__grid--single">
            {seccionActiva === "privacidad" && <PrivacySettingsPanel />}
            {seccionActiva === "contacto" && renderizarSeccionContacto()}
            {seccionActiva === "academica" && renderizarSeccionAcademicaBase()}
            {seccionActiva === "github" && renderizarSeccionGithub()}
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
                    Seleccionar imagen
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
{/* 
      {estaModalPerfilAbierto ? (
        <div
          className="softsave-profile__modal-overlay"
          role="dialog"
          aria-modal="true"
        >
          <div className="softsave-profile__modal softsave-profile__modal--portfolio">
            <header className="softsave-profile__modal-header">
              <div className="softsave-profile__modal-content">
                <h3 className="softsave-profile__modal-title">
                  Editar información personal
                </h3>
                <p className="softsave-profile__modal-text">
                  {completarPerfil
                    ? "Para continuar debes completar tu nombre y profesión."
                    : "Completa los datos personales manteniendo la misma línea visual del sistema."}
                </p> */}
      {estaPanelLinkedinAbierto ? (
        <div
          className="softsave-profile__modal-overlay softsave-profile__modal-overlay--linkedin"
          role="dialog"
          aria-modal="true"
        >
          <aside className="softsave-profile__linkedin-panel">
            <header className="softsave-profile__linkedin-header">
              <div>
                <h3 className="softsave-profile__modal-title">
                  {estaLinkedinVinculado
                    ? "Información de Cuenta Vinculada"
                    : "Vincular cuenta profesional"}
                </h3>
              </div>
              <button
                type="button"
                className="softsave-profile__icon-button softsave-profile__icon-button--static"
                onClick={cerrarPanelLinkedin}
                aria-label="Cerrar panel de LinkedIn"
              >
                <Icon path={mdiClose} size={0.9} />
              </button>
            </header>

            <form
              className="softsave-profile__form"
              onSubmit={manejarGuardarCambios}
            >
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
                {erroresFormulario.nombreCompleto ? (
                  <span
                    className="error-text softsave-profile__error-text"
                    role="alert"
                  >
                    {erroresFormulario.nombreCompleto}
                  </span>
                ) : null}
              </label>

            <div className="softsave-profile__linkedin-brand">
              <Icon path={mdiLinkedin} size={1.4} className="softsave-profile__linkedin-brand-icon" />
              <span>LinkedIn</span>
            </div>

            {!estaLinkedinVinculado ? (
              <div className="softsave-profile__linkedin-state">
                <p className="softsave-profile__linkedin-status">
                  Estado: <strong>Sin vincular</strong>
                </p>
                <button
                  type="button"
                  className="softsave-profile__linkedin-primary"
                  onClick={vincularCuentaLinkedin}
                  disabled={simulandoLinkedin}
                >
                  <Icon path={mdiLinkedin} size={0.85} />
                  {simulandoLinkedin ? "Vinculando..." : "Vincular con LinkedIn"}
                </button>
                <p className="softsave-profile__linkedin-helper">
                  Importa tu foto y titular profesional automáticamente.
                </p>
              </div>
            ) : (
              <div className="softsave-profile__linkedin-state">
                <p className="softsave-profile__linkedin-status softsave-profile__linkedin-status--success">
                  Estado: <strong>Vinculado</strong> <Icon path={mdiCheckCircle} size={0.75} />
                </p>

                <div className="softsave-profile__linkedin-details">
                  <div className="softsave-profile__linkedin-field">
                    <span>Nombre importado:</span>
                    <strong>{DATOS_LINKEDIN_MOCK.nombreCompleto}</strong>
                  </div>
                  <div className="softsave-profile__linkedin-field">
                    <span>Titular importado:</span>
                    <strong>{DATOS_LINKEDIN_MOCK.profesion}</strong>
                  </div>
                  <div className="softsave-profile__linkedin-field">
                    <span>Fotografía importada:</span>
                    <img
                      src={DATOS_LINKEDIN_MOCK.fotografia}
                      alt="Foto importada de LinkedIn"
                      className="softsave-profile__linkedin-photo"
                    />
                  </div>
                </div>

                <div className="softsave-profile__linkedin-preview-callout">
                  <p>Se sobrescribirán visualmente estos campos del formulario principal:</p>
                  <ul className="softsave-profile__linkedin-preview-list">
                    <li>Nombre completo</li>
                    <li>Titular profesional</li>
                    <li>Miniatura sugerida</li>
                  </ul>
                </div>

                <button
                  type="button"
                  className="softsave-profile__linkedin-primary"
                  onClick={sincronizarDatosLinkedin}
                >
                  <Icon path={mdiRefresh} size={0.85} />
                  Sincronizar Datos
                </button>
                <button
                  type="button"
                  className="softsave-profile__linkedin-secondary"
                  onClick={desvincularCuentaLinkedin}
                >
                  Desvincular Cuenta
                </button>
                {linkedinSincronizado ? (
                  <p className="softsave-profile__linkedin-helper">
                    Datos sincronizados localmente. Presiona “Guardar cambios” en el formulario para
                    persistir nombre y titular.
                  </p>
                ) : null}
              </div>
            )}

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
                {erroresFormulario.profesion ? (
                  <span
                    className="error-text softsave-profile__error-text"
                    role="alert"
                  >
                    {erroresFormulario.profesion}
                  </span>
                ) : null}
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
                {erroresFormulario.biografia ? (
                  <span
                    className="error-text softsave-profile__error-text"
                    role="alert"
                  >
                    {erroresFormulario.biografia}
                  </span>
                ) : null}
              </label>

              <label className="softsave-profile__field">
                <span className="softsave-profile__label">URL de GitHub</span>
                <input
                  type="url"
                  name="githubUrl"
                  value={formularioPerfil.githubUrl}
                  onChange={manejarCambioFormulario}
                  className="softsave-input softsave-profile__input"
                  placeholder="https://github.com/tu-usuario"
                />
                {erroresFormulario.githubUrl ? (
                  <span className="error-text softsave-profile__error-text" role="alert">
                    {erroresFormulario.githubUrl}
                  </span>
                ) : null}
              </label>

              <label className="softsave-profile__field">
                <span className="softsave-profile__label">URL de LinkedIn</span>
                <input
                  type="url"
                  name="linkedinUrl"
                  value={formularioPerfil.linkedinUrl}
                  onChange={manejarCambioFormulario}
                  className="softsave-input softsave-profile__input"
                  placeholder="https://www.linkedin.com/in/tu-perfil"
                />
                {erroresFormulario.linkedinUrl ? (
                  <span className="error-text softsave-profile__error-text" role="alert">
                    {erroresFormulario.linkedinUrl}
                  </span>
                ) : null}
              </label>

              {mensajeGuardadoError ? (
                <span
                  className="error-text softsave-profile__error-text"
                  role="alert"
                >
                  {mensajeGuardadoError}
                </span>
              ) : null}

              <div className="softsave-profile__modal-actions">
                {!completarPerfil ? (
                  <button
                    type="button"
                    className="softsave-profile__secondary-button softsave-profile__secondary-button--modal"
                    onClick={cerrarPanelLinkedin}
                  >
                    Cancelar
                  </button>
                ) : null}
                <button
                  type="submit"
                  className="softsave-button softsave-button--compact"
                  disabled={guardandoPerfil}
                >
                  {guardandoPerfil ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}

      {estaModalReposAbierto ? (
        <div className="softsave-profile__modal-overlay" role="dialog" aria-modal="true">
          <div className="softsave-profile__modal softsave-profile__modal--portfolio">
            <header className="softsave-profile__github-manager-head">
              <div>
                <div className="softsave-profile__github-manager-title-row">
                  <h3 className="softsave-profile__modal-title">Repositorios de GitHub</h3>
                  <span className="softsave-profile__github-connection-badge">Conectado</span>
                </div>
                <p className="softsave-profile__github-manager-meta">
                  Usuario: <strong>john-developer</strong> | {totalRepositoriosGithub} repositorios |
                  Última sync: {ultimaSyncGithub}{" "}
                  <button
                    type="button"
                    className="softsave-profile__text-link"
                    onClick={sincronizarGithubAhora}
                  >
                    Sincronizar ahora
                  </button>
                </p>
              </div>
              <button
                type="button"
                className="softsave-profile__icon-button softsave-profile__icon-button--static"
                onClick={cerrarModalRepos}
                aria-label="Cerrar gestor de repositorios"
              >
                <Icon path={mdiClose} size={1} />
              </button>
            </header>

            <div className="softsave-profile__github-toolbar">
              <label className="softsave-profile__search">
                <span className="softsave-profile__search-icon" aria-hidden="true">
                  <Icon path={mdiMagnify} size={0.8} />
                </span>
                <input
                  type="search"
                  className="softsave-input softsave-profile__input"
                  placeholder="Buscar repositorio..."
                  value={busquedaRepos}
                  onChange={(evento) => setBusquedaRepos(evento.target.value)}
                />
              </label>

              <select
                className="softsave-input softsave-profile__input softsave-profile__filter-select"
                value={filtroRepos}
                onChange={(evento) => setFiltroRepos(evento.target.value)}
              >
                <option>Todos</option>
                <option>Originales</option>
                <option>Forks</option>
              </select>

              <select
                className="softsave-input softsave-profile__input softsave-profile__filter-select"
                value={ordenRepos}
                onChange={(evento) => setOrdenRepos(evento.target.value)}
              >
                <option>Más recientes</option>
                <option>Más populares</option>
              </select>
            </div>

            <p className="softsave-profile__github-counter">
              <strong>{seleccionTemporalRepos.length}</strong> de {totalRepositoriosGithub} repositorios
              seleccionados (máx. 15)
            </p>

            {mensajeGithubError ? (
              <div className="error-alert error-alert--inline" role="alert">
                {mensajeGithubError}
              </div>
            ) : null}

            <div className="softsave-profile__github-list">
              {repositoriosGestionados.map((repositorio) => {
                const estaSeleccionado = seleccionTemporalRepos.includes(repositorio.id);

                return (
                  <article key={repositorio.id} className="softsave-profile__github-row">
                    <label className="softsave-profile__github-checkbox">
                      <input
                        type="checkbox"
                        checked={estaSeleccionado}
                        onChange={() => alternarSeleccionRepositorio(repositorio.id)}
                      />
                    </label>

                    <div className="softsave-profile__github-row-main">
                      <div className="softsave-profile__github-row-title">
                        <strong>{repositorio.nombre}</strong>
                        {repositorio.esFork ? (
                          <span className="softsave-profile__fork-badge">FORK</span>
                        ) : null}
                      </div>

                      <div className="softsave-profile__github-row-meta">
                        <div className="softsave-profile__github-tech-list">
                          {repositorio.lenguajes.map((lenguaje) => (
                            <span key={`${repositorio.id}-${lenguaje.nombre}`} className="softsave-profile__github-tech">
                              <span
                                className="softsave-profile__github-tech-dot"
                                style={{ backgroundColor: lenguaje.color }}
                              />
                              {lenguaje.nombre}
                            </span>
                          ))}
                        </div>

                        <span>★ {repositorio.estrellas}</span>
                        <span>⑂ {repositorio.forks}</span>
                        <span>{formatearTiempoRelativo(repositorio.actualizadoDias)}</span>
                        <a href={repositorio.url} target="_blank" rel="noreferrer">
                          Ver en GitHub
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="softsave-profile__github-manager-actions">
              <div className="softsave-profile__github-manager-actions-left">
                <button
                  type="button"
                  className="softsave-profile__secondary-button softsave-profile__secondary-button--outline softsave-profile__secondary-button--toolbar"
                  onClick={marcarTodosRepositorios}
                >
                  Marcar todos
                </button>
                <button
                  type="button"
                  className="softsave-profile__secondary-button softsave-profile__secondary-button--modal softsave-profile__secondary-button--toolbar"
                  onClick={desmarcarTodosRepositorios}
                >
                  Desmarcar todos
                </button>
              </div>

              <div className="softsave-profile__github-manager-actions-right">
                <button
                  type="button"
                  className="softsave-profile__secondary-button softsave-profile__secondary-button--modal softsave-profile__secondary-button--toolbar"
                  onClick={cerrarModalRepos}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="softsave-button softsave-button--compact"
                  onClick={guardarSeleccionRepositorios}
                >
                  Guardar selección
                </button>
              </div>
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
                  Agrega tus enlaces de LinkedIn y GitHub manteniendo la misma estética del perfil.
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
                <button
                  type="submit"
                  className="softsave-button softsave-button--compact"
                  disabled={guardandoEnlaces}
                >
                  {guardandoEnlaces ? "Guardando..." : "Guardar"}
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
