import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import '../styles/portafolio.css';

function Inicio() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="softsave-portafolio-shell softsave-portafolio-shell--home">
      <header className="softsave-portafolio-header">
        <h1>Inicio</h1>
        <p>Bienvenido, <strong>{user?.name || 'Usuario'}</strong></p>
        <div className="softsave-portafolio-actions">
          <button onClick={logout} className="softsave-button" type="button">
            Cerrar Sesion
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
          <p>Esta informacion es privada y solo tu puedes verla.</p>
        </div>
      </section>
    </div>
  );
}

export default Inicio;
