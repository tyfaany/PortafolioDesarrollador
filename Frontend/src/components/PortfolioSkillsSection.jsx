import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@mdi/react';
import { mdiClose, mdiPencilOutline, mdiPlus, mdiViewGridOutline } from '@mdi/js';
import useAuth from '../hooks/useAuth';
import {
  obtenerSkillsTecnicas,
  obtenerSoftSkills,
  sincronizarSkillsTecnicas,
  sincronizarSoftSkills,
} from '../services/authService';
import { getPortfolioCache, setPortfolioCache } from '../services/portfolioCache';

const NIVELES_TECNICOS = ['Básico', 'Intermedio', 'Avanzado'];
const ICON_SIZES = {
  section: 1,
  action: 0.85,
  chipRemove: 0.6,
};
const SUGERENCIAS_BLANDAS = [
  'Liderazgo',
  'Comunicación',
  'Adaptabilidad',
  'Creatividad',
  'Pensamiento crítico',
  'Gestión del tiempo',
  'Resolución de problemas',
];

function sanitizarTexto(valor) {
  return String(valor || '').replace(/\s+/g, ' ').trim();
}

function normalizarNivel(nivel) {
  const limpio = sanitizarTexto(nivel);
  if (limpio === 'Basico') {
    return 'Básico';
  }
  if (NIVELES_TECNICOS.includes(limpio)) {
    return limpio;
  }
  return 'Intermedio';
}

function normalizarSkillsTecnicas(skills) {
  if (!Array.isArray(skills)) {
    return [];
  }

  return skills
    .map((skill, indice) => {
      if (typeof skill === 'string') {
        return {
          id: `tech-${indice}-${skill}`,
          name: sanitizarTexto(skill),
          level: 'Intermedio',
        };
      }

      if (skill && typeof skill === 'object') {
        return {
          id: skill.id || `tech-${indice}-${skill.name || skill.label || 'skill'}`,
          name: sanitizarTexto(skill.name || skill.label || ''),
          level: normalizarNivel(skill.level || skill.pivot?.level || 'Intermedio'),
        };
      }

      return null;
    })
    .filter((skill) => skill?.name);
}

function normalizarHabilidadesBlandas(skills) {
  if (!Array.isArray(skills)) {
    return [];
  }

  return [...new Set(
    skills
      .map((skill) => (typeof skill === 'string' ? sanitizarTexto(skill) : sanitizarTexto(skill?.name || skill?.label || '')))
      .filter(Boolean),
  )];
}

function obtenerAnchoNivel(nivel) {
  if (nivel === 'Avanzado') {
    return '88%';
  }

  if (nivel === 'Intermedio') {
    return '58%';
  }

  return '34%';
}

function obtenerClaseNivel(nivel) {
  if (nivel === 'Avanzado') {
    return 'is-high';
  }

  if (nivel === 'Intermedio') {
    return 'is-medium';
  }

  return 'is-basic';
}

function PortfolioSkillsSection() {
  const { user } = useAuth();
  const skillInputRef = useRef(null);
  const skillsCacheKey = useMemo(
    () => (user?.id ? `portfolio:skills:${user.id}` : null),
    [user?.id],
  );
  const [tecnicas, setTecnicas] = useState([]);
  const [blandas, setBlandas] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [mostrandoAgregarBlanda, setMostrandoAgregarBlanda] = useState(false);
  const [skillTecnicaNueva, setSkillTecnicaNueva] = useState('');
  const [nivelNuevo, setNivelNuevo] = useState('Intermedio');
  const [skillBlandaNueva, setSkillBlandaNueva] = useState('');
  const [indiceBlandaEditando, setIndiceBlandaEditando] = useState(null);
  const [errores, setErrores] = useState({});
  const [mensajeExito, setMensajeExito] = useState('');

  const tieneSkills = useMemo(() => tecnicas.length > 0 || blandas.length > 0, [tecnicas, blandas]);
  const actualizarCacheSkills = useCallback((tecnicasActuales, blandasActuales) => {
    setPortfolioCache(skillsCacheKey, {
      tecnicas: tecnicasActuales,
      blandas: blandasActuales,
    });
  }, [skillsCacheKey]);

  useEffect(() => {
    let sigueMontado = true;

    const cacheSkills = getPortfolioCache(skillsCacheKey);
    if (cacheSkills) {
      setTecnicas(normalizarSkillsTecnicas(cacheSkills.tecnicas));
      setBlandas(normalizarHabilidadesBlandas(cacheSkills.blandas));
      return () => {
        sigueMontado = false;
      };
    }

    Promise.allSettled([obtenerSkillsTecnicas(), obtenerSoftSkills()])
      .then(([tecnicasResultado, blandasResultado]) => {
        if (!sigueMontado) {
          return;
        }

        const tecnicasFuente = tecnicasResultado.status === 'fulfilled'
          ? tecnicasResultado.value.data
          : user?.skills;
        const blandasFuente = blandasResultado.status === 'fulfilled'
          ? blandasResultado.value.data
          : user?.softSkills;

        const tecnicasNormalizadas = normalizarSkillsTecnicas(tecnicasFuente);
        const blandasNormalizadas = normalizarHabilidadesBlandas(blandasFuente);

        setTecnicas(tecnicasNormalizadas);
        setBlandas(blandasNormalizadas);
        actualizarCacheSkills(tecnicasNormalizadas, blandasNormalizadas);
      });

    return () => {
      sigueMontado = false;
    };
  }, [actualizarCacheSkills, skillsCacheKey, user?.skills, user?.softSkills]);

  const limpiarMensajes = () => {
    setErrores({});
    setMensajeExito('');
  };

  const alternarEdicion = () => {
    setIsEditing((actual) => {
      const siguiente = !actual;
      if (siguiente) {
        setIsAdding(false);
      } else {
        setMostrandoAgregarBlanda(false);
        setSkillBlandaNueva('');
        setIndiceBlandaEditando(null);
      }
      return siguiente;
    });
    limpiarMensajes();
  };

  const abrirAgregarRapido = () => {
    setIsAdding((actual) => {
      const siguiente = !actual;
      if (!siguiente) {
        setMostrandoAgregarBlanda(false);
        setSkillTecnicaNueva('');
        setNivelNuevo('Intermedio');
        setSkillBlandaNueva('');
        setIndiceBlandaEditando(null);
      } else {
        setIsEditing(false);
        setMostrandoAgregarBlanda(false);
        setIndiceBlandaEditando(null);
        setTimeout(() => skillInputRef.current?.focus(), 0);
      }
      return siguiente;
    });
    limpiarMensajes();
  };

  const persistirSkillsTecnicas = async (skillsActuales) => {
    const sinNivel = skillsActuales.some((skill) => !skill.level);
    if (sinNivel) {
      setErrores({ tecnica: 'Todas las habilidades deben tener un nivel asignado.' });
      return false;
    }

    const payload = skillsActuales.map((skill) => ({
      name: skill.name,
      level: normalizarNivel(skill.level).normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    }));
    await sincronizarSkillsTecnicas(payload);
    return true;
  };

  const persistirSoftSkills = async (blandasActuales) => {
    await sincronizarSoftSkills(blandasActuales);
  };

  const agregarHabilidadTecnica = async () => {
    const nombre = sanitizarTexto(skillTecnicaNueva);

    if (!nombre) {
      setErrores({ tecnica: 'Ingresa una habilidad técnica.' });
      return;
    }

    if (!nivelNuevo) {
      setErrores({ tecnica: 'Selecciona un nivel de dominio.' });
      return;
    }

    if (tecnicas.some((skill) => skill.name.toLowerCase() === nombre.toLowerCase())) {
      setErrores({ tecnica: 'Esa habilidad técnica ya existe.' });
      return;
    }

    const nuevasTecnicas = [
      ...tecnicas,
      {
        id: `tech-${Date.now()}-${nombre}`,
        name: nombre,
        level: nivelNuevo,
      },
    ];

    try {
      const persistido = await persistirSkillsTecnicas(nuevasTecnicas);
      if (!persistido) {
        return;
      }
      setTecnicas(nuevasTecnicas);
      actualizarCacheSkills(nuevasTecnicas, blandas);
      setSkillTecnicaNueva('');
      setNivelNuevo('Intermedio');
      setErrores({});
      setMensajeExito('Habilidad técnica registrada correctamente.');
    } catch {
      setErrores({ tecnica: 'No se pudo guardar la habilidad técnica.' });
    }
  };

  const cambiarNivel = async (id, nivel) => {
    const tecnicasActualizadas = tecnicas.map((skill) => (skill.id === id ? { ...skill, level: nivel } : skill));

    try {
      const persistido = await persistirSkillsTecnicas(tecnicasActualizadas);
      if (!persistido) {
        return;
      }
      setTecnicas(tecnicasActualizadas);
      actualizarCacheSkills(tecnicasActualizadas, blandas);
      setMensajeExito('Nivel actualizado correctamente.');
    } catch {
      setErrores({ tecnica: 'No se pudo actualizar el nivel.' });
    }
  };

  const guardarBlanda = async () => {
    const nombre = sanitizarTexto(skillBlandaNueva);

    if (!nombre) {
      setErrores({ blanda: 'Ingresa una habilidad blanda.' });
      return;
    }

    const duplicada = blandas.some((skill, indice) =>
      skill.toLowerCase() === nombre.toLowerCase() && indice !== indiceBlandaEditando);

    if (duplicada) {
      setErrores({ blanda: 'Esa habilidad blanda ya existe.' });
      return;
    }

    const nuevasBlandas = indiceBlandaEditando !== null
      ? blandas.map((skill, indice) => (indice === indiceBlandaEditando ? nombre : skill))
      : [...blandas, nombre];

    try {
      await persistirSoftSkills(nuevasBlandas);
      setBlandas(nuevasBlandas);
      actualizarCacheSkills(tecnicas, nuevasBlandas);
      setSkillBlandaNueva('');
      setIndiceBlandaEditando(null);
      setMostrandoAgregarBlanda(false);
      setErrores({});
      setMensajeExito(
        indiceBlandaEditando !== null
          ? 'Habilidad blanda actualizada correctamente.'
          : 'Habilidad blanda agregada correctamente.',
      );
    } catch {
      setErrores({ blanda: 'No se pudo guardar la habilidad blanda.' });
    }
  };

  const editarBlanda = (skill, indice) => {
    setSkillBlandaNueva(skill);
    setIndiceBlandaEditando(indice);
    setMostrandoAgregarBlanda(true);
    setErrores({});
    setMensajeExito('');
  };

  const eliminarBlanda = async (indice) => {
    const nuevasBlandas = blandas.filter((_, itemIndice) => itemIndice !== indice);

    try {
      await persistirSoftSkills(nuevasBlandas);
      setBlandas(nuevasBlandas);
      actualizarCacheSkills(tecnicas, nuevasBlandas);
      setMensajeExito('Habilidad blanda eliminada correctamente.');
    } catch {
      setErrores({ blanda: 'No se pudo eliminar la habilidad blanda.' });
    }
  };

  const agregarDesdeSugerencia = async (skill) => {
    if (blandas.some((actual) => actual.toLowerCase() === skill.toLowerCase())) {
      return;
    }

    const nuevasBlandas = [...blandas, skill];

    try {
      await persistirSoftSkills(nuevasBlandas);
      setBlandas(nuevasBlandas);
      actualizarCacheSkills(tecnicas, nuevasBlandas);
      setMensajeExito('Habilidad sugerida agregada correctamente.');
    } catch {
      setErrores({ blanda: 'No se pudo agregar la habilidad sugerida.' });
    }
  };

  return (
    <section className="softsave-portafolio-module-card">
      <div className="softsave-portafolio-module-card__header">
        <div className="softsave-portafolio-module-card__title-wrap">
          <Icon path={mdiViewGridOutline} size={ICON_SIZES.section} className="softsave-portafolio-module-card__icon" />
          <h2 className="softsave-portafolio-module-card__title">Habilidades</h2>
        </div>

        <div className="softsave-portafolio-module-card__actions">
          <button
            type="button"
            className="softsave-portafolio-module-card__action softsave-portafolio-module-card__action--primary"
            aria-label="Agregar habilidad"
            onClick={abrirAgregarRapido}
          >
            <Icon path={mdiPlus} size={ICON_SIZES.action} />
          </button>
          <button
            type="button"
            className="softsave-portafolio-module-card__action"
            aria-label="Editar habilidades"
            onClick={alternarEdicion}
          >
            <Icon path={mdiPencilOutline} size={ICON_SIZES.action} />
          </button>
        </div>
      </div>

      {mensajeExito ? (
        <div className="success-alert softsave-portafolio-module-card__alert" role="status">
          {mensajeExito}
        </div>
      ) : null}

      {!tieneSkills ? (
        <p className="softsave-portafolio-module-card__empty">
          Añade aquí tus habilidades técnicas y blandas
        </p>
      ) : null}

      <div className="softsave-portafolio-skills">
        <section className="softsave-portafolio-skills__block">
          <h3 className="softsave-portafolio-skills__heading">Habilidades técnicas</h3>

          {tecnicas.length > 0 ? (
            <div className="softsave-portafolio-skills__table">
              <div className="softsave-portafolio-skills__table-head">
                <span>Habilidad</span>
                <span>Nivel</span>
              </div>

              {tecnicas.map((skill) => (
                <div key={skill.id} className="softsave-portafolio-skills__row">
                  <span className="softsave-portafolio-skills__name">{skill.name}</span>
                  <div className="softsave-portafolio-skills__level-wrap">
                    {isEditing ? (
                      <select
                        value={skill.level}
                        onChange={(evento) => cambiarNivel(skill.id, evento.target.value)}
                        className="softsave-input softsave-portafolio-skills__select"
                      >
                        {NIVELES_TECNICOS.map((nivel) => (
                          <option key={nivel} value={nivel}>{nivel}</option>
                        ))}
                      </select>
                    ) : (
                      <>
                        <span className={`softsave-portafolio-skills__badge ${obtenerClaseNivel(skill.level)}`}>
                          {skill.level}
                        </span>
                        <span className="softsave-portafolio-skills__bar">
                          <span
                            className={`softsave-portafolio-skills__bar-fill ${obtenerClaseNivel(skill.level)}`}
                            style={{ width: obtenerAnchoNivel(skill.level) }}
                          />
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {isAdding ? (
            <div className="softsave-portafolio-skills__add-box">
              <h4 className="softsave-portafolio-skills__subheading">Agregar nueva habilidad</h4>
              <div className="softsave-portafolio-skills__form-grid">
                <label className="softsave-profile__field">
                  <span className="softsave-portafolio-job-form__sub-label">Habilidad</span>
                  <input
                    ref={skillInputRef}
                    type="text"
                    value={skillTecnicaNueva}
                    onChange={(evento) => {
                      setSkillTecnicaNueva(evento.target.value);
                      setErrores((actual) => ({ ...actual, tecnica: '' }));
                      setMensajeExito('');
                    }}
                    className="softsave-input softsave-profile__input"
                    placeholder="Buscar o escribir..."
                  />
                </label>

                <label className="softsave-profile__field">
                  <span className="softsave-portafolio-job-form__sub-label">Nivel</span>
                  <select
                    value={nivelNuevo}
                    onChange={(evento) => {
                      setNivelNuevo(evento.target.value);
                      setMensajeExito('');
                    }}
                    className="softsave-input softsave-profile__input"
                  >
                    {NIVELES_TECNICOS.map((nivel) => (
                      <option key={nivel} value={nivel}>{nivel}</option>
                    ))}
                  </select>
                </label>
              </div>

              {errores.tecnica ? (
                <span className="error-text softsave-profile__error-text" role="alert">
                  {errores.tecnica}
                </span>
              ) : null}

              <div className="softsave-portafolio-skills__footer">
                <button
                  type="button"
                  className="softsave-button softsave-button--compact"
                  onClick={agregarHabilidadTecnica}
                >
                  + Agregar
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="softsave-portafolio-skills__block">
          <h3 className="softsave-portafolio-skills__heading">Habilidades blandas</h3>

          <div className="softsave-portafolio-skills__chips">
            {blandas.map((skill, indice) => (
              <button
                key={`${skill}-${indice}`}
                type="button"
                className={`softsave-portafolio-skills__chip ${isEditing ? 'is-editing' : ''}`}
                onClick={() => (isEditing ? editarBlanda(skill, indice) : undefined)}
              >
                <span>{skill}</span>
                {isEditing ? (
                  <button
                    type="button"
                    className="softsave-portafolio-skills__chip-remove"
                    aria-label={`Eliminar habilidad blanda ${skill}`}
                    onClick={(evento) => {
                      evento.stopPropagation();
                      eliminarBlanda(indice);
                    }}
                  >
                    <Icon path={mdiClose} size={ICON_SIZES.chipRemove} />
                  </button>
                ) : null}
              </button>
            ))}

            {isAdding ? (
              <button
                type="button"
                className="softsave-portafolio-skills__chip softsave-portafolio-skills__chip--add"
                onClick={() => {
                  setMostrandoAgregarBlanda(true);
                  setIndiceBlandaEditando(null);
                  setSkillBlandaNueva('');
                  setErrores((actual) => ({ ...actual, blanda: '' }));
                  setMensajeExito('');
                }}
              >
                + Agregar
              </button>
            ) : null}
          </div>

          {isAdding && mostrandoAgregarBlanda ? (
            <div className="softsave-portafolio-skills__soft-form">
              <input
                type="text"
                value={skillBlandaNueva}
                onChange={(evento) => {
                  setSkillBlandaNueva(evento.target.value);
                  setErrores((actual) => ({ ...actual, blanda: '' }));
                  setMensajeExito('');
                }}
                className="softsave-input softsave-profile__input"
                placeholder="Escribe una habilidad blanda"
              />
              <div className="softsave-profile__modal-actions">
                <button
                  type="button"
                  className="softsave-profile__secondary-button softsave-profile__secondary-button--modal"
                  onClick={() => {
                    setMostrandoAgregarBlanda(false);
                    setSkillBlandaNueva('');
                    setIndiceBlandaEditando(null);
                    setErrores((actual) => ({ ...actual, blanda: '' }));
                  }}
                >
                  Cancelar
                </button>
                <button type="button" className="softsave-button softsave-button--compact" onClick={guardarBlanda}>
                  Guardar
                </button>
              </div>
            </div>
          ) : null}

          {errores.blanda ? (
            <span className="error-text softsave-profile__error-text" role="alert">
              {errores.blanda}
            </span>
          ) : null}

          {isAdding ? (
            <>
              <div className="softsave-portafolio-skills__suggestions-head">
                <span className="softsave-portafolio-skills__suggestions-title">Habilidades sugeridas</span>
              </div>

              <div className="softsave-portafolio-skills__suggestions">
                {SUGERENCIAS_BLANDAS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    className="softsave-portafolio-skills__suggestion"
                    onClick={() => agregarDesdeSugerencia(skill)}
                    disabled={blandas.some((actual) => actual.toLowerCase() === skill.toLowerCase())}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </section>
      </div>
    </section>
  );
}

export default PortfolioSkillsSection;
