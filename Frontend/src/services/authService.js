import api from './api';

export const login = (email, password, recordarme = false) => api.post('/login', {
  email,
  password,
  remember: recordarme,
});

export const registrar = (nombre, email, password, passwordConfirmacion) => api.post('/register', {
  name: nombre,
  email,
  password,
  password_confirmation: passwordConfirmacion,
});

export const logout = () => api.post('/logout');

export const getMe = () => api.get('/me');

export const solicitarRecuperacion = (email) => api.post('/forgot-password', { email });

export const restablecerPassword = ({ token, email, password, passwordConfirmacion }) => api.post('/reset-password', {
  token,
  email,
  password,
  password_confirmation: passwordConfirmacion,
});

export const subirFoto = (archivo) => {
  const formData = new FormData();
  formData.append('photo', archivo);
  return api.post('/user/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const actualizarPerfil = (datos) => api.put('/user/update', datos);
