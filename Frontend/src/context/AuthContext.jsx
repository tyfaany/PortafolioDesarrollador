import { createContext, useContext, useEffect, useState } from 'react';
import api from '../axios/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  //  Verificar si hay token al iniciar la app
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      api.get('/me')
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
          api.get('/me')
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
    const response = await api.post('/login', { email, password, remember: recordarme });

    const { token, user } = response.data;

    localStorage.setItem('token', token);
    setUser(user);

    return user;
  };

  // Registrar nuevo usuario y guardar sesion automaticamente
  const registrar = async (nombre, email, password, passwordConfirmacion) => {
    const respuesta = await api.post('/register', {
      name: nombre,
      email,
      password,
      password_confirmation: passwordConfirmacion,
    });
    const { token, user: usuario } = respuesta.data;
    localStorage.setItem('token', token);
    setUser(usuario);
    return usuario;
  };

  // Logout
  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      // El backend puede fallar al cerrar sesion, pero se limpia el token igual
    }

    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        registrar,
        logout,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook personalizado
export const useAuth = () => useContext(AuthContext);
