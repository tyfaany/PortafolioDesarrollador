import { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from '@mdi/react';
import { mdiClose, mdiContentSaveOutline, mdiDeleteOutline, mdiOpenInNew, mdiPencilOutline, mdiPlus, mdiViewGridOutline } from '@mdi/js';
import CatalogSearchInput from './CatalogSearchInput';
import DropdownSelect from './DropdownSelect';
import CharacterCounter from './CharacterCounter';
import useAuth from '../hooks/useAuth';
import useFeedback from '../hooks/useFeedback';
import {
  obtenerCatalogoSoftSkills,
  obtenerCatalogoSkillsTecnicas,
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

function sanitizarTexto(valor) {
  return String(valor || '').replace(/\s+/g, ' ').trim();
}

function sanitizarUrl(valor) {
  return String(valor || '').trim();
}

function esUrlValida(valor) {
  if (!valor) {
    return true;
  }

  try {
    const url = new URL(valor);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
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
          evidence_url: '',
        };
      }

      if (skill && typeof skill === 'object') {
        return {
          id: skill.id || `tech-${indice}-${skill.name || skill.label || 'skill'}`,
          name: sanitizarTexto(skill.name || skill.label || ''),
          level: normalizarNivel(skill.level || skill.pivot?.level || 'Intermedio'),
          evidence_url: sanitizarUrl(skill.evidence_url || skill.pivot?.evidence_url || ''),
        };
      }

      return null;
    })
    .filter((skill) => skill?.name);
}

function normalizarCatalogoSkillsTecnicas(skills) {
  if (!Array.isArray(skills)) {
    return [];
  }

  return skills
    .map((skill, indice) => {
      if (typeof skill === 'string') {
        const name = sanitizarTexto(skill);
        if (!name) {
          return null;
        }

        return {
          id: `catalog-tech-${indice}-${name}`,
          name,
        };
      }

      if (skill && typeof skill === 'object') {
        const name = sanitizarTexto(skill.name || skill.label || skill.title || skill.value || '');
        if (!name) {
          return null;
        }

        return {
          id: skill.id || `catalog-tech-${indice}-${name}`,
          name,
        };
      }

      return null;
    })
    .filter(Boolean);
}

function normalizarHabilidadesBlandas(skills) {
  if (!Array.isArray(skills)) {
    return [];
  }

  const blandasNormalizadas = skills
    .map((skill, indice) => {
      if (typeof skill === 'string') {
        const name = sanitizarTexto(skill);
        if (!name) {
          return null;
        }

        return {
          id: `soft-${indice}-${name}`,
          name,
          evidence_url: '',
        };
      }

      if (skill && typeof skill === 'object') {
        const name = sanitizarTexto(skill.name || skill.label || '');
        if (!name) {
          return null;
        }

        return {
          id: skill.id || `soft-${indice}-${name}`,
          name,
          evidence_url: sanitizarUrl(skill.evidence_url || skill.pivot?.evidence_url || ''),
        };
      }

      return null;
    })
    .filter(Boolean);

  const unicas = new Map();
  blandasNormalizadas.forEach((skill) => {
    const key = skill.name.toLowerCase();
    if (!unicas.has(key)) {
      unicas.set(key, skill);
    }
  });

  return [...unicas.values()];
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
  const [catalogoTecnico, setCatalogoTecnico] = useState([]);
  const [catalogoBlando, setCatalogoBlando] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [mostrandoAgregarBlanda, setMostrandoAgregarBlanda] = useState(false);
  const [skillTecnicaNueva, setSkillTecnicaNueva] = useState('');
  const [skillTecnicaSeleccionada, setSkillTecnicaSeleccionada] = useState(null);
  const [nivelNuevo, setNivelNuevo] = useState('Intermedio');
  const [evidenciaTecnicaNueva, setEvidenciaTecnicaNueva] = useState('');
  const [tecnicasSeleccionadasEditando, setTecnicasSeleccionadasEditando] = useState({});
  const [skillBlandaNueva, setSkillBlandaNueva] = useState('');
  const [skillBlandaSeleccionada, setSkillBlandaSeleccionada] = useState(null);
  const [evidenciaBlandaNueva, setEvidenciaBlandaNueva] = useState('');
  const [indiceBlandaEditando, setIndiceBlandaEditando] = useState(null);
  const [nombresTecnicosEditando, setNombresTecnicosEditando] = useState({});
  const [evidenciasTecnicasEditando, setEvidenciasTecnicasEditando] = useState({});
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
    let sigueMontado = true;

    obtenerCatalogoSkillsTecnicas()
      .then((respuesta) => {
        if (!sigueMontado) {
          return;
        }

        setCatalogoTecnico(normalizarCatalogoSkillsTecnicas(respuesta?.data));
      })
      .catch(() => {
        if (sigueMontado) {
          setCatalogoTecnico([]);
        }
      });

    return () => {
      sigueMontado = false;
    };
  }, []);

  useEffect(() => {
    let sigueMontado = true;

    obtenerCatalogoSoftSkills()
      .then((respuesta) => {
        if (!sigueMontado) {
          return;
        }

        setCatalogoBlando(normalizarCatalogoSkillsTecnicas(respuesta?.data));
      })
      .catch(() => {
        if (sigueMontado) {
          setCatalogoBlando([]);
        }
      });

    return () => {
      sigueMontado = false;
    };
  }, []);

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
        setEvidenciasTecnicasEditando(
          tecnicas.reduce((acumulado, skill) => ({ ...acumulado, [skill.id]: skill.evidence_url || '' }), {}),
        );
        setTecnicasSeleccionadasEditando(
          tecnicas.reduce((acumulado, skill) => {
            const match = catalogoTecnico.find((item) => String(item.id) === String(skill.id))
              || { id: skill.id, name: skill.name };
            return { ...acumulado, [skill.id]: match };
          }, {}),
        );
      } else {
        setMostrandoAgregarBlanda(false);
        setSkillBlandaNueva('');
        setSkillBlandaSeleccionada(null);
        setEvidenciaBlandaNueva('');
        setIndiceBlandaEditando(null);
        setNombresTecnicosEditando({});
        setEvidenciasTecnicasEditando({});
        setTecnicasSeleccionadasEditando({});
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
        setSkillTecnicaSeleccionada(null);
        setNivelNuevo('Intermedio');
        setEvidenciaTecnicaNueva('');
        setSkillBlandaNueva('');
        setSkillBlandaSeleccionada(null);
        setEvidenciaBlandaNueva('');
        setIndiceBlandaEditando(null);
        setNombresTecnicosEditando({});
        setEvidenciasTecnicasEditando({});
        setTecnicasSeleccionadasEditando({});
      } else {
        setIsEditing(false);
        setMostrandoAgregarBlanda(false);
        setIndiceBlandaEditando(null);
        setNombresTecnicosEditando({});
        setEvidenciasTecnicasEditando({});
        setTecnicasSeleccionadasEditando({});
        setSkillTecnicaNueva('');
        setSkillTecnicaSeleccionada(null);
        setNivelNuevo('Intermedio');
        setEvidenciaTecnicaNueva('');
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
      id: skill.id,
      level: normalizarNivel(skill.level).normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      evidence_url: sanitizarUrl(skill.evidence_url) || null,
    }));
    await sincronizarSkillsTecnicas(payload);
    return true;
  };

  const persistirSoftSkills = async (blandasActuales) => {
    if (blandasActuales.some((skill) => !skill?.id)) {
      setErrores({ blanda: 'Selecciona habilidades blandas desde el catálogo.' });
      return false;
    }

    const payload = blandasActuales.map((skill) => ({
      id: skill.id,
      evidence_url: sanitizarUrl(skill.evidence_url) || null,
    }));
    await sincronizarSoftSkills(payload);
    return true;
  };

  const agregarHabilidadTecnica = async () => {
    const nombre = sanitizarTexto(skillTecnicaNueva);
    const tecnicaCatalogo = skillTecnicaSeleccionada
      || catalogoTecnico.find((skill) => skill.name.toLowerCase() === nombre.toLowerCase());

    if (!tecnicaCatalogo?.id || !nombre) {
      setErrores({ tecnica: 'Selecciona una habilidad del catálogo de habilidades técnicas.' });
      return;
    }

    if (!nivelNuevo) {
      setErrores({ tecnica: 'Selecciona un nivel de dominio.' });
      return;
    }

    if (!esUrlValida(evidenciaTecnicaNueva)) {
      setErrores({ tecnica: 'Ingresa una URL válida para la evidencia técnica.' });
      return;
    }

    if (tecnicas.some((skill) => String(skill.id) === String(tecnicaCatalogo.id))) {
      setErrores({ tecnica: 'Esa habilidad técnica ya existe.' });
      return;
    }

    const nuevasTecnicas = [
      ...tecnicas,
      {
        id: tecnicaCatalogo.id,
        name: tecnicaCatalogo.name,
        level: nivelNuevo,
        evidence_url: sanitizarUrl(evidenciaTecnicaNueva),
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
      setSkillTecnicaSeleccionada(null);
      setNivelNuevo('Intermedio');
      setEvidenciaTecnicaNueva('');
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
      setEvidenciasTecnicasEditando((actual) => {
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

    const nombreEditado = sanitizarTexto(nombresTecnicosEditando[id] ?? '');
    const skillSeleccionada = tecnicasSeleccionadasEditando[id] || null;
    const evidenciaEditada = sanitizarUrl(evidenciasTecnicasEditando[id] ?? (skillActual.evidence_url || ''));
    if (!skillSeleccionada?.id || !nombreEditado) {
      setErrores({ tecnica: 'Selecciona una habilidad del catálogo técnico.' });
      return;
    }

    if (!esUrlValida(evidenciaEditada)) {
      setErrores({ tecnica: 'Ingresa una URL válida para la evidencia técnica.' });
      setEvidenciasTecnicasEditando((actual) => ({ ...actual, [id]: skillActual.evidence_url || '' }));
      return;
    }

    const nombreDuplicado = tecnicas.some(
      (skill) => String(skill.id) !== String(id) && String(skill.id) === String(skillSeleccionada.id),
    );
    if (nombreDuplicado) {
      setErrores({ tecnica: 'Esa habilidad técnica ya existe.' });
      return;
    }

    if (String(skillSeleccionada.id) === String(skillActual.id) && evidenciaEditada === sanitizarUrl(skillActual.evidence_url)) {
      setEvidenciasTecnicasEditando((actual) => ({ ...actual, [id]: skillActual.evidence_url || '' }));
      return;
    }

    const tecnicasPrevias = tecnicas;
    const tecnicasActualizadas = tecnicas.map(
      (skill) => (String(skill.id) === String(id)
        ? {
          ...skill,
          id: skillSeleccionada.id,
          name: skillSeleccionada.name || nombreEditado,
          evidence_url: evidenciaEditada,
        }
        : skill),
    );

    setTecnicas(tecnicasActualizadas);
    actualizarCacheSkills(tecnicasActualizadas, blandas);
    setErrores((actual) => ({ ...actual, tecnica: '' }));
    setMensajeExito('');
    setEvidenciasTecnicasEditando((actual) => ({ ...actual, [id]: evidenciaEditada }));

    try {
      const persistido = await persistirSkillsTecnicas(tecnicasActualizadas);
      if (!persistido) {
        setTecnicas(tecnicasPrevias);
        actualizarCacheSkills(tecnicasPrevias, blandas);
        setNombresTecnicosEditando((actual) => ({ ...actual, [id]: skillActual.name }));
        setTecnicasSeleccionadasEditando((actual) => ({ ...actual, [id]: skillActual }));
        setEvidenciasTecnicasEditando((actual) => ({ ...actual, [id]: skillActual.evidence_url || '' }));
        return;
      }
      setMensajeExito('Habilidad técnica actualizada correctamente.');
    } catch (error) {
      setTecnicas(tecnicasPrevias);
      actualizarCacheSkills(tecnicasPrevias, blandas);
      setNombresTecnicosEditando((actual) => ({ ...actual, [id]: skillActual.name }));
      setTecnicasSeleccionadasEditando((actual) => ({ ...actual, [id]: skillActual }));
      setEvidenciasTecnicasEditando((actual) => ({ ...actual, [id]: skillActual.evidence_url || '' }));
      setErrores({ tecnica: extractApiMessageByStatus(error, 'No se pudo actualizar la habilidad técnica.') });
    }
  };

  const guardarBlanda = async () => {
    const nombre = sanitizarTexto(skillBlandaNueva);
    const skillCatalogo = skillBlandaSeleccionada;

    if (!skillCatalogo?.id || !nombre) {
      setErrores({ blanda: 'Selecciona una habilidad blanda del catálogo.' });
      return;
    }

    const evidencia = sanitizarUrl(evidenciaBlandaNueva);
    if (!esUrlValida(evidencia)) {
      setErrores({ blanda: 'Ingresa una URL válida para la evidencia blanda.' });
      return;
    }

    const duplicada = blandas.some((skill, indice) =>
      String(skill.id) === String(skillCatalogo.id) && indice !== indiceBlandaEditando);

    if (duplicada) {
      setErrores({ blanda: 'Esa habilidad blanda ya existe.' });
      return;
    }

    if (
      indiceBlandaEditando !== null
      && String(blandas[indiceBlandaEditando]?.id) === String(skillCatalogo.id)
      && sanitizarUrl(blandas[indiceBlandaEditando]?.evidence_url) === evidencia
    ) {
      setErrores((actual) => ({ ...actual, blanda: '' }));
      setMensajeExito('');
      setSkillBlandaNueva('');
      setSkillBlandaSeleccionada(null);
      setEvidenciaBlandaNueva('');
      setIndiceBlandaEditando(null);
      setMostrandoAgregarBlanda(false);
      return;
    }

    const nuevasBlandas = indiceBlandaEditando !== null
      ? blandas.map((skill, indice) => (indice === indiceBlandaEditando
        ? { ...skill, id: skillCatalogo.id, name: skillCatalogo.name, evidence_url: evidencia }
        : skill))
      : [...blandas, { id: skillCatalogo.id, name: skillCatalogo.name, evidence_url: evidencia }];
    const blandasPrevias = blandas;

    setBlandas(nuevasBlandas);
    actualizarCacheSkills(tecnicas, nuevasBlandas);
    setErrores((actual) => ({ ...actual, blanda: '' }));
    setMensajeExito('');

    try {
      const persistido = await persistirSoftSkills(nuevasBlandas);
      if (!persistido) {
        setBlandas(blandasPrevias);
        actualizarCacheSkills(tecnicas, blandasPrevias);
        return;
      }
      setSkillBlandaNueva('');
      setSkillBlandaSeleccionada(null);
      setEvidenciaBlandaNueva('');
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
    setSkillBlandaNueva(skill.name);
    setSkillBlandaSeleccionada(
      catalogoBlando.find((item) => String(item.id) === String(skill.id)) || null,
    );
    setEvidenciaBlandaNueva(skill.evidence_url || '');
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

  return (
    <>
      <section className="softsave-portafolio-module-card">
        <div className="softsave-portafolio-module-card__header">
          <div className="softsave-portafolio-module-card__title-wrap">
            <Icon
              path={mdiViewGridOutline}
              size={ICON_SIZES.section}
              className="softsave-portafolio-module-card__icon"
            />
            <h2 className="softsave-portafolio-module-card__title">
              Habilidades
            </h2>
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
            <h3 className="softsave-portafolio-skills__heading">
              Habilidades técnicas
            </h3>

            {tecnicas.length > 0 ? (
              <div className="softsave-portafolio-skills__table">
                <div className="softsave-portafolio-skills__table-head">
                  <span>Habilidad</span>
                  <span>Nivel</span>
                </div>

                {tecnicas.map((skill) => (
                  <div
                    key={skill.id}
                    className="softsave-portafolio-skills__row"
                  >
                    {isEditing ? (
                      <div className="softsave-portafolio-skills__name-edit-wrap">
                        <CatalogSearchInput
                          label="Habilidad"
                          catalog={catalogoTecnico}
                          value={nombresTecnicosEditando[skill.id] ?? ''}
                          onChange={(valor) => {
                            const texto = sanitizarTexto(valor);
                            setTecnicasSeleccionadasEditando((actual) => ({
                              ...actual,
                              [skill.id]: null,
                            }));
                            setNombresTecnicosEditando((actual) => ({
                              ...actual,
                              [skill.id]: texto,
                            }));
                            setErrores((actual) => ({ ...actual, tecnica: '' }));
                            setMensajeExito('');
                          }}
                          onSelect={(skillCatalogo) => {
                            const nombreCatalogo = sanitizarTexto(skillCatalogo?.name || '');
                            setTecnicasSeleccionadasEditando((actual) => ({
                              ...actual,
                              [skill.id]: skillCatalogo?.raw || skillCatalogo || null,
                            }));
                            setNombresTecnicosEditando((actual) => ({
                              ...actual,
                              [skill.id]: nombreCatalogo,
                            }));
                            setErrores((actual) => ({ ...actual, tecnica: '' }));
                            setMensajeExito('');
                          }}
                          placeholder="Buscar una habilidad técnica..."
                          emptyText="No hay coincidencias en el catálogo de habilidades técnicas."
                          helperText=""
                          required
                        />
                        <div className="softsave-input-field__header">
                          <span className="softsave-portafolio-job-form__sub-label">
                            Enlace de evidencia (opcional)
                          </span>
                          <CharacterCounter
                            value={evidenciasTecnicasEditando[skill.id] ?? (skill.evidence_url || '')}
                            maxLength={255}
                          />
                        </div>
                        <input
                          type="url"
                          value={
                            evidenciasTecnicasEditando[skill.id] ??
                            (skill.evidence_url || "")
                          }
                          maxLength={255}
                          onChange={(evento) => {
                            setEvidenciasTecnicasEditando((actual) => ({
                              ...actual,
                              [skill.id]: evento.target.value,
                            }));
                            setErrores((actual) => ({
                              ...actual,
                              tecnica: "",
                            }));
                            setMensajeExito("");
                          }}
                          onBlur={() => confirmarEdicionNombreTecnico(skill.id)}
                          className="softsave-input softsave-profile__input softsave-portafolio-skills__evidence-input"
                          placeholder="URL de evidencia (opcional)"
                          aria-label={`Enlace de evidencia para ${skill.name}`}
                        />
                      </div>
                    ) : (
                      <div className="softsave-portafolio-skills__name-wrap">
                        <span className="softsave-portafolio-skills__name">
                          {skill.name}
                        </span>
                        {skill.evidence_url ? (
                          <a
                            href={skill.evidence_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="softsave-portafolio-skills__evidence-link"
                            aria-label={`Ver evidencia de ${skill.name}`}
                          >
                            <Icon path={mdiOpenInNew} size={0.72} />
                          </a>
                        ) : null}
                      </div>
                    )}
                    <div className="softsave-portafolio-skills__level-wrap">
                      {isEditing ? (
                        <>
                          <DropdownSelect
                            value={skill.level}
                            onChange={(nivel) => cambiarNivel(skill.id, nivel)}
                            options={NIVELES_TECNICOS}
                            ariaLabel={`Nivel de ${skill.name}`}
                            className="softsave-portafolio-skills__select"
                          />
                          <button
                            type="button"
                            className="softsave-portafolio-module-card__action softsave-portafolio-module-card__action--secondary softsave-portafolio-skills__tech-remove"
                            aria-label={`Guardar habilidad técnica ${skill.name}`}
                            onClick={() =>
                              confirmarEdicionNombreTecnico(skill.id)
                            }
                          >
                            <Icon
                              path={mdiContentSaveOutline}
                              size={ICON_SIZES.action}
                            />
                          </button>
                          <button
                            type="button"
                            className="softsave-portafolio-module-card__action softsave-portafolio-module-card__action--secondary softsave-portafolio-skills__tech-remove"
                            aria-label={`Eliminar habilidad técnica ${skill.name}`}
                            onClick={() =>
                              solicitarEliminarHabilidadTecnica(skill)
                            }
                          >
                            <Icon
                              path={mdiDeleteOutline}
                              size={ICON_SIZES.action}
                            />
                          </button>
                        </>
                      ) : (
                        <>
                          <span
                            className={`softsave-portafolio-skills__badge ${obtenerClaseNivel(skill.level)}`}
                          >
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
                <h4 className="softsave-portafolio-skills__subheading">
                  Agregar nueva habilidad
                </h4>
                <div className="softsave-portafolio-skills__form-grid">
                  <CatalogSearchInput
                    label="Habilidad"
                  catalog={catalogoTecnico}
                  value={skillTecnicaNueva}
                  onChange={(valor) => {
                    setSkillTecnicaNueva(valor);
                    setSkillTecnicaSeleccionada(null);
                    setErrores((actual) => ({ ...actual, tecnica: "" }));
                    setMensajeExito("");
                  }}
                  onSelect={(skillCatalogo) => {
                    setSkillTecnicaNueva(skillCatalogo?.name || "");
                    setSkillTecnicaSeleccionada(skillCatalogo?.raw || skillCatalogo || null);
                    setErrores((actual) => ({ ...actual, tecnica: "" }));
                    setMensajeExito("");
                  }}
                    placeholder="Buscar una habilidad técnica..."
                    emptyText="No hay coincidencias en el catálogo de habilidades técnicas."
                    helperText="Selecciona una habilidad del catálogo de habilidades técnicas."
                    error={errores.tecnica}
                    required
                  />

                  <label className="softsave-profile__field">
                    <span className="softsave-portafolio-job-form__sub-label">
                      Nivel
                    </span>
                    <DropdownSelect
                      value={nivelNuevo}
                      onChange={(nivel) => {
                        setNivelNuevo(nivel);
                        setMensajeExito('');
                      }}
                      options={NIVELES_TECNICOS}
                      ariaLabel="Nivel de la nueva habilidad"
                      className="softsave-profile__input"
                    />
                  </label>

                  <label className="softsave-profile__field softsave-portafolio-skills__evidence-field">
                    <div className="softsave-input-field__header">
                      <span className="softsave-portafolio-job-form__sub-label">
                        Enlace de evidencia (opcional)
                      </span>
                      <CharacterCounter value={evidenciaTecnicaNueva} maxLength={255} />
                    </div>
                    <input
                      type="url"
                      value={evidenciaTecnicaNueva}
                      maxLength={255}
                      onChange={(evento) => {
                        setEvidenciaTecnicaNueva(evento.target.value);
                        setErrores((actual) => ({ ...actual, tecnica: "" }));
                      }}
                      className="softsave-input softsave-profile__input"
                      placeholder="https://ejemplo.com/certificado"
                    />
                  </label>
                </div>

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
            <h3 className="softsave-portafolio-skills__heading">
              Habilidades blandas
            </h3>

            <div className="softsave-portafolio-skills__chips">
              {blandas.map((skill, indice) => (
                <button
                  key={`${skill.name}-${indice}`}
                  type="button"
                  className={`softsave-portafolio-skills__chip ${isEditing ? "is-editing" : ""}`}
                  onClick={() =>
                    isEditing ? editarBlanda(skill, indice) : undefined
                  }
                >
                  <span>{skill.name}</span>
                  {!isEditing && skill.evidence_url ? (
                    <a
                      href={skill.evidence_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="softsave-portafolio-skills__chip-link"
                      aria-label={`Ver evidencia de ${skill.name}`}
                      onClick={(evento) => evento.stopPropagation()}
                    >
                      <Icon path={mdiOpenInNew} size={ICON_SIZES.chipRemove} />
                    </a>
                  ) : null}
                  {isEditing ? (
                    <button
                      type="button"
                      className="softsave-portafolio-skills__chip-remove"
                      aria-label={`Eliminar habilidad blanda ${skill.name}`}
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
                    setSkillBlandaNueva("");
                    setSkillBlandaSeleccionada(null);
                    setEvidenciaBlandaNueva("");
                    setErrores((actual) => ({ ...actual, blanda: "" }));
                    setMensajeExito("");
                  }}
                >
                  + Agregar
                </button>
              ) : null}
            </div>

            {(isAdding || isEditing) && mostrandoAgregarBlanda ? (
              <div className="softsave-portafolio-skills__soft-form">
                <CatalogSearchInput
                  label="Habilidad blanda"
                  catalog={catalogoBlando}
                  value={skillBlandaNueva}
                  onChange={(valor) => {
                    setSkillBlandaNueva(valor);
                    setSkillBlandaSeleccionada(null);
                    setErrores((actual) => ({ ...actual, blanda: '' }));
                    setMensajeExito('');
                  }}
                  onSelect={(skillCatalogo) => {
                    setSkillBlandaNueva(skillCatalogo?.name || '');
                    setSkillBlandaSeleccionada(skillCatalogo?.raw || skillCatalogo || null);
                    setErrores((actual) => ({ ...actual, blanda: '' }));
                    setMensajeExito('');
                  }}
                  placeholder="Buscar una habilidad blanda..."
                  emptyText="No hay coincidencias en el catálogo de habilidades blandas."
                  helperText="Selecciona una habilidad del catálogo de habilidades blandas."
                  error={errores.blanda}
                  required
                />
                <CharacterCounter value={evidenciaBlandaNueva} maxLength={255} />
                <input
                  type="url"
                  value={evidenciaBlandaNueva}
                  maxLength={255}
                  onChange={(evento) => {
                    setEvidenciaBlandaNueva(evento.target.value);
                    setErrores((actual) => ({ ...actual, blanda: "" }));
                    setMensajeExito("");
                  }}
                  className="softsave-input softsave-profile__input"
                  placeholder="URL de evidencia (opcional)"
                />
                <div className="softsave-profile__modal-actions">
                  <button
                    type="button"
                    className="softsave-profile__secondary-button softsave-profile__secondary-button--modal"
                    onClick={() => {
                      setMostrandoAgregarBlanda(false);
                      setSkillBlandaNueva("");
                      setSkillBlandaSeleccionada(null);
                      setEvidenciaBlandaNueva("");
                      setIndiceBlandaEditando(null);
                      setErrores((actual) => ({ ...actual, blanda: "" }));
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="softsave-button softsave-button--compact"
                    onClick={guardarBlanda}
                  >
                    Guardar
                  </button>
                </div>
              </div>
            ) : null}

          </section>
        </div>
      </section>

      {tecnicaPendienteEliminar ? (
        <div
          className="softsave-profile__modal-overlay softsave-profile__modal-overlay--centered"
          role="dialog"
          aria-modal="true"
          onClick={cerrarModalEliminarTecnica}
        >
          <div
            className="softsave-profile__modal softsave-profile__modal--confirm"
            onClick={(evento) => evento.stopPropagation()}
          >
            <header className="softsave-profile__modal-header">
              <div className="softsave-profile__modal-content">
                <h3 className="softsave-profile__modal-title">
                  Eliminar habilidad técnica
                </h3>
                <p className="softsave-profile__modal-text">
                  Esta acción eliminará &quot;{tecnicaPendienteEliminar.name}
                  &quot; de tu portafolio.
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
                {eliminandoTecnica ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default PortfolioSkillsSection;
