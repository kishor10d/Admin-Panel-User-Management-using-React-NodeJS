import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '../../app/store';
import type { CurrentUser } from '../../features/auth/api/auth-api';
import { AppFooter } from './app-footer';
import { PageHeader } from './page-header';
import { Sidebar } from './sidebar';
import { TopNavbar } from './top-navbar';

export function AppLayout({ user }: { user: CurrentUser }) {
  const sidebarCollapsed = useSelector((state: RootState) => state.app.sidebarCollapsed);

  return (
    <div className={`app-wrapper sidebar-expand-lg ${sidebarCollapsed ? 'sidebar-collapse' : ''}`}>
      <TopNavbar user={user} />
      <Sidebar />
      <main className="app-main">
        <PageHeader />
        <div className="app-content"><div className="container-fluid"><Outlet /></div></div>
      </main>
      <AppFooter />
    </div>
  );
}
