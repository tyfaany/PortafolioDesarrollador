import { useEffect, useState } from 'react';
import api from '../axios/api';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

// Perfil de usuario con datos desde /me
const Perfil = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorServidor, setErrorServidor] = useState('');

  useEffect(() => {
    api.get('/me')
      .then((response) => {
        setUsuario(response.data);
      })
      .catch(() => {
        setErrorServidor('No se pudo cargar tu perfil. Intenta de nuevo.');
      })
      .finally(() => {
        setCargando(false);
      });
  }, []);

  if (cargando) {
    return <p>Cargando...</p>;
  }

  if (errorServidor) {
    return (
      <div className="error-alert" role="alert">
        {errorServidor}
      </div>
    );
  }

  return (
    <section className="auth-card">
      <div className="auth-header">
        <h2>Perfil de Usuario</h2>
      </div>
      <div className="auth-form">
        <p><strong>Nombre:</strong> {usuario?.name || 'Usuario'}</p>
        <p><strong>Correo:</strong> {usuario?.email || 'No disponible'}</p>
        <p><strong>Biografía:</strong> {usuario?.bio || 'Sin biografía aún'}</p>
      </div>
      <div className="auth-form">
        <button className="softsave-button" type="button" onClick={logout}>
          Cerrar sesión
        </button>
        <button
          className="softsave-button"
          type="button"
          onClick={() => navigate('/portafolio')}
        >
          Ir a mi portafolio
        </button>
      </div>
    </section>
  );
};

export default Perfil;
