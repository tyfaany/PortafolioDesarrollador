import React from 'react';
import { useAuth } from '../context/AuthContext';

const Portfolio = () => {
  const { user, logout } = useAuth();

  return (
    <div className="softsave-portafolio-shell">
      <header className="softsave-portafolio-header">
        <h1>Mi Portafolio</h1>
        <p>Bienvenido, <strong>{user?.name || 'Usuario'}</strong></p>
        <button
          onClick={logout}
          className="softsave-portafolio-logout"
        >
          Cerrar Sesión
        </button>
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
