import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import Login from './pages/login';
import ProfileSettings from './pages/ProfileSettings';
import Registro from './pages/registro';
import Portafolio from './pages/portafolio';
import ForgotPassword from './pages/forgotPassword';
import ResetPassword from './pages/resetPassword';

function FreeHome() {
  return (
    <section className="auth-card">
      <header className="auth-header">
        <h2>Rutas libres</h2>
        <p>Accede a cualquier pagina sin autenticacion para pruebas rapidas.</p>
      </header>
      <div className="auth-form">
        <Link className="softsave-button" to="/login">Login</Link>
        <Link className="softsave-button" to="/registro">Registro</Link>
        <Link className="softsave-button" to="/forgot-password">Olvide mi contrasena</Link>
        <Link className="softsave-button" to="/password-reset/demo-token">Restablecer contrasena</Link>
        <Link className="softsave-button" to="/portafolio">Portafolio</Link>
        <Link className="softsave-button" to="/perfil">Perfil</Link>
        <Link className="softsave-button" to="/perfil/contacto">Perfil contacto</Link>
        <Link className="softsave-button" to="/perfil/academica">Perfil academica</Link>
        <Link className="softsave-button" to="/perfil/github">Perfil GitHub</Link>
      </div>
      <p className="auth-terms">Usa esta vista solo en desarrollo.</p>
    </section>
  );
}

// App libre para pruebas locales sin PrivateRoute.
function AppFree() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FreeHome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/password-reset/:token" element={<ResetPassword />} />
        <Route path="/portafolio" element={<Portafolio />} />
        <Route path="/perfil" element={<ProfileSettings />} />
        <Route path="/perfil/contacto" element={<ProfileSettings />} />
        <Route path="/perfil/academica" element={<ProfileSettings />} />
        <Route path="/perfil/github" element={<ProfileSettings />} />
        <Route path="*" element={<FreeHome />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppFree;
