import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, LogOut, ChevronRight, Menu, Settings, User as UserIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { BreadcrumbItem } from '@/types';
import { Link } from 'react-router-dom';
import { ROLE_LABELS } from '@/lib/permissions';

function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (!items.length) return null;
  return (
    <nav className="flex items-center gap-1 text-xs">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight className="w-3 h-3 text-neutral-300 flex-shrink-0" />}
          {item.href ? (
            <Link
              to={item.href}
              className="text-neutral-400 hover:text-neutral-600 transition-colors truncate max-w-[120px]"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-neutral-600 font-medium truncate max-w-[160px]">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
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
      className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-neutral-100 z-50 py-1.5 animate-scale-in"
      style={{ boxShadow: '0 8px 32px -6px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)' }}
    >
      <div className="px-4 py-3 border-b border-neutral-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{user?.full_name?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-900 truncate leading-tight">{user?.full_name}</p>
            <p className="text-[11px] text-neutral-400 truncate leading-tight">{user?.email}</p>
          </div>
        </div>
        <div className="mt-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 text-[10px] font-semibold tracking-wide">
            {user?.role ? ROLE_LABELS[user.role] : ''}
          </span>
        </div>
      </div>

      <div className="py-1">
        <Link
          to="/settings"
          onClick={onClose}
          className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          <UserIcon className="w-3.5 h-3.5 text-neutral-400" />
          Profile
        </Link>
        <Link
          to="/settings"
          onClick={onClose}
          className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          <Settings className="w-3.5 h-3.5 text-neutral-400" />
          Settings
        </Link>
      </div>

      <div className="border-t border-neutral-50 pt-1">
        <button
          onClick={() => { logout(); onClose(); }}
          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-danger-500 hover:bg-danger-50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export function Header() {
  const { sidebarCollapsed, breadcrumbs, pageTitle, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-20 flex items-center px-5 h-16 gap-3',
        'border-b border-neutral-200/70',
        'transition-all duration-300 ease-out',
        sidebarCollapsed ? 'left-16' : 'left-64',
      )}
      style={{ background: 'rgba(250, 248, 245, 0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
    >
      <button
        onClick={toggleSidebar}
        className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100/80 transition-all flex-shrink-0 lg:hidden"
      >
        <Menu className="w-4 h-4" />
      </button>

      <div className="flex flex-col min-w-0 flex-1">
        {breadcrumbs.length > 0 ? (
          <>
            <Breadcrumbs items={breadcrumbs} />
            <h1 className="text-[13px] font-bold text-neutral-900 tracking-tight leading-tight mt-0.5 truncate">
              {pageTitle}
            </h1>
          </>
        ) : (
          <h1 className="text-[15px] font-bold text-neutral-900 tracking-tight truncate">{pageTitle}</h1>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div className={cn(
          'relative hidden md:flex items-center transition-all duration-200',
          searchFocused ? 'w-64' : 'w-48',
        )}>
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={cn(
              'w-full pl-8 pr-3 py-1.5 text-[13px] rounded-xl outline-none transition-all duration-200',
              'bg-neutral-100/80 border border-transparent placeholder:text-neutral-400 text-neutral-700',
              'focus:bg-white focus:border-neutral-200 focus:shadow-[0_0_0_3px_rgba(10,132,255,0.08)]',
            )}
          />
          {searchValue && (
            <button
              onClick={() => setSearchValue('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <button className="relative p-2 rounded-xl text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100/80 transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-danger rounded-full ring-1 ring-white" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu((v) => !v)}
            className={cn(
              'flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl transition-all duration-150',
              showUserMenu ? 'bg-neutral-100' : 'hover:bg-neutral-100/80',
            )}
          >
            <div className="relative">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <span className="text-white text-[11px] font-bold">{user?.full_name?.charAt(0).toUpperCase()}</span>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-success rounded-full border border-white" />
            </div>
            <span className="text-[12px] font-semibold text-neutral-700 hidden sm:block max-w-[80px] truncate">
              {user?.full_name?.split(' ')[0]}
            </span>
            <ChevronRight
              className={cn(
                'w-3 h-3 text-neutral-400 transition-transform duration-200',
                showUserMenu ? 'rotate-90' : 'rotate-0',
              )}
            />
          </button>

          {showUserMenu && <UserMenu onClose={() => setShowUserMenu(false)} />}
        </div>
      </div>
    </header>
  );
}
