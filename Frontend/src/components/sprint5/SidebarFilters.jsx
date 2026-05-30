import PropTypes from 'prop-types';
import Icon from '@mdi/react';
import { mdiCheck, mdiTuneVariant } from '@mdi/js';
import { technicalFilters } from '../../mocks/talentProfiles';

function SidebarFilters({ selectedSkills, onToggleSkill, onClearFilters }) {
  return (
    <aside className="sprint5-filters rounded-2xl shadow-sm" aria-label="Filtros técnicos">
      <div className="sprint5-filters__title">
        <Icon path={mdiTuneVariant} size={0.95} />
        <h2>Filtros Técnicos</h2>
      </div>

      <div className="sprint5-filters__groups">
        {technicalFilters.map((group) => (
          <fieldset key={group.id} className="sprint5-filters__group">
            <legend>{group.title}</legend>
            <div className="sprint5-filters__options">
              {group.options.map((option) => {
                const checked = selectedSkills.includes(option);

                return (
                  <label key={option} className="sprint5-checkbox">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleSkill(option)}
                    />
                    <span className="sprint5-checkbox__box bg-[#E67E22]" aria-hidden="true">
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
        className="sprint5-filters__clear rounded-xl"
        onClick={onClearFilters}
      >
        Limpiar Filtros
      </button>
    </aside>
  );
}

SidebarFilters.propTypes = {
  selectedSkills: PropTypes.arrayOf(PropTypes.string).isRequired,
  onToggleSkill: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired,
};

export default SidebarFilters;
