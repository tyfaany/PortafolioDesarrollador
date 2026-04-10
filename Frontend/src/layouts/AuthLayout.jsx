import { Outlet } from 'react-router-dom';
import '../styles/Auth.css';
import '../styles/Ui.css';

function AuthLayout() {
  return (
    <div className="auth-page">
      <Outlet />
    </div>
  );
}

export default AuthLayout;
