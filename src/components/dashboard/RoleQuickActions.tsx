import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Building2, FolderOpen, Plug, Activity, MessageSquare, Settings, ChartBar as BarChart2 } from 'lucide-react';
import { UserRole } from '@/types';
import { cn } from '@/lib/utils';

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

const ALL_ACTIONS: Record<string, QuickAction> = {
  users: {
    label: 'Manage Users',
    description: 'Add, edit or deactivate users',
    href: '/users',
    icon: Users,
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  lobs: {
    label: 'Lines of Business',
    description: 'View and manage LOBs',
    href: '/lobs',
    icon: Building2,
    color: 'text-primary-600',
    bg: 'bg-primary-50',
  },
  projects: {
    label: 'Projects',
    description: 'Browse all projects',
    href: '/projects',
    icon: FolderOpen,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
  connectors: {
    label: 'Connectors',
    description: 'Configure service endpoints',
    href: '/connectors',
    icon: Plug,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  health: {
    label: 'Health Monitor',
    description: 'Real-time service health',
    href: '/health',
    icon: Activity,
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  chatbot: {
    label: 'AI Assistant',
    description: 'Query the AI intelligence layer',
    href: '/chatbot',
    icon: MessageSquare,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
  },
  settings: {
    label: 'Settings',
    description: 'Platform configuration',
    href: '/settings',
    icon: Settings,
    color: 'text-neutral-600',
    bg: 'bg-neutral-100',
  },
  analytics: {
    label: 'Analytics',
    description: 'Trends and reports',
    href: '/health',
    icon: BarChart2,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
};

const ROLE_ACTIONS: Record<UserRole, string[]> = {
  super_admin: ['users', 'lobs', 'projects', 'connectors', 'health', 'chatbot', 'settings'],
  admin: ['users', 'lobs', 'projects', 'connectors', 'health', 'chatbot'],
  lob_admin: ['lobs', 'projects', 'connectors', 'health', 'chatbot'],
  project_admin: ['projects', 'connectors', 'health', 'chatbot'],
  analyst: ['analytics', 'health', 'projects', 'chatbot'],
  viewer: ['health', 'projects', 'chatbot'],
  project_user: ['projects', 'connectors', 'health', 'chatbot'],
};

export function RoleQuickActions({ role }: { role: UserRole }) {
  const actionKeys = ROLE_ACTIONS[role] || [];
  const actions = actionKeys.map((key) => ALL_ACTIONS[key]).filter(Boolean);

  return (
    <div>
      <h3 className="text-sm font-semibold text-neutral-700 mb-3">Quick Access</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href + action.label}
              to={action.href}
              className={cn(
                'flex flex-col gap-2.5 p-4 rounded-2xl border border-neutral-100 bg-white',
                'hover:border-neutral-200 hover:shadow-sm transition-all duration-150 group',
              )}
            >
              <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', action.bg)}>
                <Icon className={cn('w-4 h-4', action.color)} />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-800 leading-tight group-hover:text-neutral-900">{action.label}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">{action.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
