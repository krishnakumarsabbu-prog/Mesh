import React, { useEffect, useState } from 'react';
import { Plus, Plug, RefreshCw, Trash2, Play, ExternalLink } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { connectorApi, projectApi } from '@/lib/api';
import { Connector, Project } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Input, TextArea, Select } from '@/components/ui/Input';
import { notify } from '@/store/notificationStore';
import { formatMs, formatRelativeTime } from '@/lib/utils';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { useSearchParams } from 'react-router-dom';

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
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{row.name}</p>
            {row.endpoint_url && (
              <p className="text-xs truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>{row.endpoint_url}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (val: unknown) => (
        <span className="text-xs font-mono px-2 py-0.5 rounded-lg" style={{ background: 'var(--app-bg-muted)', color: 'var(--text-secondary)' }}>
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
        <span className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>{formatMs(val as number | undefined)}</span>
      ),
    },
    {
      key: 'last_checked',
      header: 'Last Check',
      render: (val: unknown) => (
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
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
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Connectors</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{connectors.length} connectors monitored</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={<RefreshCw className="w-4 h-4" />} onClick={fetchData}>Refresh</Button>
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>Add Connector</Button>
        </div>
      </div>

      <Card padding="none">
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--app-border)' }}>
          <CardHeader
            title="All Connectors"
            subtitle="Service health endpoints"
            action={
              <div className="flex gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#30D158' }} />
                  {connectors.filter((c) => c.status === 'healthy').length} healthy
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#FF9F0A' }} />
                  {connectors.filter((c) => c.status === 'degraded').length} degraded
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#FF453A' }} />
                  {connectors.filter((c) => c.status === 'down').length} down
                </span>
              </div>
            }
          />
        </div>
        <Table<Connector>
          data={connectors}
          columns={columns}
          loading={loading}
          emptyMessage="No connectors found. Add your first connector to start monitoring."
        />
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
            options={['rest_api', 'database', 'message_queue', 'grpc', 'graphql', 'websocket', 'custom'].map((t) => ({ value: t, label: t.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }))}
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
