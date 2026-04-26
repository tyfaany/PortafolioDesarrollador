import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@mdi/react';
import { mdiClose, mdiContentSaveOutline, mdiDeleteOutline, mdiPencilOutline, mdiPlus, mdiViewGridOutline } from '@mdi/js';
import useAuth from '../hooks/useAuth';
import useFeedback from '../hooks/useFeedback';
import {
  obtenerSkillsTecnicas,
  obtenerSoftSkills,
  sincronizarSkillsTecnicas,
  sincronizarSoftSkills,
} from '../services/authService';
import { getPortfolioCache, setPortfolioCache } from '../services/portfolioCache';
import { extractApiMessageByStatus } from '../utils/apiError';

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
  const { showFeedback } = useFeedback();
  const skillInputRef = useRef(null);
  const softSkillsUsuario = useMemo(
    () => user?.softSkills ?? user?.soft_skills ?? [],
    [user?.softSkills, user?.soft_skills],
  );
  const tecnicasDesdeContexto = useMemo(
    () => normalizarSkillsTecnicas(user?.skills),
    [user?.skills],
  );
  const blandasDesdeContexto = useMemo(
    () => normalizarHabilidadesBlandas(softSkillsUsuario),
    [softSkillsUsuario],
  );
  const skillsCacheKey = useMemo(
    () => (user?.id ? `portfolio:skills:${user.id}` : null),
    [user?.id],
  );
  const [tecnicas, setTecnicas] = useState(() => tecnicasDesdeContexto);
  const [blandas, setBlandas] = useState(() => blandasDesdeContexto);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [mostrandoAgregarBlanda, setMostrandoAgregarBlanda] = useState(false);
  const [skillTecnicaNueva, setSkillTecnicaNueva] = useState('');
  const [nivelNuevo, setNivelNuevo] = useState('Intermedio');
  const [skillBlandaNueva, setSkillBlandaNueva] = useState('');
  const [indiceBlandaEditando, setIndiceBlandaEditando] = useState(null);
  const [nombresTecnicosEditando, setNombresTecnicosEditando] = useState({});
  const [errores, setErrores] = useState({});
  const [mensajeExito, setMensajeExito] = useState('');
  const [eliminandoTecnica, setEliminandoTecnica] = useState(false);
  const [tecnicaPendienteEliminar, setTecnicaPendienteEliminar] = useState(null);

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

    if (tecnicasDesdeContexto.length > 0 || blandasDesdeContexto.length > 0) {
      setTecnicas(tecnicasDesdeContexto);
      setBlandas(blandasDesdeContexto);
      actualizarCacheSkills(tecnicasDesdeContexto, blandasDesdeContexto);
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
          : softSkillsUsuario;

        const tecnicasNormalizadas = normalizarSkillsTecnicas(tecnicasFuente);
        const blandasNormalizadas = normalizarHabilidadesBlandas(blandasFuente);

        setTecnicas(tecnicasNormalizadas);
        setBlandas(blandasNormalizadas);
        actualizarCacheSkills(tecnicasNormalizadas, blandasNormalizadas);
      });

    return () => {
      sigueMontado = false;
    };
  }, [actualizarCacheSkills, blandasDesdeContexto, skillsCacheKey, softSkillsUsuario, tecnicasDesdeContexto, user?.skills]);

  useEffect(() => {
    if (!mensajeExito) {
      return;
    }

    showFeedback(mensajeExito, 'success');
    setMensajeExito('');
  }, [mensajeExito, showFeedback]);

  useEffect(() => {
    if (!tecnicaPendienteEliminar) {
      return undefined;
    }

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = overflowPrevio;
    };
  }, [tecnicaPendienteEliminar]);

  const limpiarMensajes = () => {
    setErrores({});
    setMensajeExito('');
  };

  const alternarEdicion = () => {
    setIsEditing((actual) => {
      const siguiente = !actual;
      if (siguiente) {
        setIsAdding(false);
        setNombresTecnicosEditando(
          tecnicas.reduce((acumulado, skill) => ({ ...acumulado, [skill.id]: skill.name }), {}),
        );
      } else {
        setMostrandoAgregarBlanda(false);
        setSkillBlandaNueva('');
        setIndiceBlandaEditando(null);
        setNombresTecnicosEditando({});
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
        setNombresTecnicosEditando({});
      } else {
        setIsEditing(false);
        setMostrandoAgregarBlanda(false);
        setIndiceBlandaEditando(null);
        setNombresTecnicosEditando({});
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
    const tecnicasPrevias = tecnicas;

    setTecnicas(nuevasTecnicas);
    actualizarCacheSkills(nuevasTecnicas, blandas);
    setErrores((actual) => ({ ...actual, tecnica: '' }));
    setMensajeExito('');

    try {
      const persistido = await persistirSkillsTecnicas(nuevasTecnicas);
      if (!persistido) {
        setTecnicas(tecnicasPrevias);
        actualizarCacheSkills(tecnicasPrevias, blandas);
        return;
      }
      setSkillTecnicaNueva('');
      setNivelNuevo('Intermedio');
      setErrores({});
      setMensajeExito('Habilidad técnica registrada correctamente.');
    } catch (error) {
      setTecnicas(tecnicasPrevias);
      actualizarCacheSkills(tecnicasPrevias, blandas);
      setErrores({ tecnica: extractApiMessageByStatus(error, 'No se pudo guardar la habilidad técnica.') });
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
    } catch (error) {
      setErrores({ tecnica: extractApiMessageByStatus(error, 'No se pudo actualizar el nivel.') });
    }
  };

  const eliminarHabilidadTecnica = async (id) => {
    const tecnicasActualizadas = tecnicas.filter((skill) => String(skill.id) !== String(id));
    const tecnicasPrevias = tecnicas;

    setTecnicas(tecnicasActualizadas);
    actualizarCacheSkills(tecnicasActualizadas, blandas);
    setErrores((actual) => ({ ...actual, tecnica: '' }));
    setMensajeExito('');

    try {
      const persistido = await persistirSkillsTecnicas(tecnicasActualizadas);
      if (!persistido) {
        setTecnicas(tecnicasPrevias);
        actualizarCacheSkills(tecnicasPrevias, blandas);
        return false;
      }
      setNombresTecnicosEditando((actual) => {
        const siguiente = { ...actual };
        delete siguiente[id];
        return siguiente;
      });
      setErrores((actual) => ({ ...actual, tecnica: '' }));
      setMensajeExito('Habilidad técnica eliminada correctamente.');
      return true;
    } catch (error) {
      setTecnicas(tecnicasPrevias);
      actualizarCacheSkills(tecnicasPrevias, blandas);
      setErrores({ tecnica: extractApiMessageByStatus(error, 'No se pudo eliminar la habilidad técnica.') });
      return false;
    }
  };

  const solicitarEliminarHabilidadTecnica = (skill) => {
    setTecnicaPendienteEliminar(skill);
  };

  const cerrarModalEliminarTecnica = () => {
    if (eliminandoTecnica) {
      return;
    }

    setTecnicaPendienteEliminar(null);
  };

  const confirmarEliminarHabilidadTecnica = async () => {
    if (!tecnicaPendienteEliminar?.id) {
      return;
    }

    setEliminandoTecnica(true);
    const eliminado = await eliminarHabilidadTecnica(tecnicaPendienteEliminar.id);
    if (eliminado) {
      setTecnicaPendienteEliminar(null);
    }
    setEliminandoTecnica(false);
  };

  const confirmarEdicionNombreTecnico = async (id) => {
    const skillActual = tecnicas.find((skill) => String(skill.id) === String(id));
    if (!skillActual) {
      return;
    }

    const nombreEditado = sanitizarTexto(nombresTecnicosEditando[id] ?? skillActual.name);
    if (!nombreEditado) {
      setErrores({ tecnica: 'El nombre de la habilidad técnica es obligatorio.' });
      setNombresTecnicosEditando((actual) => ({ ...actual, [id]: skillActual.name }));
      return;
    }

    const nombreDuplicado = tecnicas.some(
      (skill) => String(skill.id) !== String(id) && skill.name.toLowerCase() === nombreEditado.toLowerCase(),
    );
    if (nombreDuplicado) {
      setErrores({ tecnica: 'Esa habilidad técnica ya existe.' });
      setNombresTecnicosEditando((actual) => ({ ...actual, [id]: skillActual.name }));
      return;
    }

    if (nombreEditado === skillActual.name) {
      setNombresTecnicosEditando((actual) => ({ ...actual, [id]: skillActual.name }));
      return;
    }

    const tecnicasPrevias = tecnicas;
    const tecnicasActualizadas = tecnicas.map(
      (skill) => (String(skill.id) === String(id) ? { ...skill, name: nombreEditado } : skill),
    );

    setTecnicas(tecnicasActualizadas);
    actualizarCacheSkills(tecnicasActualizadas, blandas);
    setErrores((actual) => ({ ...actual, tecnica: '' }));
    setMensajeExito('');
    setNombresTecnicosEditando((actual) => ({ ...actual, [id]: nombreEditado }));

    try {
      const persistido = await persistirSkillsTecnicas(tecnicasActualizadas);
      if (!persistido) {
        setTecnicas(tecnicasPrevias);
        actualizarCacheSkills(tecnicasPrevias, blandas);
        setNombresTecnicosEditando((actual) => ({ ...actual, [id]: skillActual.name }));
        return;
      }
      setMensajeExito('Habilidad técnica actualizada correctamente.');
    } catch (error) {
      setTecnicas(tecnicasPrevias);
      actualizarCacheSkills(tecnicasPrevias, blandas);
      setNombresTecnicosEditando((actual) => ({ ...actual, [id]: skillActual.name }));
      setErrores({ tecnica: extractApiMessageByStatus(error, 'No se pudo actualizar la habilidad técnica.') });
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

    if (
      indiceBlandaEditando !== null
      && sanitizarTexto(blandas[indiceBlandaEditando]).toLowerCase() === nombre.toLowerCase()
    ) {
      setErrores((actual) => ({ ...actual, blanda: '' }));
      setMensajeExito('');
      setSkillBlandaNueva('');
      setIndiceBlandaEditando(null);
      setMostrandoAgregarBlanda(false);
      return;
    }

    const nuevasBlandas = indiceBlandaEditando !== null
      ? blandas.map((skill, indice) => (indice === indiceBlandaEditando ? nombre : skill))
      : [...blandas, nombre];
    const blandasPrevias = blandas;

    setBlandas(nuevasBlandas);
    actualizarCacheSkills(tecnicas, nuevasBlandas);
    setErrores((actual) => ({ ...actual, blanda: '' }));
    setMensajeExito('');

    try {
      await persistirSoftSkills(nuevasBlandas);
      setSkillBlandaNueva('');
      setIndiceBlandaEditando(null);
      setMostrandoAgregarBlanda(false);
      setErrores({});
      setMensajeExito(
        indiceBlandaEditando !== null
          ? 'Habilidad blanda actualizada correctamente.'
          : 'Habilidad blanda agregada correctamente.',
      );
    } catch (error) {
      setBlandas(blandasPrevias);
      actualizarCacheSkills(tecnicas, blandasPrevias);
      setErrores({ blanda: extractApiMessageByStatus(error, 'No se pudo guardar la habilidad blanda.') });
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
    const blandasPrevias = blandas;

    setBlandas(nuevasBlandas);
    actualizarCacheSkills(tecnicas, nuevasBlandas);
    setErrores((actual) => ({ ...actual, blanda: '' }));
    setMensajeExito('');

    try {
      await persistirSoftSkills(nuevasBlandas);
      setMensajeExito('Habilidad blanda eliminada correctamente.');
    } catch (error) {
      setBlandas(blandasPrevias);
      actualizarCacheSkills(tecnicas, blandasPrevias);
      setErrores({ blanda: extractApiMessageByStatus(error, 'No se pudo eliminar la habilidad blanda.') });
    }
  };

  const agregarDesdeSugerencia = async (skill) => {
    if (blandas.some((actual) => actual.toLowerCase() === skill.toLowerCase())) {
      return;
    }

    const nuevasBlandas = [...blandas, skill];
    const blandasPrevias = blandas;

    setBlandas(nuevasBlandas);
    actualizarCacheSkills(tecnicas, nuevasBlandas);
    setErrores((actual) => ({ ...actual, blanda: '' }));
    setMensajeExito('');

    try {
      await persistirSoftSkills(nuevasBlandas);
      setMensajeExito('Habilidad sugerida agregada correctamente.');
    } catch (error) {
      setBlandas(blandasPrevias);
      actualizarCacheSkills(tecnicas, blandasPrevias);
      setErrores({ blanda: extractApiMessageByStatus(error, 'No se pudo agregar la habilidad sugerida.') });
    }
  };

  return (
    <>
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
            className="softsave-portafolio-module-card__action softsave-portafolio-module-card__action--secondary"
            aria-label="Editar habilidades"
            onClick={alternarEdicion}
          >
            <Icon path={mdiPencilOutline} size={ICON_SIZES.action} />
          </button>
        </div>
      </div>

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
                  {isEditing ? (
                    <input
                      type="text"
                      value={nombresTecnicosEditando[skill.id] ?? skill.name}
                      onChange={(evento) => {
                        setNombresTecnicosEditando((actual) => ({
                          ...actual,
                          [skill.id]: evento.target.value,
                        }));
                        setErrores((actual) => ({ ...actual, tecnica: '' }));
                        setMensajeExito('');
                      }}
                      onBlur={() => confirmarEdicionNombreTecnico(skill.id)}
                      onKeyDown={(evento) => {
                        if (evento.key === 'Enter') {
                          evento.preventDefault();
                          evento.currentTarget.blur();
                        }
                      }}
                      className="softsave-input softsave-profile__input softsave-portafolio-skills__name-input"
                      aria-label={`Nombre de la habilidad técnica ${skill.name}`}
                    />
                  ) : (
                    <span className="softsave-portafolio-skills__name">{skill.name}</span>
                  )}
                  <div className="softsave-portafolio-skills__level-wrap">
                    {isEditing ? (
                      <>
                        <select
                          value={skill.level}
                          onChange={(evento) => cambiarNivel(skill.id, evento.target.value)}
                          className="softsave-input softsave-portafolio-skills__select"
                        >
                          {NIVELES_TECNICOS.map((nivel) => (
                            <option key={nivel} value={nivel}>{nivel}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="softsave-portafolio-module-card__action softsave-portafolio-module-card__action--secondary softsave-portafolio-skills__tech-remove"
                          aria-label={`Guardar habilidad técnica ${skill.name}`}
                          onClick={() => confirmarEdicionNombreTecnico(skill.id)}
                        >
                          <Icon path={mdiContentSaveOutline} size={ICON_SIZES.action} />
                        </button>
                        <button
                          type="button"
                          className="softsave-portafolio-module-card__action softsave-portafolio-module-card__action--secondary softsave-portafolio-skills__tech-remove"
                          aria-label={`Eliminar habilidad técnica ${skill.name}`}
                          onClick={() => solicitarEliminarHabilidadTecnica(skill)}
                        >
                          <Icon path={mdiDeleteOutline} size={ICON_SIZES.action} />
                        </button>
                      </>
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

          {(isAdding || isEditing) && mostrandoAgregarBlanda ? (
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
                {SUGERENCIAS_BLANDAS
                  .filter((skill) => !blandas.some((actual) => actual.toLowerCase() === skill.toLowerCase()))
                  .map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    className="softsave-portafolio-skills__suggestion"
                    onClick={() => agregarDesdeSugerencia(skill)}
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

      {tecnicaPendienteEliminar ? (
        <div className="softsave-profile__modal-overlay softsave-profile__modal-overlay--centered" role="dialog" aria-modal="true" onClick={cerrarModalEliminarTecnica}>
          <div className="softsave-profile__modal softsave-profile__modal--confirm" onClick={(evento) => evento.stopPropagation()}>
            <header className="softsave-profile__modal-header">
              <div className="softsave-profile__modal-content">
                <h3 className="softsave-profile__modal-title">Eliminar habilidad técnica</h3>
                <p className="softsave-profile__modal-text">
                  Esta acción eliminará "{tecnicaPendienteEliminar.name}" de tu portafolio.
                </p>
              </div>
            </header>

            <div className="softsave-profile__modal-actions">
              <button
                type="button"
                className="softsave-profile__secondary-button softsave-profile__secondary-button--modal"
                onClick={cerrarModalEliminarTecnica}
                disabled={eliminandoTecnica}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="softsave-profile__danger-button"
                onClick={confirmarEliminarHabilidadTecnica}
                disabled={eliminandoTecnica}
              >
                {eliminandoTecnica ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </>
  );
}

export default PortfolioSkillsSection;
