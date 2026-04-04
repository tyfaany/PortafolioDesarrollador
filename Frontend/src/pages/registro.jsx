import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as Yup from 'yup';
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
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    passwordConfirmacion: '',
  });
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrores((current) => ({ ...current, [name]: '' }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setCargando(true);
    setErrores({});

    esquemaRegistro.validate(formData, { abortEarly: false })
      .catch((error) => {
        if (error.inner) {
          const mapaErrores = {};
          error.inner.forEach((item) => {
            mapaErrores[item.path] = item.message;
          });
          setErrores(mapaErrores);
        }
      })
      .finally(() => {
        setCargando(false);
      });
  };

  return (
    <section className="auth-card">
      <div className="auth-header">
        <h2>Crea tu Cuenta</h2>
        <p>Únete a la plataforma para gestionar tu portafolio</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <Field
          label="Nombre Completo"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          placeholder="Ingresa tu nombre"
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
        />
        {errores.email && (
          <small className="error-text">{errores.email}</small>
        )}
        <Field
          label="Contraseña"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Mínimo 8 caracteres"
        />
        {errores.password && (
          <small className="error-text">{errores.password}</small>
        )}
        <Field
          label="Confirmar Contraseña"
          type="password"
          name="passwordConfirmacion"
          value={formData.passwordConfirmacion}
          onChange={handleChange}
          placeholder="Repite tu contraseña"
        />
        {errores.passwordConfirmacion && (
          <small className="error-text">{errores.passwordConfirmacion}</small>
        )}

        <button className="softsave-button" type="submit" disabled={cargando}>
          {cargando ? 'Registrando...' : 'Registrarme'}
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
