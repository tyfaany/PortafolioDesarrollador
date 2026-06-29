import { useState } from 'react';
import PropTypes from 'prop-types';
import Icon from '@mdi/react';
import {
  mdiAccountGroupOutline,
  mdiChevronDown,
  mdiDeleteOutline,
  mdiLayersTripleOutline,
  mdiPlus,
  mdiTuneVariant,
  mdiCheck,
} from '@mdi/js';
import DropdownSelect from '../DropdownSelect';

const TECH_LEVEL_OPTIONS = ['Basico', 'Intermedio', 'Avanzado'];

function Section({ icon, title, subtitle, children }) {
  return (
    <section className="talent-board-filters__section">
      <div className="talent-board-filters__section-head">
        <span className="talent-board-filters__section-icon" aria-hidden="true">
          <Icon path={icon} size={0.82} />
        </span>
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

Section.propTypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node.isRequired,
};

function DeleteBtn({ onDelete, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onDelete}
      className="talent-board-filters__icon-button"
      aria-label={ariaLabel}
    >
      <Icon path={mdiDeleteOutline} size={0.74} />
    </button>
  );
}

DeleteBtn.propTypes = {
  onDelete: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string.isRequired,
};

function ChevronBtn({ open, onToggle, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="talent-board-filters__icon-button"
      aria-label={ariaLabel}
      aria-expanded={open}
    >
      <Icon path={mdiChevronDown} size={0.8} className={open ? 'is-open' : ''} />
    </button>
  );
}

ChevronBtn.propTypes = {
  open: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string.isRequired,
};

function AddBtn({ onClick, disabled, ariaLabel }) {
  return (
    <button
      type="button"
      className="talent-board-filters__add-button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      <Icon path={mdiPlus} size={0.75} />
    </button>
  );
}

AddBtn.propTypes = {
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  ariaLabel: PropTypes.string.isRequired,
};

AddBtn.defaultProps = {
  disabled: false,
};

function SkillTag({ label, onDelete, isOpen, onToggleOpen, levelValues, onToggleLevel }) {
  return (
    <article className="talent-board-filters__skill-card">
      <div className="talent-board-filters__skill-card-head">
        <span className="talent-board-filters__skill-card-label">{label}</span>
        <div className="talent-board-filters__skill-card-actions">
          <ChevronBtn
            open={isOpen}
            onToggle={onToggleOpen}
            ariaLabel={isOpen ? `Contraer ${label}` : `Expandir ${label}`}
          />
          <DeleteBtn onDelete={onDelete} ariaLabel={`Quitar ${label}`} />
        </div>
      </div>

      {isOpen ? (
        <div className="talent-board-filters__skill-card-body">
          <h4>Niveles</h4>
          <div className="talent-board-filters__level-list">
            {TECH_LEVEL_OPTIONS.map((level) => {
              const active = levelValues.includes(level);

              return (
                <label key={level} className="talent-board-checkbox talent-board-checkbox--level">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => onToggleLevel(level)}
                  />
                  <span className="talent-board-checkbox__box" aria-hidden="true">
                    {active ? <Icon path={mdiCheck} size={0.82} /> : null}
                  </span>
                  <span>{level === 'Basico' ? 'Básico' : level}</span>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}
    </article>
  );
}

SkillTag.propTypes = {
  label: PropTypes.string.isRequired,
  onDelete: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onToggleOpen: PropTypes.func.isRequired,
  levelValues: PropTypes.arrayOf(PropTypes.string).isRequired,
  onToggleLevel: PropTypes.func.isRequired,
};

function SimpleTag({ label, onDelete }) {
  return (
    <article className="talent-board-filters__simple-tag">
      <span className="talent-board-filters__skill-card-label">{label}</span>
      <DeleteBtn onDelete={onDelete} ariaLabel={`Quitar ${label}`} />
    </article>
  );
}

SimpleTag.propTypes = {
  label: PropTypes.string.isRequired,
  onDelete: PropTypes.func.isRequired,
};

function TalentSidebarFilters({
  availableSkills,
  availableTechnologies,
  availableSoftSkills,
  selectedSkills,
  onToggleSkill,
  onRemoveSkill,
  skillLevelFilters,
  onSkillLevelFiltersChange,
  selectedTechnologies,
  onAddTechnology,
  onRemoveTechnology,
  selectedSoftSkills,
  onAddSoftSkill,
  onRemoveSoftSkill,
  onClearFilters,
}) {
  const [skillToAddId, setSkillToAddId] = useState('');
  const [technologyDraftId, setTechnologyDraftId] = useState('');
  const [softSkillDraftId, setSoftSkillDraftId] = useState('');
  const [openSkillId, setOpenSkillId] = useState('');

  const availableSkillOptions = Array.isArray(availableSkills) ? availableSkills : [];
  const availableTechnologyOptions = Array.isArray(availableTechnologies) ? availableTechnologies : [];
  const availableSoftSkillOptions = Array.isArray(availableSoftSkills) ? availableSoftSkills : [];

  const selectedSkillCards = skillLevelFilters
    .map((entry) => {
      const skill = availableSkillOptions.find((option) => {
        const entrySkillId = String(entry?.skillId || '').trim();
        const optionId = String(option.id || '').trim();
        const entrySkillName = String(entry?.skillName || '').trim().toLowerCase();
        const optionName = String(option.name || '').trim().toLowerCase();

        return entrySkillId ? optionId === entrySkillId : entrySkillName === optionName;
      });

      const label = skill?.name || entry?.skillName || 'Habilidad';
      const entryKey = String(skill?.id ?? entry?.skillId ?? entry?.skillName ?? '').trim();

      return {
        entryKey,
        label,
        levels: Array.isArray(entry?.levels) ? entry.levels : [],
        skillId: String(skill?.id ?? entry?.skillId ?? '').trim(),
      };
    })
    .filter((item) => item.label);

  const addSkill = () => {
    if (!skillToAddId) {
      return;
    }

    const skill = availableSkillOptions.find((option) => String(option.id) === String(skillToAddId));
    if (!skill) {
      setSkillToAddId('');
      return;
    }

    const skillId = String(skill.id);
    const hasEntry = skillLevelFilters.some((entry) => {
      const entrySkillId = String(entry?.skillId || '').trim();
      const entrySkillName = String(entry?.skillName || '').trim().toLowerCase();
      const skillName = String(skill.name || '').trim().toLowerCase();

      return entrySkillId === skillId || entrySkillName === skillName;
    });

    if (!selectedSkills.includes(skillId)) {
      onToggleSkill(skill);
    }

    if (!hasEntry) {
      onSkillLevelFiltersChange([
        ...skillLevelFilters,
        {
          skillId,
          skillName: skill.name,
          levels: [],
        },
      ]);
    }

    setSkillToAddId('');
  };

  const removeSkill = (skillId) => {
    onRemoveSkill(skillId);
  };

  const toggleSkillOpen = (skillId) => {
    setOpenSkillId((currentId) => (currentId === skillId ? '' : skillId));
  };

  const handleToggleLevel = (skillId, level) => {
    onSkillLevelFiltersChange((currentEntries) => currentEntries.map((entry) => {
      const entrySkillId = String(entry?.skillId || '').trim();
      const entrySkillName = String(entry?.skillName || '').trim().toLowerCase();
      const normalizedSkillId = String(skillId || '').trim();
      const normalizedSkillName = normalizedSkillId.toLowerCase();
      const matches = entrySkillId === normalizedSkillId
        || entrySkillName === normalizedSkillName;

      if (!matches) {
        return entry;
      }

      const currentLevels = Array.isArray(entry?.levels) ? entry.levels : [];
      const nextLevels = currentLevels.includes(level)
        ? currentLevels.filter((currentLevel) => currentLevel !== level)
        : [...currentLevels, level];

      return {
        ...entry,
        levels: nextLevels,
      };
    }));
  };

  const addTechnology = () => {
    if (technologyDraftId && !selectedTechnologies.includes(technologyDraftId)) {
      onAddTechnology(technologyDraftId);
      setTechnologyDraftId('');
    }
  };

  const addSoftSkill = () => {
    if (softSkillDraftId && !selectedSoftSkills.includes(softSkillDraftId)) {
      onAddSoftSkill(softSkillDraftId);
      setSoftSkillDraftId('');
    }
  };

  return (
    <aside className="talent-board-filters softsave-privacy__card" aria-label="Filtros tecnicos">
      <div className="talent-board-filters__title">
        <div>
          <h2>Filtros técnicos</h2>
          <p>Elige varias opciones para acercarte al perfil que buscas.</p>
        </div>
      </div>

      <div className="talent-board-filters__groups">
        <Section
          icon={mdiTuneVariant}
          title="Habilidades técnicas"
          subtitle="Puedes elegir una o varias habilidades."
        >
          <div className="talent-board-filters__add-row">
            <DropdownSelect
              value={skillToAddId}
              onChange={setSkillToAddId}
              placeholder="Añadir habilidad..."
              options={[
                ...availableSkillOptions.map((skill) => ({
                  value: String(skill.id),
                  label: skill.name,
                })),
              ]}
              ariaLabel="Seleccionar habilidad técnica"
            />

            <AddBtn onClick={addSkill} disabled={!skillToAddId} ariaLabel="Agregar habilidad" />
          </div>

          <div className="talent-board-filters__stack">
            {selectedSkillCards.length > 0 ? (
              selectedSkillCards.map((item) => (
                <SkillTag
                  key={item.entryKey || item.label}
                  label={item.label}
                  isOpen={String(openSkillId) === String(item.entryKey || item.label)}
                  levelValues={
                    skillLevelFilters.find((entry) => {
                      const entrySkillId = String(entry?.skillId || '').trim();
                      const entrySkillName = String(entry?.skillName || '').trim().toLowerCase();
                      const normalizedEntryKey = String(item.entryKey || '').trim().toLowerCase();
                      return entrySkillId === item.skillId || entrySkillName === normalizedEntryKey;
                    })?.levels || []
                  }
                  onToggleOpen={() => toggleSkillOpen(item.entryKey || item.label)}
                  onDelete={() => removeSkill(item.skillId || item.entryKey)}
                  onToggleLevel={(level) => handleToggleLevel(item.entryKey || item.label, level)}
                />
              ))
            ) : (
              <p className="talent-board-filters__hint">
                
              </p>
            )}
          </div>
        </Section>

        <Section
          icon={mdiAccountGroupOutline}
          title="Habilidades blandas"
          subtitle="Puedes elegir una o varias habilidades blandas."
        >
          <div className="talent-board-filters__add-row">
            <DropdownSelect
              value={softSkillDraftId}
              onChange={setSoftSkillDraftId}
              placeholder="Añadir habilidad blanda..."
              options={[
                ...availableSoftSkillOptions.map((softSkill) => ({
                  value: String(softSkill.id),
                  label: softSkill.name,
                  disabled: selectedSoftSkills.includes(String(softSkill.id)),
                })),
              ]}
              ariaLabel="Seleccionar habilidad blanda"
            />

            <AddBtn onClick={addSoftSkill} disabled={!softSkillDraftId} ariaLabel="Aplicar habilidad blanda" />
          </div>

          <div className="talent-board-filters__stack">
            {selectedSoftSkills.length > 0 ? (
              selectedSoftSkills.map((softSkillId) => {
                const softSkill = availableSoftSkillOptions.find((item) => String(item.id) === String(softSkillId));
                return (
                  <SimpleTag
                    key={softSkillId}
                    label={softSkill?.name || softSkillId}
                    onDelete={() => onRemoveSoftSkill(softSkillId)}
                  />
                );
              })
            ) : null}
          </div>
        </Section>

        <Section
          icon={mdiLayersTripleOutline}
          title="Tecnología en proyectos"
          subtitle="Puedes elegir una o varias tecnologías."
        >
          <div className="talent-board-filters__add-row">
            <DropdownSelect
              value={technologyDraftId}
              onChange={setTechnologyDraftId}
              placeholder="Añadir tecnología..."
              options={[
                ...availableTechnologyOptions.map((technology) => ({
                  value: String(technology.id),
                  label: technology.name,
                  disabled: selectedTechnologies.includes(String(technology.id)),
                })),
              ]}
              ariaLabel="Seleccionar tecnología"
            />
            <AddBtn onClick={addTechnology} disabled={!technologyDraftId} ariaLabel="Aplicar tecnología" />
          </div>

          <div className="talent-board-filters__stack">
            {selectedTechnologies.length > 0 ? (
              selectedTechnologies.map((techId) => {
                const tech = availableTechnologyOptions.find((t) => String(t.id) === String(techId));
                return (
                  <SimpleTag
                    key={techId}
                    label={tech?.name || techId}
                    onDelete={() => onRemoveTechnology(techId)}
                  />
                );
              })
            ) : null}
          </div>
        </Section>

      </div>

      <button type="button" className="talent-board-filters__clear" onClick={onClearFilters}>
        Limpiar filtros
      </button>
    </aside>
  );
}

TalentSidebarFilters.propTypes = {
  availableSkills: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string,
  })),
  availableTechnologies: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string,
  })),
  availableSoftSkills: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string,
  })),
  selectedSkills: PropTypes.arrayOf(PropTypes.string).isRequired,
  onToggleSkill: PropTypes.func.isRequired,
  onRemoveSkill: PropTypes.func.isRequired,
  skillLevelFilters: PropTypes.arrayOf(PropTypes.shape({
    skillId: PropTypes.string,
    skillName: PropTypes.string,
    levels: PropTypes.arrayOf(PropTypes.string),
  })).isRequired,
  onSkillLevelFiltersChange: PropTypes.func.isRequired,
  selectedTechnologies: PropTypes.arrayOf(PropTypes.string).isRequired,
  onAddTechnology: PropTypes.func.isRequired,
  onRemoveTechnology: PropTypes.func.isRequired,
  selectedSoftSkills: PropTypes.arrayOf(PropTypes.string).isRequired,
  onAddSoftSkill: PropTypes.func.isRequired,
  onRemoveSoftSkill: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired,
};

TalentSidebarFilters.defaultProps = {
  availableSkills: null,
  availableTechnologies: null,
  availableSoftSkills: null,
};

export default TalentSidebarFilters;
