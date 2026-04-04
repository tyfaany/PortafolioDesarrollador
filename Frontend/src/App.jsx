import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/login';
import Registro from './pages/registro';
import Portafolio from './pages/portafolio';
import PrivateRoute from './components/PrivateRoute';

// Definicion de rutas de la aplicacion
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta raiz redirige al login */}
        <Route path='/' element={<Navigate to='/login' replace />} />
        <Route path='/login' element={<Login />} />
        <Route path='/registro' element={<Registro />} />
        {/* Ruta protegida - requiere sesion activa */}
        <Route
          path='/portafolio'
          element={
            <PrivateRoute>
              <Portafolio />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
