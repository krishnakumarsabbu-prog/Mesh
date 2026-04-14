import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, FolderOpen, Plug, Activity, MessageSquare, Settings, ChevronLeft, ChevronRight, Users, Zap, LogOut, Shield, Library, ChartBar as BarChart2, FileText } from 'lucide-react';
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
  { label: 'Connector Catalog', href: '/connector-catalog', icon: Library, description: 'Catalog management' },
  { label: 'Health Monitor', href: '/health', icon: Activity, description: 'Real-time health' },
  { label: 'Health Rules', href: '/rules', icon: Shield, description: 'Configurable rules engine' },
  { label: 'Analytics', href: '/analytics', icon: BarChart2, description: 'Historical trends & SLA' },
  { label: 'AI Assistant', href: '/chatbot', icon: MessageSquare, description: 'Intelligence layer' },
];

const adminNavItems: NavItem[] = [
  { label: 'Users', href: '/users', icon: Users, description: 'User management' },
  { label: 'Audit Logs', href: '/audit', icon: FileText, description: 'System event trail' },
];

const systemNavItems: NavItem[] = [
  { label: 'Settings', href: '/settings', icon: Settings, description: 'Configuration' },
];

function NavTooltip({ label, description }: { label: string; description?: string }) {
  return (
    <div className="absolute left-full ml-3.5 z-[100] pointer-events-none animate-fade-in">
      <div
        className="rounded-xl px-3 py-2 whitespace-nowrap"
        style={{
          background: 'var(--sidebar-logo-text)',
          color: 'var(--text-inverse)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <p className="text-xs font-semibold leading-tight">{label}</p>
        {description && (
          <p className="text-[10px] opacity-60 font-normal mt-0.5 leading-tight">{description}</p>
        )}
        <div
          className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 rotate-45"
          style={{ background: 'var(--sidebar-logo-text)' }}
        />
      </div>
    </div>
  );
}

function SidebarNavItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon;
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  function handleMouseEnter() {
    if (collapsed) {
      timeoutRef.current = setTimeout(() => setShowTooltip(true), 120);
    }
  }

  function handleMouseLeave() {
    clearTimeout(timeoutRef.current);
    setShowTooltip(false);
  }

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return (
    <NavLink
      to={item.href}
      className={({ isActive }) => cn('sidebar-item group', isActive && 'active')}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Icon
        className={cn(
          'flex-shrink-0 transition-all duration-150',
          collapsed ? 'w-[18px] h-[18px]' : 'w-4 h-4',
        )}
        strokeWidth={1.75}
      />
      {!collapsed && (
        <span className="flex-1 truncate">{item.label}</span>
      )}
      {!collapsed && item.badge && (
        <span
          className="px-1.5 py-0.5 text-[10px] font-bold rounded-full leading-none"
          style={{ background: 'var(--accent)', color: 'var(--text-inverse)' }}
        >
          {item.badge}
        </span>
      )}
      {collapsed && showTooltip && (
        <NavTooltip label={item.label} description={item.description} />
      )}
    </NavLink>
  );
}

function SidebarSection({
  label,
  items,
  collapsed,
}: {
  label?: string;
  items: NavItem[];
  collapsed: boolean;
}) {
  return (
    <div className="mb-1">
      {!collapsed && label && (
        <p
          className="text-[9px] font-bold uppercase tracking-[0.12em] px-3 mb-1.5 mt-1"
          style={{ color: 'var(--sidebar-section-label)' }}
        >
          {label}
        </p>
      )}
      {collapsed && label && (
        <div
          className="mx-auto my-2 h-px w-8"
          style={{ background: 'var(--sidebar-border)' }}
        />
      )}
      <div className="space-y-0.5">
        {items.map((item) => (
          <SidebarNavItem key={item.href} item={item} collapsed={collapsed} />
        ))}
      </div>
    </div>
  );
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const userIsAdmin = user ? isAdmin(user.role) : false;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-30 flex flex-col app-sidebar',
        'transition-all duration-300 ease-out',
        sidebarCollapsed ? 'w-[68px]' : 'w-[264px]',
      )}
    >
      <div
        className={cn(
          'flex items-center h-[60px] flex-shrink-0 px-4',
          'border-b',
        )}
        style={{ borderColor: 'var(--sidebar-border)' }}
      >
        <div
          className={cn(
            'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
            'bg-gradient-to-br from-primary-500 to-primary-700',
          )}
          style={{ boxShadow: '0 2px 8px rgba(10,132,255,0.3)' }}
        >
          <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        {!sidebarCollapsed && (
          <div className="flex-1 min-w-0 ml-2.5 animate-fade-in overflow-hidden">
            <p
              className="text-[13px] font-bold tracking-tight leading-tight truncate"
              style={{ color: 'var(--sidebar-logo-text)' }}
            >
              HealthMesh AI
            </p>
            <p
              className="text-[9px] font-semibold tracking-[0.1em] uppercase leading-tight"
              style={{ color: 'var(--sidebar-text-muted)' }}
            >
              Enterprise Platform
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-none px-2.5 py-3">
        <SidebarSection label="Platform" items={navItems} collapsed={sidebarCollapsed} />

        {userIsAdmin && (
          <SidebarSection
            label="Administration"
            items={adminNavItems}
            collapsed={sidebarCollapsed}
          />
        )}

        <SidebarSection label="System" items={systemNavItems} collapsed={sidebarCollapsed} />
      </nav>

      {!sidebarCollapsed && user && (
        <div
          className="px-2.5 pb-3 pt-2 flex-shrink-0 border-t"
          style={{ borderColor: 'var(--sidebar-border)' }}
        >
          <div
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all cursor-pointer group"
            style={{ '--hover-bg': 'var(--sidebar-item-hover)' } as React.CSSProperties}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--sidebar-item-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '')}
          >
            <div className="relative flex-shrink-0">
              <div
                className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center"
              >
                <span className="text-white text-[11px] font-bold">
                  {user.full_name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-[1.5px]"
                style={{ borderColor: 'var(--sidebar-bg)' }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[12px] font-semibold truncate leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {user.full_name}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                {userIsAdmin && (
                  <Shield className="w-2.5 h-2.5" style={{ color: 'var(--accent)' }} />
                )}
                <p className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>
                  {user.role ? ROLE_LABELS[user.role] : ''}
                </p>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); logout(); }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-all"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#FF453A';
                e.currentTarget.style.background = 'rgba(255,69,58,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.background = '';
              }}
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {sidebarCollapsed && user && (
        <div
          className="flex justify-center px-2.5 pb-3 pt-2 flex-shrink-0 border-t"
          style={{ borderColor: 'var(--sidebar-border)' }}
        >
          <div className="relative">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <span className="text-white text-[11px] font-bold">
                {user.full_name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-[1.5px]"
              style={{ borderColor: 'var(--sidebar-bg)' }}
            />
          </div>
        </div>
      )}

      <button
        onClick={toggleSidebar}
        className={cn(
          'absolute -right-3.5 top-[4.5rem] w-7 h-7 rounded-full flex items-center justify-center z-10',
          'transition-all duration-200',
        )}
        style={{
          background: 'var(--app-surface-raised)',
          border: '1px solid var(--app-border)',
          boxShadow: 'var(--shadow-md)',
          color: 'var(--text-secondary)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          e.currentTarget.style.transform = '';
        }}
      >
        {sidebarCollapsed
          ? <ChevronRight className="w-3 h-3" />
          : <ChevronLeft className="w-3 h-3" />
        }
      </button>
    </aside>
  );
}
