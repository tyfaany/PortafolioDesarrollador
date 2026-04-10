import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import './portafolio.css';

const Portfolio = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="softsave-portafolio-shell">
      <header className="softsave-portafolio-header">
        <h1>Mi Portafolio</h1>
        <p>Bienvenido, <strong>{user?.name || 'Usuario'}</strong></p>
        <div className="auth-form">
          <button
            onClick={logout}
            className="softsave-button"
            type="button"
          >
            Cerrar Sesión
          </button>
          <button
            onClick={() => navigate('/perfil')}
            className="softsave-button"
            type="button"
          >
            Ir a mi perfil
          </button>
        </div>
      </header>

      <section className="softsave-portafolio-grid">
        <div className="softsave-portafolio-card">
          <h3>Proyecto 1</h3>
          <p>Esta información es privada y solo tú puedes verla.</p>
        </div>
      </section>
    </div>
  );
};

export default Portfolio;
