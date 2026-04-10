import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Icon from '@mdi/react';
import { mdiEmailOutline, mdiEyeOffOutline, mdiEyeOutline, mdiLockOutline } from '@mdi/js';
import Field from '../components/Field';
import loginSchema from '../schemas/loginSchema';

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
  const [mensajeSesionExpirada, setMensajeSesionExpirada] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  useEffect(() => {
    const sesionExpirada = sessionStorage.getItem('session_expired');
    if (sesionExpirada) {
      setMensajeSesionExpirada('Su sesión ha expirado');
      sessionStorage.removeItem('session_expired');
    }
  }, []);

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
    if (errorServidor && (name === 'email' || name === 'password')) {
      setErrorServidor('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setCargando(true);
    setErrores({});

    try {
      await loginSchema.validate(formData, { abortEarly: false });
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
    <section className="auth-split">
      <aside
        className="auth-split__visual auth-split__visual--cluster-top-right"
        aria-hidden="true"
      >
        <div className="auth-split__decor">
          <span className="auth-split__square auth-split__square--left" />
          <span className="auth-split__square auth-split__square--right" />
          <span className="auth-split__square auth-split__square--mid" />
          <span className="auth-split__circle auth-split__circle--large" />
          <span className="auth-split__circle auth-split__circle--small" />
        </div>
        <div className="auth-split__visual-inner">
          {/* <span className="auth-split__eyebrow">BIENVENIDO DE NUEVO</span> */}
          <h2 className="auth-split__title">
            <span className="auth-split__title-line">Entra.</span>
            <span className="auth-split__title-line">Actualiza.</span>
            <span className="auth-split__accent">Comparte.</span>
          </h2>
          <p className="auth-split__text">
            Accede para actualizar tus proyectos, revisar tus habilidades
            registradas y compartir tu enlace con quienes necesitan conocer tu
            trabajo.
          </p>

          <ul className="auth-timeline">
            <li className="auth-timeline__item">
              <div className="auth-timeline__marker" aria-hidden="true">
                <span className="auth-timeline__dot auth-timeline__dot--primary" />
                <span className="auth-timeline__stem auth-timeline__stem--primary" />
              </div>
              <div>
                <h3>Tu perfil publicado</h3>
                <p>Tu enlace sigue activo y visible para quienes lo tengan.</p>
              </div>
            </li>
            <li className="auth-timeline__item">
              <div className="auth-timeline__marker" aria-hidden="true">
                <span className="auth-timeline__dot auth-timeline__dot--success" />
                <span className="auth-timeline__stem auth-timeline__stem--success" />
              </div>
              <div>
                <h3>Proyectos guardados</h3>
                <p>Tus proyectos y repositorios de GitHub siguen vinculados.</p>
              </div>
            </li>
            <li className="auth-timeline__item">
              <div className="auth-timeline__marker" aria-hidden="true">
                <span className="auth-timeline__dot auth-timeline__dot--accent" />
                <span className="auth-timeline__stem auth-timeline__stem--accent" />
              </div>
              <div>
                <h3>Habilidades registradas</h3>
                <p>Tus habilidades técnicas y blandas están intactas.</p>
              </div>
            </li>
            <li className="auth-timeline__item">
              <div className="auth-timeline__marker" aria-hidden="true">
                <span className="auth-timeline__dot auth-timeline__dot--muted" />
                <span className="auth-timeline__stem auth-timeline__stem--muted" />
              </div>
              <div>
                <h3>¿Algo nuevo que agregar?</h3>
                <p>Entra y actualiza lo que haya cambiado en tu carrera.</p>
              </div>
            </li>
          </ul>
        </div>
      </aside>

      <div className="auth-split__form">
        <section className="auth-card">
          <div className="auth-header">
            <h2>Iniciar Sesión</h2>
            <p>Ingresa tus credenciales para continuar</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} autoComplete="on">
            <Field
              label="Correo Electrónico"
              type="email"
              id="login-email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Correo Electrónico"
              autoComplete="username"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              icon={<Icon path={mdiEmailOutline} size={0.9} />}
            />
            {errores.email && (
              <small className="error-text">{errores.email}</small>
            )}
            <Field
              label="Contraseña"
              type={mostrarPassword ? "text" : "password"}
              id="login-password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Contraseña"
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect="off"
              startIcon={<Icon path={mdiLockOutline} size={0.9} />}
              endIcon={
                <Icon
                  path={mostrarPassword ? mdiEyeOffOutline : mdiEyeOutline}
                  size={0.9}
                />
              }
              onEndIconClick={() => setMostrarPassword((current) => !current)}
              endIconLabel={
                mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
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

            {errorServidor && (
              <div className="error-alert error-alert--inline" role="alert">
                {errorServidor}
              </div>
            )}
            {mensajeSesionExpirada && (
              <div className="error-alert error-alert--inline" role="alert">
                {mensajeSesionExpirada}
              </div>
            )}

            <button
              className="softsave-button"
              type="submit"
              disabled={cargando}
              data-loading={cargando ? "true" : "false"}
            >
              {cargando ? "Ingresando" : "Ingresar"}
            </button>
          </form>

          <p className="auth-footer">
            ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
          </p>
        </section>
      </div>
    </section>
  );
};

export default Login;
