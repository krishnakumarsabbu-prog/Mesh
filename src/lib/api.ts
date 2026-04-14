import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';

const BASE_URL = '/api/v1';

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().access_token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      const refreshToken = useAuthStore.getState().refresh_token;
      if (refreshToken) {
        try {
          const res = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
          useAuthStore.getState().setTokens(res.data.access_token, res.data.refresh_token);
          if (error.config?.headers) {
            error.config.headers.Authorization = `Bearer ${res.data.access_token}`;
          }
          return apiClient(error.config!);
        } catch {
          useAuthStore.getState().logout();
        }
      } else {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  register: (email: string, full_name: string, password: string) =>
    apiClient.post('/auth/register', { email, full_name, password }),
  me: () => apiClient.get('/auth/me'),
  refresh: (refresh_token: string) =>
    apiClient.post('/auth/refresh', { refresh_token }),
};

export const lobApi = {
  list: (params?: { search?: string }) => apiClient.get('/lobs', { params }),
  create: (data: object) => apiClient.post('/lobs', data),
  get: (id: string) => apiClient.get(`/lobs/${id}`),
  update: (id: string, data: object) => apiClient.patch(`/lobs/${id}`, data),
  delete: (id: string) => apiClient.delete(`/lobs/${id}`),
  getAdmins: (id: string) => apiClient.get(`/lobs/${id}/admins`),
  assignAdmin: (id: string, user_id: string) => apiClient.post(`/lobs/${id}/admins`, { user_id }),
  removeAdmin: (id: string, userId: string) => apiClient.delete(`/lobs/${id}/admins/${userId}`),
  getMembers: (id: string) => apiClient.get(`/lobs/${id}/members`),
};

export const projectApi = {
  list: (lob_id?: string) => apiClient.get('/projects', { params: { lob_id } }),
  create: (data: object) => apiClient.post('/projects', data),
  get: (id: string) => apiClient.get(`/projects/${id}`),
  update: (id: string, data: object) => apiClient.patch(`/projects/${id}`, data),
  delete: (id: string) => apiClient.delete(`/projects/${id}`),
  getMembers: (id: string) => apiClient.get(`/projects/${id}/members`),
  addMember: (id: string, data: object) => apiClient.post(`/projects/${id}/members`, data),
  updateMember: (id: string, memberId: string, data: object) => apiClient.patch(`/projects/${id}/members/${memberId}`, data),
  removeMember: (id: string, memberId: string) => apiClient.delete(`/projects/${id}/members/${memberId}`),
};

export const connectorApi = {
  list: (project_id?: string) => apiClient.get('/connectors', { params: { project_id } }),
  create: (data: object) => apiClient.post('/connectors', data),
  get: (id: string) => apiClient.get(`/connectors/${id}`),
  update: (id: string, data: object) => apiClient.patch(`/connectors/${id}`, data),
  delete: (id: string) => apiClient.delete(`/connectors/${id}`),
  runHealthCheck: (id: string) => apiClient.post(`/connectors/${id}/health-check`),
};

export const healthApi = {
  stats: () => apiClient.get('/health/stats'),
  trends: (hours?: number) => apiClient.get('/health/trends', { params: { hours } }),
};

export const chatApi = {
  message: (message: string, context?: object) =>
    apiClient.post('/chatbot/message', { message, context }),
};

export const userApi = {
  list: (params?: { search?: string; role?: string; is_active?: boolean }) =>
    apiClient.get('/users', { params }),
  create: (data: { email: string; full_name: string; password: string; role: string }) =>
    apiClient.post('/users', data),
  get: (id: string) => apiClient.get(`/users/${id}`),
  update: (id: string, data: object) => apiClient.patch(`/users/${id}`, data),
  deactivate: (id: string) => apiClient.delete(`/users/${id}`),
  assignRole: (userId: string, data: { role: string; resource_type?: string; resource_id?: string }) =>
    apiClient.post(`/users/${userId}/roles`, data),
  removeRole: (userId: string, assignmentId: string) =>
    apiClient.delete(`/users/${userId}/roles/${assignmentId}`),
};

export default apiClient;

export const catalogApi = {
  list: (params?: { category?: string; enabled_only?: boolean }) =>
    apiClient.get('/connector-catalog', { params }),
  create: (data: object) => apiClient.post('/connector-catalog', data),
  get: (id: string) => apiClient.get(`/connector-catalog/${id}`),
  update: (id: string, data: object) => apiClient.patch(`/connector-catalog/${id}`, data),
  enable: (id: string) => apiClient.post(`/connector-catalog/${id}/enable`),
  disable: (id: string) => apiClient.post(`/connector-catalog/${id}/disable`),
  test: (id: string, data: object) => apiClient.post(`/connector-catalog/${id}/test`, data),
  delete: (id: string) => apiClient.delete(`/connector-catalog/${id}`),
};

export const projectConnectorApi = {
  list: (projectId: string) =>
    apiClient.get(`/projects/${projectId}/connectors`),
  assign: (projectId: string, data: { catalog_entry_id: string; name: string; description?: string; priority?: number }) =>
    apiClient.post(`/projects/${projectId}/connectors`, data),
  get: (projectId: string, pcId: string) =>
    apiClient.get(`/projects/${projectId}/connectors/${pcId}`),
  configure: (projectId: string, pcId: string, data: object) =>
    apiClient.patch(`/projects/${projectId}/connectors/${pcId}/configure`, data),
  toggle: (projectId: string, pcId: string, is_enabled: boolean) =>
    apiClient.patch(`/projects/${projectId}/connectors/${pcId}/toggle`, { is_enabled }),
  test: (projectId: string, pcId: string, data?: object) =>
    apiClient.post(`/projects/${projectId}/connectors/${pcId}/test`, data ?? {}),
  remove: (projectId: string, pcId: string) =>
    apiClient.delete(`/projects/${projectId}/connectors/${pcId}`),
};

export const healthRunApi = {
  run: (projectId: string) =>
    apiClient.post(`/health/run/${projectId}`),
  history: (projectId: string, params?: { limit?: number; offset?: number }) =>
    apiClient.get(`/health/history/${projectId}`, { params }),
  getRun: (runId: string) =>
    apiClient.get(`/health/run/${runId}`),
  latest: (projectId: string) =>
    apiClient.get(`/health/latest/${projectId}`),
};

export const connectorAgentApi = {
  test: (projectId: string, pcId: string, data?: { config?: Record<string, unknown>; credentials?: Record<string, unknown> }) =>
    apiClient.post(`/projects/${projectId}/connectors/${pcId}/agent/test`, data ?? {}),
  sync: (projectId: string, pcId: string) =>
    apiClient.post(`/projects/${projectId}/connectors/${pcId}/agent/sync`),
  status: (projectId: string, pcId: string) =>
    apiClient.get(`/projects/${projectId}/connectors/${pcId}/agent/status`),
  logs: (projectId: string, pcId: string, limit?: number) =>
    apiClient.get(`/projects/${projectId}/connectors/${pcId}/agent/logs`, { params: { limit } }),
  projectStatuses: (projectId: string) =>
    apiClient.get(`/projects/${projectId}/connectors/agent/statuses`),
  registry: () =>
    apiClient.get('/connectors/agents/registry'),
};

export const projectDashboardApi = {
  summary: (projectId: string) =>
    apiClient.get(`/dashboard/project/${projectId}/summary`),
  trends: (projectId: string, params?: { time_range?: string; custom_hours?: number }) =>
    apiClient.get(`/dashboard/project/${projectId}/trends`, { params }),
  metrics: (projectId: string, params?: { time_range?: string; custom_hours?: number }) =>
    apiClient.get(`/dashboard/project/${projectId}/metrics`, { params }),
  connectorDrilldown: (projectId: string, connectorId: string, params?: { time_range?: string; custom_hours?: number }) =>
    apiClient.get(`/dashboard/project/${projectId}/connector/${connectorId}`, { params }),
};

export const healthRulesApi = {
  metadata: () =>
    apiClient.get('/rules/metadata'),
  list: (params?: {
    scope?: string;
    severity?: string;
    status?: string;
    project_id?: string;
    connector_id?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }) => apiClient.get('/rules', { params }),
  get: (ruleId: string) =>
    apiClient.get(`/rules/${ruleId}`),
  create: (payload: Record<string, unknown>) =>
    apiClient.post('/rules', payload),
  update: (ruleId: string, payload: Record<string, unknown>) =>
    apiClient.put(`/rules/${ruleId}`, payload),
  updateStatus: (ruleId: string, status: string) =>
    apiClient.patch(`/rules/${ruleId}/status`, { status }),
  delete: (ruleId: string) =>
    apiClient.delete(`/rules/${ruleId}`),
  validate: (payload: Record<string, unknown>) =>
    apiClient.post('/rules/validate', payload),
  test: (payload: Record<string, unknown>) =>
    apiClient.post('/rules/test', payload),
};
