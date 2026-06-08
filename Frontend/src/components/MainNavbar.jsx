import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiAccountCircle, mdiFolder, mdiHome, mdiLogoutVariant } from '@mdi/js';
import useAuth from '../hooks/useAuth';
import "../styles/MainNavbar.css";

const NAV_ITEMS = [
  { id: 'inicio', label: 'Inicio', route: '/inicio', icon: mdiHome },
  { id: 'portafolio', label: 'Mi portafolio', route: '/portafolio', icon: mdiFolder },
  { id: 'perfil', label: 'Mi perfil', route: '/perfil', icon: mdiAccountCircle },
];

function obtenerNavActivo(pathname) {
  if (pathname.startsWith('/perfil')) {
    return 'perfil';
  }

  if (pathname.startsWith('/portafolio')) {
    return 'portafolio';
  }

  if (pathname.startsWith('/inicio')) {
    return 'inicio';
  }

  return 'inicio';
}

function MainNavbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const navActivo = obtenerNavActivo(pathname);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);

  const manejarCerrarSesion = async () => {
    if (cerrandoSesion) {
      return;
    }

    setCerrandoSesion(true);

    try {
      await logout();
    } finally {
      setCerrandoSesion(false);
      navigate('/login', { replace: true });
    }
  };

  return (
    <header className="softsave-navbar">
      <div className="softsave-navbar__container">
        <div className="softsave-navbar__brand">
          <div className="softsave-navbar__logo" aria-hidden="true">
            <span className="softsave-navbar__logo-brace">{'{'}</span>
            <span className="softsave-navbar__logo-letter">S</span>
            <span className="softsave-navbar__logo-brace">{'}'}</span>
          </div>
          <span className="softsave-navbar__brand-title">DevStack</span>
        </div>

        <nav className="softsave-navbar__nav" aria-label="Navegacion principal">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.id}
              to={item.route}
              className={`softsave-navbar__nav-item ${navActivo === item.id ? 'is-active' : ''}`}
              aria-current={navActivo === item.id ? 'page' : undefined}
            >
              <span className="softsave-navbar__nav-icon" aria-hidden="true">
                <Icon path={item.icon} size={1.5} />
              </span>
              <span>{item.label}</span>
            </Link>
          ))}

          {isAuthenticated ? (
            <button
              type="button"
              className="softsave-navbar__nav-item softsave-navbar__nav-item--button softsave-navbar__nav-item--logout"
              onClick={manejarCerrarSesion}
              disabled={cerrandoSesion}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <span className="softsave-navbar__nav-icon" aria-hidden="true">
                <Icon path={mdiLogoutVariant} size={1.5} />
              </span>
              <span>{cerrandoSesion ? 'Saliendo...' : 'Salir'}</span>
            </button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}

export default MainNavbar;
