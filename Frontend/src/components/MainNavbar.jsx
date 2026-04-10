import { Link, useLocation } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiAccountCircle, mdiFolder, mdiHome } from '@mdi/js';
import './MainNavbar.css';

const NAV_ITEMS = [
  { id: 'inicio', label: 'Inicio', route: '/portafolio', icon: mdiHome },
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

  return 'inicio';
}

function MainNavbar() {
  const { pathname } = useLocation();
  const navActivo = obtenerNavActivo(pathname);

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
        </nav>
      </div>
    </header>
  );
}

export default MainNavbar;
