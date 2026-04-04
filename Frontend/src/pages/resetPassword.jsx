import { useState } from 'react';
import * as Yup from 'yup';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../axios/api';
import Icon from '@mdi/react';
import { mdiEyeOffOutline, mdiEyeOutline, mdiLockOutline } from '@mdi/js';
import Field from '../components/Field';

// Esquema de validacion para restablecer contraseña
const esquemaPassword = Yup.object({
  password: Yup.string()
    .min(8, 'Minimo 8 caracteres')
    .required('La contraseña es obligatoria'),
  passwordConfirmacion: Yup.string()
    .oneOf([Yup.ref('password')], 'Las contraseñas no coinciden')
    .required('Confirma tu contraseña'),
});

// Pagina para establecer la nueva contraseña con el token del email
const ResetPassword = () => {
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
      await esquemaPassword.validate(formData, { abortEarly: false });
      setErrores({});

      try {
        await api.post('/reset-password', {
          token,
          email,
          password: formData.password,
          password_confirmation: formData.passwordConfirmacion,
        });
        setMensajeExito('Contraseña restablecida correctamente');
        setTimeout(() => navigate('/login'), 2000);
      } catch {
        setErrorServidor('El enlace es inválido o ha expirado');
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
        <div className="success-alert" role="status">
          {mensajeExito}
        </div>
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
          icon={<Icon path={mostrarPassword ? mdiEyeOffOutline : mdiEyeOutline} size={0.9} />}
          iconPosition="end"
          onIconClick={() => setMostrarPassword((current) => !current)}
          iconLabel={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
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
          icon={<Icon path={mostrarConfirmacion ? mdiEyeOffOutline : mdiEyeOutline} size={0.9} />}
          iconPosition="end"
          onIconClick={() => setMostrarConfirmacion((current) => !current)}
          iconLabel={mostrarConfirmacion ? 'Ocultar contraseña' : 'Mostrar contraseña'}
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
  );
};

export default ResetPassword;
