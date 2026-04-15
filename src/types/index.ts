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

export interface Team {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon: string;
  lob_id: string;
  is_active: boolean;
  tenant_id: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  member_count: number;
  project_count: number;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user_email?: string;
  user_full_name?: string;
  user_avatar_url?: string;
}

export interface TeamProject {
  id: string;
  team_id: string;
  project_id: string;
  assigned_at: string;
  project_name?: string;
  project_color?: string;
  project_status?: string;
  project_environment?: string;
  connector_count: number;
  healthy_count: number;
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
  is_streaming?: boolean;
  is_error?: boolean;
  response_time_ms?: number;
  messageId?: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  tenant_id: string;
  project_id?: string;
  title?: string;
  status: 'active' | 'archived' | 'deleted';
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageRecord {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  is_streaming: boolean;
  is_error: boolean;
  finish_reason?: string;
  response_time_ms?: number;
  created_at: string;
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

export type MetricType = 'number' | 'percentage' | 'time_series' | 'table' | 'status' | 'boolean' | 'duration';
export type AggregationType = 'sum' | 'avg' | 'max' | 'min' | 'count' | 'latest';
export type ParserType = 'json_path' | 'regex' | 'xml_path' | 'csv' | 'plain_text' | 'custom';

export interface MetricTemplate {
  id: string;
  catalog_entry_id: string;
  name: string;
  metric_key: string;
  description?: string;
  category?: string;
  display_order: number;
  metric_type: MetricType;
  unit?: string;
  aggregation_type: AggregationType;
  threshold_warning?: number | null;
  threshold_critical?: number | null;
  query_config?: Record<string, unknown> | null;
  parser_type: ParserType;
  result_mapping?: Record<string, unknown> | null;
  transformation_rules?: Array<Record<string, unknown>> | null;
  is_enabled_by_default: boolean;
  is_required: boolean;
  is_custom: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface MetricTemplateCreatePayload {
  name: string;
  metric_key: string;
  description?: string;
  category?: string;
  display_order?: number;
  metric_type?: MetricType;
  unit?: string;
  aggregation_type?: AggregationType;
  threshold_warning?: number | null;
  threshold_critical?: number | null;
  query_config?: Record<string, unknown> | null;
  parser_type?: ParserType;
  result_mapping?: Record<string, unknown> | null;
  transformation_rules?: Array<Record<string, unknown>> | null;
  is_enabled_by_default?: boolean;
  is_required?: boolean;
  is_custom?: boolean;
}

export interface MetricTemplateTestResult {
  success: boolean;
  raw_response?: unknown;
  parsed_value?: unknown;
  error?: string;
  response_time_ms?: number;
  status_code?: number;
  validation_errors?: string[] | null;
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

export type HealthRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'partial';
export type HealthRunTrigger = 'manual' | 'scheduled' | 'api' | 'webhook';
export type RunConnectorOutcome = 'success' | 'failure' | 'timeout' | 'skipped' | 'error' | 'auth_error' | 'config_error';
export type RunHealthStatus = 'healthy' | 'degraded' | 'down' | 'timeout' | 'error' | 'unknown' | 'skipped';

export interface HealthRunConnectorResult {
  id: string;
  project_connector_id: string;
  connector_name: string;
  connector_slug?: string;
  connector_category?: string;
  outcome: RunConnectorOutcome;
  health_status: RunHealthStatus;
  health_score?: number;
  response_time_ms?: number;
  error_message?: string;
  message?: string;
  weight: number;
  is_enabled: boolean;
  priority: number;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
}

export interface HealthRunSummary {
  run_id: string;
  execution_id: string;
  project_id: string;
  status: HealthRunStatus;
  overall_health_status?: RunHealthStatus;
  overall_score?: number;
  connector_count: number;
  success_count: number;
  failure_count: number;
  skipped_count: number;
  total_duration_ms?: number;
  triggered_by: HealthRunTrigger;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface HealthRunDetail extends HealthRunSummary {
  contributing_factors: string[];
  connector_results: HealthRunConnectorResult[];
  connectors?: Array<{
    project_connector_id: string;
    connector_name: string;
    health_status: RunHealthStatus;
    outcome: RunConnectorOutcome;
    response_time_ms?: number;
    error?: string;
    message?: string;
    duration_ms?: number;
    priority: number;
    is_enabled: boolean;
  }>;
}

export interface ProjectDashboardConnectorSummary {
  id: string;
  name: string;
  slug?: string;
  category?: string;
  icon?: string;
  color?: string;
  is_enabled: boolean;
  priority: number;
  status?: string;
  health_status: RunHealthStatus | 'unknown';
  last_sync_at?: string;
  last_sync_response_ms?: number;
  uptime_percentage?: number;
  consecutive_failures: number;
  total_executions: number;
  total_failures: number;
  last_error?: string;
}

export interface ProjectDashboardSummary {
  project_id: string;
  project_name: string;
  project_color?: string;
  overall_score?: number;
  overall_health_status?: RunHealthStatus;
  last_run_at?: string;
  last_run_status?: HealthRunStatus;
  last_run_id?: string;
  availability_percentage: number;
  sla_percentage: number;
  incident_count: number;
  total_connectors: number;
  enabled_connectors: number;
  healthy_connectors: number;
  degraded_connectors: number;
  down_connectors: number;
  unknown_connectors: number;
  connectors: ProjectDashboardConnectorSummary[];
}

export interface TrendDataPoint {
  timestamp: string;
  score?: number;
  status?: RunHealthStatus;
  success_count?: number;
  failure_count?: number;
  duration_ms?: number;
}

export interface AvailabilityDataPoint {
  timestamp: string;
  availability: number;
}

export interface IncidentDataPoint {
  timestamp: string;
  incidents: number;
}

export interface ConnectorTrendDataPoint {
  timestamp: string;
  score?: number;
  status?: RunHealthStatus;
  response_time_ms?: number;
  outcome?: string;
}

export interface ProjectDashboardTrends {
  time_range: string;
  hours: number;
  since: string;
  overall_trend: TrendDataPoint[];
  availability_trend: AvailabilityDataPoint[];
  incident_trend: IncidentDataPoint[];
  connector_trends: Record<string, ConnectorTrendDataPoint[]>;
}

export interface MetricDataPoint {
  timestamp: string;
  value: number;
  unit?: string;
  connector?: string;
  metric?: string;
  description?: string;
}

export interface MetricSeries {
  key: string;
  connector?: string;
  metric_name?: string;
  unit?: string;
  description?: string;
  data_points: MetricDataPoint[];
  latest_value?: number;
  avg_value?: number;
  min_value?: number;
  max_value?: number;
}

export interface ConnectorResponseTime {
  connector: string;
  avg_ms: number;
  min_ms: number;
  max_ms: number;
  samples: number;
}

export interface RunDurationDataPoint {
  timestamp: string;
  duration_ms: number;
  score?: number;
  status?: RunHealthStatus;
}

export interface ProjectDashboardMetrics {
  time_range: string;
  hours: number;
  metrics: MetricSeries[];
  connector_response_times: ConnectorResponseTime[];
  run_durations: RunDurationDataPoint[];
  score_distribution: { excellent: number; good: number; fair: number; poor: number };
  total_runs: number;
}

export interface ConnectorRunHistoryEntry {
  run_id: string;
  outcome?: string;
  health_status?: RunHealthStatus;
  health_score?: number;
  response_time_ms?: number;
  error_message?: string;
  message?: string;
  duration_ms?: number;
  started_at?: string;
  completed_at?: string;
  metrics: Array<{ name: string; value: number; unit?: string }>;
}

export interface ConnectorDrilldown {
  connector_id: string;
  connector_name: string;
  connector_slug?: string;
  connector_category?: string;
  connector_icon?: string;
  connector_color?: string;
  is_enabled: boolean;
  priority: number;
  status?: string;
  current_health_status: RunHealthStatus | 'unknown';
  last_sync_at?: string;
  last_sync_response_ms?: number;
  uptime_percentage?: number;
  consecutive_failures: number;
  total_executions: number;
  total_failures: number;
  last_error?: string;
  last_error_at?: string;
  run_history: ConnectorRunHistoryEntry[];
  metrics_by_name: Record<string, Array<{ timestamp: string; value: number; unit?: string }>>;
  recent_errors: Array<{ timestamp?: string; error?: string; outcome?: string }>;
  time_range: string;
  hours: number;
}

export type RuleScope = 'global' | 'project' | 'connector' | 'metric';
export type RuleSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type RuleStatus = 'active' | 'inactive' | 'draft' | 'archived';
export type RuleAction = 'override_status' | 'apply_penalty' | 'apply_bonus' | 'flag_incident' | 'notify';
export type ConditionOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'in_range' | 'not_in_range' | 'contains' | 'not_contains' | 'is_true' | 'is_false';
export type ConditionMetricType = 'health_status' | 'health_score' | 'response_time_ms' | 'availability_pct' | 'sla_pct' | 'consecutive_failures' | 'error_rate' | 'incident_count' | 'uptime_pct' | 'custom_metric';
export type ConditionLogicGroup = 'and' | 'or';

export interface HealthRuleCondition {
  id?: string;
  rule_id?: string;
  metric_type: ConditionMetricType;
  metric_key?: string;
  operator: ConditionOperator;
  threshold_value?: number;
  threshold_value_max?: number;
  string_value?: string;
  description?: string;
  display_order?: number;
  created_at?: string;
}

export interface HealthRuleAssignment {
  id: string;
  rule_id: string;
  project_id?: string;
  connector_id?: string;
  scope_override?: string;
  is_active: boolean;
  assigned_by?: string;
  assigned_at: string;
}

export interface HealthRule {
  id: string;
  name: string;
  description?: string;
  slug: string;
  scope: RuleScope;
  severity: RuleSeverity;
  status: RuleStatus;
  action: RuleAction;
  logic_group: ConditionLogicGroup;
  action_value?: number;
  action_status_override?: string;
  action_metadata?: Record<string, unknown>;
  priority_weight: number;
  score_impact?: number;
  tags?: string;
  is_system: boolean;
  version: number;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  conditions: HealthRuleCondition[];
  assignments: HealthRuleAssignment[];
}

export interface HealthRuleListResponse {
  items: HealthRule[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface ConditionTestDetail {
  condition_id?: string;
  metric_type: string;
  metric_key?: string;
  operator: string;
  threshold_value?: number;
  threshold_value_max?: number;
  actual_value: unknown;
  matched: boolean;
  explanation: string;
}

export interface RuleTestResponse {
  rule_id?: string;
  rule_name: string;
  matched: boolean;
  logic_group: string;
  score_impact?: number;
  status_override?: string;
  explanation: string;
  condition_details: ConditionTestDetail[];
  warnings: string[];
  persisted_test_run_id?: string;
}

export interface RuleValidationError {
  field: string;
  message: string;
  condition_index?: number;
}

export interface RuleValidationResponse {
  valid: boolean;
  errors: RuleValidationError[];
  warnings: string[];
}

export interface RuleMetadataOption {
  value: string;
  label: string;
  color?: string;
  description?: string;
  data_types?: string[];
  data_type?: string;
  requires_value?: boolean;
  requires_status?: boolean;
  value_label?: string;
}

export interface RuleMetadata {
  metric_types: RuleMetadataOption[];
  operators: RuleMetadataOption[];
  severities: RuleMetadataOption[];
  actions: RuleMetadataOption[];
  scopes: RuleMetadataOption[];
  statuses: RuleMetadataOption[];
  logic_groups: RuleMetadataOption[];
  health_status_values: string[];
}

export interface ProjectConnectorMetricTemplate {
  id: string;
  name: string;
  metric_key: string;
  description?: string;
  category?: string;
  display_order: number;
  metric_type: MetricType;
  unit?: string;
  aggregation_type: AggregationType;
  threshold_warning?: number | null;
  threshold_critical?: number | null;
  is_enabled_by_default: boolean;
  is_required: boolean;
  is_custom: boolean;
}

export interface ProjectConnectorMetricBinding {
  id: string;
  project_connector_id: string;
  metric_template_id: string;
  is_enabled: boolean;
  is_critical: boolean;
  threshold_warning?: number | null;
  threshold_critical?: number | null;
  label_override?: string | null;
  query_config_override?: Record<string, unknown> | null;
  created_by?: string;
  created_at: string;
  updated_at: string;
  metric_template?: ProjectConnectorMetricTemplate;
}

export interface ProjectConnectorMetricUpsert {
  metric_template_id: string;
  is_enabled: boolean;
  is_critical: boolean;
  threshold_warning?: number | null;
  threshold_critical?: number | null;
  label_override?: string | null;
  query_config_override?: Record<string, unknown> | null;
}

// ─── Analytics Types ──────────────────────────────────────────────────────────

export type AnalyticsTimeRange = '24h' | '7d' | '30d' | '90d' | 'custom';
export type AnalyticsGranularity = 'hourly' | 'daily' | 'weekly' | 'monthly';

export interface AnalyticsTrendPoint {
  timestamp: string;
  score?: number | null;
  status?: string | null;
  run_count?: number;
}

export interface AnalyticsAvailabilityPoint {
  timestamp: string;
  availability?: number | null;
}

export interface AnalyticsIncidentPoint {
  timestamp: string;
  incidents: number;
  total_runs?: number;
}

export interface AnalyticsSlaPoint {
  timestamp: string;
  sla?: number | null;
}

export interface AnalyticsConnectorTrendPoint {
  timestamp: string;
  score?: number | null;
  avg_response_time_ms?: number | null;
  success_rate?: number | null;
}

export interface AnalyticsProjectTrends {
  project_id: string;
  time_range: string;
  granularity: string;
  hours: number;
  since: string;
  until: string;
  total_runs: number;
  score_delta?: number | null;
  health_trend: AnalyticsTrendPoint[];
  availability_trend: AnalyticsAvailabilityPoint[];
  incident_trend: AnalyticsIncidentPoint[];
  sla_trend: AnalyticsSlaPoint[];
  connector_trends: Record<string, AnalyticsConnectorTrendPoint[]>;
}

export interface AnalyticsProjectSummary {
  project_id: string;
  project_name: string;
  project_color?: string;
  avg_health_score?: number | null;
  availability_pct?: number | null;
  sla_pct?: number | null;
  uptime_pct?: number | null;
  incident_count: number;
  total_runs: number;
  score_trend: Array<{ timestamp: string; score?: number | null }>;
}

export interface AnalyticsProjectComparison {
  time_range: string;
  hours: number;
  since: string;
  until: string;
  projects: AnalyticsProjectSummary[];
}

export interface ConnectorPerformanceTrendPoint {
  timestamp: string;
  success_rate?: number | null;
  avg_response_time_ms?: number | null;
  avg_score?: number | null;
  total?: number;
}

export interface ConnectorPerformanceMetrics {
  connector_id?: string;
  connector_name: string;
  connector_slug?: string;
  connector_category?: string;
  total_executions: number;
  success_count: number;
  failure_count: number;
  success_rate: number;
  avg_response_time_ms?: number | null;
  min_response_time_ms?: number | null;
  max_response_time_ms?: number | null;
  p95_response_time_ms?: number | null;
  avg_health_score?: number | null;
  top_errors: Array<{ message: string; count: number }>;
  trend: ConnectorPerformanceTrendPoint[];
}

export interface AnalyticsConnectorHistory {
  project_id: string;
  time_range: string;
  granularity: string;
  hours: number;
  since: string;
  until: string;
  connectors: ConnectorPerformanceMetrics[];
}

export interface ConnectorSlaMetrics {
  connector_name: string;
  connector_id?: string;
  uptime_pct?: number | null;
  sla_pct?: number | null;
  breach: number;
  total_executions: number;
  success_count: number;
  failure_count: number;
}

export interface DowntimePeriod {
  timestamp?: string;
  run_id?: string;
  sla_pct: number;
  failure_count: number;
  duration_ms?: number;
}

export interface AnalyticsSlaMetrics {
  project_id: string;
  time_range: string;
  hours: number;
  since: string;
  until: string;
  sla_threshold: number;
  uptime_pct?: number | null;
  sla_pct?: number | null;
  breach_count: number;
  downtime_periods: DowntimePeriod[];
  mttr_minutes?: number | null;
  mtbf_minutes?: number | null;
  total_runs: number;
  connector_sla: ConnectorSlaMetrics[];
  sla_trend: AnalyticsSlaPoint[];
}
