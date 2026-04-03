import React from 'react';
import { useAuth } from "../context/AuthContext";

const Portfolio = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: '50px' }}>
        <h1>Mi Portafolio</h1>
        <p>Bienvenido, <strong>{user?.name || 'Usuario'}</strong></p>
        <button 
          onClick={logout}
          style={{
            backgroundColor: '#ff4d4d',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Cerrar Sesión
        </button>
      </header>

      <section style={{ display: 'grid', gap: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
          <h3>Proyecto 1</h3>
          <p>Esta información es privada y solo tú puedes verla.</p>
        </div>
      </section>
    </div>
  );
};

export default Portfolio;