import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Icon from '@mdi/react';
import {
  mdiAccountOutline,
  mdiEmailOutline,
  mdiEyeOffOutline,
  mdiEyeOutline,
  mdiFileDocumentOutline,
  mdiGithub,
  mdiLinkVariant,
  mdiLockOutline,
  mdiStarOutline,
} from '@mdi/js';
import Field from '../components/Field';
import registerSchema from '../schemas/registerSchema';
import { extractApiMessageByStatus } from '../utils/apiError';

// Formulario de registro de nuevo usuario
const Registro = () => {
  const { registrar, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    passwordConfirmacion: '',
  });
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);
  const [errorServidor, setErrorServidor] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const completarPerfil = sessionStorage.getItem('post_register');
    if (completarPerfil) {
      sessionStorage.removeItem('post_register');
      navigate('/perfil', { state: { completarPerfil: true }, replace: true });
      return;
    }

    navigate('/inicio', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrores((current) => ({ ...current, [name]: '' }));
  };

  if (loading) {
    return <p>Cargando...</p>;
  }

  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setCargando(true);
    setErrores({});

    try {
      await registerSchema.validate(formData, { abortEarly: false });
      setErrores({});
      setCargando(true);

      try {
        await registrar(
          formData.nombre,
          formData.email,
          formData.password,
          formData.passwordConfirmacion
        );
        sessionStorage.setItem('post_register', 'true');
        navigate('/perfil', { state: { completarPerfil: true } });
      } catch (error) {
        if (error.response?.status === 422) {
          const erroresBackend = error?.response?.data?.errors;
          if (!erroresBackend || typeof erroresBackend !== 'object') {
            setErrorServidor(extractApiMessageByStatus(error, 'Ocurrió un error. Intenta de nuevo.'));
            return;
          }

          setErrores({
            nombre: erroresBackend.name?.[0] || '',
            email: erroresBackend.email?.[0] || '',
            password: erroresBackend.password?.[0] || '',
          });
          if (!erroresBackend?.name && !erroresBackend?.email && !erroresBackend?.password) {
            setErrorServidor(extractApiMessageByStatus(error, 'Ocurrió un error. Intenta de nuevo.'));
          }
        } else {
          setErrorServidor(extractApiMessageByStatus(error, 'Ocurrió un error. Intenta de nuevo.'));
        }
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
        className="auth-split__visual auth-split__visual--soft-shapes"
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
          {/* <span className="auth-split__eyebrow">SISTEMA DE PORTAFOLIOS · UMSS</span> */}
          <h2 className="auth-split__title">
            Tu portal
            <span className="auth-split__title-line">profesional</span>
            <span className="auth-split__accent">comienza aquí.</span>
          </h2>
          <p className="auth-split__text">
            Únete a miles de profesionales y crea tu portafolio único en un solo
            enlace. Muestra tus habilidades al mundo con la precisión que tu
            carrera merece.
          </p>

          <ul className="auth-split__list">
            <li className="auth-split__list-item">
              <span
                className="auth-split__badge auth-split__badge--primary"
                aria-hidden="true"
              >
                <Icon path={mdiFileDocumentOutline} size={0.9} />
              </span>
              <div>
                <h3>Un portafolio que te representa</h3>
                <p>
                  Agrega tus proyectos, habilidades técnicas, experiencia
                  laboral y formación académica en un solo lugar.
                </p>
              </div>
            </li>
            <li className="auth-split__list-item">
              <span
                className="auth-split__badge auth-split__badge--success"
                aria-hidden="true"
              >
                <Icon path={mdiLinkVariant} size={0.9} />
              </span>
              <div>
                <h3>Comparte con un solo enlace</h3>
                <p>
                  Obtén una URL propia para compartir con reclutadores, docentes
                  o en postulaciones académicas.
                </p>
              </div>
            </li>
            <li className="auth-split__list-item">
              <span
                className="auth-split__badge auth-split__badge--accent"
                aria-hidden="true"
              >
                <Icon path={mdiGithub} size={0.9} />
              </span>
              <div>
                <h3>Conecta tu cuenta de GitHub</h3>
                <p>
                  Vincula tus repositorios y elige cuáles mostrar directamente
                  en tu portafolio.
                </p>
              </div>
            </li>
            <li className="auth-split__list-item">
              <span
                className="auth-split__badge auth-split__badge--secondary"
                aria-hidden="true"
              >
                <Icon path={mdiStarOutline} size={0.9} />
              </span>
              <div>
                <h3>Tú decides qué se ve</h3>
                <p>
                  Controla la visibilidad de cada sección. Muestra solo lo que
                  quieres que el mundo vea.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </aside>

      <div className="auth-split__form">
        <section className="auth-card">
          <div className="auth-header">
            <h2>Crea tu Cuenta</h2>
            <p>Únete a la plataforma para gestionar tu portafolio</p>
          </div>

          {errorServidor && (
            <div className="error-alert" role="alert">
              {errorServidor}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} autoComplete="on">
            <Field
              label="Nombre Completo"
              id="register-name"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ingresa tu nombre"
              autoComplete="name"
              maxLength={50}
              icon={<Icon path={mdiAccountOutline} size={0.9} />}
            />
            {errores.nombre && (
              <small className="error-text">{errores.nombre}</small>
            )}
            <Field
              label="Correo Electrónico"
              type="email"
              id="register-email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Ingresa tu correo"
              autoComplete="email"
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
              id="register-password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
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
            <Field
              label="Confirmar Contraseña"
              type={mostrarConfirmacion ? "text" : "password"}
              id="register-password-confirm"
              name="passwordConfirmacion"
              value={formData.passwordConfirmacion}
              onChange={handleChange}
              placeholder="Repite tu contraseña"
              autoComplete="new-password"
              autoCapitalize="none"
              autoCorrect="off"
              startIcon={<Icon path={mdiLockOutline} size={0.9} />}
              endIcon={
                <Icon
                  path={mostrarConfirmacion ? mdiEyeOffOutline : mdiEyeOutline}
                  size={0.9}
                />
              }
              onEndIconClick={() =>
                setMostrarConfirmacion((current) => !current)
              }
              endIconLabel={
                mostrarConfirmacion
                  ? "Ocultar contraseña"
                  : "Mostrar contraseña"
              }
            />
            {errores.passwordConfirmacion && (
              <small className="error-text">
                {errores.passwordConfirmacion}
              </small>
            )}

            <button
              className="softsave-button"
              type="submit"
              disabled={cargando}
              data-loading={cargando ? "true" : "false"}
            >
              {cargando ? "Registrando" : "Registrarme"}
            </button>
          </form>

          <p className="auth-footer">
            ¿Ya tienes cuenta? <Link to="/login">Inicia Sesión</Link>
          </p>
          <p className="auth-terms">
            Al registrarte, aceptas nuestros Términos y Condiciones
          </p>
        </section>
      </div>
    </section>
  );
};

export default Registro;
