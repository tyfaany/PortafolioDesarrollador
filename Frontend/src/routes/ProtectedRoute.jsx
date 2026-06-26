import PropTypes from 'prop-types';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuth from '../hooks/useAuth';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const estaVerificado = Boolean(user?.email_verified_at);

  useEffect(() => {
    if (!loading && isAuthenticated && !estaVerificado) {
      sessionStorage.setItem(
        'verification_pending',
        'Debes verificar tu correo electrónico antes de continuar.',
      );
      logout().finally(() => {
        navigate('/login', {
          replace: true,
          state: { from: location.pathname },
        });
      });
    }
  }, [estaVerificado, isAuthenticated, loading, location.pathname, logout, navigate]);

  if (loading) {
    return <p>Cargando...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!estaVerificado) {
    return <p>Verificando tu cuenta...</p>;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
