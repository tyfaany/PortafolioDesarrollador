import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/login';
import ProfileSettings from './pages/ProfileSettings'; //
import Registro from './pages/registro';
import Portafolio from './pages/portafolio';
import ForgotPassword from './pages/forgotPassword';
import ResetPassword from './pages/resetPassword';
import PrivateRoute from './components/PrivateRoute';

// Definicion de rutas de la aplicacion
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta raiz redirige al login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/password-reset/:token" element={<ResetPassword />} />

        {/* 1. RUTA DE PERFIL LIBERADA: Se quita PrivateRoute para verla directo */}
        <Route path="/perfil" element={<ProfileSettings />} />

        {/* Ruta protegida - requiere sesion activa */}
        <Route
          path="/portafolio"
          element={
            <PrivateRoute>
              <Portafolio />
            </PrivateRoute>
          }
        />

        {/* 2. COMENTAMOS ESTO TEMPORALMENTE: Evita que cualquier error te mande al login */}
        {/* <Route path="*" element={<Navigate to="/login" replace />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;