import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { authApi, type CurrentUser } from '../../features/auth/api/auth-api';
import { setSidebarCollapsed, type RootState } from '../../app/store';

export function TopNavbar({ user }: { user: Pick<CurrentUser, 'email' | 'name'> }) {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const sidebarCollapsed = useSelector((state: RootState) => state.app.sidebarCollapsed);
  const logout = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }),
  });

  return (
    <nav className="app-header navbar navbar-expand bg-body shadow-sm">
      <div className="container-fluid">
        <button
          className="btn btn-link text-body fs-4"
          onClick={() => dispatch(setSidebarCollapsed(!sidebarCollapsed))}
          aria-label="Toggle sidebar"
        >
          <i className="bi bi-list" />
        </button>
        <ul className="navbar-nav ms-auto align-items-center">
          <li className="nav-item d-none d-md-block text-secondary me-3">
            <i className="bi bi-person-circle me-1" /> {user.name ?? user.email}
          </li>
          <li className="nav-item">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => logout.mutate()} disabled={logout.isPending}>
              <i className="bi bi-box-arrow-right me-1" /> Sign out
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
