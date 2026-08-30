import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppLayout } from '../components/layout/app-layout';
import { authApi } from '../features/auth/api/auth-api';
import { LoginPage } from '../features/auth/pages/login-page';
import { ForgotPasswordPage, ResetPasswordPage } from '../features/auth/pages/password-pages';
import { DashboardPage } from '../features/dashboard/pages/dashboard-page';
import { LoginHistoryPage } from '../features/login-history/pages/login-history-page';
import { ProfilePage } from '../features/profile/pages/profile-page';
import { RolesPage } from '../features/roles/pages/roles-page';
import { UsersPage } from '../features/users/pages/users-page';
import { setLogoutIntent, type RootState } from './store';
import { useToast } from './toast-provider';

export function App() {
  return <Routes>
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="*" element={<AuthenticatedApp />} />
  </Routes>;
}

function AuthenticatedApp() {
  const location = useLocation();
  const dispatch = useDispatch();
  const toast = useToast();
  const logoutIntent = useSelector((state: RootState) => state.app.logoutIntent);
  const previouslyAuthenticated = useRef(false);
  const returnedToLogin = useRef(false);
  const sessionErrorNotified = useRef(false);
  const currentUser = useQuery({ queryKey: ['auth', 'me'], queryFn: authApi.me, retry: false });

  useEffect(() => {
    if (currentUser.isSuccess) {
      if (returnedToLogin.current) dispatch(setLogoutIntent(false));
      previouslyAuthenticated.current = true;
      returnedToLogin.current = false;
      sessionErrorNotified.current = false;
      return;
    }

    if (currentUser.isError) {
      if (previouslyAuthenticated.current && !logoutIntent && !sessionErrorNotified.current) {
        toast.error('Your session has expired. Please sign in again.');
        sessionErrorNotified.current = true;
      }
      returnedToLogin.current = true;
    }
  }, [currentUser.isError, currentUser.isSuccess, dispatch, logoutIntent, toast]);

  if (currentUser.isPending) return <main className="min-vh-100 d-flex align-items-center justify-content-center bg-body-secondary">Loading CIAS Admin…</main>;
  if (currentUser.isError) return location.pathname === '/' ? <LoginPage /> : <Navigate to="/" replace />;

  return <Routes><Route element={<AppLayout user={currentUser.data.user} />}><Route index element={<DashboardPage />} /><Route path="users" element={<UsersPage />} /><Route path="roles" element={<RolesPage />} /><Route path="login-history" element={<LoginHistoryPage />} /><Route path="profile" element={<ProfilePage />} /><Route path="*" element={<Navigate to="/" replace />} /></Route></Routes>;
}
