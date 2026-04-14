import React, { useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { NotificationContainer } from '@/components/ui/Notification';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-page-enter">
      {children}
    </div>
  );
}

export function AppLayout() {
  const { isAuthenticated } = useAuthStore();
  const { sidebarCollapsed, theme } = useUIStore();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--app-bg)' }}
    >
      <Sidebar />
      <Header />

      <main
        className={cn(
          'min-h-screen pt-[60px] transition-all duration-300 ease-out',
          sidebarCollapsed ? 'pl-[68px]' : 'pl-[264px]',
        )}
      >
        <div className="px-6 py-7 lg:px-8 lg:py-8 max-w-screen-2xl mx-auto">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>

      <NotificationContainer />
    </div>
  );
}
