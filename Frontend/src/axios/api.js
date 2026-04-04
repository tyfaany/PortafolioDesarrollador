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

// Interceptor de responses: se puede manejar errores globales
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ejemplo: si la respuesta es 401, podrías redirigir al login
    if (error.response?.status === 401) {
      console.log('Token expirado o no autorizado');
    }
    return Promise.reject(error);
  }
);

export default api;
