export const colors = {
  graphite: {
    bg: '#0F1115',
    bgSubtle: '#161B22',
    bgMuted: '#1A202C',
    surface: 'rgba(22, 27, 34, 0.97)',
    surfaceRaised: 'rgba(29, 36, 48, 0.98)',
    border: 'rgba(255,255,255,0.07)',
  },
  neon: {
    DEFAULT: '#00E599',
    hover: '#00C97F',
    subtle: 'rgba(0,229,153,0.10)',
    glow: '0 0 20px rgba(0,229,153,0.25), 0 0 40px rgba(0,229,153,0.10)',
  },
  accent: {
    blue: '#3B82F6',
    amber: '#F59E0B',
    red: '#EF4444',
    teal: '#14B8A6',
    ai: '#818CF8',
  },
  text: {
    primary: '#E6EAF0',
    secondary: '#98A2B3',
    muted: '#667085',
  },
};

export const shadow = {
  xs: '0 1px 2px rgba(0,0,0,0.4)',
  sm: '0 2px 8px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
  md: '0 4px 16px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
  lg: '0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
  xl: '0 16px 48px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)',
  modal: '0 24px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.06)',
  neon: {
    sm: '0 0 8px rgba(0,229,153,0.4)',
    md: '0 0 20px rgba(0,229,153,0.25), 0 0 40px rgba(0,229,153,0.10)',
    lg: '0 0 40px rgba(0,229,153,0.3), 0 0 80px rgba(0,229,153,0.15)',
  },
  glow: {
    neon: '0 0 0 3px rgba(0,229,153,0.15)',
    blue: '0 0 0 3px rgba(59,130,246,0.15)',
    red: '0 0 0 3px rgba(239,68,68,0.15)',
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
    color: '#00E599',
    bg: 'rgba(0,229,153,0.08)',
    border: 'rgba(0,229,153,0.20)',
    text: '#00E599',
  },
  degraded: {
    label: 'Degraded',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.20)',
    text: '#F59E0B',
  },
  down: {
    label: 'Down',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.20)',
    text: '#EF4444',
  },
  unknown: {
    label: 'Unknown',
    color: '#6B7280',
    bg: 'rgba(107,114,128,0.08)',
    border: 'rgba(107,114,128,0.20)',
    text: '#9CA3AF',
  },
  active: {
    label: 'Active',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.20)',
    text: '#3B82F6',
  },
  maintenance: {
    label: 'Maintenance',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.20)',
    text: '#F59E0B',
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
