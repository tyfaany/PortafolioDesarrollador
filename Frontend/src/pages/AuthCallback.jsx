import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useFeedback from '../hooks/useFeedback';

function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { showFeedback } = useFeedback();

  useEffect(() => {
    const procesarCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        showFeedback(error, 'error');
        navigate('/perfil/contacto', { replace: true });
        return;
      }

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
  }, [navigate, refreshUser, searchParams, showFeedback]);

  return <p>Procesando autenticacion...</p>;
}

export default AuthCallback;
