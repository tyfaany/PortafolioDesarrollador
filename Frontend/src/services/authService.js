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

export const subirFoto = async (archivo) => {
  const formData = new FormData();
  formData.append('photo', archivo);
  const respuesta = await api.post('/user/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const profilePhotoUrl = respuesta?.data?.profile_photo_url || respuesta?.data?.photo_url || null;
  return {
    ...respuesta,
    data: {
      ...respuesta.data,
      profile_photo_url: profilePhotoUrl,
    },
  };
};

export const actualizarPerfil = (datos) => api.put('/user/update', datos);

export const obtenerEstudios = () => api.get('/studies');

export const crearEstudio = (datos) => api.post('/studies', datos);

export const actualizarEstudio = (id, datos) => api.put(`/studies/${id}`, datos);

export const eliminarEstudio = (id) => api.delete(`/studies/${id}`);

export const obtenerJobs = () => api.get('/user/jobs');

export const crearJob = (datos) => api.post('/user/jobs', datos);

export const actualizarJob = (id, datos) => api.put(`/user/jobs/${id}`, datos);

export const eliminarJob = (id) => api.delete(`/user/jobs/${id}`);

export const obtenerSkillsTecnicas = () => api.get('/user/technical-skills');

export const sincronizarSkillsTecnicas = (skills) =>
  api.post('/user/technical-skills/sync', { skills });

export const obtenerSoftSkills = () => api.get('/user/soft-skills');

export const sincronizarSoftSkills = (skills) =>
  api.post('/user/soft-skills/sync', { skills });

export const obtenerProyectos = () => api.get('/user/projects');

export const crearProyecto = (formData) => api.post('/user/projects', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

export const actualizarProyecto = (id, formData) => api.put(`/user/projects/${id}`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

export const eliminarProyecto = (id) => api.delete(`/user/projects/${id}`);

export const obtenerTecnologias = () => api.get('/project-technologies');
