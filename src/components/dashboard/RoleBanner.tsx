import React from 'react';
import { Shield, Crown, Building2, FolderOpen, ChartBar as BarChart2, Eye, Users } from 'lucide-react';
import { UserRole } from '@/types';
import { cn } from '@/lib/utils';

interface RoleBannerConfig {
  icon: React.ElementType;
  label: string;
  description: string;
  gradient: string;
  iconBg: string;
  iconColor: string;
  capabilities: string[];
}

const ROLE_CONFIGS: Record<UserRole, RoleBannerConfig> = {
  super_admin: {
    icon: Crown,
    label: 'Super Admin',
    description: 'You have full platform access — manage users, all LOBs, projects, connectors, and system settings.',
    gradient: 'from-red-50 to-rose-50',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    capabilities: ['Manage all users & roles', 'Full LOB & project control', 'System configuration', 'Audit log access'],
  },
  admin: {
    icon: Shield,
    label: 'Admin',
    description: 'You have broad platform access to manage LOBs, projects, connectors and users.',
    gradient: 'from-amber-50 to-yellow-50',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    capabilities: ['Manage users', 'All LOBs & projects', 'Connector management', 'Health monitoring'],
  },
  lob_admin: {
    icon: Building2,
    label: 'LOB Admin',
    description: 'You manage a Line of Business, its projects, and members within your assigned scope.',
    gradient: 'from-orange-50 to-amber-50',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    capabilities: ['Manage LOB settings', 'Add & remove members', 'Oversee projects', 'Monitor LOB health'],
  },
  project_admin: {
    icon: FolderOpen,
    label: 'Project Admin',
    description: 'You manage connectors, health checks, and members within your assigned projects.',
    gradient: 'from-sky-50 to-blue-50',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
    capabilities: ['Manage project connectors', 'Configure health checks', 'Project member access', 'View project reports'],
  },
  analyst: {
    icon: BarChart2,
    label: 'Analyst',
    description: 'You have read access to analytics, health reports, trends and dashboards.',
    gradient: 'from-teal-50 to-emerald-50',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    capabilities: ['View all health data', 'Access trend reports', 'Export analytics', 'Monitor connectors'],
  },
  viewer: {
    icon: Eye,
    label: 'Viewer',
    description: 'You have read-only access to resources assigned to you.',
    gradient: 'from-neutral-50 to-slate-50',
    iconBg: 'bg-neutral-100',
    iconColor: 'text-neutral-500',
    capabilities: ['View assigned resources', 'Read-only dashboard', 'Monitor connector status'],
  },
  project_user: {
    icon: Users,
    label: 'Project User',
    description: 'You can interact with data and connectors within your assigned projects.',
    gradient: 'from-green-50 to-emerald-50',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    capabilities: ['Interact with project data', 'View connector status', 'Submit chatbot queries', 'Monitor assigned projects'],
  },
};

export function RoleBanner({ role, name }: { role: UserRole; name: string }) {
  const config = ROLE_CONFIGS[role];
  const Icon = config.icon;
  const firstName = name?.split(' ')[0] || 'there';

  return (
    <div className={cn('rounded-2xl border border-neutral-100 bg-gradient-to-r p-5 flex items-start gap-4', config.gradient)}>
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', config.iconBg)}>
        <Icon className={cn('w-5 h-5', config.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h2 className="text-base font-bold text-neutral-900">Welcome back, {firstName}</h2>
          <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-lg border', config.iconBg, config.iconColor, 'border-transparent')}>
            {config.label}
          </span>
        </div>
        <p className="text-sm text-neutral-500 leading-snug mb-3">{config.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {config.capabilities.map((cap) => (
            <span key={cap} className="text-[11px] text-neutral-600 bg-white/70 border border-neutral-200/80 px-2 py-0.5 rounded-lg font-medium">
              {cap}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
