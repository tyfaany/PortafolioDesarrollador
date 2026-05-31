import PropTypes from 'prop-types';
import Icon from '@mdi/react';
import {
  mdiArrowLeft,
  mdiBriefcaseOutline,
  mdiChevronLeft,
  mdiChevronRight,
  mdiCodeBraces,
  mdiEmailOutline,
  mdiGithub,
  mdiLinkedin,
  mdiSchoolOutline,
  mdiStar,
} from '@mdi/js';

function TalentProfileDetail({
  profile,
  currentIndex,
  totalProfiles,
  onBack,
  onPreviousProfile,
  onNextProfile,
}) {
  const avatarStyle = {
    background: `linear-gradient(135deg, ${profile.avatar.from}, ${profile.avatar.to})`,
  };

  return (
    <section className="talent-board-detail" aria-label={`Detalle de ${profile.nombre}`}>
      <button type="button" className="talent-board-detail__back" onClick={onBack}>
        <Icon path={mdiArrowLeft} size={0.78} />
        Volver a resultados
      </button>

      <div className="talent-board-detail__hero">
        <div className="talent-board-detail__photo-wrap">
          <div className="talent-board-detail__photo" style={avatarStyle}>
            <span>{profile.avatar.initials}</span>
          </div>
          <a
            className="talent-board-detail__mail"
            href={`mailto:${profile.email}`}
            aria-label={`Contactar a ${profile.nombre}`}
          >
            <Icon path={mdiEmailOutline} size={0.9} />
          </a>
        </div>

        <div className="talent-board-detail__summary">
          <span className="talent-board-detail__availability">Disponible para proyectos</span>
          <h1>{profile.nombre}</h1>
          <p className="talent-board-detail__role">{profile.rol}</p>

          <div className="talent-board-detail__stats" aria-label="Estadisticas del perfil">
            <span>
              <Icon path={mdiStar} size={0.7} />
              {profile.calificacion.toFixed(1)}
            </span>
            <span>{profile.proyectos} proyectos</span>
            <span>{profile.focus}</span>
          </div>

          <div className="talent-board-detail__links">
            <a href={profile.github} target="_blank" rel="noreferrer">
              <Icon path={mdiGithub} size={0.72} />
              GitHub
            </a>
            <a href={profile.linkedin} target="_blank" rel="noreferrer">
              <Icon path={mdiLinkedin} size={0.72} />
              LinkedIn
            </a>
          </div>

          <div className="talent-board-detail__bio softsave-projects-card">
            <h2>Biografia</h2>
            <p>{profile.bio}</p>
          </div>
        </div>
      </div>

      <div className="talent-board-detail__profile-nav" aria-label="Navegacion entre perfiles">
        <button type="button" onClick={onPreviousProfile} disabled={totalProfiles <= 1}>
          <Icon path={mdiChevronLeft} size={0.82} />
          Perfil anterior
        </button>
        <span>
          Perfil {currentIndex + 1} de {totalProfiles}
        </span>
        <button type="button" onClick={onNextProfile} disabled={totalProfiles <= 1}>
          Siguiente perfil
          <Icon path={mdiChevronRight} size={0.82} />
        </button>
      </div>

      <div className="talent-board-detail__content">
        <div className="talent-board-detail__skills softsave-privacy__card">
          <h2>
            <Icon path={mdiCodeBraces} size={0.9} />
            Habilidades tecnicas
          </h2>
          <div className="talent-board-tags">
            {profile.habilidades.map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>
        </div>

        <div className="talent-board-detail__code-card softsave-privacy__card">
          <pre>{`const developer = {
  name: '${profile.nombre}',
  stack: '${profile.habilidades.slice(0, 3).join(' + ')}',
  focus: '${profile.focus}'
};`}</pre>
        </div>

        <section className="talent-board-detail__timeline">
          <h2>
            <Icon path={mdiBriefcaseOutline} size={0.9} />
            Experiencia laboral
          </h2>
          <div className="talent-board-timeline">
            {profile.experienciaLaboral.map((experience) => (
              <article
                key={`${experience.empresa}-${experience.puesto}`}
                className="talent-board-timeline__item"
              >
                <span className="talent-board-timeline__dot" aria-hidden="true" />
                <div>
                  <p className="talent-board-timeline__years">{experience.anios}</p>
                  <h3>{experience.puesto}</h3>
                  <p className="talent-board-timeline__company">{experience.empresa}</p>
                  <p>{experience.descripcion}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="talent-board-detail__education">
          <h2>
            <Icon path={mdiSchoolOutline} size={0.9} />
            Formacion academica
          </h2>
          <div className="talent-board-education">
            {profile.formacionAcademica.map((education) => (
              <article
                key={`${education.institucion}-${education.titulo}`}
                className="talent-board-education__card"
              >
                <h3>{education.titulo}</h3>
                <p>{education.institucion}</p>
                <span>{education.anio}</span>
              </article>
            ))}
          </div>

          <a href={`mailto:${profile.email}`} className="talent-board-primary-button talent-board-detail__contact">
            <Icon path={mdiEmailOutline} size={0.78} />
            Contactar
          </a>

          <button type="button" className="talent-board-detail__return" onClick={onBack}>
            Volver a resultados
          </button>
        </section>
      </div>
    </section>
  );
}

const experienceShape = PropTypes.shape({
  puesto: PropTypes.string.isRequired,
  empresa: PropTypes.string.isRequired,
  anios: PropTypes.string.isRequired,
  descripcion: PropTypes.string.isRequired,
});

const educationShape = PropTypes.shape({
  titulo: PropTypes.string.isRequired,
  institucion: PropTypes.string.isRequired,
  anio: PropTypes.string.isRequired,
});

TalentProfileDetail.propTypes = {
  profile: PropTypes.shape({
    nombre: PropTypes.string.isRequired,
    rol: PropTypes.string.isRequired,
    bio: PropTypes.string.isRequired,
    habilidades: PropTypes.arrayOf(PropTypes.string).isRequired,
    avatar: PropTypes.shape({
      initials: PropTypes.string.isRequired,
      from: PropTypes.string.isRequired,
      to: PropTypes.string.isRequired,
    }).isRequired,
    github: PropTypes.string.isRequired,
    linkedin: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    focus: PropTypes.string.isRequired,
    calificacion: PropTypes.number.isRequired,
    proyectos: PropTypes.number.isRequired,
    experienciaLaboral: PropTypes.arrayOf(experienceShape).isRequired,
    formacionAcademica: PropTypes.arrayOf(educationShape).isRequired,
  }).isRequired,
  currentIndex: PropTypes.number.isRequired,
  totalProfiles: PropTypes.number.isRequired,
  onBack: PropTypes.func.isRequired,
  onPreviousProfile: PropTypes.func.isRequired,
  onNextProfile: PropTypes.func.isRequired,
};

export default TalentProfileDetail;
