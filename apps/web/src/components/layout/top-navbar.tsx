import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi, type CurrentUser } from '../../features/auth/api/auth-api';
import { setLogoutIntent, setSidebarCollapsed, type RootState } from '../../app/store';
import { useToast } from '../../app/toast-provider';
import { hasPermission, useCurrentUser } from '../../app/current-user-context';

export function TopNavbar({ user }: { user: Pick<CurrentUser, 'email' | 'name' | 'roles'> }) {
  const currentUser = useCurrentUser();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const sidebarCollapsed = useSelector((state: RootState) => state.app.sidebarCollapsed);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const toast = useToast();
  const logout = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      dispatch(setLogoutIntent(true));
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <nav className="app-header navbar navbar-expand bg-body">
      <div className="container-fluid">
        <ul className="navbar-nav">
          <li className="nav-item"><button className="nav-link border-0 bg-transparent" onClick={() => dispatch(setSidebarCollapsed(!sidebarCollapsed))} aria-label="Toggle sidebar"><i className="bi bi-list" /></button></li>
          <li className="nav-item d-none d-md-block"><Link className="nav-link" to="/">Dashboard</Link></li>
          {hasPermission(currentUser, 'users.read') && <li className="nav-item d-none d-md-block"><Link className="nav-link" to="/users">Users</Link></li>}
        </ul>
        <ul className="navbar-nav ms-auto">
          <li className="nav-item dropdown user-menu">
            <button className="nav-link dropdown-toggle border-0 bg-transparent" onClick={() => setUserMenuOpen((open) => !open)} aria-expanded={userMenuOpen} aria-haspopup="true">
              <i className="bi bi-person-circle me-1" />
              <span className="d-none d-md-inline">{user.name ?? user.email}</span>
            </button>
            <ul className={`dropdown-menu dropdown-menu-lg dropdown-menu-end ${userMenuOpen ? 'show' : ''}`} data-bs-popper="static">
              <li className="user-header text-bg-primary text-center">
                <i className="bi bi-person-circle display-1" aria-hidden="true" />
                <p className="mb-0">{user.name ?? user.email}<small className="d-block">{user.email}</small></p>
              </li>
              <li className="px-3 py-2 text-center small text-body-secondary">{user.roles.length ? user.roles.join(', ') : 'No assigned roles'}</li>
              <li className="user-footer">
                <Link className="btn btn-outline-secondary" to="/profile" onClick={() => setUserMenuOpen(false)}>Profile</Link>
                <button className="btn btn-outline-danger float-end" onClick={() => logout.mutate()} disabled={logout.isPending}>{logout.isPending ? 'Signing out…' : 'Sign out'}</button>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </nav>
  );
}
