import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Plug, RefreshCw, Trash2, Play, Search, X, ChevronDown } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { connectorApi, projectApi } from '@/lib/api';
import { Connector, Project } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Input, TextArea, Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { notify } from '@/store/notificationStore';
import { formatMs, formatRelativeTime } from '@/lib/utils';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { useSearchParams } from 'react-router-dom';

const CONNECTOR_TYPES = [
  'rest_api', 'database', 'message_queue', 'grpc', 'graphql', 'websocket', 'custom',
];

export function ConnectorsPage() {
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [searchParams] = useSearchParams();
  const projectIdFilter = searchParams.get('project_id');
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Connector | null>(null);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [form, setForm] = useState({
    name: '', description: '', type: 'rest_api', project_id: projectIdFilter || '',
    endpoint_url: '', check_interval_seconds: '60', timeout_seconds: '30',
  });

  useEffect(() => {
    setPageTitle('Connectors');
    setBreadcrumbs([{ label: 'Connectors' }]);
    fetchData();
  }, [projectIdFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [connRes, projRes] = await Promise.all([
        connectorApi.list(projectIdFilter || undefined),
        projectApi.list(),
      ]);
      setConnectors(connRes.data);
      setProjects(projRes.data);
    } catch {
      notify.error('Failed to load connectors');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await connectorApi.create(form);
      notify.success('Connector created');
      setCreateOpen(false);
      setForm({ name: '', description: '', type: 'rest_api', project_id: projectIdFilter || '', endpoint_url: '', check_interval_seconds: '60', timeout_seconds: '30' });
      fetchData();
    } catch (err: unknown) {
      notify.error('Failed to create', (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail);
    } finally {
      setSaving(false);
    }
  };

  const handleHealthCheck = async (connectorId: string) => {
    setChecking(connectorId);
    try {
      await connectorApi.runHealthCheck(connectorId);
      notify.success('Health check completed');
      fetchData();
    } catch {
      notify.error('Health check failed');
    } finally {
      setChecking(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await connectorApi.delete(deleteTarget.id);
      notify.success('Connector deleted');
      setDeleteTarget(null);
      fetchData();
    } catch {
      notify.error('Failed to delete connector');
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const lower = search.toLowerCase();
    return connectors.filter(c => {
      if (search && !c.name.toLowerCase().includes(lower) && !(c.endpoint_url || '').toLowerCase().includes(lower)) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      if (typeFilter && c.type !== typeFilter) return false;
      return true;
    });
  }, [connectors, search, statusFilter, typeFilter]);

  const columns = [
    {
      key: 'name',
      header: 'Connector',
      render: (val: unknown, row: Connector) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-subtle)' }}>
            <Plug className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{row.name}</p>
            {row.endpoint_url && (
              <p className="text-[11px] truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>{row.endpoint_url}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (val: unknown) => (
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg" style={{ background: 'var(--app-bg-muted)', color: 'var(--text-secondary)' }}>
          {String(val).replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (val: unknown) => <StatusBadge status={String(val)} />,
    },
    {
      key: 'avg_response_time_ms',
      header: 'Response Time',
      render: (val: unknown) => (
        <span className="text-[13px] font-mono" style={{ color: 'var(--text-secondary)' }}>{formatMs(val as number | undefined)}</span>
      ),
    },
    {
      key: 'last_checked',
      header: 'Last Check',
      render: (val: unknown) => (
        <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
          {val ? formatRelativeTime(String(val)) : 'Never'}
        </span>
      ),
    },
    {
      key: 'id',
      header: '',
      render: (_: unknown, row: Connector) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); handleHealthCheck(row.id); }}
            className="p-1.5 rounded-lg transition-all"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-subtle)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = ''; }}
            disabled={checking === row.id}
            title="Run health check"
          >
            {checking === row.id ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}
            className="p-1.5 rounded-lg transition-all"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#FF453A'; e.currentTarget.style.background = 'rgba(255,69,58,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = ''; }}
            title="Delete connector"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const hasFilters = search || statusFilter || typeFilter;

  return (
    <div className="space-y-6 animate-page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Connectors</h2>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {connectors.length} connector{connectors.length !== 1 ? 's' : ''} monitored
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={<RefreshCw className="w-4 h-4" />} onClick={fetchData}>Refresh</Button>
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>Add Connector</Button>
        </div>
      </div>

      <Card padding="none">
        <div
          className="px-5 py-4 border-b flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between"
          style={{ borderColor: 'var(--app-border)' }}
        >
          <div className="flex items-center gap-3 flex-wrap flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search connectors..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-8 py-2 text-[13px] rounded-xl outline-none transition-all w-52"
                style={{
                  background: 'var(--app-surface)',
                  border: '1px solid var(--app-border)',
                  color: 'var(--text-primary)',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-subtle)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--app-border)'; e.currentTarget.style.boxShadow = ''; }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2 text-[13px] rounded-xl outline-none cursor-pointer"
                style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', color: 'var(--text-secondary)' }}
              >
                <option value="">All status</option>
                <option value="healthy">Healthy</option>
                <option value="degraded">Degraded</option>
                <option value="down">Down</option>
                <option value="unknown">Unknown</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            </div>

            <div className="relative">
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2 text-[13px] rounded-xl outline-none cursor-pointer"
                style={{ background: 'var(--app-surface)', border: '1px solid var(--app-border)', color: 'var(--text-secondary)' }}
              >
                <option value="">All types</option>
                {CONNECTOR_TYPES.map(t => (
                  <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            </div>

            {hasFilters && (
              <button
                onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); }}
                className="text-[12px] transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="flex gap-3 text-[12px]" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: '#30D158' }} />
              {connectors.filter(c => c.status === 'healthy').length} healthy
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: '#FF9F0A' }} />
              {connectors.filter(c => c.status === 'degraded').length} degraded
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: '#FF453A' }} />
              {connectors.filter(c => c.status === 'down').length} down
            </span>
          </div>
        </div>

        {loading ? (
          <div className="divide-y" style={{ borderColor: 'var(--app-border)' }}>
            {Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Plug}
            title={hasFilters ? 'No connectors match your filters' : 'No connectors yet'}
            description={hasFilters ? 'Try adjusting your search or filters.' : 'Add your first connector to start monitoring service health.'}
            action={!hasFilters ? <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>Add Connector</Button> : undefined}
          />
        ) : (
          <Table<Connector>
            data={filtered}
            columns={columns}
            loading={false}
            emptyMessage="No connectors found."
          />
        )}
      </Card>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Connector"
        subtitle="Configure a new service health endpoint"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" form="create-connector-form" loading={saving}>Add Connector</Button>
          </>
        }
      >
        <form id="create-connector-form" onSubmit={handleCreate} className="space-y-4">
          <Select
            label="Project"
            value={form.project_id}
            onChange={(e) => setForm({ ...form, project_id: e.target.value })}
            options={[{ value: '', label: 'Select a project...' }, ...projects.map((p) => ({ value: p.id, label: p.name }))]}
            required
          />
          <Input label="Name" placeholder="e.g., Payment API" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Select
            label="Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={CONNECTOR_TYPES.map(t => ({ value: t, label: t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) }))}
          />
          <Input label="Endpoint URL" placeholder="https://api.example.com/health" value={form.endpoint_url} onChange={(e) => setForm({ ...form, endpoint_url: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Check Interval (s)" type="number" value={form.check_interval_seconds} onChange={(e) => setForm({ ...form, check_interval_seconds: e.target.value })} />
            <Input label="Timeout (s)" type="number" value={form.timeout_seconds} onChange={(e) => setForm({ ...form, timeout_seconds: e.target.value })} />
          </div>
          <TextArea label="Description" placeholder="Optional..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Connector"
        message={`Delete "${deleteTarget?.name}"? Health history will also be removed.`}
        confirmLabel="Delete"
        variant="danger"
        loading={saving}
      />
    </div>
  );
}
