import React, { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { NotificationContainer } from '@/components/ui/Notification';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const { isAuthenticated } = useAuthStore();
  const { sidebarCollapsed } = useUIStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-ivory-200">
      <Sidebar />
      <Header />

      <main
        className={cn(
          'min-h-screen pt-16 transition-all duration-300',
          sidebarCollapsed ? 'pl-16' : 'pl-64'
        )}
      >
        <div className="p-6 lg:p-8 max-w-screen-2xl mx-auto animate-fade-in">
          <Outlet />
        </div>
      </main>

      <NotificationContainer />
    </div>
  );
}
