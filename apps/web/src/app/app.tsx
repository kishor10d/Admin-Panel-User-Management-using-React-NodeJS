import { useQuery } from '@tanstack/react-query';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppLayout } from '../components/layout/app-layout';
import { authApi } from '../features/auth/api/auth-api';
import { LoginPage } from '../features/auth/pages/login-page';
import { ChangePasswordPage, ResetPasswordPage } from '../features/auth/pages/password-pages';
import { DashboardPage } from '../features/dashboard/pages/dashboard-page';
import { LoginHistoryPage } from '../features/login-history/pages/login-history-page';
import { RolesPage } from '../features/roles/pages/roles-page';
import { UsersPage } from '../features/users/pages/users-page';

export function App() {
  const location = useLocation();
  const currentUser = useQuery({ queryKey: ['auth', 'me'], queryFn: authApi.me, retry: false });

  if (location.pathname === '/reset-password') return <ResetPasswordPage />;
  if (currentUser.isPending) return <main className="loading-screen">Loading CIAS Admin…</main>;
  if (currentUser.isError) return <LoginPage />;

  return (
    <Routes>
      <Route element={<AppLayout user={currentUser.data.user} />}>
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="login-history" element={<LoginHistoryPage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
