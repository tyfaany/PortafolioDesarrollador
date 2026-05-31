import { useEffect, useMemo, useState } from 'react';
import Icon from '@mdi/react';
import { mdiMagnify, mdiStarFourPoints } from '@mdi/js';
import { talentProfiles } from '../../mocks/talentProfiles';
import TalentProfileCard from './TalentProfileCard';
import TalentProfileDetail from './TalentProfileDetail';
import ProfilePagination from './ProfilePagination';
import TalentSidebarFilters from './TalentSidebarFilters';
import '../../styles/TalentBoard.css';

const PROFILES_PER_PAGE = 4;

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function TalentBoardHome() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredProfiles = useMemo(() => {
    const query = normalizeText(searchTerm.trim());

    return talentProfiles.filter((profile) => {
      const searchableContent = normalizeText([
        profile.nombre,
        profile.rol,
        profile.bio,
        profile.focus,
        profile.habilidades.join(' '),
      ].join(' '));

      const matchesSearch = !query || searchableContent.includes(query);
      const matchesSkills = selectedSkills.every((skill) => profile.habilidades.includes(skill));

      return matchesSearch && matchesSkills;
    });
  }, [searchTerm, selectedSkills]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSkills]);

  useEffect(() => {
    if (selectedProfileIndex === null) {
      return;
    }

    if (selectedProfileIndex < 0 || selectedProfileIndex >= filteredProfiles.length) {
      setSelectedProfileIndex(null);
    }
  }, [filteredProfiles, selectedProfileIndex]);

  const totalPages = Math.max(1, Math.ceil(filteredProfiles.length / PROFILES_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PROFILES_PER_PAGE;
  const visibleProfiles = filteredProfiles.slice(pageStart, pageStart + PROFILES_PER_PAGE);
  const selectedProfile = selectedProfileIndex !== null
    ? filteredProfiles[selectedProfileIndex]
    : null;

  const toggleSkill = (skill) => {
    setSelectedSkills((currentSkills) => (
      currentSkills.includes(skill)
        ? currentSkills.filter((currentSkill) => currentSkill !== skill)
        : [...currentSkills, skill]
    ));
  };

  const openProfile = (profileId) => {
    const index = filteredProfiles.findIndex((profile) => profile.id === profileId);
    if (index >= 0) {
      setSelectedProfileIndex(index);
    }
  };

  const showPreviousProfile = () => {
    setSelectedProfileIndex((currentIndex) => {
      if (currentIndex === null || filteredProfiles.length === 0) {
        return currentIndex;
      }

      return currentIndex === 0 ? filteredProfiles.length - 1 : currentIndex - 1;
    });
  };

  const showNextProfile = () => {
    setSelectedProfileIndex((currentIndex) => {
      if (currentIndex === null || filteredProfiles.length === 0) {
        return currentIndex;
      }

      return currentIndex === filteredProfiles.length - 1 ? 0 : currentIndex + 1;
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
          totalProfiles={filteredProfiles.length}
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
          selectedSkills={selectedSkills}
          onToggleSkill={toggleSkill}
          onClearFilters={() => setSelectedSkills([])}
        />

        <div className="talent-board-results">
          <div className="talent-board-results__bar">
            <p>
              Mostrando <span>{filteredProfiles.length}</span> perfiles destacados
            </p>
            <p>
              Pagina <span>{safePage}</span> de <span>{totalPages}</span>
            </p>
          </div>

          {filteredProfiles.length > 0 ? (
            <>
              <div className="talent-board-results__grid">
                {visibleProfiles.map((profile) => (
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
