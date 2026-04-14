import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, Search, LogOut, ChevronDown, Settings, User as UserIcon, X, Command, ChevronRight, Layers, Zap, CircleCheck as CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { Link } from 'react-router-dom';
import { ROLE_LABELS } from '@/lib/permissions';
import { BreadcrumbItem } from '@/types';

const WORKSPACES = [
  { id: 'prod', label: 'Production', color: '#10B981' },
  { id: 'staging', label: 'Staging', color: '#F59E0B' },
  { id: 'dev', label: 'Development', color: '#6366F1' },
];

function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (!items.length) return null;
  return (
    <nav className="flex items-center gap-1 text-xs" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
          )}
          {item.href ? (
            <Link
              to={item.href}
              className="transition-colors truncate max-w-[120px] hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}
            >
              {item.label}
            </Link>
          ) : (
            <span
              className="font-medium truncate max-w-[160px]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}


function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(WORKSPACES[0]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative hidden lg:block">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[12px] font-medium transition-all duration-150',
          'focus-ring',
        )}
        style={{
          background: 'var(--app-bg-muted)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--app-border)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--app-border)'; }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: active.color }}
        />
        <span>{active.label}</span>
        <Layers className="w-3 h-3 opacity-50" />
        <ChevronDown className={cn('w-3 h-3 opacity-50 transition-transform duration-150', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          className="absolute top-full mt-2 left-0 w-44 rounded-2xl py-1.5 z-50 animate-expand-down"
          style={{
            background: 'var(--app-surface-raised)',
            border: '1px solid var(--app-border)',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          <p
            className="text-[9px] font-bold uppercase tracking-[0.1em] px-3 pb-1.5"
            style={{ color: 'var(--text-muted)' }}
          >
            Environment
          </p>
          {WORKSPACES.map((ws) => (
            <button
              key={ws.id}
              onClick={() => { setActive(ws); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium transition-all"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--app-bg-muted)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ws.color }} />
              <span className="flex-1 text-left">{ws.label}</span>
              {active.id === ws.id && (
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: ws.color }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasNotifications = true;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 focus-ring',
          open ? 'opacity-100' : '',
        )}
        style={{
          background: open ? 'var(--app-bg-muted)' : 'transparent',
          color: 'var(--text-secondary)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--app-bg-muted)'; }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.background = 'transparent';
        }}
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {hasNotifications && (
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ring-1"
            style={{ background: '#FF453A', outline: '1.5px solid var(--app-bg)' }}
          />
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-2xl z-50 overflow-hidden animate-expand-down"
          style={{
            background: 'var(--app-surface-raised)',
            border: '1px solid var(--app-border)',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'var(--app-border)' }}
          >
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Notifications
              </p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                3 unread alerts
              </p>
            </div>
            <button
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all"
              style={{ color: 'var(--accent)', background: 'var(--accent-subtle)' }}
            >
              Mark all read
            </button>
          </div>

          <div className="py-1.5">
            {[
              { title: 'Payment connector degraded', time: '2m ago', type: 'warning', unread: true },
              { title: 'LOB "Retail" health check passed', time: '18m ago', type: 'success', unread: true },
              { title: 'New user invited to workspace', time: '1h ago', type: 'info', unread: false },
            ].map((n, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-all"
                style={{ background: n.unread ? 'var(--accent-subtle)' : '' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--app-bg-muted)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = n.unread ? 'var(--accent-subtle)' : ''; }}
              >
                <span
                  className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{
                    background: n.type === 'warning' ? '#FF9F0A' : n.type === 'success' ? '#30D158' : 'var(--accent)',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>
                    {n.title}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{n.time}</p>
                </div>
                {n.unread && (
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: 'var(--accent)' }}
                  />
                )}
              </div>
            ))}
          </div>

          <div
            className="px-4 py-2.5 border-t"
            style={{ borderColor: 'var(--app-border)' }}
          >
            <button
              className="w-full text-center text-[12px] font-medium transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenu({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuthStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-60 rounded-2xl z-50 py-1.5 overflow-hidden animate-scale-in"
      style={{
        background: 'var(--app-surface-raised)',
        border: '1px solid var(--app-border)',
        boxShadow: 'var(--shadow-xl)',
      }}
    >
      <div
        className="px-4 py-3.5 border-b"
        style={{ borderColor: 'var(--app-border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {user?.full_name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-2"
              style={{ borderColor: 'var(--app-surface-raised)' }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-semibold truncate leading-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {user?.full_name}
            </p>
            <p
              className="text-[11px] truncate leading-tight mt-0.5"
              style={{ color: 'var(--text-muted)' }}
            >
              {user?.email}
            </p>
          </div>
        </div>
        <div className="mt-2.5">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
          >
            <Zap className="w-2.5 h-2.5" />
            {user?.role ? ROLE_LABELS[user.role] : ''}
          </span>
        </div>
      </div>

      <div className="py-1">
        <Link
          to="/settings"
          onClick={onClose}
          className="flex items-center gap-2.5 px-4 py-2 text-[13px] transition-all"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--app-bg-muted)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
        >
          <UserIcon className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          Profile
        </Link>
        <Link
          to="/settings"
          onClick={onClose}
          className="flex items-center gap-2.5 px-4 py-2 text-[13px] transition-all"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--app-bg-muted)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
        >
          <Settings className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          Settings
        </Link>
      </div>

      <div
        className="border-t pt-1"
        style={{ borderColor: 'var(--app-border)' }}
      >
        <button
          onClick={() => { logout(); onClose(); }}
          className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] transition-all text-danger"
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,69,58,0.07)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
          style={{ color: '#FF453A' }}
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </div>
  );
}

function CommandHint() {
  return (
    <div
      className="hidden xl:flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium select-none"
      style={{
        background: 'var(--app-bg-muted)',
        color: 'var(--text-muted)',
        border: '1px solid var(--app-border)',
      }}
    >
      <Command className="w-3 h-3" />
      <span>K</span>
    </div>
  );
}

export function Header() {
  const { sidebarCollapsed, breadcrumbs, pageTitle } = useUIStore();
  const { user } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchValue('');
      setSearchFocused(false);
      (e.target as HTMLInputElement).blur();
    }
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-20 flex items-center px-4 h-[60px] gap-3',
        'app-header transition-all duration-300 ease-out',
        sidebarCollapsed ? 'left-[68px]' : 'left-[264px]',
      )}
    >
      <div className="flex flex-col min-w-0 flex-1">
        {breadcrumbs.length > 0 ? (
          <>
            <Breadcrumbs items={breadcrumbs} />
            <h1
              className="text-[13px] font-bold tracking-tight leading-tight mt-0.5 truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {pageTitle}
            </h1>
          </>
        ) : (
          <h1
            className="text-[15px] font-bold tracking-tight truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {pageTitle}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <WorkspaceSwitcher />

        <div
          className={cn(
            'relative hidden md:flex items-center transition-all duration-200',
            searchFocused ? 'w-60' : 'w-44',
          )}
        >
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none transition-colors"
            style={{ color: searchFocused ? 'var(--accent)' : 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onKeyDown={handleSearchKeyDown}
            className="w-full pl-8 pr-8 py-1.5 text-[13px] rounded-xl outline-none transition-all duration-200"
            style={{
              background: searchFocused ? 'var(--app-surface-raised)' : 'var(--app-bg-muted)',
              border: `1px solid ${searchFocused ? 'var(--accent)' : 'var(--app-border)'}`,
              color: 'var(--text-primary)',
              boxShadow: searchFocused ? '0 0 0 3px var(--accent-subtle)' : 'none',
            }}
          />
          {searchValue ? (
            <button
              onClick={() => setSearchValue('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
              <CommandHint />
            </div>
          )}
        </div>

        <NotificationBell />

        <div
          className="w-px h-5 mx-0.5 flex-shrink-0"
          style={{ background: 'var(--app-border)' }}
        />

        <div className="relative">
          <button
            onClick={() => setShowUserMenu((v) => !v)}
            className={cn(
              'flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl transition-all duration-150 focus-ring',
            )}
            style={{
              background: showUserMenu ? 'var(--app-bg-muted)' : 'transparent',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--app-bg-muted)'; }}
            onMouseLeave={(e) => {
              if (!showUserMenu) e.currentTarget.style.background = 'transparent';
            }}
          >
            <div className="relative">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #00E599 0%, #00C97F 100%)' }}
              >
                <span className="text-[#0F1115] text-[11px] font-bold">
                  {user?.full_name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border"
                style={{ background: '#00E599', borderColor: 'var(--header-bg)' }}
              />
            </div>
            <span
              className="text-[12px] font-semibold hidden sm:block max-w-[80px] truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {user?.full_name?.split(' ')[0]}
            </span>
            <ChevronDown
              className={cn(
                'w-3 h-3 transition-transform duration-200',
                showUserMenu ? 'rotate-180' : 'rotate-0',
              )}
              style={{ color: 'var(--text-muted)' }}
            />
          </button>

          {showUserMenu && <UserMenu onClose={() => setShowUserMenu(false)} />}
        </div>
      </div>
    </header>
  );
}
