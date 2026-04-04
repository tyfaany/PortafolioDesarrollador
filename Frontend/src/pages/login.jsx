import { useState } from 'react';
import * as Yup from 'yup';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '@mdi/react';
import { mdiEmailOutline, mdiEyeOffOutline, mdiEyeOutline, mdiLockOutline } from '@mdi/js';
import Field from '../components/Field';

// Esquema de validacion para inicio de sesion
const esquemaLogin = Yup.object({
  email: Yup.string()
    .email('Formato de correo invalido')
    .required('El correo es obligatorio'),
  password: Yup.string()
    .required('La contraseña es obligatoria'),
});

// Formulario de inicio de sesion
const Login = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    recordarme: false,
  });
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  if (loading) {
    return <p>Cargando...</p>;
  }

  if (isAuthenticated) {
    return <Navigate to="/portafolio" replace />;
  }

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrores((current) => ({ ...current, [name]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setCargando(true);
    setErrores({});
    setErrorServidor('');

    try {
      await esquemaLogin.validate(formData, { abortEarly: false });
      setErrores({});

      try {
        await login(formData.email, formData.password, formData.recordarme);
        navigate('/portafolio');
      } catch {
        setErrorServidor('Credenciales no coinciden con nuestros registros');
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
        <h2>Iniciar Sesión</h2>
      </div>

      {errorServidor && (
        <div className="error-alert" role="alert">
          {errorServidor}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <Field
          label="Correo Electrónico"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Correo Electrónico"
          autoComplete="email"
          icon={<Icon path={mdiEmailOutline} size={0.9} />}
        />
        {errores.email && (
          <small className="error-text">{errores.email}</small>
        )}
        <Field
          label="Contraseña"
          type={mostrarPassword ? 'text' : 'password'}
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Contraseña"
          autoComplete="current-password"
          icon={<Icon path={mostrarPassword ? mdiEyeOffOutline : mdiEyeOutline} size={0.9} />}
          iconPosition="end"
          onIconClick={() => setMostrarPassword((current) => !current)}
          iconLabel={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        />
        {errores.password && (
          <small className="error-text">{errores.password}</small>
        )}

        <div className="auth-options">
          <label className="remember-option">
            <input
              type="checkbox"
              name="recordarme"
              checked={formData.recordarme}
              onChange={handleChange}
            />
            <span>Recordarme</span>
          </label>
          <Link to="/forgot-password" className="auth-link">
            Olvidé mi contraseña
          </Link>
        </div>

        <button
          className="softsave-button"
          type="submit"
          disabled={cargando}
          data-loading={cargando ? 'true' : 'false'}
        >
          {cargando ? 'Ingresando' : 'Ingresar'}
        </button>
      </form>

      <p className="auth-footer">
        ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
      </p>
    </section>
  );
};

export default Login;
