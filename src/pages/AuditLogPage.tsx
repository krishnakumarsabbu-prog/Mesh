import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Search, Filter, RefreshCw, Download, Clock, User, Database, Link, Box, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { auditApi } from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import { cn, formatRelativeTime } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

interface AuditLogEntry {
  id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  user_id?: string;
  changes?: string;
  ip_address?: string;
  user_agent?: string;
  tenant_id?: string;
  created_at: string;
}

const ACTION_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  'user.login': { bg: 'rgba(59,130,246,0.12)', color: '#60A5FA', label: 'Login' },
  'user.register': { bg: 'rgba(16,185,129,0.12)', color: '#34D399', label: 'Register' },
  'user.change_password': { bg: 'rgba(245,158,11,0.12)', color: '#FBBF24', label: 'Password Change' },
  'connector.create': { bg: 'rgba(0,229,153,0.12)', color: '#00E599', label: 'Create' },
  'connector.update': { bg: 'rgba(245,158,11,0.12)', color: '#FBBF24', label: 'Update' },
  'connector.delete': { bg: 'rgba(239,68,68,0.12)', color: '#EF4444', label: 'Delete' },
  'connector.health_check': { bg: 'rgba(139,92,246,0.12)', color: '#A78BFA', label: 'Health Check' },
  'project.create': { bg: 'rgba(0,229,153,0.12)', color: '#00E599', label: 'Create' },
  'project.update': { bg: 'rgba(245,158,11,0.12)', color: '#FBBF24', label: 'Update' },
  'project.delete': { bg: 'rgba(239,68,68,0.12)', color: '#EF4444', label: 'Delete' },
  'rule.create': { bg: 'rgba(0,229,153,0.12)', color: '#00E599', label: 'Create' },
  'rule.update': { bg: 'rgba(245,158,11,0.12)', color: '#FBBF24', label: 'Update' },
  'rule.delete': { bg: 'rgba(239,68,68,0.12)', color: '#EF4444', label: 'Delete' },
  'rule.status_change': { bg: 'rgba(139,92,246,0.12)', color: '#A78BFA', label: 'Status Change' },
};

const RESOURCE_ICONS: Record<string, React.ElementType> = {
  user: User,
  connector: Link,
  project: Box,
  health_rule: Shield,
  lob: Database,
};

const RESOURCE_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'user', label: 'Users' },
  { value: 'connector', label: 'Connectors' },
  { value: 'project', label: 'Projects' },
  { value: 'health_rule', label: 'Health Rules' },
];

function AuditLogSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3.5 rounded-xl shimmer-bg"
          style={{ animationDelay: `${i * 60}ms`, height: '56px' }}
        />
      ))}
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const config = ACTION_COLORS[action];
  if (!config) {
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold"
        style={{ background: 'var(--app-bg-muted)', color: 'var(--text-secondary)' }}
      >
        {action}
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold"
      style={{ background: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
}

export function AuditLogPage() {
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const LIMIT = 50;

  useEffect(() => {
    setPageTitle('Audit Logs');
    setBreadcrumbs([{ label: 'Admin' }, { label: 'Audit Logs' }]);
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auditApi.getLogs({
        search: search || undefined,
        resource_type: resourceType || undefined,
        limit: LIMIT,
        offset: page * LIMIT,
      });
      setLogs(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [search, resourceType, page]);

  useEffect(() => {
    const timer = setTimeout(fetchLogs, 300);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  const handleExport = useCallback(() => {
    const csv = [
      ['ID', 'Action', 'Resource Type', 'Resource ID', 'User ID', 'IP', 'Timestamp'],
      ...logs.map(l => [l.id, l.action, l.resource_type, l.resource_id || '', l.user_id || '', l.ip_address || '', l.created_at]),
    ].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6 animate-page-enter">
      <PageHeader
        title="Audit Logs"
        subtitle={`${total.toLocaleString()} total events`}
        badge={<Shield className="w-5 h-5" style={{ color: 'var(--accent)' }} />}
      />

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--app-surface)',
          border: '1px solid var(--app-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          className="flex flex-wrap items-center gap-3 px-4 py-3.5 border-b"
          style={{ borderColor: 'var(--app-border)' }}
        >
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search actions, resources..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-[13px] outline-none focus-ring"
              style={{
                background: 'var(--app-bg-muted)',
                border: '1px solid var(--app-border)',
                color: 'var(--text-primary)',
              }}
              aria-label="Search audit logs"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <select
              value={resourceType}
              onChange={e => { setResourceType(e.target.value); setPage(0); }}
              className="pl-9 pr-8 py-2 rounded-xl text-[13px] outline-none focus-ring appearance-none"
              style={{
                background: 'var(--app-bg-muted)',
                border: '1px solid var(--app-border)',
                color: 'var(--text-primary)',
              }}
              aria-label="Filter by resource type"
            >
              {RESOURCE_TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors focus-ring"
              style={{
                background: 'var(--app-bg-muted)',
                border: '1px solid var(--app-border)',
                color: 'var(--text-secondary)',
              }}
              aria-label="Refresh"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors focus-ring"
              style={{
                background: 'var(--accent-subtle)',
                border: '1px solid rgba(0,229,153,0.2)',
                color: 'var(--accent)',
              }}
              aria-label="Export CSV"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>

        <div className="min-h-[200px]">
          {loading ? (
            <div className="p-4">
              <AuditLogSkeleton />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <FileText className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
              <p className="text-[14px] font-medium" style={{ color: 'var(--text-secondary)' }}>No audit logs found</p>
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Events will appear here as actions are performed</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--app-border-subtle)' }}>
              {logs.map((log) => {
                const Icon = RESOURCE_ICONS[log.resource_type] || Shield;
                const isExpanded = expandedId === log.id;
                let parsedChanges: Record<string, unknown> | null = null;
                if (log.changes) {
                  try { parsedChanges = JSON.parse(log.changes); } catch {}
                }
                return (
                  <div
                    key={log.id}
                    className="transition-colors"
                    style={{ background: isExpanded ? 'var(--app-bg-subtle)' : 'transparent' }}
                  >
                    <button
                      className="w-full flex items-center gap-4 px-4 py-3 text-left transition-colors"
                      style={{ cursor: parsedChanges ? 'pointer' : 'default' }}
                      onClick={() => parsedChanges && setExpandedId(isExpanded ? null : log.id)}
                      aria-expanded={isExpanded}
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--app-bg-muted)' }}
                      >
                        <Icon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <ActionBadge action={log.action} />
                        <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                          {log.resource_type}
                          {log.resource_id && <span style={{ color: 'var(--text-disabled)' }}> · {log.resource_id.slice(0, 8)}</span>}
                        </span>
                        {log.user_id && (
                          <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            <User className="w-3 h-3" />
                            {log.user_id.slice(0, 8)}
                          </span>
                        )}
                        {log.ip_address && (
                          <span className="text-[11px]" style={{ color: 'var(--text-disabled)' }}>
                            {log.ip_address}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
                        <Clock className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {formatRelativeTime(log.created_at)}
                        </span>
                      </div>
                    </button>

                    {isExpanded && parsedChanges && (
                      <div
                        className="mx-4 mb-3 rounded-xl p-3 text-[12px] font-mono"
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--app-border)' }}
                      >
                        {Object.entries(parsedChanges).map(([k, v]) => (
                          <div key={k} className="flex gap-2">
                            <span style={{ color: 'var(--accent)' }}>{k}:</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: 'var(--app-border)' }}
          >
            <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
              {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} of {total.toLocaleString()}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 0}
                className="p-1.5 rounded-lg transition-colors disabled:opacity-40 focus-ring"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[13px] font-medium px-2" style={{ color: 'var(--text-primary)' }}>
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg transition-colors disabled:opacity-40 focus-ring"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
