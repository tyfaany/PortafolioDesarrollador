import { useEffect, useState } from 'react';
import Icon from '@mdi/react';
import { mdiMagnify, mdiStarFourPoints } from '@mdi/js';
import { obtenerPerfilesPublicos, obtenerTecnologias } from '../../services/authService';
import TalentProfileCard from './TalentProfileCard';
import TalentProfileDetail from './TalentProfileDetail';
import ProfilePagination from './ProfilePagination';
import TalentSidebarFilters from './TalentSidebarFilters';
import '../../styles/TalentBoard.css';

const PROFILES_PER_PAGE = 4;

function getInitials(name) {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function buildGradient(seed) {
  const palette = [
    ['#2C3E50', '#4C6580'],
    ['#0F766E', '#14B8A6'],
    ['#7C3AED', '#A855F7'],
    ['#B45309', '#EA580C'],
    ['#2563EB', '#38BDF8'],
  ];

  const text = String(seed || '');
  const hash = [...text].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

function formatYearRange(startMonth, startYear, endMonth, endYear, isCurrentJob) {
  const start = [startMonth, startYear].filter(Boolean).join('/');
  const end = isCurrentJob ? 'Actualidad' : [endMonth, endYear].filter(Boolean).join('/');

  if (!start && !end) {
    return 'Sin fechas';
  }

  if (!start) {
    return end || 'Sin fechas';
  }

  if (!end) {
    return start;
  }

  return `${start} - ${end}`;
}

function pickFirstText(...values) {
  return values.find((value) => String(value || '').trim() !== '') || '';
}

function mapPublicProfile(profile) {
  const name = profile?.name || 'Perfil sin nombre';
  const skills = Array.isArray(profile?.skills)
    ? profile.skills.map((skill) => (typeof skill === 'string' ? skill : skill?.name)).filter(Boolean)
    : [];
  const jobs = Array.isArray(profile?.jobs) ? profile.jobs : [];
  const studies = Array.isArray(profile?.studies) ? profile.studies : [];
  const [from, to] = buildGradient(name);

  return {
    id: profile?.id,
    name,
    nombre: name,
    profession: profile?.profession || '',
    rol: profile?.profession || 'Profesional',
    profile_photo_url: profile?.profile_photo_url || '',
    bio: profile?.biography || 'Sin biografía disponible.',
    biography: profile?.biography || '',
    calificacion: Number(profile?.rating || 5),
    proyectos: Array.isArray(profile?.projects) ? profile.projects.length : 0,
    projects: Array.isArray(profile?.projects) ? profile.projects : [],
    email: profile?.contact_email || profile?.email || '',
    github: profile?.github_url || '',
    github_url: profile?.github_url || '',
    linkedin: profile?.linkedin_url || '',
    linkedin_url: profile?.linkedin_url || '',
    avatar: {
      initials: getInitials(name),
      from,
      to,
    },
    habilidades: skills,
    skills: skills.map((skill) => ({ name: skill })),
    focus: skills[0] || profile?.profession || 'Talento destacado',
    experienciaLaboral: jobs.map((job) => ({
      puesto: pickFirstText(job?.position, job?.job_title, job?.role, job?.title, job?.cargo, 'Experiencia laboral'),
      empresa: job?.company_name || 'Empresa no especificada',
      anios: formatYearRange(job?.start_month, job?.start_year, job?.end_month, job?.end_year, job?.is_current_job),
      descripcion: pickFirstText(
        job?.description,
        job?.achievements,
        job?.achievement,
        job?.achivements,
        job?.logros,
        'Sin descripción disponible.',
      ),
    })),
    formacionAcademica: studies.map((study) => ({
      titulo: study?.degree || 'Estudio',
      institucion: study?.academic_institution || 'Institución no especificada',
      anio: formatYearRange(
        study?.start_date ? new Date(study.start_date).getFullYear() : '',
        '',
        study?.end_date ? new Date(study.end_date).getFullYear() : '',
        '',
        false,
      ),
    })),
  };
}

function TalentBoardHome() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshTick, setRefreshTick] = useState(0);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [apiCurrentPage, setApiCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [availableSkills, setAvailableSkills] = useState(null);

  useEffect(() => {
    let isActive = true;

    const loadTechnologies = async () => {
      setAvailableSkills(null);

      try {
        const response = await obtenerTecnologias();
        const technologies = Array.isArray(response?.data) ? response.data : [];
        const names = technologies
          .map((technology) => (typeof technology === 'string' ? technology : technology?.name))
          .filter(Boolean);

        if (!isActive) {
          return;
        }

        setAvailableSkills(Array.from(new Set(names)));
      } catch {
        if (!isActive) {
          return;
        }

        setAvailableSkills([]);
      }
    };

    loadTechnologies();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSkills]);

  useEffect(() => {
    let isActive = true;
    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      setError('');

      try {
        const params = {
          page: currentPage,
          per_page: PROFILES_PER_PAGE,
        };

        const query = searchTerm.trim();
        if (query) {
          params['filter[search]'] = query;
        }

        if (selectedSkills.length > 0) {
          params['filter[habilidades]'] = selectedSkills
            .map((skill) => skill.toLowerCase())
            .join(',');
        }

        const response = await obtenerPerfilesPublicos(params);
        const payload = response?.data || {};
        const rawProfiles = Array.isArray(payload.data) ? payload.data : [];

        if (!isActive) {
          return;
        }

        setProfiles(rawProfiles.map(mapPublicProfile));
        setTotalPages(Math.max(1, Number(payload.last_page || 1)));
        setApiCurrentPage(Number(payload.current_page || currentPage));
        setTotalResults(Number(payload.total || rawProfiles.length));
      } catch {
        if (!isActive) {
          return;
        }

        setProfiles([]);
        setTotalPages(1);
        setApiCurrentPage(1);
        setTotalResults(0);
        setError('No se pudieron cargar los perfiles.');
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [currentPage, refreshTick, searchTerm, selectedSkills]);

  useEffect(() => {
    if (selectedProfileIndex === null) {
      return;
    }

    if (selectedProfileIndex < 0 || selectedProfileIndex >= profiles.length) {
      setSelectedProfileIndex(null);
    }
  }, [profiles, selectedProfileIndex]);

  const safePage = Math.min(apiCurrentPage, totalPages);
  const selectedProfile = selectedProfileIndex !== null
    ? profiles[selectedProfileIndex]
    : null;

  const toggleSkill = (skill) => {
    setSelectedSkills((currentSkills) => (
      currentSkills.includes(skill)
        ? currentSkills.filter((currentSkill) => currentSkill !== skill)
        : [...currentSkills, skill]
    ));
  };

  const openProfile = (profileId) => {
    const index = profiles.findIndex((profile) => profile.id === profileId);
    if (index >= 0) {
      setSelectedProfileIndex(index);
    }
  };

  const showPreviousProfile = () => {
    setSelectedProfileIndex((currentIndex) => {
      if (currentIndex === null || profiles.length === 0) {
        return currentIndex;
      }

      return currentIndex === 0 ? profiles.length - 1 : currentIndex - 1;
    });
  };

  const showNextProfile = () => {
    setSelectedProfileIndex((currentIndex) => {
      if (currentIndex === null || profiles.length === 0) {
        return currentIndex;
      }

      return currentIndex === profiles.length - 1 ? 0 : currentIndex + 1;
    });
  };

  if (selectedProfile) {
    return (
      <main className="talent-board-page">
        <div className="talent-board-page__orb talent-board-page__orb--one" aria-hidden="true" />
        <div className="talent-board-page__orb talent-board-page__orb--two" aria-hidden="true" />
        <TalentProfileDetail
          profile={selectedProfile}
          currentIndex={selectedProfileIndex}
          totalProfiles={profiles.length}
          onBack={() => setSelectedProfileIndex(null)}
          onPreviousProfile={showPreviousProfile}
          onNextProfile={showNextProfile}
        />
      </main>
    );
  }

  return (
    <main className="talent-board-page">
      <div className="talent-board-page__orb talent-board-page__orb--one" aria-hidden="true" />
      <div className="talent-board-page__orb talent-board-page__orb--two" aria-hidden="true" />

      <section className="talent-board-hero">
        <p className="talent-board-hero__eyebrow">
          <Icon path={mdiStarFourPoints} size={0.7} />
          Talent Board
        </p>
        <h1>Explora talento, proyectos y trayectoria en una sola vista</h1>
        <p>
          Una experiencia de discovery pensada para encontrar perfiles que encajan con tu stack,
          tus retos tecnicos y la narrativa visual de SoftSave.
        </p>

        <form
          className="talent-board-search softsave-projects-card"
          onSubmit={(event) => event.preventDefault()}
        >
          <span className="talent-board-search__icon" aria-hidden="true">
            <Icon path={mdiMagnify} size={0.9} />
          </span>
          <label className="talent-board-search__label" htmlFor="talent-board-search-input">
            Buscar perfiles
          </label>
          <input
            id="talent-board-search-input"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Busca por nombre, rol o palabra clave"
            aria-label="Buscar perfiles por nombre, rol o palabra clave"
          />
          <button type="submit" className="talent-board-primary-button">
            Buscar
          </button>
        </form>
      </section>

      <section className="talent-board-layout">
        <TalentSidebarFilters
          availableSkills={availableSkills}
          selectedSkills={selectedSkills}
          onToggleSkill={toggleSkill}
          onClearFilters={() => setSelectedSkills([])}
        />

        <div className="talent-board-results">
          <div className="talent-board-results__bar">
            <p>
              Mostrando <span>{totalResults}</span> perfiles destacados
            </p>
            <p>
              Pagina <span>{safePage}</span> de <span>{totalPages}</span>
            </p>
          </div>

          {loading ? (
            <div className="talent-board-empty softsave-projects-card">
              <h2>Cargando perfiles</h2>
              <p>Estamos consultando la informacion mas reciente del directorio.</p>
            </div>
          ) : error ? (
            <div className="talent-board-empty softsave-projects-card">
              <h2>No fue posible cargar los perfiles</h2>
              <p>{error}</p>
              <button
                type="button"
                className="talent-board-primary-button talent-board-empty__action"
                onClick={() => setRefreshTick((value) => value + 1)}
              >
                Reintentar
              </button>
            </div>
          ) : profiles.length > 0 ? (
            <>
              <div className="talent-board-results__grid">
                {profiles.map((profile) => (
                  <TalentProfileCard
                    key={profile.id}
                    profile={profile}
                    onViewDetail={() => openProfile(profile.id)}
                  />
                ))}
              </div>

              <ProfilePagination
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          ) : (
            <div className="talent-board-empty softsave-projects-card">
              <h2>No se encontraron resultados</h2>
              <p>
                Prueba con otro nombre, un rol distinto o limpia los filtros tecnicos para volver
                a explorar el directorio.
              </p>
              <button
                type="button"
                className="talent-board-primary-button talent-board-empty__action"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSkills([]);
                }}
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default TalentBoardHome;
