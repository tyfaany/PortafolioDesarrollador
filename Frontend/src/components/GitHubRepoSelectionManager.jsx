import { useEffect, useMemo, useState } from "react";
import { mdiRefresh } from "@mdi/js";
import Icon from "@mdi/react";
import useAuth from "../hooks/useAuth";
import useFeedback from "../hooks/useFeedback";
import {
  guardarSeleccionRepositorios,
  obtenerRepositoriosGithub,
  sincronizarRepositoriosGithub,
} from "../services/authService";

function extraerUsernameGithub(githubUrl) {
  const url = String(githubUrl || "").trim();
  if (!url) {
    return "";
  }

  const coincidencia = url.match(/github\.com\/([^/?#]+)/i);
  return coincidencia?.[1] || "";
}

function formatearTiempoRelativoDesdeFecha(fechaIso) {
  if (!fechaIso) {
    return "sin actividad reciente";
  }

  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) {
    return "sin actividad reciente";
  }

  const diferenciaMs = Date.now() - fecha.getTime();
  const dias = Math.max(1, Math.round(diferenciaMs / (1000 * 60 * 60 * 24)));

  if (dias <= 1) {
    return "hace 1 día";
  }

  if (dias < 30) {
    return `hace ${dias} días`;
  }

  const meses = Math.round(dias / 30);
  return `hace ${meses} ${meses === 1 ? "mes" : "meses"}`;
}

function normalizarRepositorio(repo) {
  return {
    id: repo.id,
    nombre: repo.name || "Repositorio sin nombre",
    descripcion: repo.description || "Sin descripción disponible.",
    lenguajes: repo.language
      ? [{ nombre: repo.language, color: "#4b5563" }]
      : [{ nombre: "Sin lenguaje", color: "#9ca3af" }],
    estrellas: Number(repo.stars_count || 0),
    forks: Number(repo.forks_count || 0),
    actualizadoEn: repo.pushed_at || null,
    esFork: Boolean(repo.is_fork),
    url: repo.html_url || "#",
    isVisible: Boolean(repo.is_visible),
  };
}

function GitHubRepoSelectionManager() {
  const { user } = useAuth();
  const { showFeedback } = useFeedback();
  const [ultimaSyncGithub, setUltimaSyncGithub] = useState("hace 2 horas");
  const [busquedaRepos, setBusquedaRepos] = useState("");
  const [filtroRepos, setFiltroRepos] = useState("Todos");
  const [ordenRepos, setOrdenRepos] = useState("Más recientes");
  const [mensajeGithubError, setMensajeGithubError] = useState("");
  const [loading, setLoading] = useState(false);
  const [repos, setRepos] = useState([]);
  const [seleccionRepos, setSeleccionRepos] = useState([]);

  const cargarRepositorios = async () => {
    setLoading(true);
    setMensajeGithubError("");

    try {
      const respuesta = await obtenerRepositoriosGithub();
      const repositoriosNormalizados = Array.isArray(respuesta?.data)
        ? respuesta.data.map(normalizarRepositorio)
        : [];
      const seleccionInicial = repositoriosNormalizados
        .filter((repo) => repo.isVisible)
        .map((repo) => repo.id);

      setRepos(repositoriosNormalizados);
      setSeleccionRepos(seleccionInicial);
    } catch (error) {
      setRepos([]);
      setSeleccionRepos([]);
      setMensajeGithubError(error?.response?.data?.message || "No se pudieron cargar los repositorios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarRepositorios();
  }, []);

  const totalRepositoriosGithub = repos.length;
  const repositoriosGestionados = useMemo(() => {
    const termino = busquedaRepos.trim().toLowerCase();

    return [...repos]
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

        return (
          new Date(b.actualizadoEn || 0).getTime() -
          new Date(a.actualizadoEn || 0).getTime()
        );
      });
  }, [busquedaRepos, filtroRepos, ordenRepos, repos]);

  const alternarSeleccionRepositorio = (repoId) => {
    setSeleccionRepos((estadoActual) => {
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
      setSeleccionRepos(idsVisibles.slice(0, 15));
      setMensajeGithubError(
        "Se seleccionaron los primeros 15 repositorios. Ajusta filtros si necesitas otros.",
      );
      return;
    }

    setMensajeGithubError("");
    setSeleccionRepos(idsVisibles);
  };

  const desmarcarTodosRepositorios = () => {
    setSeleccionRepos([]);
    setMensajeGithubError("");
  };

  const sincronizarGithubAhora = async () => {
    const githubUsername = extraerUsernameGithub(user?.github_url);
    if (!githubUsername) {
      setMensajeGithubError("No se encontró un username de GitHub válido en tu perfil.");
      return;
    }

    setLoading(true);
    setMensajeGithubError("");
    try {
      await sincronizarRepositoriosGithub(githubUsername);
      await cargarRepositorios();
      setUltimaSyncGithub("justo ahora");
      showFeedback("Repositorios actualizados desde GitHub.", "success");
    } catch (error) {
      setMensajeGithubError(error?.response?.data?.message || "No se pudo sincronizar con GitHub.");
    } finally {
      setLoading(false);
    }
  };

  const guardarSeleccion = async () => {
    setLoading(true);
    setMensajeGithubError("");
    try {
      await guardarSeleccionRepositorios(seleccionRepos);
      setUltimaSyncGithub("justo ahora");
      showFeedback("Selección guardada exitosamente", "success");
    } catch (error) {
      setMensajeGithubError(error?.response?.data?.message || "No se pudo guardar la selección.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="softsave-portafolio-github-manager">
      <header className="softsave-portafolio-github-manager__head">
        <div className="softsave-portafolio-github-manager__title-row">
          <h3 className="softsave-portafolio-github-manager__title">Repositorios de GitHub</h3>
          <span className="softsave-portafolio-github-manager__badge">Conectado</span>
        </div>
        <p className="softsave-portafolio-github-manager__meta">
          Usuario: <strong>john-developer</strong> | {totalRepositoriosGithub} repositorios | Última
          sync: {ultimaSyncGithub}{" "}
          <button
            type="button"
            className="softsave-portafolio-github-manager__sync"
            onClick={sincronizarGithubAhora}
            disabled={loading}
          >
            <Icon path={mdiRefresh} size={0.7} />
            Sincronizar ahora
          </button>
        </p>
      </header>

      <div className="softsave-portafolio-github-manager__toolbar">
        <input
          type="search"
          className="softsave-input"
          placeholder="Buscar repositorio..."
          value={busquedaRepos}
          onChange={(event) => setBusquedaRepos(event.target.value)}
          disabled={loading}
        />

        <select
          className="softsave-input"
          value={filtroRepos}
          onChange={(event) => setFiltroRepos(event.target.value)}
          disabled={loading}
        >
          <option>Todos</option>
          <option>Originales</option>
          <option>Forks</option>
        </select>

        <select
          className="softsave-input"
          value={ordenRepos}
          onChange={(event) => setOrdenRepos(event.target.value)}
          disabled={loading}
        >
          <option>Más recientes</option>
          <option>Más populares</option>
        </select>
      </div>

      <p className="softsave-portafolio-github-manager__counter">
        <strong>{seleccionRepos.length}</strong> de {totalRepositoriosGithub} repositorios seleccionados
        (máx. 15)
      </p>

      {loading ? <div className="softsave-profile__empty-state">Cargando repositorios...</div> : null}

      {mensajeGithubError ? (
        <div className="error-alert error-alert--inline" role="alert">
          {mensajeGithubError}
        </div>
      ) : null}

      <div className="softsave-portafolio-github-manager__list">
        {!loading && repositoriosGestionados.length === 0 ? (
          <div className="softsave-profile__empty-state">No hay repositorios para mostrar.</div>
        ) : null}
        {repositoriosGestionados.map((repositorio) => {
          const estaSeleccionado = seleccionRepos.includes(repositorio.id);

          return (
            <article key={repositorio.id} className="softsave-portafolio-github-manager__row">
              <label className="softsave-portafolio-github-manager__checkbox">
                <input
                  type="checkbox"
                  checked={estaSeleccionado}
                  onChange={() => alternarSeleccionRepositorio(repositorio.id)}
                />
              </label>

              <div className="softsave-portafolio-github-manager__row-main">
                <div className="softsave-portafolio-github-manager__row-title">
                  <strong>{repositorio.nombre}</strong>
                  {repositorio.esFork ? (
                    <span className="softsave-portafolio-github-manager__fork">FORK</span>
                  ) : null}
                </div>

                <div className="softsave-portafolio-github-manager__row-meta">
                  <div className="softsave-portafolio-github-manager__tech-list">
                    {repositorio.lenguajes.map((lenguaje) => (
                      <span
                        key={`${repositorio.id}-${lenguaje.nombre}`}
                        className="softsave-portafolio-github-manager__tech"
                      >
                        <span
                          className="softsave-portafolio-github-manager__tech-dot"
                          style={{ backgroundColor: lenguaje.color }}
                        />
                        {lenguaje.nombre}
                      </span>
                    ))}
                  </div>

                  <span>★ {repositorio.estrellas}</span>
                  <span>⑂ {repositorio.forks}</span>
                  <span>{formatearTiempoRelativoDesdeFecha(repositorio.actualizadoEn)}</span>
                  <a href={repositorio.url} target="_blank" rel="noreferrer">
                    Ver en GitHub
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="softsave-portafolio-github-manager__actions">
        <div className="softsave-portafolio-github-manager__actions-group">
          <button
            type="button"
            className="softsave-profile__secondary-button softsave-profile__secondary-button--outline softsave-profile__secondary-button--toolbar"
            onClick={marcarTodosRepositorios}
            disabled={loading}
          >
            Marcar todos
          </button>
          <button
            type="button"
            className="softsave-profile__secondary-button softsave-profile__secondary-button--modal softsave-profile__secondary-button--toolbar"
            onClick={desmarcarTodosRepositorios}
            disabled={loading}
          >
            Desmarcar todos
          </button>
        </div>

        <div className="softsave-portafolio-github-manager__actions-group">
          <button
            type="button"
            className="softsave-profile__secondary-button softsave-profile__secondary-button--modal softsave-profile__secondary-button--toolbar"
            onClick={desmarcarTodosRepositorios}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="softsave-button softsave-button--compact"
            onClick={guardarSeleccion}
            disabled={loading}
          >
            Guardar selección
          </button>
        </div>
      </div>
    </section>
  );
}

export default GitHubRepoSelectionManager;
