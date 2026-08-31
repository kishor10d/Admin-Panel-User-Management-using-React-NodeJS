import { Link, NavLink } from 'react-router-dom';
import { navigationSections, type NavigationItem } from './navigation';
import { hasPermission, useCurrentUser } from '../../app/current-user-context';

export function Sidebar() {
  const user = useCurrentUser();
  return (
    <aside className="app-sidebar bg-body-secondary shadow" data-bs-theme="dark">
      <div className="sidebar-brand">
        <Link className="brand-link text-decoration-none" to="/">
          <i className="bi bi-shield-lock-fill brand-image opacity-75" />
          <span className="brand-text fw-light">CIAS Admin</span>
        </Link>
      </div>
      <div className="sidebar-wrapper">
        <nav className="mt-3" aria-label="Primary navigation">
          <ul className="nav sidebar-menu flex-column" role="menu">
            {navigationSections.map((section) => {
              const visibleItems = section.items.filter((item) => !item.permission || hasPermission(user, item.permission));
              return visibleItems.length > 0 && (
              <li key={section.label}>
                <div className="nav-header">{section.label}</div>
                <ul className="nav flex-column">
                  {visibleItems.map((item) => <SidebarLink key={item.to} {...item} />)}
                </ul>
              </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}

function SidebarLink({ to, end, icon, label }: NavigationItem) {
  return (
    <li className="nav-item">
      <NavLink end={end} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
        <i className={`nav-icon bi ${icon}`} />
        <p>{label}</p>
      </NavLink>
    </li>
  );
}
