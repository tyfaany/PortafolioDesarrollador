import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  getMe,
  login as loginService,
  logout as logoutService,
  registrar as registrarService,
} from '../services/authService';

const AuthContext = createContext();
const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;
const LAST_ACTIVITY_KEY = 'last_activity_at';
const TOKEN_KEY = 'token';
const ACTIVITY_EVENTS = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimerRef = useRef(null);

  const inicializarSesion = useCallback((token) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
  }, []);

  const limpiarSesion = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const cargarUsuarioAutenticado = useCallback(async () => {
    const respuesta = await getMe();
    const usuarioCompleto = respuesta.data;
    setUser(usuarioCompleto);
    return usuarioCompleto;
  }, []);

  // Verificar si hay token al iniciar la app
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      cargarUsuarioAutenticado()
        .catch(() => {
          limpiarSesion();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [cargarUsuarioAutenticado, limpiarSesion]);

  useEffect(() => {
    const manejarStorage = (event) => {
      if (event.key === TOKEN_KEY) {
        const tokenActual = event.newValue;
        if (!tokenActual) {
          setUser(null);
        } else {
          cargarUsuarioAutenticado().catch(() => {
            limpiarSesion();
          });
        }
      }
    };

    window.addEventListener('storage', manejarStorage);
    return () => window.removeEventListener('storage', manejarStorage);
  }, [cargarUsuarioAutenticado, limpiarSesion]);

  const detenerInactividad = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  const cerrarSesionPorInactividad = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    setUser(null);
    sessionStorage.setItem('session_expired', 'true');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }, []);

  const reiniciarInactividad = useCallback(() => {
    detenerInactividad();
    const ultimoRegistro = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || Date.now());
    const transcurrido = Date.now() - ultimoRegistro;
    const restante = Math.max(0, INACTIVITY_LIMIT_MS - transcurrido);
    inactivityTimerRef.current = setTimeout(cerrarSesionPorInactividad, restante);
  }, [cerrarSesionPorInactividad, detenerInactividad]);

  const registrarActividad = useCallback(() => {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    reiniciarInactividad();
  }, [reiniciarInactividad]);

  // Login con opcion de recordar sesion
  const login = async (email, password, recordarme = false) => {
    const response = await loginService(email, password, recordarme);

    const { token } = response.data;

    inicializarSesion(token);
    return cargarUsuarioAutenticado();
  };

  // Registrar nuevo usuario y guardar sesion automaticamente
  const registrar = async (nombre, email, password, passwordConfirmacion) => {
    const respuesta = await registrarService(nombre, email, password, passwordConfirmacion);
    const { token } = respuesta.data;
    inicializarSesion(token);
    return cargarUsuarioAutenticado();
  };

  // Logout
  const logout = async () => {
    try {
      await logoutService();
    } catch {
      // El backend puede fallar al cerrar sesion, pero se limpia el token igual
    }

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    setUser(null);
  };

  const refreshUser = async () => {
    await cargarUsuarioAutenticado();
  };

  useEffect(() => {
    if (!user) {
      detenerInactividad();
      return undefined;
    }

    if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    }

    reiniciarInactividad();
    ACTIVITY_EVENTS.forEach((evento) => {
      window.addEventListener(evento, registrarActividad, { passive: true });
    });

    return () => {
      ACTIVITY_EVENTS.forEach((evento) => {
        window.removeEventListener(evento, registrarActividad);
      });
      detenerInactividad();
    };
  }, [detenerInactividad, registrarActividad, reiniciarInactividad, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        registrar,
        logout,
        refreshUser,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export { AuthContext };
