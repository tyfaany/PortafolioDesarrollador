import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import useAuth from '../hooks/useAuth';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Mientras verifica el token al iniciar la app
  if (loading) {
    return <p>Cargando...</p>;
  }

  // Si no hay sesion activa redirigir al login
  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  // Si hay usuario → muestra la vista protegida
  return children;
}

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PrivateRoute;
