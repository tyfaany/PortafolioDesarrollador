import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@mdi/react';
import { useSearchParams } from 'react-router-dom';
import { mdiMagnify, mdiRefresh, mdiSortVariant } from '@mdi/js';
import {
  obtenerCatalogoSkillsTecnicas,
  obtenerCatalogosPerfilPublico,
  obtenerPerfilesPublicos,
  obtenerTecnologias,
} from '../../services/authService';
import DropdownSelect from '../DropdownSelect';
import TalentProfileCard from './TalentProfileCard';
import ProfilePagination from './ProfilePagination';
import TalentSidebarFilters from './TalentSidebarFilters';
import '../../styles/TalentBoard.css';

const PROFILES_PER_PAGE = 4;
const DEFAULT_SORT = '-created_at';
const QUERY_KEYS = {
  currentPage: 'page',
  searchTerm: 'q',
  selectedSkills: 'skills',
  skillLevelFilters: 'skillLevelFilters',
  selectedTechnologies: 'technologies',
  professions: 'professions',
  degrees: 'degrees',
  institutions: 'institutions',
  experienceRole: 'experienceRole',
  sortValue: 'sort',
};

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

function buildExperienceFilterValue(experienceRoles) {
  if (!Array.isArray(experienceRoles) || experienceRoles.length === 0) {
    return '';
  }

  return experienceRoles
    .map((item) => {
      const role = String(item.role || '').trim();
      if (!role) {
        return '';
      }

      const minYears = String(item.minYears || '').trim();
      const maxYears = String(item.maxYears || '').trim();

      if (!minYears && !maxYears) {
        return role;
      }

      return [role, minYears, maxYears].join(',');
    })
    .filter(Boolean)
    .join('|');
}

function getOptionNameById(options, id) {
  return options.find((option) => String(option.id) === String(id))?.name || '';
}

function parseListParam(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildSkillLevelFilterValue(skillLevelFilters) {
  if (!Array.isArray(skillLevelFilters) || skillLevelFilters.length === 0) {
    return '';
  }

  return skillLevelFilters
    .map((item) => {
      const skillName = String(item?.skillName || '').trim();
      const levels = Array.isArray(item?.levels)
        ? item.levels.map((level) => String(level || '').trim()).filter(Boolean)
        : [];

      if (!skillName) {
        return '';
      }

      return levels.length > 0 ? [skillName, ...levels].join(',') : skillName;
    })
    .filter(Boolean)
    .join('|');
}

function parseSkillLevelFiltersParam(value) {
  const rawValue = String(value || '').trim();
  if (!rawValue) {
    return [];
  }

  return rawValue
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [skillName, ...levels] = item.split(',').map((part) => String(part || '').trim());
      return {
        skillId: '',
        skillName: String(skillName || '').trim(),
        levels: levels.filter(Boolean),
      };
    })
    .filter((item) => item.skillName && item.skillName.length >= 2);
}

function parseExperienceRolesParam(value) {
  const rawValue = String(value || '').trim();
  if (!rawValue) {
    return [];
  }

  return rawValue
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [role, minYears = '', maxYears = ''] = item.split(',').map((part) => String(part || '').trim());
      return {
        role: String(role || '').trim(),
        minYears: String(minYears || '').trim(),
        maxYears: String(maxYears || '').trim(),
      };
    })
    .filter((item) => item.role && item.role.length >= 2);
}

function parsePageParam(value) {
  const page = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function normalizeFiltersFromSearchParams(searchParams) {
  return {
    searchTerm: searchParams.get(QUERY_KEYS.searchTerm) || '',
    selectedSkills: parseListParam(searchParams.get(QUERY_KEYS.selectedSkills)),
    skillLevelFilters: parseSkillLevelFiltersParam(searchParams.get(QUERY_KEYS.skillLevelFilters)),
    selectedTechnologies: parseListParam(searchParams.get(QUERY_KEYS.selectedTechnologies)),
    professions: parseListParam(searchParams.get(QUERY_KEYS.professions)),
    degrees: parseListParam(searchParams.get(QUERY_KEYS.degrees)),
    institutions: parseListParam(searchParams.get(QUERY_KEYS.institutions)),
    experienceRoles: parseExperienceRolesParam(searchParams.get(QUERY_KEYS.experienceRole)),
    sortValue: searchParams.get(QUERY_KEYS.sortValue) || DEFAULT_SORT,
    currentPage: parsePageParam(searchParams.get(QUERY_KEYS.currentPage)),
  };
}

function serializeFiltersToSearchParams(filters) {
  const params = new URLSearchParams();

  if (filters.searchTerm.trim()) {
    params.set(QUERY_KEYS.searchTerm, filters.searchTerm.trim());
  }

  if (filters.selectedSkills.length > 0) {
    params.set(QUERY_KEYS.selectedSkills, filters.selectedSkills.join(','));
  }

  if (Array.isArray(filters.skillLevelFilters) && filters.skillLevelFilters.length > 0) {
    const skillLevelValue = buildSkillLevelFilterValue(filters.skillLevelFilters);
    if (skillLevelValue) {
      params.set(QUERY_KEYS.skillLevelFilters, skillLevelValue);
    }
  }

  if (filters.selectedTechnologies.length > 0) {
    params.set(QUERY_KEYS.selectedTechnologies, filters.selectedTechnologies.join(','));
  }

  if (filters.professions.length > 0) {
    params.set(QUERY_KEYS.professions, filters.professions.join(','));
  }

  if (filters.degrees.length > 0) {
    params.set(QUERY_KEYS.degrees, filters.degrees.join(','));
  }

  if (filters.institutions.length > 0) {
    params.set(QUERY_KEYS.institutions, filters.institutions.join(','));
  }

  if (Array.isArray(filters.experienceRoles) && filters.experienceRoles.length > 0) {
    params.set(QUERY_KEYS.experienceRole, buildExperienceFilterValue(filters.experienceRoles));
  }

  if (filters.sortValue && filters.sortValue !== DEFAULT_SORT) {
    params.set(QUERY_KEYS.sortValue, filters.sortValue);
  }

  if (filters.currentPage > 1) {
    params.set(QUERY_KEYS.currentPage, String(filters.currentPage));
  }

  return params;
}

function TalentBoardHome() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlFilters = useMemo(() => normalizeFiltersFromSearchParams(searchParams), [searchParams]);
  const [searchTerm, setSearchTerm] = useState(() => urlFilters.searchTerm);
  const [selectedSkills, setSelectedSkills] = useState(() => urlFilters.selectedSkills);
  const [skillLevelFilters, setSkillLevelFilters] = useState(() => urlFilters.skillLevelFilters);
  const [selectedTechnologies, setSelectedTechnologies] = useState(() => urlFilters.selectedTechnologies);
  const [professions, setProfessions] = useState(() => urlFilters.professions);
  const [degrees, setDegrees] = useState(() => urlFilters.degrees);
  const [institutions, setInstitutions] = useState(() => urlFilters.institutions);
  const [experienceRoles, setExperienceRoles] = useState(() => urlFilters.experienceRoles);
  const [sortValue, setSortValue] = useState(() => urlFilters.sortValue);
  const [currentPage, setCurrentPage] = useState(() => urlFilters.currentPage);
  const [refreshTick, setRefreshTick] = useState(0);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [apiCurrentPage, setApiCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [availableSkills, setAvailableSkills] = useState(null);
  const [availableTechnologies, setAvailableTechnologies] = useState(null);
  const [availableProfileCatalogs, setAvailableProfileCatalogs] = useState(null);
  const profileCatalogs = availableProfileCatalogs || {};
  const professionOptions = Array.isArray(profileCatalogs.professions) ? profileCatalogs.professions : [];
  const roleOptions = Array.isArray(profileCatalogs.experience_roles) ? profileCatalogs.experience_roles : [];
  const degreeOptions = Array.isArray(profileCatalogs.degrees) ? profileCatalogs.degrees : [];
  const institutionOptions = Array.isArray(profileCatalogs.institutions) ? profileCatalogs.institutions : [];
  const searchParamsString = searchParams.toString();
  const lastWrittenSearchParamsRef = useRef(searchParamsString);

  useEffect(() => {
    if (searchParamsString === lastWrittenSearchParamsRef.current) {
      return;
    }

    const nextFilters = normalizeFiltersFromSearchParams(searchParams);

    setSearchTerm(nextFilters.searchTerm);
    setSelectedSkills(nextFilters.selectedSkills);
    setSkillLevelFilters(nextFilters.skillLevelFilters);
    setSelectedTechnologies(nextFilters.selectedTechnologies);
    setProfessions(nextFilters.professions);
    setDegrees(nextFilters.degrees);
    setInstitutions(nextFilters.institutions);
    setExperienceRoles(nextFilters.experienceRoles);
    setSortValue(nextFilters.sortValue);
    setCurrentPage(nextFilters.currentPage);
    lastWrittenSearchParamsRef.current = searchParamsString;
  }, [searchParams, searchParamsString]);

  useEffect(() => {
    const nextParams = serializeFiltersToSearchParams({
      searchTerm,
      selectedSkills,
      skillLevelFilters,
      selectedTechnologies,
      professions,
      degrees,
      institutions,
      experienceRoles,
      sortValue,
      currentPage,
    });

    if (nextParams.toString() === searchParamsString) {
      return;
    }

    lastWrittenSearchParamsRef.current = nextParams.toString();
    setSearchParams(nextParams, { replace: true });
  }, [
    currentPage,
    degrees,
    experienceRoles,
    institutions,
    professions,
    searchTerm,
    skillLevelFilters,
    selectedSkills,
    selectedTechnologies,
    setSearchParams,
    sortValue,
    searchParamsString,
  ]);

  useEffect(() => {
    let isActive = true;

    const loadCatalogs = async () => {
      setAvailableSkills(null);
      setAvailableTechnologies(null);
      setAvailableProfileCatalogs(null);

      const [skillsResult, technologiesResult, profileCatalogsResult] = await Promise.allSettled([
        obtenerCatalogoSkillsTecnicas(),
        obtenerTecnologias(),
        obtenerCatalogosPerfilPublico(),
      ]);

      if (!isActive) {
        return;
      }

      const skillCatalog = skillsResult.status === 'fulfilled' && Array.isArray(skillsResult.value?.data)
        ? skillsResult.value.data
        : [];
      const technologyCatalog = technologiesResult.status === 'fulfilled' && Array.isArray(technologiesResult.value?.data)
        ? technologiesResult.value.data
        : [];
      const publicCatalogs = profileCatalogsResult.status === 'fulfilled' && profileCatalogsResult.value?.data
        ? profileCatalogsResult.value.data
        : {};

      setAvailableSkills(skillCatalog);
      setAvailableTechnologies(technologyCatalog);
      setAvailableProfileCatalogs(publicCatalogs);
    };

    loadCatalogs();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedSkills,
    skillLevelFilters,
    selectedTechnologies,
    professions,
    degrees,
    institutions,
    experienceRoles,
    sortValue,
  ]);

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
          const catalog = Array.isArray(availableSkills) ? availableSkills : [];
          const selectedSkillNames = selectedSkills
            .map((skillId) => getOptionNameById(catalog, skillId))
            .filter(Boolean);

          if (selectedSkillNames.length > 0) {
            params['filter[habilidades]'] = selectedSkillNames.join(',');
          }
        }

        if (skillLevelFilters.length > 0) {
          const skillLevelValue = buildSkillLevelFilterValue(skillLevelFilters);
          if (skillLevelValue) {
            params['filter[habilidadTecnica_nivel]'] = skillLevelValue;
          }
        }

        if (selectedTechnologies.length > 0) {
          const catalog = Array.isArray(availableTechnologies) ? availableTechnologies : [];
          const technologyNames = selectedTechnologies
            .map((techId) => getOptionNameById(catalog, techId))
            .filter(Boolean);

          if (technologyNames.length > 0) {
            params['filter[technology]'] = technologyNames.join(',');
          }
        }

        if (professions.length > 0) {
          params['filter[profession]'] = professions.join(',');
        }

        if (degrees.length > 0) {
          params['filter[degree]'] = degrees.join(',');
        }

        if (institutions.length > 0) {
          params['filter[academic_institution]'] = institutions.join(',');
        }

        const experienceValue = buildExperienceFilterValue(experienceRoles);
        if (experienceValue) {
          params['filter[experiencia_cargo]'] = experienceValue;
        }

        if (sortValue) {
          params.sort = sortValue;
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
  }, [
    availableSkills,
    availableTechnologies,
    currentPage,
    refreshTick,
    searchTerm,
    selectedSkills,
    skillLevelFilters,
    selectedTechnologies,
    professions,
    degrees,
    institutions,
    experienceRoles,
    sortValue,
  ]);

  const safePage = Math.min(apiCurrentPage, totalPages);
  const selectedSkillsCount = selectedSkills.length;
  const activeFiltersCount = [
    selectedSkillsCount > 0,
    skillLevelFilters.length > 0,
    selectedTechnologies.length > 0,
    professions.length > 0,
    degrees.length > 0,
    institutions.length > 0,
    experienceRoles.length > 0,
  ].filter(Boolean).length;

  const toggleSkill = (skill) => {
    const skillId = String(skill?.id ?? '');
    if (!skillId) {
      return;
    }

    setSelectedSkills((currentSkills) => (
      currentSkills.includes(skillId)
        ? currentSkills.filter((currentSkill) => currentSkill !== skillId)
        : [...currentSkills, skillId]
    ));
  };

  const removeSkill = (skillId) => {
    setSelectedSkills((currentSkills) => currentSkills.filter((currentSkill) => currentSkill !== skillId));
    setSkillLevelFilters((currentEntries) => currentEntries.filter((entry) => String(entry.skillId) !== String(skillId)));
  };

  const addProfession = (profession) => {
    if (profession && !professions.includes(profession)) {
      setProfessions((prev) => [...prev, profession]);
    }
  };

  const removeProfession = (profession) => {
    setProfessions((prev) => prev.filter((p) => p !== profession));
  };

  const addTechnology = (techId) => {
    if (techId && !selectedTechnologies.includes(techId)) {
      setSelectedTechnologies((prev) => [...prev, techId]);
    }
  };

  const removeTechnology = (techId) => {
    setSelectedTechnologies((prev) => prev.filter((t) => t !== techId));
  };

  const addDegree = (degree) => {
    if (degree && !degrees.includes(degree)) {
      setDegrees((prev) => [...prev, degree]);
    }
  };

  const removeDegree = (degree) => {
    setDegrees((prev) => prev.filter((d) => d !== degree));
  };

  const addInstitution = (institution) => {
    if (institution && !institutions.includes(institution)) {
      setInstitutions((prev) => [...prev, institution]);
    }
  };

  const removeInstitution = (institution) => {
    setInstitutions((prev) => prev.filter((i) => i !== institution));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSkills([]);
    setSkillLevelFilters([]);
    setSelectedTechnologies([]);
    setProfessions([]);
    setDegrees([]);
    setInstitutions([]);
    setExperienceRoles([]);
    setSortValue(DEFAULT_SORT);
  };

  return (
    <main className="talent-board-page">
      <div
        className="talent-board-page__orb talent-board-page__orb--one"
        aria-hidden="true"
      />
      <div
        className="talent-board-page__orb talent-board-page__orb--two"
        aria-hidden="true"
      />

      <section className="talent-board-hero">
        <h1>Explora talento, proyectos y trayectoria en una sola vista</h1>
        <p>
          Una experiencia de discovery pensada para encontrar perfiles que
          encajan con tu stack, tus retos técnicos y la narrativa visual de
          DevStack.
        </p>

        <form
          className="talent-board-search softsave-projects-card"
          onSubmit={(event) => event.preventDefault()}
        >
          <span className="talent-board-search__icon" aria-hidden="true">
            <Icon path={mdiMagnify} size={0.9} />
          </span>
          <label
            className="talent-board-search__label"
            htmlFor="talent-board-search-input"
          ></label>
          <input
            id="talent-board-search-input"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar..."
            aria-label="Buscar perfiles por nombre, rol, biografía o experiencia"
          />
          <button type="submit" className="talent-board-primary-button">
            Buscar
          </button>
        </form>
      </section>

      <section className="talent-board-layout">
        <TalentSidebarFilters
          availableSkills={availableSkills}
          availableTechnologies={availableTechnologies}
          professionOptions={professionOptions}
          selectedSkills={selectedSkills}
          onToggleSkill={toggleSkill}
          onRemoveSkill={removeSkill}
          skillLevelFilters={skillLevelFilters}
          onSkillLevelFiltersChange={setSkillLevelFilters}
          selectedTechnologies={selectedTechnologies}
          onAddTechnology={addTechnology}
          onRemoveTechnology={removeTechnology}
          roleOptions={roleOptions}
          professions={professions}
          onAddProfession={addProfession}
          onRemoveProfession={removeProfession}
          degreeOptions={degreeOptions}
          degrees={degrees}
          onAddDegree={addDegree}
          onRemoveDegree={removeDegree}
          institutionOptions={institutionOptions}
          institutions={institutions}
          onAddInstitution={addInstitution}
          onRemoveInstitution={removeInstitution}
          experienceRoles={experienceRoles}
          onExperienceRolesChange={setExperienceRoles}
          onClearFilters={clearFilters}
        />

        <div className="talent-board-results">
          <div className="talent-board-results__bar">
            <div className="talent-board-results__summary">
              <p>
                Mostrando <span>{totalResults}</span> perfiles
              </p>
              <p className="talent-board-results__meta">
                {activeFiltersCount > 0 ? (
                  <>
                    <span>{activeFiltersCount}</span> filtro/s activo/s
                  </>
                ) : (
                  "Sin filtros activos"
                )}
              </p>
            </div>

            <div className="talent-board-results__sort">
              <label htmlFor="talent-board-sort">
                <Icon path={mdiSortVariant} size={0.72} />
                Ordenar por
              </label>
              <DropdownSelect
                id="talent-board-sort"
                value={sortValue}
                onChange={setSortValue}
                options={[
                  { value: '-created_at', label: 'Más recientes' },
                  { value: 'created_at', label: 'Más antiguos' },
                  { value: '-projects_count', label: 'Más proyectos' },
                  { value: 'projects_count', label: 'Menos proyectos' },
                  { value: 'name', label: 'Nombre (A-Z)' },
                  { value: '-name', label: 'Nombre (Z-A)' },
                  { value: 'profession', label: 'Profesión (A-Z)' },
                  { value: '-profession', label: 'Profesión (Z-A)' },
                ]}
                ariaLabel="Ordenar resultados"
              />
            </div>

            <div className="talent-board-results__page">
              <p>
                Página <span>{safePage}</span> de <span>{totalPages}</span>
              </p>
              <button
                type="button"
                className="talent-board-results__refresh"
                onClick={() => setRefreshTick((value) => value + 1)}
              >
                <Icon path={mdiRefresh} size={0.72} />
                Reintentar
              </button>
            </div>
          </div>

          {loading ? (
            <div className="talent-board-empty softsave-projects-card">
              <h2>Cargando perfiles</h2>
              <p>
                Estamos consultando la información más reciente del directorio.
              </p>
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
                  <TalentProfileCard key={profile.id} profile={profile} />
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
                Prueba con otro nombre, ajusta las habilidades o limpia los
                filtros para volver a explorar el directorio.
              </p>
              <button
                type="button"
                className="talent-board-primary-button talent-board-empty__action"
                onClick={clearFilters}
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
