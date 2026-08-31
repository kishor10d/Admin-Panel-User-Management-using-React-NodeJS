export interface NavigationItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
  permission?: string;
}

export const navigationSections: Array<{ label: string; items: NavigationItem[] }> = [
  {
    label: 'Administration',
    items: [
      { to: '/', label: 'Dashboard', icon: 'bi-speedometer2', end: true },
      { to: '/users', label: 'Users', icon: 'bi-people-fill', permission: 'users.read' },
      { to: '/roles', label: 'Roles & permissions', icon: 'bi-shield-check', permission: 'roles.read' },
    ],
  },
  {
    label: 'Security',
    items: [
      { to: '/login-history', label: 'Login history', icon: 'bi-clock-history', permission: 'login-history.read' },
    ],
  },
];

export const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/users': 'Users',
  '/roles': 'Roles & permissions',
  '/login-history': 'Login history',
  '/profile': 'Profile',
  '/access-denied': 'Access denied',
};
