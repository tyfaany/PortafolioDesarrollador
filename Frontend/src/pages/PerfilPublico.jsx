import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from '@mdi/react';
import {
  mdiArrowLeft,
  mdiBriefcaseOutline,
  mdiCodeBraces,
  mdiEmailOutline,
  mdiGithub,
  mdiLinkedin,
  mdiSchoolOutline,
  mdiStar,
} from '@mdi/js';
import api from '../services/api';
import { getMe } from '../services/authService';
import '../styles/TalentBoard.css';

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
  const navigate = useNavigate();
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

  const name = profile?.name || 'Usuario';
  const role = profile?.profession || '';
  const photoUrl = profile?.profile_photo_url || '';
  const initials = getInitials(name);
  const avatarStyle = photoUrl ? undefined : {
    background: 'linear-gradient(135deg, #2C3E50, #4C6580)',
  };
  const rating = Number(profile?.rating || 5);
  const projectsCount = Array.isArray(profile?.projects) ? profile.projects.length : 0;
  const skills = Array.isArray(profile?.skills)
    ? profile.skills
        .map((skill) => (typeof skill === 'string' ? skill : skill?.name))
        .filter(Boolean)
    : [];
  const jobs = Array.isArray(profile?.jobs) ? profile.jobs : [];
  const studies = Array.isArray(profile?.studies) ? profile.studies : [];
  const projects = Array.isArray(profile?.projects) ? profile.projects : [];
  const softSkills = Array.isArray(profile?.soft_skills)
    ? profile.soft_skills
        .map((skill) => (typeof skill === 'string' ? skill : skill?.name))
        .filter(Boolean)
    : [];
  const githubUrl = getTextValue(profile?.github_url, profile?.github);
  const linkedinUrl = getTextValue(profile?.linkedin_url, profile?.linkedin);
  const email = getTextValue(profile?.contact_email, profile?.email);

  return (
    <section className="talent-board-detail">
      <button type="button" className="talent-board-detail__back" onClick={() => navigate('/inicio')}>
        <Icon path={mdiArrowLeft} size={0.78} />
        Volver a la busqueda
      </button>

      <div className="talent-board-detail__hero">
        <div className="talent-board-detail__photo-wrap">
          <div className="talent-board-detail__photo" style={avatarStyle}>
            {photoUrl ? <img src={photoUrl} alt="" /> : <span>{initials}</span>}
          </div>
          {email ? (
            <a
              className="talent-board-detail__mail"
              href={`mailto:${email}`}
              aria-label={`Contactar a ${name}`}
            >
              <Icon path={mdiEmailOutline} size={0.9} />
            </a>
          ) : null}
        </div>

        <div className="talent-board-detail__summary">
          <span className="talent-board-detail__availability">Perfil publico</span>
          <h1>{name}</h1>
          <p className="talent-board-detail__role">{role}</p>

          <div className="talent-board-detail__stats" aria-label="Estadisticas del perfil">
            <span>
              <Icon path={mdiStar} size={0.7} />
              {rating.toFixed(1)}
            </span>
            <span>{projectsCount} proyectos</span>
          </div>

          <div className="talent-board-detail__links">
            {githubUrl ? (
              <a href={githubUrl} target="_blank" rel="noreferrer">
                <Icon path={mdiGithub} size={0.72} />
                GitHub
              </a>
            ) : null}
            {linkedinUrl ? (
              <a href={linkedinUrl} target="_blank" rel="noreferrer">
                <Icon path={mdiLinkedin} size={0.72} />
                LinkedIn
              </a>
            ) : null}
          </div>

          <div className="talent-board-detail__bio softsave-projects-card">
            <h2>Biografia</h2>
            <p>{profile?.biography || 'Sin biografía disponible.'}</p>
            {isOwnProfile ? (
              <p className="softsave-project-form__hint">
                Estas viendo tu perfil publico. Algunas secciones privadas no se muestran aqui.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="talent-board-detail__content">
        <div className="talent-board-detail__skills softsave-privacy__card">
          <h2>
            <Icon path={mdiCodeBraces} size={0.9} />
            Habilidades tecnicas
          </h2>
          <div className="talent-board-tags" aria-label={`Habilidades de ${name}`}>
            {skills.length > 0 ? (
              skills.map((skill) => <span key={skill}>{skill}</span>)
            ) : (
              <span>Sin habilidades publicas</span>
            )}
          </div>
        </div>

        <div className="talent-board-detail__skills softsave-privacy__card">
          <h2>
            <Icon path={mdiCodeBraces} size={0.9} />
            Habilidades blandas
          </h2>
          <div className="talent-board-tags" aria-label={`Habilidades blandas de ${name}`}>
            {softSkills.length > 0 ? (
              softSkills.map((skill) => <span key={skill}>{skill}</span>)
            ) : (
              <span>Sin habilidades blandas publicas</span>
            )}
          </div>
        </div>

        <section className="talent-board-detail__timeline">
          <h2>
            <Icon path={mdiBriefcaseOutline} size={0.9} />
            Experiencia laboral
          </h2>
          <div className="talent-board-timeline">
            {jobs.length > 0 ? (
              jobs.map((job) => (
                <article
                  key={job.id}
                  className="talent-board-timeline__item"
                >
                  <span className="talent-board-timeline__dot" aria-hidden="true" />
                  <div>
                    <p className="talent-board-timeline__years">{formatJobRange(job)}</p>
                    <h3>{getTextValue(job?.position, job?.job_title, job?.role, job?.title, job?.cargo, 'Experiencia')}</h3>
                    <p className="talent-board-timeline__company">{getTextValue(job?.company_name, 'Empresa no especificada')}</p>
                    <p>{getTextValue(job?.description, job?.achievements, job?.achievement, job?.achivements, job?.logros)}</p>
                  </div>
                </article>
              ))
            ) : (
              <p className="softsave-project-form__hint">Sin experiencia laboral publica disponible.</p>
            )}
          </div>
        </section>

        <section className="talent-board-detail__education">
          <h2>
            <Icon path={mdiSchoolOutline} size={0.9} />
            Formacion academica
          </h2>
          <div className="talent-board-education">
            {studies.length > 0 ? (
              studies.map((study) => (
                <article
                  key={study.id}
                  className="talent-board-education__card"
                >
                  <h3>{getTextValue(study?.degree, study?.title, 'Estudio')}</h3>
                  <p>{getTextValue(study?.academic_institution, study?.institution, 'Institución no especificada')}</p>
                  <span>{formatStudyRange(study)}</span>
                </article>
              ))
            ) : (
              <p className="softsave-project-form__hint">Sin formacion academica publica disponible.</p>
            )}
          </div>

          {projects.length > 0 ? (
            <>
              <h2 style={{ marginTop: '1.5rem' }}>
                Proyectos publicos
              </h2>
              <div className="talent-board-education">
                {projects.map((project) => {
                  const technologies = Array.isArray(project?.technologies) ? project.technologies : [];

                  return (
                    <article
                      key={project.id}
                      className="talent-board-education__card"
                    >
                      <h3>{getTextValue(project?.title, project?.name, 'Proyecto')}</h3>
                      {getTextValue(project?.description) ? <p>{project.description}</p> : null}
                      {technologies.length > 0 ? (
                        <div className="talent-board-tags">
                          {technologies.map((technology) => (
                            <span key={technology?.id || technology?.name}>{technology?.name || technology}</span>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </>
          ) : null}
        </section>
      </div>
    </section>
  );
}

export default PerfilPublico;
