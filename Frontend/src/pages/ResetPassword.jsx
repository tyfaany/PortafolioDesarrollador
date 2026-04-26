import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiEyeOffOutline, mdiEyeOutline, mdiLockOutline } from '@mdi/js';
import Field from '../components/Field';
import useFeedback from '../hooks/useFeedback';
import resetPasswordSchema from '../schemas/resetPasswordSchema';
import { restablecerPassword } from '../services/authService';
import { extractApiMessageByStatus } from '../utils/apiError';

// Pagina para establecer la nueva contraseña con el token del email
const ResetPassword = () => {
  const { showFeedback } = useFeedback();
  const { token } = useParams();
  const [paramsUrl] = useSearchParams();
  const email = paramsUrl.get('email');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: '',
    passwordConfirmacion: '',
  });
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrores((current) => ({ ...current, [name]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setCargando(true);
    setErrores({});
    setErrorServidor('');

    try {
      await resetPasswordSchema.validate(formData, { abortEarly: false });
      setErrores({});

      try {
        await restablecerPassword({
          token,
          email,
          password: formData.password,
          passwordConfirmacion: formData.passwordConfirmacion,
        });
        setMensajeExito('Contraseña restablecida correctamente');
        showFeedback('Contraseña restablecida correctamente', 'success');
        setTimeout(() => navigate('/login'), 2000);
      } catch (error) {
        setErrorServidor(extractApiMessageByStatus(error, 'El enlace es inválido o ha expirado.'));
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
      setCargando(false);
    }
  };

  return (
    <div className="auth-centered auth-centered--reset">
      <section className="auth-card">
        <div className="auth-header">
          <h2>Nueva contraseña</h2>
        </div>

        {errorServidor && (
          <div className="error-alert" role="alert">
            {errorServidor}
          </div>
        )}
        {mensajeExito && (
          <p className="auth-helper" role="status">
            Contraseña actualizada. Redirigiendo al inicio de sesión...
          </p>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <Field
            label="Nueva contraseña"
            type={mostrarPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Nueva contraseña"
            autoComplete="new-password"
            startIcon={<Icon path={mdiLockOutline} size={0.9} />}
            endIcon={<Icon path={mostrarPassword ? mdiEyeOffOutline : mdiEyeOutline} size={0.9} />}
            onEndIconClick={() => setMostrarPassword((current) => !current)}
            endIconLabel={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          />
          {errores.password && (
            <small className="error-text">{errores.password}</small>
          )}
          <Field
            label="Confirmar contraseña"
            type={mostrarConfirmacion ? 'text' : 'password'}
            name="passwordConfirmacion"
            value={formData.passwordConfirmacion}
            onChange={handleChange}
            placeholder="Confirma tu contraseña"
            autoComplete="new-password"
            startIcon={<Icon path={mdiLockOutline} size={0.9} />}
            endIcon={<Icon path={mostrarConfirmacion ? mdiEyeOffOutline : mdiEyeOutline} size={0.9} />}
            onEndIconClick={() => setMostrarConfirmacion((current) => !current)}
            endIconLabel={mostrarConfirmacion ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          />
          {errores.passwordConfirmacion && (
            <small className="error-text">{errores.passwordConfirmacion}</small>
          )}
          <button
            className="softsave-button"
            type="submit"
            disabled={cargando || !!mensajeExito}
            data-loading={cargando ? 'true' : 'false'}
          >
            {cargando ? 'Guardando' : 'Restablecer contraseña'}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login">Volver al inicio de sesión</Link>
        </p>
      </section>
    </div>
  );
};

export default ResetPassword;
