import { useMemo, useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'

function RocketIcon() {
  return (
    <svg
      className="rocket-icon"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M32 8C39.6 12.5 44 21 44 30.5V35L50 40V42H40.8L38 50H26L23.2 42H14V40L20 35V30.5C20 21 24.4 12.5 32 8Z"
        className="rocket-shell"
      />
      <path d="M28 50H36V54C36 56.2 34.2 58 32 58C29.8 58 28 56.2 28 54V50Z" className="rocket-fin" />
      <path d="M20 36H14C12.9 36 12 36.9 12 38V40H20V36Z" className="rocket-fin" />
      <path d="M44 36H50C51.1 36 52 36.9 52 38V40H44V36Z" className="rocket-fin" />
      <circle cx="32" cy="25" r="6" className="rocket-window" />
    </svg>
  )
}

function LandingPage() {
  return (
    <section className="landing-shell">
      <div className="landing-actions">
        <Link className="softsave-button softsave-button--compact" to="/register">
          Crear portafolio
        </Link>
        <Link className="softsave-button softsave-button--compact" to="/login">
          Iniciar sesión
        </Link>
      </div>

      <div className="landing-hero">
        <RocketIcon />
        <h1>¡Bienvenido!</h1>
        <p>Convierte tus proyectos de software en un portafolio profesional</p>

        <div className="landing-cta-group">
          <Link className="softsave-button" to="/register">
            Crear portafolio
          </Link>
          <Link className="softsave-button" to="/login">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </section>
  )
}

function Field({ label, type = 'text', name, value, onChange, placeholder }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input
        className="softsave-input"
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="off"
      />
    </label>
  )
}

function RegisterPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    navigate('/login')
  }

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
  )
}

function LoginPage() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    remember: true,
  })
  const [hasError, setHasError] = useState(false)

  const isSuccessfulLogin = useMemo(
    () => credentials.email === 'demo@softsave.com' && credentials.password === 'SoftSave123',
    [credentials.email, credentials.password],
  )

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target
    setCredentials((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setHasError(false)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setHasError(!isSuccessfulLogin)
  }

  return (
    <section className="auth-card">
      <div className="auth-header">
        <h2>Iniciar Sesión</h2>
      </div>

      {hasError && (
        <div className="error-alert" role="alert">
          Credenciales no coinciden con nuestros registros
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <Field
          label="Correo Electrónico"
          type="email"
          name="email"
          value={credentials.email}
          onChange={handleChange}
          placeholder="Correo Electrónico"
        />
        <Field
          label="Contraseña"
          type="password"
          name="password"
          value={credentials.password}
          onChange={handleChange}
          placeholder="Contraseña"
        />

        <div className="auth-options">
          <label className="remember-option">
            <input
              type="checkbox"
              name="remember"
              checked={credentials.remember}
              onChange={handleChange}
            />
            <span>Remember Me</span>
          </label>
          <Link to="/login" className="auth-link">
            Forgot Password?
          </Link>
        </div>

        <button className="softsave-button" type="submit">
          Iniciar Sesión
        </button>
      </form>

      <p className="auth-footer">
        ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
      </p>
    </section>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
