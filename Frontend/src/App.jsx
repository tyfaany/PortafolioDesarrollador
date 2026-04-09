import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/login';
import ProfileSettings from './pages/ProfileSettings';
import Registro from './pages/registro';
import Portafolio from './pages/portafolio';
import ForgotPassword from './pages/forgotPassword';
import ResetPassword from './pages/resetPassword';
import PrivateRoute from './components/PrivateRoute';
import MainNavbar from './components/MainNavbar';

// Definicion de rutas de la aplicacion
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta raiz redirige al login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
         {/*  */}
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/password-reset/:token" element={<ResetPassword />} />

        {/* Rutas protegidas - requieren sesion activa */}
        <Route
          path="/portafolio"
          element={
            <PrivateRoute>
              <div className="softsave-app-shell">
                <MainNavbar />
                <Portafolio />
              </div>
            </PrivateRoute>
          }
        />
        <Route
          path="/perfil/*"
          element={
            <PrivateRoute>
              <div className="softsave-app-shell">
                <MainNavbar />
                <ProfileSettings />
              </div>
            </PrivateRoute>
          }
        />
        {/* Redirigir cualquier URL no reconocida al login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
