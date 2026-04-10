import { Outlet } from 'react-router-dom';
import MainNavbar from '../components/MainNavbar';
import '../styles/MainNavbar.css';
import '../styles/Ui.css';

function MainLayout() {
  return (
    <div className="softsave-app-shell">
      <MainNavbar />
      <Outlet />
    </div>
  );
}

export default MainLayout;
