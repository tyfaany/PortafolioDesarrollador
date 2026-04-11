import { createContext, useEffect, useRef, useState } from 'react';
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
const ACTIVITY_EVENTS = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimerRef = useRef(null);

  // Verificar si hay token al iniciar la app
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      getMe()
        .then((response) => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const manejarStorage = (event) => {
      if (event.key === 'token') {
        const tokenActual = event.newValue;
        if (!tokenActual) {
          setUser(null);
        } else {
          getMe()
            .then((response) => {
              setUser(response.data);
            })
            .catch(() => {
              localStorage.removeItem('token');
              setUser(null);
            });
        }
      }
    };

    window.addEventListener('storage', manejarStorage);
    return () => window.removeEventListener('storage', manejarStorage);
  }, []);

  const detenerInactividad = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  };

  const cerrarSesionPorInactividad = () => {
    localStorage.removeItem('token');
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    setUser(null);
    sessionStorage.setItem('session_expired', 'true');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  };

  const reiniciarInactividad = () => {
    detenerInactividad();
    const ultimoRegistro = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || Date.now());
    const transcurrido = Date.now() - ultimoRegistro;
    const restante = Math.max(0, INACTIVITY_LIMIT_MS - transcurrido);
    inactivityTimerRef.current = setTimeout(cerrarSesionPorInactividad, restante);
  };

  const registrarActividad = () => {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    reiniciarInactividad();
  };

  // Login con opcion de recordar sesion
  const login = async (email, password, recordarme = false) => {
    const response = await loginService(email, password, recordarme);

    const { token } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    const perfilRespuesta = await getMe();
    const usuarioCompleto = perfilRespuesta.data;
    setUser(usuarioCompleto);

    return usuarioCompleto;
  };

  // Registrar nuevo usuario y guardar sesion automaticamente
  const registrar = async (nombre, email, password, passwordConfirmacion) => {
    const respuesta = await registrarService(nombre, email, password, passwordConfirmacion);
    const { token } = respuesta.data;
    localStorage.setItem('token', token);
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    const perfilRespuesta = await getMe();
    const usuarioCompleto = perfilRespuesta.data;
    setUser(usuarioCompleto);
    return usuarioCompleto;
  };

  // Logout
  const logout = async () => {
    try {
      await logoutService();
    } catch (error) {
      // El backend puede fallar al cerrar sesion, pero se limpia el token igual
    }

    localStorage.removeItem('token');
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    setUser(null);
  };

  const refreshUser = async () => {
    const respuesta = await getMe();
    setUser(respuesta.data);
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
  }, [user]);

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
