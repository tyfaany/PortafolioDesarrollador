import { Outlet } from 'react-router-dom';
import MainNavbar from '../components/MainNavbar';
import '../components/MainNavbar.css';
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
