import PropTypes from 'prop-types';
import Icon from '@mdi/react';
import { mdiStar } from '@mdi/js';

function ProfileCard({ profile, onViewDetail }) {
  return (
    <article className="sprint5-card bg-white rounded-lg shadow-md">
      <div className="sprint5-card__header">
        <div className="sprint5-card__avatar-wrap">
          <img src={profile.foto} alt={`Foto de ${profile.nombre}`} className="sprint5-card__avatar" />
          <span className="sprint5-card__status" aria-label="Disponible" />
        </div>

        <div>
          <h3>{profile.nombre}</h3>
          <p>{profile.rol}</p>
          <div className="sprint5-card__rating">
            <Icon path={mdiStar} size={0.68} />
            <span>{profile.calificacion.toFixed(1)} ({profile.proyectos} proyectos)</span>
          </div>
        </div>
      </div>

      <p className="sprint5-card__bio">&ldquo;{profile.bio}&rdquo;</p>

      <div className="sprint5-tags" aria-label={`Habilidades de ${profile.nombre}`}>
        {profile.habilidades.slice(0, 4).map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>

      <button
        type="button"
        className="sprint5-primary-button bg-[#E67E22] hover:bg-[#D35400] rounded-lg shadow-sm"
        onClick={onViewDetail}
      >
        Ver Detalle
      </button>
    </article>
  );
}

ProfileCard.propTypes = {
  profile: PropTypes.shape({
    nombre: PropTypes.string.isRequired,
    rol: PropTypes.string.isRequired,
    calificacion: PropTypes.number.isRequired,
    proyectos: PropTypes.number.isRequired,
    bio: PropTypes.string.isRequired,
    habilidades: PropTypes.arrayOf(PropTypes.string).isRequired,
    foto: PropTypes.string.isRequired,
  }).isRequired,
  onViewDetail: PropTypes.func.isRequired,
};

export default ProfileCard;
