export const colors = {
  ivory: {
    bg: '#F5F2EC',
    bgSubtle: '#FAF8F5',
    bgMuted: '#EDE9E0',
    border: 'rgba(0,0,0,0.07)',
  },
  glass: {
    surface: 'rgba(253, 252, 250, 0.88)',
    surfaceDark: 'rgba(39, 39, 42, 0.82)',
    border: 'rgba(255,255,255,0.72)',
    borderDark: 'rgba(255,255,255,0.10)',
  },
  primary: '#0A84FF',
  success: '#30D158',
  warning: '#FF9F0A',
  danger: '#FF453A',
  neutral: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
  },
};

export const shadow = {
  xs: '0 1px 2px rgba(0,0,0,0.04)',
  sm: '0 2px 8px -2px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
  md: '0 4px 16px -4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
  lg: '0 8px 32px -6px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.06)',
  xl: '0 16px 48px -8px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)',
  modal: '0 24px 64px -12px rgba(0,0,0,0.20), 0 0 0 1px rgba(0,0,0,0.06)',
  glow: {
    primary: '0 0 0 3px rgba(10,132,255,0.15)',
    success: '0 0 0 3px rgba(48,209,88,0.15)',
    danger: '0 0 0 3px rgba(255,69,58,0.15)',
  },
};

export const radius = {
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '2rem',
  full: '9999px',
};

export const spacing = {
  sidebar: 260,
  sidebarCollapsed: 64,
  header: 64,
  contentPadding: 32,
};

export const transition = {
  fast: 'all 0.12s ease',
  base: 'all 0.18s ease',
  slow: 'all 0.28s ease',
  spring: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
};

export const statusConfig = {
  healthy: {
    label: 'Healthy',
    color: '#30D158',
    bg: '#ECFDF5',
    border: '#D1FAE5',
    text: '#059669',
  },
  degraded: {
    label: 'Degraded',
    color: '#FF9F0A',
    bg: '#FFFBEB',
    border: '#FEF3C7',
    text: '#92400E',
  },
  down: {
    label: 'Down',
    color: '#FF453A',
    bg: '#FEF2F2',
    border: '#FEE2E2',
    text: '#DC2626',
  },
  unknown: {
    label: 'Unknown',
    color: '#A1A1AA',
    bg: '#F4F4F5',
    border: '#E4E4E7',
    text: '#52525B',
  },
  active: {
    label: 'Active',
    color: '#0A84FF',
    bg: '#EBF4FF',
    border: '#DBEAFE',
    text: '#1D4ED8',
  },
  maintenance: {
    label: 'Maintenance',
    color: '#F59E0B',
    bg: '#FFFBEB',
    border: '#FEF3C7',
    text: '#92400E',
  },
};

export const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Lines of Business', href: '/lobs', icon: 'Building2' },
  { label: 'Projects', href: '/projects', icon: 'FolderOpen' },
  { label: 'Connectors', href: '/connectors', icon: 'Plug' },
  { label: 'Health Monitor', href: '/health', icon: 'Activity' },
  { label: 'AI Assistant', href: '/chatbot', icon: 'MessageSquare' },
];

export const bottomNavItems = [
  { label: 'Users', href: '/users', icon: 'Users' },
  { label: 'Settings', href: '/settings', icon: 'Settings' },
];
