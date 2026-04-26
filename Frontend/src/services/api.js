import axios from 'axios';

// Creamos una instancia de Axios
const api = axios.create({
  baseURL: import.meta.env.VITE_LARAVEL_API_URL, // Variable de entorno
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de requests: agrega token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Trae token del storage
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de responses: manejo de errores globales
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Limpiar sesion y redirigir si el token expiro o es invalido
    const token = localStorage.getItem('token');
    if (error.response?.status === 401 && token) {
      const url = error.config?.url || '';
      const esRutaPublica =
        url.includes('/login')
        || url.includes('/register')
        || url.includes('/forgot-password')
        || url.includes('/reset-password');

      localStorage.removeItem('token');
      if (!esRutaPublica && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
