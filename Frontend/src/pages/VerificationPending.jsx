import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { reenviarVerificacion } from '../services/authService';
import { extractApiMessageByStatus } from '../utils/apiError';

function VerificationPending() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const emailDesdeEstado = location.state?.email;
    if (emailDesdeEstado) {
      setEmail(emailDesdeEstado);
    }
  }, [location.state?.email]);

  const manejarEnvio = async (event) => {
    event.preventDefault();
    setCargando(true);
    setError('');
    setMensaje('');

    try {
      const respuesta = await reenviarVerificacion(email);
      setMensaje(respuesta.data?.message || 'Te enviamos un nuevo enlace de verificación.');
    } catch (err) {
      setError(extractApiMessageByStatus(err, 'No pudimos reenviar la verificación. Intenta de nuevo.'));
    } finally {
      setCargando(false);
    }
  };

  return (
    <section className="auth-centered auth-centered--forgot">
      <section className="auth-card">
        <div className="auth-header">
          <h2>Verifica tu correo</h2>
          <p>Necesitamos confirmar tu cuenta antes de dejarte entrar.</p>
        </div>

        {mensaje && (
          <div className="success-alert" role="status">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="error-alert" role="alert">
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={manejarEnvio}>
          <label className="auth-field">
            <span className="auth-field__label">Correo electrónico</span>
            <input
              className="softsave-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Ingresa tu correo"
              autoComplete="email"
              required
            />
          </label>

          <button className="softsave-button" type="submit" disabled={cargando}>
            {cargando ? 'Enviando...' : 'Reenviar verificación'}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login" state={{ email }}>
            Volver al inicio de sesión
          </Link>
        </p>
      </section>
    </section>
  );
}

export default VerificationPending;
