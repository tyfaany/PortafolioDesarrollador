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

  // Login
  const login = async (email, password) => {
    const response = await api.post('/login', { email, password });

    const { token, user } = response.data;

    localStorage.setItem('token', token);
    setUser(user);

    return user;
  };

  // Logout
  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.log('Error cerrando sesion');
    }

    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
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
