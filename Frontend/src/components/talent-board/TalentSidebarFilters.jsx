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
  degrees,
  degreeOptions,
  onAddDegree,
  onRemoveDegree,
  institutions,
  institutionOptions,
  onAddInstitution,
  onRemoveInstitution,
}) {
  const [degreeDraft, setDegreeDraft] = useState('');
  const [institutionDraft, setInstitutionDraft] = useState('');

  const handleAddDegree = () => {
    if (degreeDraft && !degrees.includes(degreeDraft)) {
      onAddDegree(degreeDraft);
      setDegreeDraft('');
    }
  };

  const handleAddInstitution = () => {
    if (institutionDraft && !institutions.includes(institutionDraft)) {
      onAddInstitution(institutionDraft);
      setInstitutionDraft('');
    }
  };

  return (
    <div className="talent-board-filters__academic-panel">
      <div className="talent-board-filters__subsection">
        <p className="talent-board-filters__subsection-title">Grados</p>
        <div className="talent-board-filters__add-row">
          <DropdownSelect
            value={degreeDraft}
            onChange={setDegreeDraft}
            options={[
              { value: '', label: 'Añadir grado...', disabled: true },
              ...degreeOptions.map((option) => ({
                value: option,
                label: option,
                disabled: degrees.includes(option),
              })),
            ]}
            ariaLabel="Seleccionar grado"
          />
          <AddBtn
            onClick={handleAddDegree}
            disabled={!degreeDraft}
            ariaLabel="Aplicar grado"
          />
        </div>
        <div className="talent-board-filters__stack">
          {degrees.length > 0 ? (
            degrees.map((degree) => (
              <SimpleTag
                key={degree}
                label={degree}
                onDelete={() => onRemoveDegree(degree)}
              />
            ))
          ) : null}
        </div>
      </div>

      <div className="talent-board-filters__subsection">
        <p className="talent-board-filters__subsection-title">Instituciones</p>
        <div className="talent-board-filters__add-row">
          <DropdownSelect
            value={institutionDraft}
            onChange={setInstitutionDraft}
            options={[
              { value: '', label: 'Añadir institución...', disabled: true },
              ...institutionOptions.map((option) => ({
                value: option,
                label: option,
                disabled: institutions.includes(option),
              })),
            ]}
            ariaLabel="Seleccionar institución"
          />
          <AddBtn
            onClick={handleAddInstitution}
            disabled={!institutionDraft}
            ariaLabel="Aplicar institución"
          />
        </div>
        <div className="talent-board-filters__stack">
          {institutions.length > 0 ? (
            institutions.map((institution) => (
              <SimpleTag
                key={institution}
                label={institution}
                onDelete={() => onRemoveInstitution(institution)}
              />
            ))
          ) : null}
        </div>
      </div>
    </div>
  );
}

AcademicPanel.propTypes = {
  degrees: PropTypes.arrayOf(PropTypes.string).isRequired,
  degreeOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  onAddDegree: PropTypes.func.isRequired,
  onRemoveDegree: PropTypes.func.isRequired,
  institutions: PropTypes.arrayOf(PropTypes.string).isRequired,
  institutionOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  onAddInstitution: PropTypes.func.isRequired,
  onRemoveInstitution: PropTypes.func.isRequired,
};

function TalentSidebarFilters({
  availableSkills,
  availableTechnologies,
  professionOptions,
  selectedSkills,
  onToggleSkill,
  onRemoveSkill,
  skillLevelFilters,
  onSkillLevelFiltersChange,
  selectedTechnologies,
  onAddTechnology,
  onRemoveTechnology,
  roleOptions,
  professions,
  onAddProfession,
  onRemoveProfession,
  degreeOptions,
  degrees,
  onAddDegree,
  onRemoveDegree,
  institutionOptions,
  institutions,
  onAddInstitution,
  onRemoveInstitution,
  experienceRoles,
  onExperienceRolesChange,
  onClearFilters,
}) {
  const [skillToAddId, setSkillToAddId] = useState('');
  const [professionDraft, setProfessionDraft] = useState('');
  const [technologyDraftId, setTechnologyDraftId] = useState('');
  const [roleDraft, setRoleDraft] = useState('');
  const [roleOpen, setRoleOpen] = useState(experienceRoles.length > 0);
  const [openSkillId, setOpenSkillId] = useState('');

  useEffect(() => {
    setRoleDraft('');
    setRoleOpen(experienceRoles.length > 0);
  }, [experienceRoles]);

  const availableSkillOptions = Array.isArray(availableSkills) ? availableSkills : [];
  const availableTechnologyOptions = Array.isArray(availableTechnologies) ? availableTechnologies : [];

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

  const addProfession = () => {
    if (professionDraft && !professions.includes(professionDraft)) {
      onAddProfession(professionDraft);
      setProfessionDraft('');
    }
  };

  const addTechnology = () => {
    if (technologyDraftId && !selectedTechnologies.includes(technologyDraftId)) {
      onAddTechnology(technologyDraftId);
      setTechnologyDraftId('');
    }
  };

  const addRole = () => {
    const value = roleDraft.trim();

    if (!value) {
      return;
    }

    if (!experienceRoles.some((item) => item.role === value)) {
      onExperienceRolesChange([...experienceRoles, {
        role: value,
        minYears: '',
        maxYears: '',
      }] );
    }

    setRoleDraft('');
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
            <DropdownSelect
              value={skillToAddId}
              onChange={setSkillToAddId}
              options={[
                { value: '', label: 'Añadir habilidad...', disabled: true },
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

        {/*<Section
          icon={mdiBriefcaseOutline}
          title="Profesión"
        >
          <div className="talent-board-filters__add-row">
            <DropdownSelect
              value={professionDraft}
              onChange={setProfessionDraft}
              options={[
                { value: '', label: 'Añadir profesión...', disabled: true },
                ...professionOptions.map((option) => ({
                  value: option,
                  label: option,
                  disabled: professions.includes(option),
                })),
              ]}
              ariaLabel="Seleccionar profesión"
            />
            <AddBtn onClick={addProfession} disabled={!professionDraft} ariaLabel="Aplicar profesión" />
          </div>
          <div className="talent-board-filters__stack">
            {professions.length > 0 ? (
              professions.map((prof) => (
                <SimpleTag
                  key={prof}
                  label={prof}
                  onDelete={() => onRemoveProfession(prof)}
                />
              ))
            ) : null}
          </div>
        </Section>

        <Section
          icon={mdiBriefcaseOutline}
          title="Experiencia por cargo"
        >
          <div className="talent-board-filters__add-row">
            <DropdownSelect
              value={roleDraft}
              onChange={setRoleDraft}
              options={[
                { value: '', label: 'Añadir cargo...', disabled: true },
                ...roleOptions.map((option) => ({
                  value: option,
                  label: option,
                })),
              ]}
              ariaLabel="Seleccionar cargo"
            />
            <AddBtn onClick={addRole} disabled={!roleDraft} ariaLabel="Aplicar cargo" />
          </div>

          {experienceRoles.length > 0 ? (
            experienceRoles.map((item) => (
              <RoleTag
                key={item.role}
                label={item.role}
                isOpen={roleOpen}
                onToggleOpen={() => setRoleOpen((value) => !value)}
                onDelete={() => {
                  const nextRoles = experienceRoles.filter((roleItem) => roleItem.role !== item.role);
                  onExperienceRolesChange(nextRoles);

                  if (nextRoles.length === 0) {
                    setRoleOpen(false);
                  }
                }}
                minYears={item.minYears}
                onChangeMinYears={(value) => {
                  onExperienceRolesChange(
                    experienceRoles.map((roleItem) => (
                      roleItem.role === item.role
                        ? { ...roleItem, minYears: String(value || '').trim() }
                        : roleItem
                    )),
                  );
                }}
                maxYears={item.maxYears}
                onChangeMaxYears={(value) => {
                  onExperienceRolesChange(
                    experienceRoles.map((roleItem) => (
                      roleItem.role === item.role
                        ? { ...roleItem, maxYears: String(value || '').trim() }
                        : roleItem
                    )),
                  );
                }}
              />
            ))
          ) : null}
        </Section>*/}

        <Section
          icon={mdiLayersTripleOutline}
          title="Tecnología en proyectos"
        >
          <div className="talent-board-filters__add-row">
            <DropdownSelect
              value={technologyDraftId}
              onChange={setTechnologyDraftId}
              options={[
                { value: '', label: 'Añadir tecnología...', disabled: true },
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

        {/*<Section
          icon={mdiSchoolOutline}
          title="Académico"
        >
          <AcademicPanel
            degrees={degrees}
            degreeOptions={degreeOptions}
            onAddDegree={onAddDegree}
            onRemoveDegree={onRemoveDegree}
            institutions={institutions}
            institutionOptions={institutionOptions}
            onAddInstitution={onAddInstitution}
            onRemoveInstitution={onRemoveInstitution}
          />
        </Section>*/}
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
  roleOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  professions: PropTypes.arrayOf(PropTypes.string).isRequired,
  onAddProfession: PropTypes.func.isRequired,
  onRemoveProfession: PropTypes.func.isRequired,
  degreeOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  degrees: PropTypes.arrayOf(PropTypes.string).isRequired,
  onAddDegree: PropTypes.func.isRequired,
  onRemoveDegree: PropTypes.func.isRequired,
  institutionOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  institutions: PropTypes.arrayOf(PropTypes.string).isRequired,
  onAddInstitution: PropTypes.func.isRequired,
  onRemoveInstitution: PropTypes.func.isRequired,
  experienceRoles: PropTypes.arrayOf(PropTypes.shape({
    role: PropTypes.string.isRequired,
    minYears: PropTypes.string.isRequired,
    maxYears: PropTypes.string.isRequired,
  })).isRequired,
  onExperienceRolesChange: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired,
};

TalentSidebarFilters.defaultProps = {
  availableSkills: null,
  availableTechnologies: null,
};

export default TalentSidebarFilters;
