import { useMemo, useState } from 'react';
import Icon from '@mdi/react';
import { mdiMagnify } from '@mdi/js';
import { talentProfiles } from '../../mocks/talentProfiles';
import ProfileCard from './ProfileCard';
import ProfileDetail from './ProfileDetail';
import ResultsPagination from './ResultsPagination';
import SidebarFilters from './SidebarFilters';
import '../../styles/Sprint5.css';

function normalizeText(value) {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(null);

  const filteredProfiles = useMemo(() => {
    const query = normalizeText(searchTerm.trim());

    return talentProfiles.filter((profile) => {
      const searchableContent = normalizeText([
        profile.nombre,
        profile.rol,
        profile.bio,
        profile.habilidades.join(' '),
      ].join(' '));

      const matchesSearch = !query || searchableContent.includes(query);
      const matchesSkills = selectedSkills.every((skill) => profile.habilidades.includes(skill));

      return matchesSearch && matchesSkills;
    });
  }, [searchTerm, selectedSkills]);

  const toggleSkill = (skill) => {
    setSelectedSkills((currentSkills) => (
      currentSkills.includes(skill)
        ? currentSkills.filter((currentSkill) => currentSkill !== skill)
        : [...currentSkills, skill]
    ));
  };

  const selectedProfile = selectedProfileIndex !== null
    ? filteredProfiles[selectedProfileIndex]
    : null;

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
      <main className="sprint5-page">
        <ProfileDetail
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
    <main className="sprint5-page">
      <section className="sprint5-hero">
        <h1>Encuentra tu próximo talento</h1>
        <p>El curador digital para desarrolladores. Filtra perfiles verificados con pasión por el código.</p>

        <form className="sprint5-search rounded-2xl shadow-md" onSubmit={(event) => event.preventDefault()}>
          <Icon path={mdiMagnify} size={0.9} />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por cargo, nombre o palabra clave..."
            aria-label="Buscar perfiles por nombre, cargo o palabra clave"
          />
          <button type="submit" className="bg-[#E67E22] hover:bg-[#D35400] rounded-lg">
            Buscar
          </button>
        </form>
      </section>

      <section className="sprint5-layout">
        <SidebarFilters
          selectedSkills={selectedSkills}
          onToggleSkill={toggleSkill}
          onClearFilters={() => setSelectedSkills([])}
        />

        <div className="sprint5-results">
          <div className="sprint5-results__bar">
            <p>Mostrando {filteredProfiles.length} perfiles destacados</p>
            <span>Relevancia</span>
          </div>

          {filteredProfiles.length > 0 ? (
            <div className="sprint5-results__grid">
              {filteredProfiles.map((profile, profileIndex) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  onViewDetail={() => setSelectedProfileIndex(profileIndex)}
                />
              ))}
              <ResultsPagination activePage={1} />
            </div>
          ) : (
            <div className="sprint5-empty rounded-2xl shadow-sm">
              <h2>No se encontraron resultados</h2>
              <p>Prueba con otro nombre, cargo, palabra clave o limpia los filtros técnicos.</p>
              <button type="button" onClick={() => setSelectedSkills([])}>
                Limpiar Filtros
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default Home;
