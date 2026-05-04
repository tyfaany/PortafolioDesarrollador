import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { getMe } from '../services/authService';
import '../styles/ProjectsPrivacyViews.css';

function PerfilPublico() {
  const { user } = useParams();
  const [profile, setProfile] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      setError('');

      try {
        const [profileResponse, meResponse] = await Promise.all([
          api.get(`/users/${user}/profile`),
          getMe().catch(() => null),
        ]);

        if (!isMounted) {
          return;
        }

        const publicProfile = profileResponse?.data || {};
        const authUserId = meResponse?.data?.id;

        setProfile(publicProfile);
        setIsOwnProfile(Boolean(authUserId) && Number(authUserId) === Number(publicProfile?.id));
      } catch {
        if (!isMounted) {
          return;
        }

        setError('No se pudo cargar el perfil publico.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  if (isLoading) {
    return <p className="softsave-project-form__hint">Cargando perfil publico...</p>;
  }

  if (error) {
    return <p className="error-text">{error}</p>;
  }

  return (
    <section className="softsave-workspace">
      <div className="softsave-workspace__container">
        <header className="softsave-workspace__hero">
          <p className="softsave-workspace__eyebrow">Perfil publico</p>
          <h1 className="softsave-workspace__title">{profile?.name || 'Usuario'}</h1>
          <p className="softsave-workspace__subtitle">{profile?.profession || ''}</p>
          {isOwnProfile ? (
            <p className="softsave-project-form__hint">Estas viendo tu perfil publico. Algunas secciones privadas no se muestran aqui.</p>
          ) : null}
        </header>

        {profile?.biography ? (
          <article className="softsave-projects-card">
            <h3 className="softsave-projects-card__edit-title">Biografia</h3>
            <p>{profile.biography}</p>
          </article>
        ) : null}

        {Array.isArray(profile?.studies) && profile.studies.length > 0 ? (
          <article className="softsave-projects-card">
            <h3 className="softsave-projects-card__edit-title">Estudios</h3>
            {profile.studies.map((study) => (
              <p key={study.id}>{study.title || study.institution || 'Estudio'}</p>
            ))}
          </article>
        ) : null}

        {Array.isArray(profile?.jobs) && profile.jobs.length > 0 ? (
          <article className="softsave-projects-card">
            <h3 className="softsave-projects-card__edit-title">Experiencia laboral</h3>
            {profile.jobs.map((job) => (
              <p key={job.id}>{job.position || job.title || 'Experiencia'}</p>
            ))}
          </article>
        ) : null}

        {Array.isArray(profile?.skills) && profile.skills.length > 0 ? (
          <article className="softsave-projects-card">
            <h3 className="softsave-projects-card__edit-title">Habilidades</h3>
            <p>{profile.skills.map((skill) => skill.name).join(', ')}</p>
          </article>
        ) : null}

        {Array.isArray(profile?.projects) && profile.projects.length > 0 ? (
          <article className="softsave-projects-card">
            <h3 className="softsave-projects-card__edit-title">Proyectos publicos</h3>
            {profile.projects.map((project) => (
              <p key={project.id}>{project.title}</p>
            ))}
          </article>
        ) : null}
      </div>
    </section>
  );
}

export default PerfilPublico;
