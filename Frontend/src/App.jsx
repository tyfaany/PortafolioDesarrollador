import { Navigate, Route, Routes } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import AuthCallback from './pages/AuthCallback';
import ForgotPassword from './pages/ForgotPassword';
import Inicio from './pages/Inicio';
import Login from './pages/Login';
import PerfilPublico from './pages/PerfilPublico';
import Portafolio from './pages/Portafolio';
import ProfileSettings from './pages/ProfileSettings';
import Registro from './pages/Registro';
import ResetPassword from './pages/ResetPassword';
import VerificationPending from './pages/VerificationPending';

// Definicion de rutas de la aplicacion
function App() {
  return (
    <Routes>
      {/* Rutas publicas */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/password-reset/:token" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/verificacion-pendiente" element={<VerificationPending />} />
      </Route>

      <Route element={<MainLayout />}>
        <Route path="/users/:user/profile" element={<PerfilPublico />} />
      </Route>

      {/* Rutas protegidas */}
      <Route
        element={(
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        )}
      >
        <Route path="/inicio" element={<Inicio />} />
        <Route path="/portafolio" element={<Portafolio />} />
        <Route path="/perfil" element={<Navigate to="/perfil/contacto" replace />} />
        <Route path="/perfil/contacto" element={<ProfileSettings />} />
        <Route path="/perfil/academica" element={<ProfileSettings />} />
        <Route path="/perfil/github" element={<ProfileSettings />} />
        <Route path="/perfil/ajustes" element={<ProfileSettings />} />
        <Route path="/perfil/privacidad" element={<Navigate to="/perfil/ajustes" replace />} />
        <Route path="/perfil/*" element={<Navigate to="/perfil/contacto" replace />} />
      </Route>

      {/* Redirecciones */}
      <Route path="/" element={<Navigate to="/inicio" replace />} />
      <Route path="*" element={<Navigate to="/inicio" replace />} />
    </Routes>
  );
}

export default App;