import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/login';
import Perfil from './pages/perfil';
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
        {/* Ruta debe coincidir con la URL que genera AuthServiceProvider en Laravel */}
        <Route path="/password-reset/:token" element={<ResetPassword />} />
        {/* Redirigir cualquier URL no reconocida al login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
        {/* Ruta protegida - requiere sesion activa */}
        <Route
          path="/portafolio"
          element={
            <PrivateRoute>
              <Portafolio />
            </PrivateRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <PrivateRoute>
              <Perfil />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
