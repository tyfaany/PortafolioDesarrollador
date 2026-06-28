import PropTypes from 'prop-types';
import Icon from '@mdi/react';
import { mdiCheck, mdiTuneVariant } from '@mdi/js';

function normalizeSkillValue(skill) {
  return String(skill || '').trim().toLowerCase();
}

function TalentSidebarFilters({
  availableSkills,
  selectedSkills,
  onToggleSkill,
  onClearFilters,
}) {
  return (
    <aside className="talent-board-filters softsave-privacy__card" aria-label="Filtros tecnicos">
      <div className="talent-board-filters__title">
        <Icon path={mdiTuneVariant} size={0.95} />
        <div>
          <h2>Filtros </h2>
    
        </div>
      </div>

      <div className="talent-board-filters__groups">
        <fieldset className="talent-board-filters__group">
          <legend>Habilidades disponibles</legend>
          <div className="talent-board-filters__options">
            {availableSkills === null ? (
              <p className="talent-board-filters__empty">Cargando filtros...</p>
            ) : availableSkills.length > 0 ? (
              availableSkills.map((option) => {
                const checked = selectedSkills.includes(normalizeSkillValue(option));

                return (
                  <label key={option} className="talent-board-checkbox">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleSkill(option)}
                    />
                    <span className="talent-board-checkbox__box" aria-hidden="true">
                      {checked ? <Icon path={mdiCheck} size={0.82} /> : null}
                    </span>
                    <span>{option}</span>
                  </label>
                );
              })
            ) : (
              <p className="talent-board-filters__empty">No hay filtros disponibles.</p>
            )}
          </div>
        </fieldset>
      </div>

      <button
        type="button"
        className="talent-board-filters__clear"
        onClick={onClearFilters}
      >
        Limpiar filtros
      </button>
    </aside>
  );
}

TalentSidebarFilters.propTypes = {
  availableSkills: PropTypes.arrayOf(PropTypes.string),
  selectedSkills: PropTypes.arrayOf(PropTypes.string).isRequired,
  onToggleSkill: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired,
};

TalentSidebarFilters.defaultProps = {
  availableSkills: null,
};

export default TalentSidebarFilters;
