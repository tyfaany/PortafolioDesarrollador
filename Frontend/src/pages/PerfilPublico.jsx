import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from '@mdi/react';
import {
  mdiArrowLeft,
  mdiBriefcaseOutline,
  mdiCellphone,
  mdiCodeBraces,
  mdiEmailOutline,
  mdiFolderOutline,
  mdiGithub,
  mdiLinkedin,
  mdiMapMarkerOutline,
  mdiOpenInNew,
  mdiPhoneOutline,
  mdiSchoolOutline,
  mdiStar,
} from '@mdi/js';
import api from '../services/api';
import { getMe } from '../services/authService';
import '../styles/ProjectsPrivacyViews.css';
import '../styles/PerfilPublico.css';

function getInitials(name) {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function getTextValue(...values) {
  return values.find((value) => String(value || '').trim() !== '') || '';
}

function sanitizeHtml(description) {
  if (!description) {
    return '';
  }

  const allowedTags = new Set([
    'a',
    'b',
    'blockquote',
    'br',
    'code',
    'div',
    'em',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'i',
    'li',
    'ol',
    'p',
    'pre',
    's',
    'span',
    'strong',
    'u',
    'ul',
  ]);

  const parser = new DOMParser();
  const document = parser.parseFromString(`<div>${String(description)}</div>`, 'text/html');
  const root = document.body.firstElementChild;

  if (!root) {
    return '';
  }

  const sanitizeNode = (node) => {
    const nodes = Array.from(node.childNodes);

    nodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        return;
      }

      if (child.nodeType !== Node.ELEMENT_NODE) {
        child.remove();
        return;
      }

      const tagName = child.tagName.toLowerCase();

      if (!allowedTags.has(tagName)) {
        const fragment = document.createDocumentFragment();
        while (child.firstChild) {
          fragment.appendChild(child.firstChild);
        }
        child.replaceWith(fragment);
        sanitizeNode(fragment);
        return;
      }

      Array.from(child.attributes).forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        const value = attribute.value.trim();

        if (name.startsWith('on') || name === 'style' || name === 'class' || name === 'id') {
          child.removeAttribute(attribute.name);
          return;
        }

        if (tagName !== 'a') {
          child.removeAttribute(attribute.name);
          return;
        }

        if (name === 'href') {
          if (!/^(https?:|mailto:|tel:|\/|#)/i.test(value)) {
            child.removeAttribute(attribute.name);
          } else {
            child.setAttribute('rel', 'noreferrer noopener');
            child.setAttribute('target', '_blank');
          }
          return;
        }

        child.removeAttribute(attribute.name);
      });

      sanitizeNode(child);
    });
  };

  sanitizeNode(root);
  return root.innerHTML.trim();
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateText(value, maxLength = 180) {
  const text = stripHtml(value);

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
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

function formatProjectRange(project) {
  const start = formatDateLabel(project?.start_date);
  const end = formatDateLabel(project?.end_date);

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

function formatProjectIsoDate(project) {
  const value = project?.start_date || project?.end_date;

  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    const match = value.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) {
      return match[0];
    }
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

function getSkills(profile) {
  if (!Array.isArray(profile?.skills)) {
    return [];
  }

  return profile.skills
    .map((skill, index) => {
      if (typeof skill === 'string') {
        return {
          id: `tech-${index}-${skill}`,
          name: skill,
          level: '',
          evidence_url: '',
        };
      }

      if (skill && typeof skill === 'object') {
        return {
          id: skill.id || `tech-${index}-${skill.name || skill.label || 'skill'}`,
          name: skill.name || skill.label || '',
          level: skill.pivot?.level || skill.level || '',
          evidence_url: skill.pivot?.evidence_url || skill.evidence_url || '',
        };
      }

      return null;
    })
    .filter((skill) => skill?.name);
}

function getSoftSkills(profile) {
  if (!Array.isArray(profile?.soft_skills)) {
    return [];
  }

  return profile.soft_skills
    .map((skill, index) => {
      if (typeof skill === 'string') {
        return {
          id: `soft-${index}-${skill}`,
          name: skill,
          evidence_url: '',
        };
      }

      if (skill && typeof skill === 'object') {
        return {
          id: skill.id || `soft-${index}-${skill.name || skill.label || 'skill'}`,
          name: skill.name || skill.label || '',
          evidence_url: skill.pivot?.evidence_url || skill.evidence_url || '',
        };
      }

      return null;
    })
    .filter((skill) => skill?.name);
}

function getProjectTechnologies(project) {
  if (!Array.isArray(project?.technologies)) {
    return [];
  }

  return project.technologies
    .map((technology) => {
      if (typeof technology === 'string') {
        return technology.trim();
      }

      if (technology && typeof technology === 'object') {
        return (technology.name || technology.label || technology.title || technology.value || '').trim();
      }

      return '';
    })
    .filter(Boolean);
}

function normalizeGithubRepositories(repositories) {
  if (!Array.isArray(repositories)) {
    return [];
  }

  return repositories
    .map((repository, index) => {
      if (!repository) {
        return null;
      }

      const fallbackId = repository?.id || repository?.github_id || repository?.html_url || repository?.name || index;
      const language = getTextValue(repository?.language);

      return {
        id: `github-${fallbackId}`,
        title: getTextValue(repository?.name, 'Repositorio'),
        description: getTextValue(repository?.description, 'Sin descripción disponible.'),
        language,
        starsCount: Number(repository?.stars_count || 0),
        forksCount: Number(repository?.forks_count || 0),
        repoUrl: getTextValue(repository?.html_url),
        isFork: Boolean(repository?.is_fork),
      };
    })
    .filter(Boolean);
}

function resolveProjectImageUrl(project) {
  const rawUrl =
    project?.image_url ||
    project?.image_path ||
    project?.currentImagePreview ||
    '';

  if (!rawUrl) {
    return '';
  }

  if (
    /^https?:\/\//i.test(rawUrl) ||
    rawUrl.startsWith('data:') ||
    rawUrl.startsWith('blob:')
  ) {
    return rawUrl;
  }

  const apiBase = import.meta.env.VITE_LARAVEL_API_URL;
  if (!apiBase) {
    return rawUrl;
  }

  let backendOrigin = '';
  try {
    backendOrigin = new URL(apiBase).origin;
  } catch {
    return rawUrl;
  }

  if (rawUrl.startsWith('/storage/')) {
    return `${backendOrigin}${rawUrl}`;
  }

  if (rawUrl.startsWith('storage/')) {
    return `${backendOrigin}/${rawUrl}`;
  }

  if (rawUrl.startsWith('projects/')) {
    return `${backendOrigin}/storage/${rawUrl}`;
  }

  return `${backendOrigin}/${rawUrl.replace(/^\/+/, '')}`;
}

function getProjectTitle(project) {
  return getTextValue(project?.title, project?.name, 'Proyecto');
}

function sortProjects(projects) {
  return [...projects].sort((projectA, projectB) => {
    const startA = Date.parse(projectA?.start_date || '');
    const startB = Date.parse(projectB?.start_date || '');
    const createdA = Date.parse(projectA?.created_at || '');
    const createdB = Date.parse(projectB?.created_at || '');

    if (!Number.isNaN(startA) || !Number.isNaN(startB)) {
      return (Number.isNaN(startB) ? Number.NEGATIVE_INFINITY : startB)
        - (Number.isNaN(startA) ? Number.NEGATIVE_INFINITY : startA);
    }

    if (!Number.isNaN(createdA) || !Number.isNaN(createdB)) {
      return (Number.isNaN(createdB) ? Number.NEGATIVE_INFINITY : createdB)
        - (Number.isNaN(createdA) ? Number.NEGATIVE_INFINITY : createdA);
    }

    return String(projectB?.id || '').localeCompare(String(projectA?.id || ''));
  });
}

function sortGithubRepositories(repositories) {
  return [...repositories].sort((repoA, repoB) => {
    const pushedA = Date.parse(repoA?.pushed_at || '');
    const pushedB = Date.parse(repoB?.pushed_at || '');

    if (!Number.isNaN(pushedA) || !Number.isNaN(pushedB)) {
      return (Number.isNaN(pushedB) ? Number.NEGATIVE_INFINITY : pushedB)
        - (Number.isNaN(pushedA) ? Number.NEGATIVE_INFINITY : pushedA);
    }

    return String(repoB?.id || '').localeCompare(String(repoA?.id || ''));
  });
}

function PerfilPublico() {
  const { user } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('general');

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

  const normalizedProfile = useMemo(() => {
    const projects = sortProjects(Array.isArray(profile?.projects) ? profile.projects : []);
    const githubRepositories = sortGithubRepositories(
      normalizeGithubRepositories(Array.isArray(profile?.github_repositories) ? profile.github_repositories : []),
    );
    const skills = getSkills(profile);
    const softSkills = getSoftSkills(profile);
    const jobs = Array.isArray(profile?.jobs) ? profile.jobs : [];
    const studies = Array.isArray(profile?.studies) ? profile.studies : [];
    const contact = {
      phone: getTextValue(profile?.phone),
      mobile: getTextValue(profile?.mobile),
      email: getTextValue(profile?.contact_email, profile?.email),
      address: getTextValue(profile?.address),
    };

    return {
      name: profile?.name || 'Usuario',
      role: profile?.profession || '',
      biography: profile?.biography || '',
      photoUrl: profile?.profile_photo_url || '',
      githubUrl: getTextValue(profile?.github_url, profile?.github),
      linkedinUrl: getTextValue(profile?.linkedin_url, profile?.linkedin),
      projects,
      githubRepositories,
      featuredProject: projects[0] || null,
      remainingProjects: projects.slice(1),
      skills,
      softSkills,
      jobs,
      studies,
      contact,
    };
  }, [profile]);

  const avatarStyle = normalizedProfile.photoUrl
    ? undefined
    : {
        background: 'linear-gradient(135deg, #2C3E50, #E67E22)',
      };

  const visibleProjectsTotal = normalizedProfile.projects.length + normalizedProfile.githubRepositories.length;

  const publicHighlights = [
    { label: 'Proyectos públicos', value: visibleProjectsTotal },
    { label: 'Experiencias', value: normalizedProfile.jobs.length },
    { label: 'Formaciones', value: normalizedProfile.studies.length },
    { label: 'Habilidades', value: normalizedProfile.skills.length + normalizedProfile.softSkills.length },
  ];

  const contactEntries = [
    normalizedProfile.contact.phone
      ? {
          label: 'Teléfono',
          value: normalizedProfile.contact.phone,
          icon: mdiPhoneOutline,
        }
      : null,
    normalizedProfile.contact.mobile
      ? {
          label: 'Móvil',
          value: normalizedProfile.contact.mobile,
          icon: mdiCellphone,
        }
      : null,
    normalizedProfile.contact.email
      ? {
          label: 'Correo',
          value: normalizedProfile.contact.email,
          icon: mdiEmailOutline,
          href: `mailto:${normalizedProfile.contact.email}`,
        }
      : null,
    normalizedProfile.contact.address
      ? {
          label: 'Dirección',
          value: normalizedProfile.contact.address,
          icon: mdiMapMarkerOutline,
        }
      : null,
  ].filter(Boolean);

  if (isLoading) {
    return (
      <div className="perfil-publico-page">
        <div className="perfil-publico-page__container">
          <p className="perfil-publico-state">Cargando perfil publico...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="perfil-publico-page">
        <div className="perfil-publico-page__container">
          <p className="perfil-publico-state perfil-publico-state--error">{error}</p>
        </div>
      </div>
    );
  }

  const featuredProjectDescription = sanitizeHtml(normalizedProfile.featuredProject?.description || '');
  const projectsTabHasContent = normalizedProfile.projects.length > 0;
  const githubRepositoriesTabHasContent = normalizedProfile.githubRepositories.length > 0;
  const hasProjectsSection = projectsTabHasContent || githubRepositoriesTabHasContent;

  return (
    <section className="perfil-publico-page">
      <span className="perfil-publico-page__orb perfil-publico-page__orb--one" aria-hidden="true" />
      <span className="perfil-publico-page__orb perfil-publico-page__orb--two" aria-hidden="true" />

      <div className="perfil-publico-page__container">
        <button type="button" className="perfil-publico-back" onClick={() => navigate('/inicio')}>
          <Icon path={mdiArrowLeft} size={0.8} />
          Volver a la búsqueda
        </button>

        <header className="perfil-publico-hero perfil-publico-card">
          <div className="perfil-publico-hero__media">
            <div className="perfil-publico-hero__photo-frame">
              <div className="perfil-publico-hero__photo" style={avatarStyle}>
                {normalizedProfile.photoUrl ? (
                  <img src={normalizedProfile.photoUrl} alt={`Foto de ${normalizedProfile.name}`} />
                ) : (
                  <span>{getInitials(normalizedProfile.name)}</span>
                )}
              </div>
            </div>
            <div className="perfil-publico-hero__badge">
              <span className="perfil-publico-hero__badge-value">
                <Icon path={mdiFolderOutline} size={0.72} />
                {visibleProjectsTotal > 0 ? visibleProjectsTotal : '0'}
              </span>
              <span className="perfil-publico-hero__badge-label">proyectos visibles</span>
            </div>
          </div>

          <div className="perfil-publico-hero__content">
            <span className="perfil-publico-hero__eyebrow">Perfil público</span>
            <h1 className="perfil-publico-hero__title">{normalizedProfile.name}</h1>
            {normalizedProfile.role ? (
              <p className="perfil-publico-hero__role">{normalizedProfile.role}</p>
            ) : (
              <p className="perfil-publico-hero__role perfil-publico-hero__role--muted">Profesional sin título visible</p>
            )}

            <div className="perfil-publico-hero__highlights" aria-label="Resumen del perfil">
              {publicHighlights.map((item) => (
                <div key={item.label} className="perfil-publico-hero__highlight">
                  <span className="perfil-publico-hero__highlight-value">{item.value}</span>
                  <span className="perfil-publico-hero__highlight-label">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="perfil-publico-hero__contacts">
              {contactEntries.length > 0 ? (
                contactEntries.map((entry) => (
                  <div key={entry.label} className="perfil-publico-contact">
                    <span className="perfil-publico-contact__icon" aria-hidden="true">
                      <Icon path={entry.icon} size={0.8} />
                    </span>
                    <div className="perfil-publico-contact__copy">
                      <span className="perfil-publico-contact__label">{entry.label}</span>
                      {entry.href ? (
                        <a className="perfil-publico-contact__value" href={entry.href}>
                          {entry.value}
                        </a>
                      ) : (
                        <p className="perfil-publico-contact__value">{entry.value}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="perfil-publico-empty-inline">No hay datos de contacto públicos disponibles.</p>
              )}
            </div>

            <div className="perfil-publico-hero__links">
              {normalizedProfile.githubUrl ? (
                <a href={normalizedProfile.githubUrl} target="_blank" rel="noreferrer" className="perfil-publico-link-button">
                  <Icon path={mdiGithub} size={0.78} />
                  GitHub
                </a>
              ) : null}
              {normalizedProfile.linkedinUrl ? (
                <a href={normalizedProfile.linkedinUrl} target="_blank" rel="noreferrer" className="perfil-publico-link-button perfil-publico-link-button--soft">
                  <Icon path={mdiLinkedin} size={0.78} />
                  LinkedIn
                </a>
              ) : null}
              {normalizedProfile.contact.email ? (
                <a href={`mailto:${normalizedProfile.contact.email}`} className="perfil-publico-link-button perfil-publico-link-button--ghost">
                  <Icon path={mdiEmailOutline} size={0.78} />
                  Escribir correo
                </a>
              ) : null}
            </div>
          </div>
        </header>

        <section className="perfil-publico-bio perfil-publico-card">
          <div className="perfil-publico-section-head">
            <div className="perfil-publico-section-head__title-wrap">
              <span className="perfil-publico-section-head__icon" aria-hidden="true">
                <Icon path={mdiCodeBraces} size={0.88} />
              </span>
              <h2>Biografía</h2>
            </div>
            {isOwnProfile ? (
              <span className="perfil-publico-bio__owner-badge">Estás viendo tu perfil público</span>
            ) : null}
          </div>
          <p className="perfil-publico-bio__text">
            {normalizedProfile.biography || 'Sin biografía disponible.'}
          </p>
        </section>

        <div className="perfil-publico-tabs" role="tablist" aria-label="Secciones del perfil público">
          <button
            id="perfil-publico-tab-general"
            type="button"
            role="tab"
            aria-selected={activeTab === 'general'}
            aria-controls="perfil-publico-panel-general"
            className={`perfil-publico-tab ${activeTab === 'general' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            Información general
          </button>
          <button
            id="perfil-publico-tab-projects"
            type="button"
            role="tab"
            aria-selected={activeTab === 'projects'}
            aria-controls="perfil-publico-panel-projects"
            className={`perfil-publico-tab ${activeTab === 'projects' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            Proyectos
          </button>
        </div>

        {activeTab === 'general' ? (
          <div
            id="perfil-publico-panel-general"
            role="tabpanel"
            aria-labelledby="perfil-publico-tab-general"
            className="perfil-publico-layout"
          >
            <div className="perfil-publico-layout__main">
              <section className="perfil-publico-card perfil-publico-card--timeline">
                <div className="perfil-publico-section-head">
                  <div className="perfil-publico-section-head__title-wrap">
                    <span className="perfil-publico-section-head__icon perfil-publico-section-head__icon--dark" aria-hidden="true">
                      <Icon path={mdiBriefcaseOutline} size={0.9} />
                    </span>
                    <h2>Experiencia laboral</h2>
                  </div>
                </div>

                {normalizedProfile.jobs.length > 0 ? (
                  <div className="perfil-publico-timeline">
                    {normalizedProfile.jobs.map((job) => (
                      <article key={job.id} className="perfil-publico-timeline__item">
                        <span className="perfil-publico-timeline__dot" aria-hidden="true" />
                        <div className="perfil-publico-timeline__head">
                          <div>
                            <h3>{getTextValue(job?.position, job?.job_title, job?.role, job?.title, job?.cargo, 'Experiencia')}</h3>
                            <p>{getTextValue(job?.company_name, 'Empresa no especificada')}</p>
                          </div>
                          <span className="perfil-publico-timeline__period">{formatJobRange(job)}</span>
                        </div>
                        {getTextValue(job?.description, job?.achievements, job?.achievement, job?.achivements, job?.logros) ? (
                          <p className="perfil-publico-timeline__text">
                            {truncateText(getTextValue(job?.description, job?.achievements, job?.achievement, job?.achivements, job?.logros), 220)}
                          </p>
                        ) : null}
                        {job?.evidence_url ? (
                          <a href={job.evidence_url} target="_blank" rel="noreferrer" className="perfil-publico-inline-link">
                            <Icon path={mdiOpenInNew} size={0.72} />
                            Ver evidencia
                          </a>
                        ) : null}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="perfil-publico-empty-inline">Sin experiencia laboral pública disponible.</p>
                )}
              </section>
            </div>

            <aside className="perfil-publico-layout__aside">
              <section className="perfil-publico-card perfil-publico-card--stack">
                <div className="perfil-publico-section-head">
                  <div className="perfil-publico-section-head__title-wrap">
                    <span className="perfil-publico-section-head__icon perfil-publico-section-head__icon--accent" aria-hidden="true">
                      <Icon path={mdiSchoolOutline} size={0.88} />
                    </span>
                    <h2>Formación</h2>
                  </div>
                </div>

                {normalizedProfile.studies.length > 0 ? (
                  <div className="perfil-publico-stack-list">
                    {normalizedProfile.studies.map((study) => (
                      <article key={study.id} className="perfil-publico-stack-item">
                        <p className="perfil-publico-stack-item__period">{formatStudyRange(study)}</p>
                        <h3>{getTextValue(study?.degree, study?.title, 'Estudio')}</h3>
                        <p className="perfil-publico-stack-item__subline">
                          {getTextValue(study?.academic_institution, study?.institution, 'Institución no especificada')}
                        </p>
                        {getTextValue(study?.achievements) ? (
                          <p className="perfil-publico-stack-item__text">{truncateText(study.achievements, 180)}</p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="perfil-publico-empty-inline">Sin formación académica pública disponible.</p>
                )}
              </section>

              <section className="perfil-publico-card perfil-publico-card--stack">
                <div className="perfil-publico-section-head">
                  <div className="perfil-publico-section-head__title-wrap">
                    <span className="perfil-publico-section-head__icon perfil-publico-section-head__icon--accent" aria-hidden="true">
                      <Icon path={mdiCodeBraces} size={0.88} />
                    </span>
                    <h2>Habilidades técnicas</h2>
                  </div>
                </div>

                {normalizedProfile.skills.length > 0 ? (
                  <div className="perfil-publico-tags">
                    {normalizedProfile.skills.map((skill) => (
                      <div key={skill.id} className="perfil-publico-tag">
                        <span className="perfil-publico-tag__label">{skill.name}</span>
                        {skill.level ? <span className="perfil-publico-tag__meta">{skill.level}</span> : null}
                        {skill.evidence_url ? (
                          <a href={skill.evidence_url} target="_blank" rel="noreferrer" className="perfil-publico-tag__link" aria-label={`Ver evidencia de ${skill.name}`}>
                            <Icon path={mdiOpenInNew} size={0.65} />
                          </a>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="perfil-publico-empty-inline">Sin habilidades técnicas públicas disponibles.</p>
                )}
              </section>

              <section className="perfil-publico-card perfil-publico-card--stack">
                <div className="perfil-publico-section-head">
                  <div className="perfil-publico-section-head__title-wrap">
                    <span className="perfil-publico-section-head__icon perfil-publico-section-head__icon--soft" aria-hidden="true">
                      <Icon path={mdiStar} size={0.82} />
                    </span>
                    <h2>Habilidades blandas</h2>
                  </div>
                </div>

                {normalizedProfile.softSkills.length > 0 ? (
                  <div className="perfil-publico-tags perfil-publico-tags--soft">
                    {normalizedProfile.softSkills.map((skill) => (
                      <div key={skill.id} className="perfil-publico-tag perfil-publico-tag--soft">
                        <span className="perfil-publico-tag__label">{skill.name}</span>
                        {skill.evidence_url ? (
                          <a href={skill.evidence_url} target="_blank" rel="noreferrer" className="perfil-publico-tag__link" aria-label={`Ver evidencia de ${skill.name}`}>
                            <Icon path={mdiOpenInNew} size={0.65} />
                          </a>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="perfil-publico-empty-inline">Sin habilidades blandas públicas disponibles.</p>
                )}
              </section>
            </aside>
          </div>
        ) : null}

        {activeTab === 'projects' ? (
          <div
            id="perfil-publico-panel-projects"
            role="tabpanel"
            aria-labelledby="perfil-publico-tab-projects"
            className="perfil-publico-projects"
          >
            {hasProjectsSection ? (
              <>
                {projectsTabHasContent ? (
                  <div className="perfil-publico-section-head perfil-publico-section-head--spaced perfil-publico-projects-personal-head">
                    <div className="perfil-publico-section-head__title-wrap">
                      <span className="perfil-publico-section-head__icon perfil-publico-section-head__icon--dark" aria-hidden="true">
                        <Icon path={mdiFolderOutline} size={0.9} />
                      </span>
                      <h2>Proyectos personales</h2>
                    </div>
                    <span className="perfil-publico-section-head__count">{normalizedProfile.projects.length}</span>
                  </div>
                ) : null}

                {normalizedProfile.featuredProject ? (
                  <section className="softsave-projects-card softsave-projects-card--public perfil-publico-project-featured">
                    <div className="softsave-projects-card__body perfil-publico-project-featured__body">
                      <div className="softsave-projects-card__media perfil-publico-project-featured__media" aria-hidden="true">
                        {resolveProjectImageUrl(normalizedProfile.featuredProject) ? (
                          <img
                            src={resolveProjectImageUrl(normalizedProfile.featuredProject)}
                            alt={getProjectTitle(normalizedProfile.featuredProject)}
                          />
                        ) : (
                          <Icon path={mdiFolderOutline} size={1.1} />
                        )}
                      </div>

                      <div className="softsave-projects-card__summary perfil-publico-project-featured__summary">
                        <div className="perfil-publico-project-featured__header">
                          <div className="perfil-publico-project-featured__headline">
                            <h3 className="softsave-projects-card__title perfil-publico-featured__title">
                              {getProjectTitle(normalizedProfile.featuredProject)}
                            </h3>
                          </div>
                        </div>

                        <div className="perfil-publico-project-featured__meta">
                          {normalizedProfile.featuredProject?.is_in_progress ? (
                            <span className="perfil-publico-status is-active">
                              En progreso
                            </span>
                          ) : null}
                          {formatProjectIsoDate(normalizedProfile.featuredProject) ? (
                            <p className="perfil-publico-project-featured__date">
                              {formatProjectIsoDate(normalizedProfile.featuredProject)}
                            </p>
                          ) : null}
                        </div>

                        {featuredProjectDescription ? (
                          <div
                            className="softsave-projects-card__description softsave-projects-card__description--rich perfil-publico-project-featured__text"
                            dangerouslySetInnerHTML={{ __html: featuredProjectDescription }}
                          />
                        ) : (
                          <p className="softsave-projects-card__description perfil-publico-project-featured__text">
                            Sin descripción disponible.
                          </p>
                        )}

                        <div className="softsave-projects-card__links perfil-publico-project-featured__links">
                          {normalizedProfile.featuredProject?.demo_url ? (
                            <a
                              href={normalizedProfile.featuredProject.demo_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Icon path={mdiOpenInNew} size={0.72} />
                              Demo
                            </a>
                          ) : null}
                          {normalizedProfile.featuredProject?.repo_url ? (
                            <a
                              href={normalizedProfile.featuredProject.repo_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Icon path={mdiGithub} size={0.72} />
                              Repositorio
                            </a>
                          ) : null}
                        </div>

                        {getProjectTechnologies(normalizedProfile.featuredProject).length > 0 ? (
                          <div className="softsave-project-form__chips perfil-publico-project-featured__chips" aria-label="Tecnologías del proyecto destacado">
                            {getProjectTechnologies(normalizedProfile.featuredProject).map((technology) => (
                              <span key={technology} className="softsave-project-form__chip softsave-project-form__chip--selected">
                                {technology}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </section>
                ) : null}

                {normalizedProfile.remainingProjects.length > 0 ? (
                  <section className="perfil-publico-card perfil-publico-project-grid-card">
                    <div className="perfil-publico-section-head perfil-publico-section-head--spaced">
                      <div className="perfil-publico-section-head__title-wrap">
                        <span className="perfil-publico-section-head__icon perfil-publico-section-head__icon--dark" aria-hidden="true">
                          <Icon path={mdiFolderOutline} size={0.9} />
                        </span>
                        <h2>Otros proyectos públicos</h2>
                      </div>
                      <span className="perfil-publico-section-head__count">{normalizedProfile.remainingProjects.length}</span>
                    </div>

                    <div className="perfil-publico-project-grid">
                      {normalizedProfile.remainingProjects.map((project) => {
                        const imageUrl = resolveProjectImageUrl(project);
                        const technologies = getProjectTechnologies(project);
                        const description = sanitizeHtml(project?.description || '');

                        return (
                          <article key={project.id} className="perfil-publico-project-card">
                            <div className="perfil-publico-project-card__media">
                              {imageUrl ? (
                                <img src={imageUrl} alt={getProjectTitle(project)} />
                              ) : (
                                <div className="perfil-publico-project-card__placeholder" aria-hidden="true">
                                  <Icon path={mdiFolderOutline} size={1.2} />
                                </div>
                              )}
                            </div>

                            <div className="perfil-publico-project-card__content">
                              <div className="perfil-publico-project-card__head">
                                <span className={`perfil-publico-status ${project?.is_in_progress ? 'is-active' : 'is-complete'}`}>
                                  {project?.is_in_progress ? 'En progreso' : 'Publicado'}
                                </span>
                                {formatProjectRange(project) ? (
                                  <span className="perfil-publico-project-card__date">{formatProjectRange(project)}</span>
                                ) : null}
                              </div>

                              <h3>{getProjectTitle(project)}</h3>
                              {description ? (
                                <div
                                  className="perfil-publico-project-card__text softsave-projects-card__description--rich"
                                  dangerouslySetInnerHTML={{ __html: description }}
                                />
                              ) : (
                                <p className="perfil-publico-project-card__text">
                                  Sin descripción disponible.
                                </p>
                              )}

                              {technologies.length > 0 ? (
                                <div className="perfil-publico-project-tags">
                                  {technologies.slice(0, 4).map((technology) => (
                                    <span key={technology} className="perfil-publico-project-tags__item">
                                      {technology}
                                    </span>
                                  ))}
                                </div>
                              ) : null}

                              <div className="perfil-publico-project-card__links">
                                {project?.demo_url ? (
                                  <a href={project.demo_url} target="_blank" rel="noreferrer">
                                    Demo
                                    <Icon path={mdiOpenInNew} size={0.68} />
                                  </a>
                                ) : null}
                                {project?.repo_url ? (
                                  <a href={project.repo_url} target="_blank" rel="noreferrer">
                                    Repo
                                    <Icon path={mdiGithub} size={0.68} />
                                  </a>
                                ) : null}
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ) : null}
              </>
            ) : (
              <section className="perfil-publico-card perfil-publico-empty-state">
                <span className="perfil-publico-empty-state__icon" aria-hidden="true">
                  <Icon path={mdiFolderOutline} size={1.3} />
                </span>
                <h2>Sin proyectos públicos</h2>
                <p>No hay proyectos visibles para este perfil en este momento.</p>
              </section>
            )}

            {githubRepositoriesTabHasContent ? (
              <section className="perfil-publico-card perfil-publico-github-grid-card">
                <div className="perfil-publico-section-head perfil-publico-section-head--spaced">
                  <div className="perfil-publico-section-head__title-wrap">
                    <span className="perfil-publico-section-head__icon perfil-publico-section-head__icon--dark" aria-hidden="true">
                      <Icon path={mdiGithub} size={0.9} />
                    </span>
                    <h2>Repositorios de GitHub</h2>
                  </div>
                  <span className="perfil-publico-section-head__count">{normalizedProfile.githubRepositories.length}</span>
                </div>

                <div className="perfil-publico-github-grid">
                  {normalizedProfile.githubRepositories.map((repository) => (
                    <article key={repository.id} className="perfil-publico-github-card">
                      <div className="perfil-publico-github-card__top">
                        <span className="perfil-publico-github-card__icon" aria-hidden="true">
                          <Icon path={mdiFolderOutline} size={0.82} />
                        </span>
                        {repository.language ? (
                          <span className="softsave-project-form__chip softsave-project-form__chip--selected perfil-publico-github-card__tech">
                            {repository.language}
                          </span>
                        ) : null}
                      </div>

                      <div className="perfil-publico-github-card__content">
                        <h3>{repository.title}</h3>
                        <p className="perfil-publico-github-card__text">
                          {repository.description}
                        </p>

                        <div className="perfil-publico-github-card__stats" aria-label="Estadísticas del repositorio">
                          <span className="perfil-publico-github-card__stat">☆ {repository.starsCount}</span>
                          <span className="perfil-publico-github-card__stat">⑂ {repository.forksCount}</span>
                          {repository.isFork ? (
                            <span className="perfil-publico-github-card__stat perfil-publico-github-card__stat--fork">Fork</span>
                          ) : null}
                        </div>

                        {repository.repoUrl ? (
                          <div className="perfil-publico-github-card__links">
                            <a href={repository.repoUrl} target="_blank" rel="noreferrer">
                              Ver en GitHub
                              <Icon path={mdiOpenInNew} size={0.68} />
                            </a>
                          </div>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default PerfilPublico;
