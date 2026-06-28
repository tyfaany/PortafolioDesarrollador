import { useState } from 'react';
import PropTypes from 'prop-types';
import Icon from '@mdi/react';
import { mdiTuneVariant, mdiChevronDown, mdiChevronUp } from '@mdi/js';

function TalentSidebarCargoFilters({
  onSearch,
  title = "Filtros de Cargo",
}) {
  // Estado para saber cuál opción de experiencia está activa y desplegada
  // Valores: 'no_importa' o 'con_experiencia'
  const [experienceType, setExperienceType] = useState('no_importa');
  const [cargo, setCargo] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({
      cargo: cargo.trim(),
      noImportaExperiencia: experienceType === 'no_importa',
      yearsOfExperience: experienceType === 'con_experiencia' ? Number(yearsOfExperience) || 0 : null
    });
  };

  return (
    <aside 
      className="talent-board-filters softsave-privacy__card" 
      aria-label="Filtros de cargo y experiencia"
      style={{
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Título adaptable */}
      <div className="talent-board-filters__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Icon path={mdiTuneVariant} size={0.95} />
        <h2>{title}</h2>
      </div>

      <form onSubmit={handleSubmit} className="talent-board-filters__groups" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
        
        {/* 1. Bloque de Puesto o Cargo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Puesto o Cargo</label>
          <input
            type="text"
            className="talent-board-filters__input"
            placeholder="Ej. Técnico en redes..."
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem',
              borderRadius: '6px',
              border: '1px solid var(--softsave-border-color, #e5e7eb)',
              backgroundColor: 'transparent',
              color: 'inherit',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* 2. Bloque de Experiencia (Desplegables) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Años de experiencia</label>

          {/* OPCIÓN DESPLEGABLE 1: No importa */}
          <div style={{ border: '1px solid var(--softsave-border-color, #e5e7eb)', borderRadius: '6px', overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setExperienceType('no_importa')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                padding: '0.6rem',
                background: experienceType === 'no_importa' ? 'rgba(var(--primary-rgb, 0, 128, 128), 0.08)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
                textAlign: 'left',
                fontWeight: experienceType === 'no_importa' ? '600' : 'normal'
              }}
            >
              <span>No importa</span>
              <Icon path={experienceType === 'no_importa' ? mdiChevronUp : mdiChevronDown} size={0.75} />
            </button>
            
            {experienceType === 'no_importa' && (
              <div style={{ padding: '0.6rem', fontSize: '0.85rem', opacity: 0.8, borderTop: '1px solid var(--softsave-border-color, #e5e7eb)' }}>
                La búsqueda mostrará todos los perfiles sin filtrar por tiempo de experiencia.
              </div>
            )}
          </div>

          {/* OPCIÓN DESPLEGABLE 2: Especificar por años */}
          <div style={{ border: '1px solid var(--softsave-border-color, #e5e7eb)', borderRadius: '6px', overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setExperienceType('con_experiencia')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                padding: '0.6rem',
                background: experienceType === 'con_experiencia' ? 'rgba(var(--primary-rgb, 0, 128, 128), 0.08)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
                textAlign: 'left',
                fontWeight: experienceType === 'con_experiencia' ? '600' : 'normal'
              }}
            >
              <span>Especificar por años</span>
              <Icon path={experienceType === 'con_experiencia' ? mdiChevronUp : mdiChevronDown} size={0.75} />
            </button>
            
            {experienceType === 'con_experiencia' && (
              <div style={{ padding: '0.8rem 0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid var(--softsave-border-color, #e5e7eb)' }}>
                <span style={{ fontSize: '0.85rem' }}>Cantidad de años:</span>
                <input
                  type="number"
                  min="0"
                  max="50"
                  placeholder="Ej. 2"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                  required={experienceType === 'con_experiencia'}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    border: '1px solid var(--softsave-border-color, #cbd5e0)',
                    backgroundColor: 'transparent',
                    color: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Botón Buscar */}
        <button
          type="submit"
          className="talent-board-filters__clear"
          style={{
            marginTop: '0.5rem',
            width: '100%',
            cursor: 'pointer',
            padding: '0.65rem',
            boxSizing: 'border-box'
          }}
        >
          Buscar
        </button>
      </form>
    </aside>
  );
}

TalentSidebarCargoFilters.propTypes = {
  onSearch: PropTypes.func.isRequired,
  title: PropTypes.string,
};

export default TalentSidebarCargoFilters;