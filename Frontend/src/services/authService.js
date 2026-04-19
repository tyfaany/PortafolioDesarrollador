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

export const getMe = () => api.get('/user');

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

export const obtenerEstudios = () => api.get('/studies');

export const crearEstudio = (datos) => api.post('/studies', datos);

export const actualizarEstudio = (id, datos) => api.put(`/studies/${id}`, datos);

export const obtenerJobs = () => api.get('/user/jobs');

export const crearJob = (datos) => api.post('/user/jobs', datos);

export const actualizarJob = (id, datos) => api.put(`/user/jobs/${id}`, datos);

export const obtenerSkillsTecnicas = () => api.get('/user/technical-skills');

export const sincronizarSkillsTecnicas = (skills) =>
  api.post('/user/technical-skills/sync', { skills });

export const obtenerSoftSkills = () => api.get('/user/soft-skills');

export const sincronizarSoftSkills = (skills) =>
  api.post('/user/soft-skills/sync', { skills });
