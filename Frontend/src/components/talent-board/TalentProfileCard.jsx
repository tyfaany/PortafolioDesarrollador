import PropTypes from 'prop-types';
import Icon from '@mdi/react';
import { mdiArrowRight } from '@mdi/js';
import { useNavigate } from 'react-router-dom';

function getInitials(name) {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function getSkills(profile) {
  if (Array.isArray(profile?.skills) && profile.skills.length > 0) {
    return profile.skills.map((skill) => (typeof skill === 'string' ? skill : skill?.name)).filter(Boolean);
  }

  if (Array.isArray(profile?.habilidades)) {
    return profile.habilidades.filter(Boolean);
  }

  return [];
}

function TalentProfileCard({ profile, onViewDetail }) {
  const navigate = useNavigate();
  const name = profile?.name || profile?.nombre || 'Perfil sin nombre';
  const profession = profile?.profession || profile?.rol || 'Profesional';
  const projects = Array.isArray(profile?.projects)
    ? profile.projects.length
    : Number(profile?.proyectos || 0);
  const biography = profile?.biography || profile?.bio || 'Sin biografía disponible.';
  const skills = getSkills(profile).slice(0, 4);
  const photoUrl = profile?.profile_photo_url || '';
  const initials = profile?.avatar?.initials || getInitials(name);
  const fallbackBackground = profile?.avatar?.from && profile?.avatar?.to
    ? `linear-gradient(135deg, ${profile.avatar.from}, ${profile.avatar.to})`
    : 'linear-gradient(135deg, #2C3E50, #4C6580)';

  return (
    <article className="talent-board-card softsave-projects-card">
      <div className="talent-board-card__header">
        <div className="talent-board-card__avatar-wrap" aria-hidden="true">
          {photoUrl ? (
            <img className="talent-board-card__avatar" src={photoUrl} alt="" />
          ) : (
            <div
              className="talent-board-card__avatar"
              style={{ background: fallbackBackground }}
            >
              <span>{initials}</span>
            </div>
          )}
        </div>

        <div className="talent-board-card__heading">
          <h3>{name}</h3>
          <p>{profession}</p>
          <div className="talent-board-card__proyects">
            <span>{`${projects} proyecto/s`}</span>
          </div>
        </div>
      </div>

      <p className="talent-board-card__bio">{biography}</p>

      <div className="talent-board-tags" aria-label={`Habilidades de ${name}`}>
        {skills.map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>

      <button
        type="button"
        className="talent-board-primary-button talent-board-card__action"
        onClick={() => {
          if (profile?.id) {
            navigate(`/users/${profile.id}/profile`);
            return;
          }

          onViewDetail?.();
        }}
      >
        Ver perfil
        <Icon path={mdiArrowRight} size={0.78} />
      </button>
    </article>
  );
}

TalentProfileCard.propTypes = {
  profile: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string,
    nombre: PropTypes.string,
    profession: PropTypes.string,
    rol: PropTypes.string,
    biography: PropTypes.string,
    bio: PropTypes.string,
    calificacion: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    projects: PropTypes.array,
    proyectos: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    skills: PropTypes.array,
    habilidades: PropTypes.array,
    profile_photo_url: PropTypes.string,
    avatar: PropTypes.shape({
      initials: PropTypes.string,
      from: PropTypes.string,
      to: PropTypes.string,
    }),
  }).isRequired,
  onViewDetail: PropTypes.func,
};

export default TalentProfileCard;
