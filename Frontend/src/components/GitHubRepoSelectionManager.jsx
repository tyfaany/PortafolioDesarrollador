import { useMemo, useState } from "react";
import useFeedback from "../hooks/useFeedback";
import { GITHUB_REPOSITORIES_MOCK, formatGithubRelativeTime } from "../mocks/githubRepositories";

function GitHubRepoSelectionManager() {
  const { showFeedback } = useFeedback();
  const [ultimaSyncGithub, setUltimaSyncGithub] = useState("hace 2 horas");
  const [busquedaRepos, setBusquedaRepos] = useState("");
  const [filtroRepos, setFiltroRepos] = useState("Todos");
  const [ordenRepos, setOrdenRepos] = useState("Más recientes");
  const [mensajeGithubError, setMensajeGithubError] = useState("");
  const [seleccionRepos, setSeleccionRepos] = useState([1, 2]);

  const totalRepositoriosGithub = GITHUB_REPOSITORIES_MOCK.length;
  const repositoriosGestionados = useMemo(() => {
    const termino = busquedaRepos.trim().toLowerCase();

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

  const sincronizarGithubAhora = () => {
    setUltimaSyncGithub("justo ahora");
    showFeedback("Repositorios actualizados desde GitHub.", "success");
  };

  const guardarSeleccionRepositorios = () => {
    setUltimaSyncGithub("justo ahora");
    setMensajeGithubError("");
    showFeedback("Selección guardada exitosamente", "success");
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
          >
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
        />

        <select
          className="softsave-input"
          value={filtroRepos}
          onChange={(event) => setFiltroRepos(event.target.value)}
        >
          <option>Todos</option>
          <option>Originales</option>
          <option>Forks</option>
        </select>

        <select
          className="softsave-input"
          value={ordenRepos}
          onChange={(event) => setOrdenRepos(event.target.value)}
        >
          <option>Más recientes</option>
          <option>Más populares</option>
        </select>
      </div>

      <p className="softsave-portafolio-github-manager__counter">
        <strong>{seleccionRepos.length}</strong> de {totalRepositoriosGithub} repositorios seleccionados
        (máx. 15)
      </p>

      {mensajeGithubError ? (
        <div className="error-alert error-alert--inline" role="alert">
          {mensajeGithubError}
        </div>
      ) : null}

      <div className="softsave-portafolio-github-manager__list">
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
                  <span>{formatGithubRelativeTime(repositorio.actualizadoDias)}</span>
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

        <div className="softsave-portafolio-github-manager__actions-group">
          <button
            type="button"
            className="softsave-profile__secondary-button softsave-profile__secondary-button--modal softsave-profile__secondary-button--toolbar"
            onClick={desmarcarTodosRepositorios}
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
    </section>
  );
}

export default GitHubRepoSelectionManager;
