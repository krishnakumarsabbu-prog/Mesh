export type UserRole = 'super_admin' | 'lob_admin' | 'project_admin' | 'project_user' | 'admin' | 'analyst' | 'viewer';

export interface RoleAssignment {
  id: string;
  user_id: string;
  role: UserRole;
  resource_type?: string;
  resource_id?: string;
  granted_by?: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  avatar_url?: string;
  tenant_id?: string;
  last_login?: string;
  created_at: string;
  role_assignments?: RoleAssignment[];
}

export interface AuthState {
  user: User | null;
  access_token: string | null;
  refresh_token: string | null;
  isAuthenticated: boolean;
}

export interface Lob {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon: string;
  is_active: boolean;
  tenant_id: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  project_count: number;
  member_count: number;
}

export interface LobMember {
  id: string;
  lob_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user_email?: string;
  user_full_name?: string;
  user_avatar_url?: string;
}

export type ProjectMemberRole = 'project_admin' | 'project_user';

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectMemberRole;
  assigned_by?: string;
  joined_at: string;
  user_email?: string;
  user_full_name?: string;
  user_avatar_url?: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  lob_id: string;
  status: 'active' | 'inactive' | 'maintenance' | 'archived';
  environment: string;
  tags?: string;
  color: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  connector_count: number;
  healthy_count: number;
  degraded_count: number;
  down_count: number;
  member_count: number;
}

export type ConnectorType = 'rest_api' | 'database' | 'message_queue' | 'grpc' | 'graphql' | 'websocket' | 'custom';
export type ConnectorStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

export interface Connector {
  id: string;
  name: string;
  description?: string;
  type: ConnectorType;
  project_id: string;
  endpoint_url?: string;
  config?: string;
  status: ConnectorStatus;
  is_active: boolean;
  check_interval_seconds: string;
  timeout_seconds: string;
  last_checked?: string;
  last_status_change?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  uptime_percentage?: number;
  avg_response_time_ms?: number;
}

export interface HealthCheck {
  id: string;
  connector_id: string;
  project_id: string;
  status: 'healthy' | 'degraded' | 'down' | 'timeout' | 'error';
  response_time_ms?: number;
  status_code?: number;
  error_message?: string;
  checked_at: string;
}

export interface DashboardStats {
  total_lobs: number;
  total_projects: number;
  total_connectors: number;
  healthy_connectors: number;
  degraded_connectors: number;
  down_connectors: number;
  unknown_connectors: number;
  overall_health_percentage: number;
  avg_response_time_ms?: number;
}

export interface HealthTrend {
  timestamp: string;
  healthy: number;
  degraded: number;
  down: number;
  total: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestions?: string[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export type CatalogConnectorCategory = 'observability' | 'apm' | 'itsm' | 'database' | 'messaging' | 'custom';
export type CatalogConnectorStatus = 'active' | 'disabled' | 'deprecated';

export interface ConnectorCatalogEntry {
  id: string;
  slug: string;
  name: string;
  description?: string;
  vendor?: string;
  category: CatalogConnectorCategory;
  status: CatalogConnectorStatus;
  icon?: string;
  color?: string;
  tags?: string;
  is_system: boolean;
  is_enabled: boolean;
  config_schema?: Record<string, unknown>;
  default_config?: Record<string, unknown>;
  test_definition?: Record<string, unknown>;
  docs_url?: string;
  version?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ConnectorCatalogTestResult {
  success: boolean;
  status_code?: number;
  response_time_ms?: number;
  error?: string;
  details?: Record<string, unknown>;
}

export type ProjectConnectorStatus = 'configured' | 'unconfigured' | 'testing' | 'error';

export interface ProjectConnectorCatalogSnippet {
  id: string;
  slug: string;
  name: string;
  vendor?: string;
  category: CatalogConnectorCategory;
  icon?: string;
  color?: string;
  config_schema?: Record<string, unknown>;
  default_config?: Record<string, unknown>;
  test_definition?: Record<string, unknown>;
  docs_url?: string;
  version?: string;
}

export interface ProjectConnector {
  id: string;
  project_id: string;
  catalog_entry_id: string;
  name: string;
  description?: string;
  config?: Record<string, unknown>;
  is_enabled: boolean;
  priority: number;
  status: ProjectConnectorStatus;
  last_test_at?: string;
  last_test_success?: boolean;
  last_test_error?: string;
  last_test_response_ms?: number;
  assigned_by?: string;
  created_at: string;
  updated_at: string;
  catalog_entry?: ProjectConnectorCatalogSnippet;
}

export interface ProjectConnectorTestResult {
  success: boolean;
  response_time_ms?: number;
  error?: string;
  details?: Record<string, unknown>;
}

export type AgentHealthStatus = 'healthy' | 'degraded' | 'down' | 'timeout' | 'error' | 'unknown' | 'unconfigured';
export type ExecutionOutcome = 'success' | 'failure' | 'timeout' | 'auth_error' | 'config_error' | 'skipped';

export interface ConnectorAgentStatus {
  project_connector_id: string;
  health_status: AgentHealthStatus;
  last_sync_at?: string;
  last_sync_outcome?: ExecutionOutcome;
  last_sync_response_ms?: number;
  last_error?: string;
  last_error_at?: string;
  consecutive_failures: number;
  total_executions: number;
  total_failures: number;
  uptime_percentage?: number;
  updated_at?: string;
}

export interface ConnectorAgentTestResult {
  success: boolean;
  response_time_ms?: number;
  status_code?: number;
  error?: string;
  details?: Record<string, unknown>;
  authenticated?: boolean;
  connector_slug?: string;
  executed_at?: string;
}

export interface ConnectorAgentSyncResult {
  success: boolean;
  health_status: AgentHealthStatus;
  response_time_ms?: number;
  message?: string;
  error?: string;
  metrics?: Array<{ name: string; value: number; unit: string }>;
  connector_slug?: string;
  executed_at?: string;
}

export interface ConnectorExecutionLog {
  id: string;
  triggered_by: 'manual' | 'scheduled' | 'api';
  outcome: ExecutionOutcome;
  response_time_ms?: number;
  http_status_code?: number;
  error_message?: string;
  executed_at: string;
}
