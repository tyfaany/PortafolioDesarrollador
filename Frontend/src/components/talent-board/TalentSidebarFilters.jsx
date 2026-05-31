import PropTypes from 'prop-types';
import Icon from '@mdi/react';
import { mdiCheck, mdiTuneVariant } from '@mdi/js';
import { technicalFilters } from '../../mocks/talentProfiles';

function TalentSidebarFilters({ selectedSkills, onToggleSkill, onClearFilters }) {
  return (
    <aside className="talent-board-filters softsave-privacy__card" aria-label="Filtros tecnicos">
      <div className="talent-board-filters__title">
        <Icon path={mdiTuneVariant} size={0.95} />
        <div>
          <h2>Filtros tecnicos</h2>
          <p>Afina la busqueda por stack y enfoque.</p>
        </div>
      </div>

      <div className="talent-board-filters__groups">
        {technicalFilters.map((group) => (
          <fieldset key={group.id} className="talent-board-filters__group">
            <legend>{group.title}</legend>
            <div className="talent-board-filters__options">
              {group.options.map((option) => {
                const checked = selectedSkills.includes(option);

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
              })}
            </div>
          </fieldset>
        ))}
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
  selectedSkills: PropTypes.arrayOf(PropTypes.string).isRequired,
  onToggleSkill: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired,
};

export default TalentSidebarFilters;
