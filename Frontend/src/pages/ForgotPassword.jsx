import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiEmailOutline } from '@mdi/js';
import Field from '../components/Field';
import useFeedback from '../hooks/useFeedback';
import forgotPasswordSchema from '../schemas/forgotPasswordSchema';
import { solicitarRecuperacion } from '../services/authService';

// Pagina para solicitar el enlace de recuperacion de contraseña
const ForgotPassword = () => {
  const { showFeedback } = useFeedback();
  const [formData, setFormData] = useState({ email: '' });
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeEstado, setMensajeEstado] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrores((current) => ({ ...current, [name]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (cargando) {
      return;
    }

    setCargando(true);
    setErrores({});
    setErrorServidor('');
    setMensajeExito('');
    setMensajeEstado('Enviando enlace, esto puede tardar unos segundos...');

    try {
      await forgotPasswordSchema.validate(formData, { abortEarly: false });
      setErrores({});

      try {
        await solicitarRecuperacion(formData.email);
        setMensajeExito('Enlace de recuperación enviado al correo');
        showFeedback('Enlace de recuperación enviado al correo. Revisa tu buzón.', 'success');
        setMensajeEstado('');
      } catch {
        setErrorServidor('No pudimos procesar la solicitud. Intenta de nuevo.');
        setMensajeEstado('');
      } finally {
        setCargando(false);
      }
    } catch (error) {
      if (error.inner) {
        const mapaErrores = {};
        error.inner.forEach((item) => {
          mapaErrores[item.path] = item.message;
        });
        setErrores(mapaErrores);
      }
      setMensajeEstado('');
      setCargando(false);
    }
  };

  return (
    <div className="auth-centered auth-centered--forgot">
      <section className="auth-card">
        <div className="auth-header">
          <h2>Recuperar contraseña</h2>
        </div>

        {errorServidor && (
          <div className="error-alert" role="alert">
            {errorServidor}
          </div>
        )}

        {mensajeExito ? (
          <p className="auth-helper" role="status">
            Revisa tu buzón de correo para continuar.
          </p>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <Field
              label="Correo Electrónico"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Ingresa tu correo"
              autoComplete="email"
              icon={<Icon path={mdiEmailOutline} size={0.9} />}
            />
            {errores.email && (
              <small className="error-text">{errores.email}</small>
            )}
            <button
              className="softsave-button"
              type="submit"
              disabled={cargando}
              data-loading={cargando ? 'true' : 'false'}
            >
              {cargando ? 'Enviando' : 'Enviar enlace'}
            </button>
            {mensajeEstado && (
              <p className="auth-helper" role="status">
                {mensajeEstado}
              </p>
            )}
          </form>
        )}

        <p className="auth-footer">
          <Link to="/login">Volver al inicio de sesión</Link>
        </p>
      </section>
    </div>
  );
};

export default ForgotPassword;
