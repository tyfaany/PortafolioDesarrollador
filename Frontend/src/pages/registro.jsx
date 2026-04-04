import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Field from '../components/Field';

// Formulario de registro de nuevo usuario
const Registro = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate('/login');
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
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ingresa tu nombre"
        />
        <Field
          label="Correo Electrónico"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Ingresa tu correo"
        />
        <Field
          label="Contraseña"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Mínimo 8 caracteres"
        />
        <Field
          label="Confirmar Contraseña"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Repite tu contraseña"
        />

        <button className="softsave-button" type="submit">
          Registrarme
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
