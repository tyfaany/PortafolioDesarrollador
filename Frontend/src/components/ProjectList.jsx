import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ProjectCard from './ProjectCard';
import { obtenerProyectos, toggleVisibilidadProyecto } from '../services/authService';
import useFeedback from '../hooks/useFeedback';

function ProjectList({ onEdit, onDelete }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingToggleIds, setPendingToggleIds] = useState([]);
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
  }, []);

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
    <section className="softsave-privacy__list" aria-label="Listado de proyectos">
      {projects.map((project) => {
        const isPending = pendingToggleIds.includes(project.id);

        return (
          <div key={project.id} aria-busy={isPending}>
            <ProjectCard
              project={project}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleVisibility={handleToggleVisibility}
            />
          </div>
        );
      })}
    </section>
  );
}

ProjectList.propTypes = {
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};

ProjectList.defaultProps = {
  onEdit: () => {},
  onDelete: () => {},
};

export default ProjectList;
