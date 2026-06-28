import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Icon from '@mdi/react';
import {
  mdiBriefcaseOutline,
  mdiChevronDown,
  mdiDeleteOutline,
  mdiLayersTripleOutline,
  mdiPlus,
  mdiSchoolOutline,
  mdiTuneVariant,
  mdiCheck,
} from '@mdi/js';

const TECH_LEVEL_OPTIONS = ['Basico', 'Intermedio', 'Avanzado'];

function getCatalogLabel(options, id) {
  return options.find((option) => String(option.id) === String(id))?.name || '';
}

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

function RoleTag({
  label,
  onDelete,
  isOpen,
  onToggleOpen,
  minYears,
  onChangeMinYears,
  maxYears,
  onChangeMaxYears,
}) {
  return (
    <article className="talent-board-filters__tag-card">
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
          <h4>Años de experiencia</h4>
          <div className="talent-board-filters__range">
            <div className="talent-board-filters__field">
              <label htmlFor="talent-board-role-min">Mín.</label>
              <input
                id="talent-board-role-min"
                type="number"
                min="0"
                value={minYears}
                onChange={(event) => onChangeMinYears(event.target.value)}
                placeholder="0"
              />
            </div>
            <div className="talent-board-filters__field">
              <label htmlFor="talent-board-role-max">Máx.</label>
              <input
                id="talent-board-role-max"
                type="number"
                min="0"
                value={maxYears}
                onChange={(event) => onChangeMaxYears(event.target.value)}
                placeholder="20"
              />
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

RoleTag.propTypes = {
  label: PropTypes.string.isRequired,
  onDelete: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onToggleOpen: PropTypes.func.isRequired,
  minYears: PropTypes.string.isRequired,
  onChangeMinYears: PropTypes.func.isRequired,
  maxYears: PropTypes.string.isRequired,
  onChangeMaxYears: PropTypes.func.isRequired,
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

function AcademicPanel({
  degree,
  degreeOptions,
  onDegreeChange,
  institution,
  institutionOptions,
  onInstitutionChange,
  onRemoveDegree,
  onRemoveInstitution,
}) {
  const [degreeDraft, setDegreeDraft] = useState(degree);
  const [institutionDraft, setInstitutionDraft] = useState(institution);

  useEffect(() => {
    setDegreeDraft(degree);
  }, [degree]);

  useEffect(() => {
    setInstitutionDraft(institution);
  }, [institution]);

  return (
    <div className="talent-board-filters__academic-panel">
      <div className="talent-board-filters__subsection">
        <p className="talent-board-filters__subsection-title">Grados</p>
        <div className="talent-board-filters__add-row">
          <select value={degreeDraft} onChange={(event) => setDegreeDraft(event.target.value)}>
            <option value="">Añadir grado...</option>
            {degreeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <AddBtn
            onClick={() => {
              onDegreeChange(degreeDraft);
              setDegreeDraft('');
            }}
            disabled={!degreeDraft}
            ariaLabel="Aplicar grado"
          />
        </div>
        {degree ? <SimpleTag label={degree} onDelete={onRemoveDegree} /> : null}
      </div>

      <div className="talent-board-filters__subsection">
        <p className="talent-board-filters__subsection-title">Instituciones</p>
        <div className="talent-board-filters__add-row">
          <select value={institutionDraft} onChange={(event) => setInstitutionDraft(event.target.value)}>
            <option value="">Añadir institución...</option>
            {institutionOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <AddBtn
            onClick={() => {
              onInstitutionChange(institutionDraft);
              setInstitutionDraft('');
            }}
            disabled={!institutionDraft}
            ariaLabel="Aplicar institución"
          />
        </div>
        {institution ? <SimpleTag label={institution} onDelete={onRemoveInstitution} /> : null}
      </div>
    </div>
  );
}

AcademicPanel.propTypes = {
  degree: PropTypes.string.isRequired,
  degreeOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  onDegreeChange: PropTypes.func.isRequired,
  institution: PropTypes.string.isRequired,
  institutionOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  onInstitutionChange: PropTypes.func.isRequired,
  onRemoveDegree: PropTypes.func.isRequired,
  onRemoveInstitution: PropTypes.func.isRequired,
};

function TalentSidebarFilters({
  availableSkills,
  availableTechnologies,
  professionOptions,
  selectedSkills,
  onToggleSkill,
  selectedSkillLevelSkillId,
  onSelectedSkillLevelSkillChange,
  selectedSkillLevelOptions,
  onToggleSkillLevel,
  selectedTechnologyId,
  onTechnologyChange,
  roleOptions,
  profession,
  onProfessionChange,
  degreeOptions,
  degree,
  onDegreeChange,
  institutionOptions,
  institution,
  onInstitutionChange,
  experienceRole,
  onExperienceRoleChange,
  experienceMinYears,
  onExperienceMinYearsChange,
  experienceMaxYears,
  onExperienceMaxYearsChange,
  onClearFilters,
}) {
  const [skillToAddId, setSkillToAddId] = useState('');
  const [professionDraft, setProfessionDraft] = useState(profession);
  const [technologyDraftId, setTechnologyDraftId] = useState(selectedTechnologyId);
  const [roleDraft, setRoleDraft] = useState(experienceRole);
  const [roleOpen, setRoleOpen] = useState(Boolean(experienceRole));

  useEffect(() => {
    setProfessionDraft(profession);
  }, [profession]);

  useEffect(() => {
    setTechnologyDraftId(selectedTechnologyId);
  }, [selectedTechnologyId]);

  useEffect(() => {
    setRoleDraft(experienceRole);
    setRoleOpen(Boolean(experienceRole));
  }, [experienceRole]);

  const availableSkillOptions = Array.isArray(availableSkills) ? availableSkills : [];
  const availableTechnologyOptions = Array.isArray(availableTechnologies) ? availableTechnologies : [];

  const selectedSkillCards = selectedSkills
    .map((skillId) => availableSkillOptions.find((skill) => String(skill.id) === String(skillId)))
    .filter(Boolean);

  const addSkill = () => {
    if (!skillToAddId) {
      return;
    }

    const skill = availableSkillOptions.find((option) => String(option.id) === String(skillToAddId));
    if (skill) {
      onToggleSkill(skill);
      onSelectedSkillLevelSkillChange(String(skill.id));
    }

    setSkillToAddId('');
  };

  const removeSkill = (skillId) => {
    const skill = availableSkillOptions.find((option) => String(option.id) === String(skillId));
    if (skill) {
      onToggleSkill(skill);
    }

    if (String(selectedSkillLevelSkillId) === String(skillId)) {
      onSelectedSkillLevelSkillChange('');
      onToggleSkillLevel('__clear__');
    }
  };

  const toggleSkillOpen = (skillId) => {
    if (String(selectedSkillLevelSkillId) !== String(skillId)) {
      onToggleSkillLevel('__clear__');
    }

    onSelectedSkillLevelSkillChange(
      String(selectedSkillLevelSkillId) === String(skillId) ? '' : String(skillId),
    );
  };

  const handleToggleLevel = (level, skillId) => {
    if (String(selectedSkillLevelSkillId) !== String(skillId)) {
      onSelectedSkillLevelSkillChange(String(skillId));
    }

    onToggleSkillLevel(level);
  };

  const addProfession = () => {
    onProfessionChange(professionDraft.trim());
  };

  const addTechnology = () => {
    onTechnologyChange(technologyDraftId);
  };

  const addRole = () => {
    onExperienceRoleChange(roleDraft.trim());
  };

  return (
    <aside className="talent-board-filters softsave-privacy__card" aria-label="Filtros tecnicos">
      <div className="talent-board-filters__title">
        <div>
          <h2>Filtros técnicos</h2>
          <p>Afina la búsqueda por stack, trayectoria y enfoque académico.</p>
        </div>
      </div>

      <div className="talent-board-filters__groups">
        <Section
          icon={mdiTuneVariant}
          title="Habilidades técnicas"
        >
          <div className="talent-board-filters__add-row">
            <select value={skillToAddId} onChange={(event) => setSkillToAddId(event.target.value)}>
              <option value="">Añadir habilidad...</option>
              {availableSkillOptions.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
            </select>

            <AddBtn onClick={addSkill} disabled={!skillToAddId} ariaLabel="Agregar habilidad" />
          </div>

          <div className="talent-board-filters__stack">
            {selectedSkillCards.length > 0 ? (
              selectedSkillCards.map((skill) => (
                <SkillTag
                  key={skill.id}
                  label={skill.name}
                  isOpen={String(selectedSkillLevelSkillId) === String(skill.id)}
                  levelValues={
                    String(selectedSkillLevelSkillId) === String(skill.id)
                      ? selectedSkillLevelOptions
                      : []
                  }
                  onToggleOpen={() => toggleSkillOpen(skill.id)}
                  onDelete={() => removeSkill(skill.id)}
                  onToggleLevel={(level) => handleToggleLevel(level, skill.id)}
                />
              ))
            ) : (
              <p className="talent-board-filters__hint">
                
              </p>
            )}
          </div>
        </Section>

        <Section
          icon={mdiBriefcaseOutline}
          title="Profesión"
        >
          <div className="talent-board-filters__add-row">
            <select value={professionDraft} onChange={(event) => setProfessionDraft(event.target.value)}>
              <option value="">Añadir profesión...</option>
              {professionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <AddBtn onClick={addProfession} disabled={!professionDraft} ariaLabel="Aplicar profesión" />
          </div>
          {profession ? <SimpleTag label={profession} onDelete={() => onProfessionChange('')} /> : null}
        </Section>

        <Section
          icon={mdiBriefcaseOutline}
          title="Experiencia por cargo"
        >
          <div className="talent-board-filters__add-row">
            <select value={roleDraft} onChange={(event) => setRoleDraft(event.target.value)}>
              <option value="">Añadir cargo...</option>
              {roleOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <AddBtn onClick={addRole} disabled={!roleDraft} ariaLabel="Aplicar cargo" />
          </div>

          {experienceRole ? (
            <RoleTag
              label={experienceRole}
              isOpen={roleOpen}
              onToggleOpen={() => setRoleOpen((value) => !value)}
              onDelete={() => {
                onExperienceRoleChange('');
                onExperienceMinYearsChange('');
                onExperienceMaxYearsChange('');
                onToggleSkillLevel('__clear__');
                onSelectedSkillLevelSkillChange('');
                setRoleOpen(false);
              }}
              minYears={experienceMinYears}
              onChangeMinYears={onExperienceMinYearsChange}
              maxYears={experienceMaxYears}
              onChangeMaxYears={onExperienceMaxYearsChange}
            />
          ) : null}
        </Section>

        <Section
          icon={mdiLayersTripleOutline}
          title="Tecnología en proyectos"
        >
          <div className="talent-board-filters__add-row">
            <select value={technologyDraftId} onChange={(event) => setTechnologyDraftId(event.target.value)}>
              <option value="">Añadir tecnología...</option>
              {availableTechnologyOptions.map((technology) => (
                <option key={technology.id} value={technology.id}>
                  {technology.name}
                </option>
              ))}
            </select>
            <AddBtn onClick={addTechnology} disabled={!technologyDraftId} ariaLabel="Aplicar tecnología" />
          </div>

          {selectedTechnologyId ? (
            <SimpleTag
              label={getCatalogLabel(availableTechnologyOptions, selectedTechnologyId) || selectedTechnologyId}
              onDelete={() => onTechnologyChange('')}
            />
          ) : null}
        </Section>

        <Section
          icon={mdiSchoolOutline}
          title="Académico"
        >
          <AcademicPanel
            degree={degree}
            degreeOptions={degreeOptions}
            onDegreeChange={onDegreeChange}
            institution={institution}
            institutionOptions={institutionOptions}
            onInstitutionChange={onInstitutionChange}
            onRemoveDegree={() => onDegreeChange('')}
            onRemoveInstitution={() => onInstitutionChange('')}
          />
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
  professionOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedSkills: PropTypes.arrayOf(PropTypes.string).isRequired,
  onToggleSkill: PropTypes.func.isRequired,
  selectedSkillLevelSkillId: PropTypes.string.isRequired,
  onSelectedSkillLevelSkillChange: PropTypes.func.isRequired,
  selectedSkillLevelOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  onToggleSkillLevel: PropTypes.func.isRequired,
  selectedTechnologyId: PropTypes.string.isRequired,
  onTechnologyChange: PropTypes.func.isRequired,
  roleOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  profession: PropTypes.string.isRequired,
  onProfessionChange: PropTypes.func.isRequired,
  degreeOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  degree: PropTypes.string.isRequired,
  onDegreeChange: PropTypes.func.isRequired,
  institutionOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  institution: PropTypes.string.isRequired,
  onInstitutionChange: PropTypes.func.isRequired,
  experienceRole: PropTypes.string.isRequired,
  onExperienceRoleChange: PropTypes.func.isRequired,
  experienceMinYears: PropTypes.string.isRequired,
  onExperienceMinYearsChange: PropTypes.func.isRequired,
  experienceMaxYears: PropTypes.string.isRequired,
  onExperienceMaxYearsChange: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired,
};

TalentSidebarFilters.defaultProps = {
  availableSkills: null,
  availableTechnologies: null,
};

export default TalentSidebarFilters;
