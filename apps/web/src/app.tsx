import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import type { HealthResponse } from '@cias/shared-types';
import { Link, NavLink, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { authApi } from './auth';
import { LoginPage } from './login-page';
import { RolesPage } from './roles-page';
import { UsersPage } from './users-page';
import { ChangePasswordPage, ResetPasswordPage } from './password-pages';
import { LoginHistoryPage } from './login-history-page';
import { setSidebarCollapsed, type RootState } from './store';

async function getHealth(): Promise<HealthResponse> {
  const response = await fetch('/api/health', { credentials: 'include' });
  if (!response.ok) throw new Error('API is unavailable');
  return response.json() as Promise<HealthResponse>;
}

export function App() {
  const location = useLocation();
  const health = useQuery({ queryKey: ['health'], queryFn: getHealth, retry: false });
  const currentUser = useQuery({ queryKey: ['auth', 'me'], queryFn: authApi.me, retry: false });

  if (location.pathname === '/reset-password') return <ResetPasswordPage />;
  if (currentUser.isPending) return <main className="loading-screen">Loading CIAS Admin…</main>;
  if (currentUser.isError) return <LoginPage />;

  return <Routes><Route element={<AdminLayout user={currentUser.data.user} />}><Route index element={<Dashboard health={health} />} /><Route path="users" element={<UsersPage />} /><Route path="roles" element={<RolesPage />} /><Route path="login-history" element={<LoginHistoryPage />} /><Route path="change-password" element={<ChangePasswordPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Route></Routes>;
}

function AdminLayout({ user }: { user: { email: string; name: string | null } }) {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const sidebarCollapsed = useSelector((state: RootState) => state.app.sidebarCollapsed);
  const location = useLocation();
  const pageTitle = ({ '/': 'Dashboard', '/users': 'Users', '/roles': 'Roles & permissions', '/login-history': 'Login history', '/change-password': 'Change password' } as Record<string, string>)[location.pathname] ?? 'Admin panel';
  const logout = useMutation({ mutationFn: authApi.logout, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }) });
  return (
    <div className={`app-wrapper sidebar-expand-lg ${sidebarCollapsed ? 'sidebar-collapse' : ''}`}>
      <nav className="app-header navbar navbar-expand bg-body shadow-sm">
        <div className="container-fluid">
          <button className="btn btn-link text-body fs-4" onClick={() => dispatch(setSidebarCollapsed(!sidebarCollapsed))} aria-label="Toggle sidebar"><i className="bi bi-list" /></button>
          <ul className="navbar-nav ms-auto align-items-center"><li className="nav-item d-none d-md-block text-secondary me-3"><i className="bi bi-person-circle me-1" /> {user.name ?? user.email}</li><li className="nav-item"><button className="btn btn-outline-secondary btn-sm" onClick={() => logout.mutate()} disabled={logout.isPending}><i className="bi bi-box-arrow-right me-1" /> Sign out</button></li></ul>
        </div>
      </nav>
      <aside className="app-sidebar bg-body-secondary shadow" data-bs-theme="dark">
        <div className="sidebar-brand"><Link className="brand-link text-decoration-none" to="/"><i className="bi bi-shield-lock-fill brand-image opacity-75" /><span className="brand-text fw-light">CIAS Admin</span></Link></div>
        <div className="sidebar-wrapper"><nav className="mt-3" aria-label="Primary navigation"><ul className="nav sidebar-menu flex-column" role="menu"><li className="nav-header">ADMINISTRATION</li><SidebarLink to="/" end icon="bi-speedometer2">Dashboard</SidebarLink><SidebarLink to="/users" icon="bi-people-fill">Users</SidebarLink><SidebarLink to="/roles" icon="bi-shield-check">Roles & permissions</SidebarLink><li className="nav-header">SECURITY</li><SidebarLink to="/login-history" icon="bi-clock-history">Login history</SidebarLink><SidebarLink to="/change-password" icon="bi-key-fill">Change password</SidebarLink></ul></nav></div>
      </aside>
      <main className="app-main">
        <div className="app-content-header"><div className="container-fluid"><div className="row align-items-center"><div className="col-sm-6"><h3 className="mb-0">{pageTitle}</h3></div><div className="col-sm-6"><ol className="breadcrumb float-sm-end mb-0"><li className="breadcrumb-item"><Link to="/">Home</Link></li><li className="breadcrumb-item active">{pageTitle}</li></ol></div></div></div></div>
        <div className="app-content"><div className="container-fluid"><Outlet /></div></div>
      </main>
      <footer className="app-footer"><span>Copyright © 2026 CIAS. All rights reserved.</span><span className="float-end d-none d-sm-inline">React + NestJS</span></footer>
    </div>
  );
}

function SidebarLink({ to, end, icon, children }: { to: string; end?: boolean; icon: string; children: string }) {
  return <li className="nav-item"><NavLink end={end} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><i className={`nav-icon bi ${icon}`} /><p>{children}</p></NavLink></li>;
}

function Dashboard({ health }: { health: ReturnType<typeof useQuery<HealthResponse>> }) {
  return (
    <><div className="row"><div className="col-lg-3 col-6"><div className="small-box text-bg-primary"><div className="inner"><h3>Users</h3><p>User management</p></div><i className="small-box-icon bi bi-people-fill" /><Link className="small-box-footer" to="/users">Manage users <i className="bi bi-arrow-right-circle" /></Link></div></div><div className="col-lg-3 col-6"><div className="small-box text-bg-success"><div className="inner"><h3>Roles</h3><p>Access control</p></div><i className="small-box-icon bi bi-shield-check" /><Link className="small-box-footer" to="/roles">Manage roles <i className="bi bi-arrow-right-circle" /></Link></div></div><div className="col-lg-3 col-6"><div className="small-box text-bg-warning"><div className="inner"><h3>Audit</h3><p>Login activity</p></div><i className="small-box-icon bi bi-clock-history" /><Link className="small-box-footer" to="/login-history">View history <i className="bi bi-arrow-right-circle" /></Link></div></div><div className="col-lg-3 col-6"><div className="small-box text-bg-info"><div className="inner"><h3>{health.data?.database === 'configured' ? 'Online' : 'Offline'}</h3><p>Database status</p></div><i className="small-box-icon bi bi-database-check" /><span className="small-box-footer">{health.isPending ? 'Checking API…' : health.isError ? 'API unavailable' : `Database: ${health.data?.database}`}</span></div></div></div><div className="row"><div className="col-lg-7"><div className="card"><div className="card-header"><h3 className="card-title"><i className="bi bi-lightning-charge-fill me-2" />Quick start</h3></div><div className="card-body"><p className="mb-3">Use the menu to manage users and role permissions, inspect sign-in activity, or update your password.</p><div className="d-flex flex-wrap gap-2"><Link className="btn btn-primary" to="/users"><i className="bi bi-person-plus-fill me-1" /> Add user</Link><Link className="btn btn-outline-secondary" to="/roles">Configure roles</Link></div></div></div></div><div className="col-lg-5"><div className="card card-outline card-primary"><div className="card-header"><h3 className="card-title">System status</h3></div><div className="card-body"><div className="d-flex justify-content-between border-bottom pb-2 mb-2"><span>API</span><strong className={health.isError ? 'text-danger' : 'text-success'}>{health.isError ? 'Unavailable' : 'Connected'}</strong></div><div className="d-flex justify-content-between"><span>Database</span><strong>{health.data?.database ?? 'Checking'}</strong></div></div></div></div></div></>
  );
}
