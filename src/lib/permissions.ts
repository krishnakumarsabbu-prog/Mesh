import { UserRole } from '@/types';

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  lob_admin: 'LOB Admin',
  project_admin: 'Project Admin',
  project_user: 'Project User',
  admin: 'Admin',
  analyst: 'Analyst',
  viewer: 'Viewer',
};

export const ROLE_COLORS: Record<UserRole, { bg: string; text: string; border: string }> = {
  super_admin:   { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-100' },
  lob_admin:     { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-100' },
  project_admin: { bg: 'bg-primary-50', text: 'text-primary-600', border: 'border-primary-100' },
  project_user:  { bg: 'bg-teal-50',    text: 'text-teal-600',    border: 'border-teal-100' },
  admin:         { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-100' },
  analyst:       { bg: 'bg-primary-50', text: 'text-primary-600', border: 'border-primary-100' },
  viewer:        { bg: 'bg-neutral-50', text: 'text-neutral-500', border: 'border-neutral-100' },
};

export const ADMIN_ROLES: UserRole[] = ['super_admin', 'lob_admin', 'project_admin', 'admin'];
export const SUPER_ROLES: UserRole[] = ['super_admin'];

export function isAdmin(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role);
}

export function isSuperAdmin(role: UserRole): boolean {
  return SUPER_ROLES.includes(role);
}

export function canManageUsers(role: UserRole): boolean {
  return isAdmin(role);
}

export function canAssignRole(actorRole: UserRole, targetRole: UserRole): boolean {
  if (targetRole === 'super_admin') return isSuperAdmin(actorRole);
  return isAdmin(actorRole);
}

export const ALL_ROLES: UserRole[] = [
  'super_admin',
  'lob_admin',
  'project_admin',
  'project_user',
  'admin',
  'analyst',
  'viewer',
];

export function isLobAdmin(role: UserRole): boolean {
  return ['super_admin', 'lob_admin', 'admin'].includes(role);
}

export function canManageProjects(role: UserRole): boolean {
  return ['super_admin', 'lob_admin', 'project_admin', 'admin'].includes(role);
}
