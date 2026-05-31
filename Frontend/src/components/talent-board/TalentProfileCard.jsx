import PropTypes from 'prop-types';
import Icon from '@mdi/react';
import { mdiArrowRight, mdiStar } from '@mdi/js';

function TalentProfileCard({ profile, onViewDetail }) {
  const avatarStyle = {
    background: `linear-gradient(135deg, ${profile.avatar.from}, ${profile.avatar.to})`,
  };

  return (
    <article className="talent-board-card softsave-projects-card">
      <div className="talent-board-card__header">
        <div className="talent-board-card__avatar-wrap" aria-hidden="true">
          <div className="talent-board-card__avatar" style={avatarStyle}>
            <span>{profile.avatar.initials}</span>
          </div>
          <span className="talent-board-card__status" />
        </div>

        <div className="talent-board-card__heading">
          <p className="talent-board-card__eyebrow">{profile.focus}</p>
          <h3>{profile.nombre}</h3>
          <p>{profile.rol}</p>
          <div className="talent-board-card__rating">
            <Icon path={mdiStar} size={0.68} />
            <span>
              {profile.calificacion.toFixed(1)} {`(${profile.proyectos} proyectos)`}
            </span>
          </div>
        </div>
      </div>

      <p className="talent-board-card__bio">&ldquo;{profile.bio}&rdquo;</p>

      <div className="talent-board-tags" aria-label={`Habilidades de ${profile.nombre}`}>
        {profile.habilidades.slice(0, 4).map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>

      <button
        type="button"
        className="talent-board-primary-button talent-board-card__action"
        onClick={onViewDetail}
      >
        Ver perfil
        <Icon path={mdiArrowRight} size={0.78} />
      </button>
    </article>
  );
}

TalentProfileCard.propTypes = {
  profile: PropTypes.shape({
    nombre: PropTypes.string.isRequired,
    rol: PropTypes.string.isRequired,
    bio: PropTypes.string.isRequired,
    calificacion: PropTypes.number.isRequired,
    proyectos: PropTypes.number.isRequired,
    habilidades: PropTypes.arrayOf(PropTypes.string).isRequired,
    focus: PropTypes.string.isRequired,
    avatar: PropTypes.shape({
      initials: PropTypes.string.isRequired,
      from: PropTypes.string.isRequired,
      to: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  onViewDetail: PropTypes.func.isRequired,
};

export default TalentProfileCard;
