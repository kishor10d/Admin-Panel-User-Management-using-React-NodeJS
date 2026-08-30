export interface NavigationItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

export const navigationSections: Array<{ label: string; items: NavigationItem[] }> = [
  {
    label: 'Administration',
    items: [
      { to: '/', label: 'Dashboard', icon: 'bi-speedometer2', end: true },
      { to: '/users', label: 'Users', icon: 'bi-people-fill' },
      { to: '/roles', label: 'Roles & permissions', icon: 'bi-shield-check' },
    ],
  },
  {
    label: 'Security',
    items: [
      { to: '/login-history', label: 'Login history', icon: 'bi-clock-history' },
      { to: '/change-password', label: 'Change password', icon: 'bi-key-fill' },
    ],
  },
];

export const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/users': 'Users',
  '/roles': 'Roles & permissions',
  '/login-history': 'Login history',
  '/change-password': 'Change password',
  '/profile': 'Profile',
};
