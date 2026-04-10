import { Link, useLocation } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiAccount, mdiCodeTags, mdiHome } from '@mdi/js';
import './MainNavbar.css';

const NAV_ITEMS = [
  { id: 'inicio', label: 'Inicio', route: '/portafolio', icon: mdiHome },
  { id: 'portafolio', label: 'Mi portafolio', route: '/portafolio', icon: mdiCodeTags },
  { id: 'perfil', label: 'Mi perfil', route: '/perfil', icon: mdiAccount },
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
          <div className="softsave-navbar__logo">{'{S}'}</div>
          <div className="softsave-navbar__brand-text">
            <span className="softsave-navbar__brand-title">DevStack</span>
            <span className="softsave-navbar__brand-subtitle">Perfil profesional</span>
          </div>
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
                <Icon path={item.icon} size={1} />
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
