import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { HealthResponse } from '@cias/shared-types';
import { Link, NavLink, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { authApi } from './auth';
import { LoginPage } from './login-page';
import { RolesPage } from './roles-page';
import { UsersPage } from './users-page';
import { ChangePasswordPage, ResetPasswordPage } from './password-pages';
import { LoginHistoryPage } from './login-history-page';

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
  const logout = useMutation({ mutationFn: authApi.logout, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }) });
  return (
    <main className="app-shell">
      <aside className="sidebar"><Link className="brand" to="/">CIAS Admin</Link><nav aria-label="Primary navigation"><NavLink end to="/">Dashboard</NavLink><NavLink to="/users">Users</NavLink><NavLink to="/roles">Roles & permissions</NavLink><NavLink to="/login-history">Login history</NavLink><NavLink to="/change-password">Change password</NavLink></nav></aside>
      <section className="content"><header><div><h1>Administration</h1><span>Signed in as {user.name ?? user.email}</span></div><button className="logout-button" onClick={() => logout.mutate()} disabled={logout.isPending}>Sign out</button></header><Outlet /></section>
    </main>
  );
}

function Dashboard({ health }: { health: ReturnType<typeof useQuery<HealthResponse>> }) {
  return (
    <>
      <div className="page-heading"><div><h1>Dashboard</h1><p>React + NestJS administration foundation</p></div></div>
        <div className="status-card">
          <h2>API status</h2>
          {health.isPending && <p>Connecting to API…</p>}
          {health.isError && <p className="status-error">The API is not running yet.</p>}
          {health.data && <p className="status-ok">Connected. Database: {health.data.database}.</p>}
        </div>
        <div className="next-steps">
          <h2>Ready for development</h2>
          <p>The base workspace, API health check, client state, server-state cache, and database migration foundation are in place.</p>
        </div>
    </>
  );
}
