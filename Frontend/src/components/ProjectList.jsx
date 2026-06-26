import { useEffect, useState } from 'react';
import Icon from '@mdi/react';
import { mdiClose } from '@mdi/js';
import PropTypes from 'prop-types';
import ProjectCard from './ProjectCard';
import ProjectForm from './ProjectForm';
import { eliminarProyecto, obtenerProyectos, toggleVisibilidadProyecto } from '../services/authService';
import useFeedback from '../hooks/useFeedback';

function normalizeProjectsResponse(responseData) {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  return [];
}

function sortProjects(projects) {
  return [...projects].sort((projectA, projectB) => {
    const isPresentA = Boolean(projectA?.is_in_progress) || !projectA?.end_date;
    const isPresentB = Boolean(projectB?.is_in_progress) || !projectB?.end_date;

    if (isPresentA !== isPresentB) {
      return isPresentA ? -1 : 1;
    }

    if (!isPresentA) {
      const endA = Date.parse(projectA?.end_date || '');
      const endB = Date.parse(projectB?.end_date || '');
      const endValA = Number.isNaN(endA) ? Number.NEGATIVE_INFINITY : endA;
      const endValB = Number.isNaN(endB) ? Number.NEGATIVE_INFINITY : endB;

      if (endValA !== endValB) {
        return endValB - endValA;
      }
    }

    const startA = Date.parse(projectA?.start_date || '');
    const startB = Date.parse(projectB?.start_date || '');
    const startValA = Number.isNaN(startA) ? Number.NEGATIVE_INFINITY : startA;
    const startValB = Number.isNaN(startB) ? Number.NEGATIVE_INFINITY : startB;

    if (startValA !== startValB) {
      return startValB - startValA;
    }

    const createdA = Date.parse(projectA?.created_at || '');
    const createdB = Date.parse(projectB?.created_at || '');
    const createdValA = Number.isNaN(createdA) ? Number.NEGATIVE_INFINITY : createdA;
    const createdValB = Number.isNaN(createdB) ? Number.NEGATIVE_INFINITY : createdB;

    if (createdValA !== createdValB) {
      return createdValB - createdValA;
    }

    return String(projectB?.id || '').localeCompare(String(projectA?.id || ''));
  });
}

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

        setProjects(normalizeProjectsResponse(response?.data));
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

  const sortedProjects = sortProjects(projects);

  return (
    <section className="softsave-projects-list" aria-label="Listado de proyectos">
      {sortedProjects.map((project) => {
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
              <div
                className="softsave-project-modal__overlay"
                role="dialog"
                aria-modal="true"
                onClick={() => setExpandedEditId(null)}
              >
                <div className="softsave-project-modal" onClick={(event) => event.stopPropagation()}>
                  <header className="softsave-project-modal__header">
                    <h3 className="softsave-project-modal__title">Editar proyecto</h3>
                    <p className="softsave-project-modal__subtitle">
                      Actualiza la informacion detallada de tu trabajo para el portafolio.
                    </p>
                    <button
                      type="button"
                      className="softsave-project-modal__close"
                      onClick={() => setExpandedEditId(null)}
                      aria-label="Cerrar modal de editar proyecto"
                    >
                      <Icon path={mdiClose} size={0.8} />
                    </button>
                  </header>
                  <ProjectForm
                    mode="edit"
                    project={project}
                    initialData={null}
                    onProjectSaved={handleProjectUpdated}
                    showModeActions={false}
                    onCancel={() => setExpandedEditId(null)}
                    showHeader={false}
                    useModalLayout
                  />
                </div>
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
