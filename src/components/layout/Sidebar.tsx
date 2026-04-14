import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Building2, FolderOpen, Plug, Activity,
  MessageSquare, Settings, ChevronLeft, ChevronRight, Users,
  Zap, LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { isAdmin, ROLE_LABELS } from '@/lib/permissions';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  description?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, description: 'Overview & metrics' },
  { label: 'Lines of Business', href: '/lobs', icon: Building2, description: 'Manage LOBs' },
  { label: 'Projects', href: '/projects', icon: FolderOpen, description: 'All projects' },
  { label: 'Connectors', href: '/connectors', icon: Plug, description: 'Service endpoints' },
  { label: 'Health Monitor', href: '/health', icon: Activity, description: 'Real-time health' },
  { label: 'AI Assistant', href: '/chatbot', icon: MessageSquare, description: 'Intelligence layer' },
];

const bottomNavItems: NavItem[] = [
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Settings', href: '/settings', icon: Settings },
];

function SidebarNavItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon;
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <NavLink
      to={item.href}
      className={({ isActive }) => cn('sidebar-item', isActive && 'active')}
      onMouseEnter={() => collapsed && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.8} />
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {!collapsed && item.badge && (
        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary-500 text-white rounded-full leading-none">
          {item.badge}
        </span>
      )}
      {collapsed && showTooltip && (
        <div className="absolute left-full ml-3 z-50 pointer-events-none animate-fade-in">
          <div className="bg-neutral-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-xl whitespace-nowrap shadow-xl">
            {item.label}
            {item.description && (
              <span className="block text-neutral-400 text-[10px] font-normal mt-0.5">{item.description}</span>
            )}
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-neutral-900 rotate-45" />
          </div>
        </div>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const userIsAdmin = user ? isAdmin(user.role) : false;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-30 flex flex-col',
        'bg-[#FAF8F5] border-r border-neutral-200/70',
        'transition-all duration-300 ease-out',
        sidebarCollapsed ? 'w-16' : 'w-64',
      )}
      style={{ boxShadow: '1px 0 0 0 rgba(0,0,0,0.05)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 h-16 flex-shrink-0 px-4 border-b border-neutral-100">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-primary-500 to-primary-700 shadow-sm">
          <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        {!sidebarCollapsed && (
          <div className="flex-1 min-w-0 animate-fade-in">
            <p className="text-[13px] font-bold text-neutral-900 tracking-tight leading-tight">HealthMesh AI</p>
            <p className="text-[10px] text-neutral-400 tracking-wider uppercase">Enterprise Platform</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-none px-2.5 py-3">
        {!sidebarCollapsed && (
          <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest px-3 mb-2">
            Platform
          </p>
        )}
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <SidebarNavItem key={item.href} item={item} collapsed={sidebarCollapsed} />
          ))}
        </div>

        {userIsAdmin && (
          <div className={cn('space-y-0.5', !sidebarCollapsed ? 'mt-5' : 'mt-3 pt-3 border-t border-neutral-100')}>
            {!sidebarCollapsed && (
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest px-3 mb-2">
                Admin
              </p>
            )}
            {bottomNavItems.filter((item) => item.href === '/users').map((item) => (
              <SidebarNavItem key={item.href} item={item} collapsed={sidebarCollapsed} />
            ))}
          </div>
        )}
        <div className={cn('space-y-0.5', userIsAdmin ? 'mt-2' : (!sidebarCollapsed ? 'mt-5' : 'mt-3 pt-3 border-t border-neutral-100'))}>
          <SidebarNavItem key="/settings" item={{ label: 'Settings', href: '/settings', icon: Settings }} collapsed={sidebarCollapsed} />
        </div>
      </nav>

      {/* User profile */}
      {!sidebarCollapsed && user && (
        <div className="px-2.5 py-3 border-t border-neutral-100 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-neutral-100/80 transition-all cursor-pointer group">
            <div className="relative flex-shrink-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <span className="text-white text-[11px] font-bold">{user.full_name?.charAt(0)?.toUpperCase()}</span>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-[1.5px] border-[#FAF8F5]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-neutral-800 truncate leading-tight">{user.full_name}</p>
              <p className="text-[10px] text-neutral-400 leading-tight">{user.role ? ROLE_LABELS[user.role] : ''}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); logout(); }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-neutral-400 hover:text-danger-500 hover:bg-danger-50 transition-all"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {sidebarCollapsed && user && (
        <div className="flex justify-center px-2.5 py-3 border-t border-neutral-100 flex-shrink-0">
          <div className="relative">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <span className="text-white text-[11px] font-bold">{user.full_name?.charAt(0)?.toUpperCase()}</span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-[1.5px] border-[#FAF8F5]" />
          </div>
        </div>
      )}

      {/* Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3.5 top-[4.75rem] w-7 h-7 rounded-full bg-white border border-neutral-200 shadow-md flex items-center justify-center text-neutral-500 hover:text-neutral-800 hover:shadow-lg hover:scale-110 transition-all duration-200 z-10"
      >
        {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}

