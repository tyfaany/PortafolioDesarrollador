import PropTypes from 'prop-types';
import Icon from '@mdi/react';
import {
  mdiArrowLeft,
  mdiBriefcaseOutline,
  mdiChevronLeft,
  mdiChevronRight,
  mdiCodeBraces,
  mdiDownloadOutline,
  mdiEmailOutline,
  mdiGithub,
  mdiLinkedin,
  mdiSchoolOutline,
} from '@mdi/js';

function ProfileDetail({
  profile,
  currentIndex,
  totalProfiles,
  onBack,
  onPreviousProfile,
  onNextProfile,
}) {
  const handleDownloadPdf = () => {
    alert('Descargando PDF del candidato...');
  };

  return (
    <section className="sprint5-detail" aria-label={`Detalle de ${profile.nombre}`}>
      <button type="button" className="sprint5-detail__back" onClick={onBack}>
        <Icon path={mdiArrowLeft} size={0.78} />
        Volver a la búsqueda
      </button>

      <div className="sprint5-detail__hero">
        <div className="sprint5-detail__photo-wrap">
          <img src={profile.foto} alt={`Foto de ${profile.nombre}`} className="sprint5-detail__photo" />
          <a className="sprint5-detail__mail" href={`mailto:${profile.email}`} aria-label={`Contactar a ${profile.nombre}`}>
            <Icon path={mdiEmailOutline} size={0.9} />
          </a>
        </div>

        <div className="sprint5-detail__summary">
          <span className="sprint5-detail__availability">Disponible para proyectos</span>
          <h1>{profile.nombre}</h1>
          <p className="sprint5-detail__role">{profile.rol}</p>
          <div className="sprint5-detail__links">
            <a href={profile.github} target="_blank" rel="noreferrer">
              <Icon path={mdiGithub} size={0.72} />
              GitHub
            </a>
            <a href={profile.linkedin} target="_blank" rel="noreferrer">
              <Icon path={mdiLinkedin} size={0.72} />
              LinkedIn
            </a>
          </div>
          <div className="sprint5-detail__bio rounded-2xl">
            <h2>Biografía</h2>
            <p>{profile.bio}</p>
          </div>
          <div className="sprint5-detail__actions">
            <button
              type="button"
              className="sprint5-primary-button sprint5-detail__download bg-[#E67E22] hover:bg-[#D35400] rounded-lg shadow-sm"
              onClick={handleDownloadPdf}
            >
              <Icon path={mdiDownloadOutline} size={0.82} />
              Descargar CV en PDF
            </button>
          </div>
        </div>
      </div>

      <div className="sprint5-detail__profile-nav" aria-label="Navegacion entre perfiles">
        <button type="button" onClick={onPreviousProfile} disabled={totalProfiles <= 1}>
          <Icon path={mdiChevronLeft} size={0.82} />
          Perfil Anterior
        </button>
        <span>Perfil {currentIndex + 1} de {totalProfiles}</span>
        <button type="button" onClick={onNextProfile} disabled={totalProfiles <= 1}>
          Siguiente Perfil
          <Icon path={mdiChevronRight} size={0.82} />
        </button>
      </div>

      <div className="sprint5-detail__content">
        <div className="sprint5-detail__skills rounded-2xl shadow-sm">
          <h2>
            <Icon path={mdiCodeBraces} size={0.9} />
            Habilidades Técnicas
          </h2>
          <div className="sprint5-tags">
            {profile.habilidades.map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>
        </div>

        <div className="sprint5-detail__code-card rounded-2xl">
          <pre>{`const developer = {
  name: '${profile.nombre}',
  stack: '${profile.habilidades.slice(0, 2).join(' + ')}',
  status: 'Shipping'
};`}</pre>
        </div>

        <section className="sprint5-detail__timeline">
          <h2>
            <Icon path={mdiBriefcaseOutline} size={0.9} />
            Experiencia Laboral
          </h2>
          <div className="sprint5-timeline">
            {profile.experienciaLaboral.map((experience) => (
              <article key={`${experience.empresa}-${experience.puesto}`} className="sprint5-timeline__item">
                <span className="sprint5-timeline__dot" aria-hidden="true" />
                <div>
                  <p className="sprint5-timeline__years">{experience.anios}</p>
                  <h3>{experience.puesto}</h3>
                  <p className="sprint5-timeline__company">{experience.empresa}</p>
                  <p>{experience.descripcion}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="sprint5-detail__education">
          <h2>
            <Icon path={mdiSchoolOutline} size={0.9} />
            Formación Académica
          </h2>
          <div className="sprint5-education">
            {profile.formacionAcademica.map((education) => (
              <article key={`${education.institucion}-${education.titulo}`} className="sprint5-education__card rounded-xl">
                <h3>{education.titulo}</h3>
                <p>{education.institucion}</p>
                <span>{education.anio}</span>
              </article>
            ))}
          </div>

          <a
            href={`mailto:${profile.email}`}
            className="sprint5-primary-button sprint5-detail__contact bg-[#E67E22] hover:bg-[#D35400] rounded-lg shadow-sm"
          >
            <Icon path={mdiEmailOutline} size={0.78} />
            Contactar
          </a>

          <button type="button" className="sprint5-detail__return" onClick={onBack}>
            Volver a la búsqueda
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

ProfileDetail.propTypes = {
  profile: PropTypes.shape({
    nombre: PropTypes.string.isRequired,
    rol: PropTypes.string.isRequired,
    bio: PropTypes.string.isRequired,
    habilidades: PropTypes.arrayOf(PropTypes.string).isRequired,
    foto: PropTypes.string.isRequired,
    github: PropTypes.string.isRequired,
    linkedin: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    experienciaLaboral: PropTypes.arrayOf(experienceShape).isRequired,
    formacionAcademica: PropTypes.arrayOf(educationShape).isRequired,
  }).isRequired,
  currentIndex: PropTypes.number.isRequired,
  totalProfiles: PropTypes.number.isRequired,
  onBack: PropTypes.func.isRequired,
  onPreviousProfile: PropTypes.func.isRequired,
  onNextProfile: PropTypes.func.isRequired,
};

export default ProfileDetail;
