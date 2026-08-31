import { Navigate, Outlet } from 'react-router-dom';
import { hasPermission, useCurrentUser } from './current-user-context';

export function PermissionGate({ permission }: { permission: string }) {
  const user = useCurrentUser();
  return hasPermission(user, permission) ? <Outlet /> : <Navigate to="/access-denied" replace />;
}
