import { Navigate, Route, Routes } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/Login';
import Registro from './pages/Registro';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Portafolio from './pages/Portafolio';
import ProfileSettings from './pages/ProfileSettings';

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
      </Route>

      {/* Rutas protegidas */}
      <Route
        element={(
          // <ProtectedRoute>
            <MainLayout />
          // </ProtectedRoute>
        )}
      >
        <Route path="/portafolio" element={<Portafolio />} />
        <Route path="/perfil/*" element={<ProfileSettings />} />
      </Route>

      {/* Redirecciones */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
