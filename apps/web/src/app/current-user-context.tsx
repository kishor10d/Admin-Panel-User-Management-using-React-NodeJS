import { createContext, useContext, type ReactNode } from 'react';
import type { CurrentUser } from '../features/auth/api/auth-api';

const CurrentUserContext = createContext<CurrentUser | null>(null);

export function CurrentUserProvider({ user, children }: { user: CurrentUser; children: ReactNode }) {
  return <CurrentUserContext.Provider value={user}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser() {
  const user = useContext(CurrentUserContext);
  if (!user) throw new Error('useCurrentUser must be used within CurrentUserProvider.');
  return user;
}

export function hasPermission(user: CurrentUser, permission: string) {
  return user.userType === 'SYSTEM_ADMINISTRATOR' || user.permissions.includes(permission);
}

export function isSystemAdministrator(user: CurrentUser) {
  return user.userType === 'SYSTEM_ADMINISTRATOR';
}
