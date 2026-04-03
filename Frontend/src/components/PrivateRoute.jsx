import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  // Mientras verifica el usuario (cuando se llama a /me)
  if (loading) {
    return <p>Cargando...</p>;
  }

  // Si NO hay usuario → redirige al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si hay usuario → muestra la vista protegida
  return children;
}

export default PrivateRoute;