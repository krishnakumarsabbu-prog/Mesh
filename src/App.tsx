import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LobsPage } from '@/pages/LobsPage';
import { LobDetailPage } from '@/pages/LobDetailPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { ConnectorsPage } from '@/pages/ConnectorsPage';
import { HealthPage } from '@/pages/HealthPage';
import { ChatbotPage } from '@/pages/ChatbotPage';
import { UsersPage } from '@/pages/UsersPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { NotificationContainer } from '@/components/ui/Notification';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useAuthStore } from '@/store/authStore';
import { isAdmin } from '@/lib/permissions';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (!isAdmin(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
            <Route path="lobs" element={<ErrorBoundary><LobsPage /></ErrorBoundary>} />
            <Route path="lobs/:lobId" element={<ErrorBoundary><LobDetailPage /></ErrorBoundary>} />
            <Route path="projects" element={<ErrorBoundary><ProjectsPage /></ErrorBoundary>} />
            <Route path="connectors" element={<ErrorBoundary><ConnectorsPage /></ErrorBoundary>} />
            <Route path="health" element={<ErrorBoundary><HealthPage /></ErrorBoundary>} />
            <Route path="chatbot" element={<ErrorBoundary><ChatbotPage /></ErrorBoundary>} />
            <Route
              path="users"
              element={
                <RequireAdmin>
                  <ErrorBoundary><UsersPage /></ErrorBoundary>
                </RequireAdmin>
              }
            />
            <Route path="settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <NotificationContainer />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
