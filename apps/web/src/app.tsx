import { useQuery } from '@tanstack/react-query';
import type { HealthResponse } from '@cias/shared-types';
import { authApi } from './auth';
import { LoginPage } from './login-page';

async function getHealth(): Promise<HealthResponse> {
  const response = await fetch('/api/health', { credentials: 'include' });
  if (!response.ok) throw new Error('API is unavailable');
  return response.json() as Promise<HealthResponse>;
}

export function App() {
  const health = useQuery({ queryKey: ['health'], queryFn: getHealth, retry: false });
  const currentUser = useQuery({ queryKey: ['auth', 'me'], queryFn: authApi.me, retry: false });

  if (currentUser.isPending) return <main className="loading-screen">Loading CIAS Admin…</main>;
  if (currentUser.isError) return <LoginPage />;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">CIAS Admin</div>
        <nav aria-label="Primary navigation">
          <a className="active" href="#dashboard">Dashboard</a>
          <a href="#users">Users</a>
          <a href="#roles">Roles & permissions</a>
          <a href="#login-history">Login history</a>
        </nav>
      </aside>
      <section className="content">
        <header><h1>Dashboard</h1><span>Signed in as {currentUser.data.user.name ?? currentUser.data.user.email}</span></header>
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
      </section>
    </main>
  );
}
