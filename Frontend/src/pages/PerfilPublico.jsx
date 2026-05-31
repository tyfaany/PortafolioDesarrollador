import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { getMe } from '../services/authService';
import '../styles/ProjectsPrivacyViews.css';

function getInitials(name) {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function formatDateLabel(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('es-ES', {
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatStudyRange(study) {
  const start = formatDateLabel(study?.start_date);
  const end = study?.end_date ? formatDateLabel(study.end_date) : 'Presente';

  if (!start && !end) {
    return '';
  }

  if (!start) {
    return end;
  }

  return `${start} - ${end}`;
}

function formatJobRange(job) {
  const start = [job?.start_month, job?.start_year].filter(Boolean).join('/');
  const end = job?.is_current_job
    ? 'Presente'
    : [job?.end_month, job?.end_year].filter(Boolean).join('/');

  if (!start && !end) {
    return '';
  }

  if (!start) {
    return end;
  }

  if (!end) {
    return start;
  }

  return `${start} - ${end}`;
}

function getTextValue(...values) {
  return values.find((value) => String(value || '').trim() !== '') || '';
}

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

  const initials = getInitials(profile?.name || 'Usuario');
  const profilePhotoUrl = profile?.profile_photo_url || '';

  return (
    <section className="softsave-workspace">
      <div className="softsave-workspace__container">
        <header className="softsave-workspace__hero">
          <p className="softsave-workspace__eyebrow">Perfil publico</p>

          <div className="softsave-workspace__profile-header">
            <div className="softsave-workspace__profile-photo" aria-hidden="true">
              {profilePhotoUrl ? (
                <img src={profilePhotoUrl} alt="" />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            <div className="softsave-workspace__profile-copy">
              <h1 className="softsave-workspace__title">{profile?.name || 'Usuario'}</h1>
              <p className="softsave-workspace__subtitle">{profile?.profession || ''}</p>
              {isOwnProfile ? (
                <p className="softsave-project-form__hint">
                  Estas viendo tu perfil publico. Algunas secciones privadas no se muestran aqui.
                </p>
              ) : null}
            </div>
          </div>
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
            <div className="softsave-public-list">
              {profile.studies.map((study) => (
                <article key={study.id} className="softsave-public-list__item">
                  <h4>{getTextValue(study?.degree, study?.title, 'Estudio')}</h4>
                  <p>{getTextValue(study?.academic_institution, study?.institution, 'Institución no especificada')}</p>
                  {formatStudyRange(study) ? <span>{formatStudyRange(study)}</span> : null}
                  {getTextValue(study?.achievements) ? <p>{study.achievements}</p> : null}
                </article>
              ))}
            </div>
          </article>
        ) : null}

        {Array.isArray(profile?.jobs) && profile.jobs.length > 0 ? (
          <article className="softsave-projects-card">
            <h3 className="softsave-projects-card__edit-title">Experiencia laboral</h3>
            <div className="softsave-public-list">
              {profile.jobs.map((job) => (
                <article key={job.id} className="softsave-public-list__item">
                  <h4>
                    {getTextValue(job?.position, job?.job_title, job?.role, job?.title, job?.cargo, 'Experiencia')}
                  </h4>
                  <p>{getTextValue(job?.company_name, 'Empresa no especificada')}</p>
                  {formatJobRange(job) ? <span>{formatJobRange(job)}</span> : null}
                  {getTextValue(job?.description, job?.achievements, job?.achievement, job?.achivements, job?.logros) ? (
                    <p>{getTextValue(job?.description, job?.achievements, job?.achievement, job?.achivements, job?.logros)}</p>
                  ) : null}
                </article>
              ))}
            </div>
          </article>
        ) : null}

        {Array.isArray(profile?.skills) && profile.skills.length > 0 ? (
          <article className="softsave-projects-card">
            <h3 className="softsave-projects-card__edit-title">Habilidades</h3>
            <div className="softsave-tags-list">
              {profile.skills.map((skill) => {
                const skillName = typeof skill === 'string' ? skill : skill?.name;
                const skillLevel = typeof skill === 'object' ? skill?.pivot?.level : null;

                if (!skillName) {
                  return null;
                }

                return (
                  <span key={skillName} className="softsave-tag">
                    {skillName}
                    {skillLevel ? <small>{skillLevel}</small> : null}
                  </span>
                );
              })}
            </div>
          </article>
        ) : null}

        {Array.isArray(profile?.soft_skills) && profile.soft_skills.length > 0 ? (
          <article className="softsave-projects-card">
            <h3 className="softsave-projects-card__edit-title">Habilidades blandas</h3>
            <div className="softsave-tags-list">
              {profile.soft_skills.map((skill) => (
                <span key={skill?.id || skill?.name} className="softsave-tag">
                  {skill?.name || skill}
                </span>
              ))}
            </div>
          </article>
        ) : null}

        {Array.isArray(profile?.projects) && profile.projects.length > 0 ? (
          <article className="softsave-projects-card">
            <h3 className="softsave-projects-card__edit-title">Proyectos publicos</h3>
            <div className="softsave-public-list">
              {profile.projects.map((project) => {
                const projectTitle = getTextValue(project?.title, project?.name, 'Proyecto');
                const technologies = Array.isArray(project?.technologies)
                  ? project.technologies
                  : [];

                return (
                  <article key={project.id} className="softsave-public-list__item">
                    <h4>{projectTitle}</h4>
                    {getTextValue(project?.description) ? <p>{project.description}</p> : null}
                    {technologies.length > 0 ? (
                      <div className="softsave-tags-list">
                        {technologies.map((technology) => (
                          <span key={technology?.id || technology?.name} className="softsave-tag">
                            {technology?.name || technology}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}

export default PerfilPublico;
