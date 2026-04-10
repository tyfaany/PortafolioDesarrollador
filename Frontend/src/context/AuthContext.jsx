import { createContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  getMe,
  login as loginService,
  logout as logoutService,
  registrar as registrarService,
} from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // Login con opcion de recordar sesion
  const login = async (email, password, recordarme = false) => {
    const response = await loginService(email, password, recordarme);

    const { token, user } = response.data;

    localStorage.setItem('token', token);
    setUser(user);

    return user;
  };

  // Registrar nuevo usuario y guardar sesion automaticamente
  const registrar = async (nombre, email, password, passwordConfirmacion) => {
    const respuesta = await registrarService(nombre, email, password, passwordConfirmacion);
    const { token, user: usuario } = respuesta.data;
    localStorage.setItem('token', token);
    setUser(usuario);
    return usuario;
  };

  // Logout
  const logout = async () => {
    try {
      await logoutService();
    } catch (error) {
      // El backend puede fallar al cerrar sesion, pero se limpia el token igual
    }

    localStorage.removeItem('token');
    setUser(null);
  };

  const refreshUser = async () => {
    const respuesta = await getMe();
    setUser(respuesta.data);
  };

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
