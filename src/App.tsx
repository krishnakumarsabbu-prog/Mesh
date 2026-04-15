import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LobsPage } from '@/pages/LobsPage';
import { LobDetailPage } from '@/pages/LobDetailPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { ProjectDetailPage } from '@/pages/ProjectDetailPage';
import { ProjectHealthDashboardPage } from '@/pages/ProjectHealthDashboardPage';
import { ConnectorsPage } from '@/pages/ConnectorsPage';
import { ConnectorCatalogPage } from '@/pages/ConnectorCatalogPage';
import { HealthPage } from '@/pages/HealthPage';
import { ChatbotPage } from '@/pages/ChatbotPage';
import { UsersPage } from '@/pages/UsersPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { RulesPage } from '@/pages/RulesPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { TeamsPage } from '@/pages/TeamsPage';
import { TeamDetailPage } from '@/pages/TeamDetailPage';
import { TeamDashboardsPage } from '@/pages/TeamDashboardsPage';
import { TeamLiveDashboardPage } from '@/pages/TeamLiveDashboardPage';
import { LobDashboardsPage } from '@/pages/LobDashboardsPage';
import { LobLiveDashboardPage } from '@/pages/LobLiveDashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { AuditLogPage } from '@/pages/AuditLogPage';
import { DashboardBuilderPage } from '@/pages/DashboardBuilderPage';
import { DashboardBuilderEditor } from '@/components/dashboard-builder/DashboardBuilderEditor';
import { ProjectDashboardsPage } from '@/pages/ProjectDashboardsPage';
import { LiveDashboardPage } from '@/pages/LiveDashboardPage';
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
            <Route path="lobs/:lobId/dashboards" element={<ErrorBoundary><LobDashboardsPage /></ErrorBoundary>} />
            <Route path="lobs/:lobId/dashboards/:assignmentId" element={<ErrorBoundary><LobLiveDashboardPage /></ErrorBoundary>} />
            <Route path="teams" element={<ErrorBoundary><TeamsPage /></ErrorBoundary>} />
            <Route path="teams/:teamId" element={<ErrorBoundary><TeamDetailPage /></ErrorBoundary>} />
            <Route path="teams/:teamId/dashboards" element={<ErrorBoundary><TeamDashboardsPage /></ErrorBoundary>} />
            <Route path="teams/:teamId/dashboards/:assignmentId" element={<ErrorBoundary><TeamLiveDashboardPage /></ErrorBoundary>} />
            <Route path="projects" element={<ErrorBoundary><ProjectsPage /></ErrorBoundary>} />
            <Route path="projects/:projectId" element={<ErrorBoundary><ProjectDetailPage /></ErrorBoundary>} />
            <Route path="projects/:projectId/health-dashboard" element={<ErrorBoundary><ProjectHealthDashboardPage /></ErrorBoundary>} />
            <Route path="projects/:projectId/dashboards" element={<ErrorBoundary><ProjectDashboardsPage /></ErrorBoundary>} />
            <Route path="projects/:projectId/dashboards/:assignmentId" element={<ErrorBoundary><LiveDashboardPage /></ErrorBoundary>} />
            <Route path="connectors" element={<ErrorBoundary><ConnectorsPage /></ErrorBoundary>} />
            <Route path="connector-catalog" element={<ErrorBoundary><ConnectorCatalogPage /></ErrorBoundary>} />
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
            <Route
              path="audit"
              element={
                <RequireAdmin>
                  <ErrorBoundary><AuditLogPage /></ErrorBoundary>
                </RequireAdmin>
              }
            />
            <Route path="rules" element={<ErrorBoundary><RulesPage /></ErrorBoundary>} />
            <Route path="analytics" element={<ErrorBoundary><AnalyticsPage /></ErrorBoundary>} />
            <Route path="projects/:projectId/analytics" element={<ErrorBoundary><AnalyticsPage /></ErrorBoundary>} />
            <Route path="dashboard-builder" element={<ErrorBoundary><DashboardBuilderPage /></ErrorBoundary>} />
            <Route path="settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
          </Route>
          <Route
            path="/dashboard-builder/:templateId"
            element={
              <RequireAuth>
                <ErrorBoundary><DashboardBuilderEditor /></ErrorBoundary>
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
