import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ProjectCard from './ProjectCard';
import ProjectForm from './ProjectForm';
import { eliminarProyecto, obtenerProyectos, toggleVisibilidadProyecto } from '../services/authService';
import useFeedback from '../hooks/useFeedback';

function ProjectList({ refreshKey = 0 }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingToggleIds, setPendingToggleIds] = useState([]);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedEditId, setExpandedEditId] = useState(null);
  const { showFeedback } = useFeedback();

  useEffect(() => {
    let isMounted = true;

    const loadProjects = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await obtenerProyectos();

        if (!isMounted) {
          return;
        }

        setProjects(Array.isArray(response?.data) ? response.data : []);
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setError('No se pudieron cargar los proyectos. Intenta nuevamente.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProjects();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const handleToggleVisibility = async (project) => {
    const projectId = project?.id;

    if (!projectId || pendingToggleIds.includes(projectId)) {
      return;
    }

    setPendingToggleIds((current) => [...current, projectId]);

    const nextIsPublic = !project?.is_public;
    const optimisticProject = {
      ...project,
      is_public: nextIsPublic,
    };

    setProjects((current) => current.map((item) => (item.id === projectId ? optimisticProject : item)));

    try {
      const response = await toggleVisibilidadProyecto(project);
      const updatedProject = response?.data?.project;

      if (updatedProject && updatedProject.id) {
        setProjects((current) => current.map((item) => (item.id === updatedProject.id ? updatedProject : item)));
      }

      showFeedback(nextIsPublic ? 'Proyecto visible para el publico.' : 'Proyecto marcado como privado.');
    } catch (requestError) {
      setProjects((current) => current.map((item) => (item.id === projectId ? project : item)));
      showFeedback('No se pudo actualizar la visibilidad del proyecto.', 'error');
    } finally {
      setPendingToggleIds((current) => current.filter((id) => id !== projectId));
    }
  };

  const requestDeleteProject = (project) => {
    setProjectToDelete(project);
  };

  const toggleEdit = (project) => {
    const projectId = project?.id;
    if (!projectId) {
      return;
    }

    setExpandedEditId((current) => (current === projectId ? null : projectId));
  };

  const handleProjectUpdated = (updatedProject) => {
    if (!updatedProject?.id) {
      return;
    }

    setProjects((current) => current.map((item) => (item.id === updatedProject.id ? updatedProject : item)));
    setExpandedEditId(null);
  };

  const closeDeleteModal = () => {
    if (isDeleting) {
      return;
    }

    setProjectToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete?.id) {
      return;
    }

    setIsDeleting(true);
    try {
      await eliminarProyecto(projectToDelete.id);
      setProjects((current) => current.filter((item) => item.id !== projectToDelete.id));
      showFeedback('Proyecto eliminado correctamente.');
      setProjectToDelete(null);
    } catch (requestError) {
      const status = requestError?.response?.status;

      if (status === 403) {
        showFeedback('No tienes permisos para eliminar este proyecto.', 'error');
        return;
      }

      if (status === 404) {
        setProjects((current) => current.filter((item) => item.id !== projectToDelete.id));
        showFeedback('El proyecto ya no existe en el servidor.');
        setProjectToDelete(null);
        return;
      }

      showFeedback('No se pudo eliminar el proyecto. Intenta nuevamente.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <p className="softsave-project-form__hint">Cargando proyectos...</p>;
  }

  if (error) {
    return <p className="error-text">{error}</p>;
  }

  if (projects.length === 0) {
    return <p className="softsave-project-form__hint">Aun no tienes proyectos registrados.</p>;
  }

  return (
    <section className="softsave-projects-list" aria-label="Listado de proyectos">
      {projects.map((project) => {
        const isPending = pendingToggleIds.includes(project.id);

        return (
          <div key={project.id} aria-busy={isPending}>
            <ProjectCard
              project={project}
              onDelete={requestDeleteProject}
              onToggleVisibility={handleToggleVisibility}
              onToggleEdit={toggleEdit}
            />
            {expandedEditId === project.id ? (
              <div className="softsave-projects-card__editor">
                <ProjectForm
                  mode="edit"
                  project={project}
                  initialData={null}
                  onProjectSaved={handleProjectUpdated}
                  showModeActions={false}
                  onCancel={() => setExpandedEditId(null)}
                  showHeader={false}
                />
              </div>
            ) : null}
          </div>
        );
      })}

      {projectToDelete ? (
        <div
          className="softsave-profile__modal-overlay softsave-profile__modal-overlay--centered"
          role="dialog"
          aria-modal="true"
          onClick={closeDeleteModal}
        >
          <div className="softsave-profile__modal softsave-profile__modal--confirm" onClick={(event) => event.stopPropagation()}>
            <header className="softsave-profile__modal-header">
              <div className="softsave-profile__modal-content">
                <h3 className="softsave-profile__modal-title">Eliminar proyecto</h3>
                <p className="softsave-profile__modal-text">
                  ¿Seguro que deseas eliminar <strong>{projectToDelete.title}</strong>? Esta accion no se puede deshacer.
                </p>
              </div>
            </header>
            <div className="softsave-profile__modal-actions">
              <button
                type="button"
                className="softsave-profile__secondary-button softsave-profile__secondary-button--modal"
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="softsave-profile__danger-button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

ProjectList.propTypes = {
  refreshKey: PropTypes.number,
};

export default ProjectList;
