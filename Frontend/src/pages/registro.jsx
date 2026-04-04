import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import * as Yup from 'yup';
import Icon from '@mdi/react';
import {
  mdiAccountOutline,
  mdiEmailOutline,
  mdiEyeOffOutline,
  mdiEyeOutline,
  mdiLockOutline,
} from '@mdi/js';
import Field from '../components/Field';

// Esquema de validacion para el formulario de registro
const esquemaRegistro = Yup.object({
  nombre: Yup.string()
    .required('El nombre es obligatorio'),
  email: Yup.string()
    .email('Formato de correo invalido')
    .required('El correo es obligatorio'),
  password: Yup.string()
    .min(8, 'Minimo 8 caracteres')
    .required('La contraseña es obligatoria'),
  passwordConfirmacion: Yup.string()
    .oneOf([Yup.ref('password')], 'Las contraseñas no coinciden')
    .required('Confirma tu contraseña'),
});

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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrores((current) => ({ ...current, [name]: '' }));
  };

  if (loading) {
    return <p>Cargando...</p>;
  }

  if (isAuthenticated) {
    return <Navigate to="/portafolio" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setCargando(true);
    setErrores({});

    try {
      await esquemaRegistro.validate(formData, { abortEarly: false });
      setErrores({});
      setCargando(true);

      try {
        await registrar(
          formData.nombre,
          formData.email,
          formData.password,
          formData.passwordConfirmacion
        );
        navigate('/perfil');
      } catch (error) {
        if (error.response?.status === 422) {
          const erroresBackend = error.response.data.errors;
          setErrores({
            nombre: erroresBackend.name?.[0] || '',
            email: erroresBackend.email?.[0] || '',
            password: erroresBackend.password?.[0] || '',
          });
        } else {
          setErrorServidor('Ocurrió un error. Intenta de nuevo.');
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

      <form className="auth-form" onSubmit={handleSubmit}>
        <Field
          label="Nombre Completo"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          placeholder="Ingresa tu nombre"
          autoComplete="name"
          icon={<Icon path={mdiAccountOutline} size={0.9} />}
        />
        {errores.nombre && (
          <small className="error-text">{errores.nombre}</small>
        )}
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
        <Field
          label="Contraseña"
          type={mostrarPassword ? 'text' : 'password'}
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Mínimo 8 caracteres"
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
          label="Confirmar Contraseña"
          type={mostrarConfirmacion ? 'text' : 'password'}
          name="passwordConfirmacion"
          value={formData.passwordConfirmacion}
          onChange={handleChange}
          placeholder="Repite tu contraseña"
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
          disabled={cargando}
          data-loading={cargando ? 'true' : 'false'}
        >
          {cargando ? 'Registrando' : 'Registrarme'}
        </button>
      </form>

      <p className="auth-footer">
        ¿Ya tienes cuenta? <Link to="/login">Inicia Sesión</Link>
      </p>
      <p className="auth-terms">Al registrarte, aceptas nuestros Términos y Condiciones</p>
    </section>
  );
};

export default Registro;
