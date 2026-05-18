import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const procesarCallback = async () => {
      const token = searchParams.get('token');

      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('last_activity_at', String(Date.now()));

      try {
        await refreshUser();
        navigate('/perfil/contacto', { replace: true });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('last_activity_at');
        navigate('/login', { replace: true });
      }
    };

    procesarCallback();
  }, [navigate, refreshUser, searchParams]);

  return <p>Procesando autenticacion...</p>;
}

export default AuthCallback;
