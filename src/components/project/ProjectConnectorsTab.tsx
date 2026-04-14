import React, { useEffect, useState, useCallback } from 'react';
import { Plug, Plus, Trash2, Settings, ToggleLeft, ToggleRight, ChevronUp, ChevronDown, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle, Loader, Activity, ExternalLink, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { notify } from '@/store/notificationStore';
import { projectConnectorApi, catalogApi } from '@/lib/api';
import { ProjectConnector, ConnectorCatalogEntry } from '@/types';
import { cn } from '@/lib/utils';

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  configured: { label: 'Configured', color: '#30D158', bg: 'rgba(48,209,88,0.12)', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  unconfigured: { label: 'Unconfigured', color: '#FF9F0A', bg: 'rgba(255,159,10,0.12)', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  error: { label: 'Error', color: '#FF453A', bg: 'rgba(255,69,58,0.12)', icon: <XCircle className="w-3.5 h-3.5" /> },
  testing: { label: 'Testing', color: '#0A84FF', bg: 'rgba(10,132,255,0.12)', icon: <Loader className="w-3.5 h-3.5 animate-spin" /> },
};

const CATEGORY_LABELS: Record<string, string> = {
  observability: 'Observability', apm: 'APM', itsm: 'ITSM',
  database: 'Database', messaging: 'Messaging', custom: 'Custom',
};

interface Props {
  projectId: string;
  canManage: boolean;
}

interface ConfigField {
  key: string;
  title: string;
  type: string;
  description?: string;
  secret?: boolean;
  required?: boolean;
  enum?: string[];
  default?: unknown;
}

function parseConfigSchema(schema: Record<string, unknown> | undefined): ConfigField[] {
  if (!schema) return [];
  const props = (schema.properties as Record<string, Record<string, unknown>>) || {};
  const required = (schema.required as string[]) || [];
  return Object.entries(props).map(([key, def]) => ({
    key,
    title: (def.title as string) || key,
    type: (def.type as string) || 'string',
    description: def.description as string | undefined,
    secret: (def.secret as boolean) || false,
    required: required.includes(key),
    enum: def.enum as string[] | undefined,
    default: def.default,
  }));
}

function ConnectorStatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] || STATUS_META.unconfigured;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ color: meta.color, background: meta.bg }}
    >
      {meta.icon}
      {meta.label}
    </span>
  );
}

function ConnectorIcon({ icon, color, name }: { icon?: string; color?: string; name: string }) {
  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
      style={{ background: (color || '#2563EB') + '20', color: color || '#2563EB' }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function ProjectConnectorsTab({ projectId, canManage }: Props) {
  const [connectors, setConnectors] = useState<ProjectConnector[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState<ConnectorCatalogEntry[]>([]);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ catalog_entry_id: '', name: '', description: '', priority: 0 });
  const [assignSaving, setAssignSaving] = useState(false);

  const [configTarget, setConfigTarget] = useState<ProjectConnector | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [configSaving, setConfigSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; ms?: number } | null>(null);

  const [removeTarget, setRemoveTarget] = useState<ProjectConnector | null>(null);
  const [removeSaving, setRemoveSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await projectConnectorApi.list(projectId);
      setConnectors(res.data);
    } catch {
      notify.error('Failed to load connectors');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAssign = async () => {
    try {
      const res = await catalogApi.list({ enabled_only: true });
      setCatalog(res.data);
    } catch {
      notify.error('Failed to load catalog');
    }
    setAssignForm({ catalog_entry_id: '', name: '', description: '', priority: 0 });
    setAssignOpen(true);
  };

  const handleCatalogSelect = (id: string) => {
    const entry = catalog.find(c => c.id === id);
    setAssignForm(f => ({
      ...f,
      catalog_entry_id: id,
      name: entry ? entry.name : f.name,
    }));
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignSaving(true);
    try {
      await projectConnectorApi.assign(projectId, assignForm);
      notify.success('Connector assigned to project');
      setAssignOpen(false);
      fetchAll();
    } catch (err: unknown) {
      notify.error('Failed to assign connector', (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail);
    } finally {
      setAssignSaving(false);
    }
  };

  const openConfigure = (pc: ProjectConnector) => {
    const fields = parseConfigSchema(pc.catalog_entry?.config_schema);
    const current: Record<string, string> = {};
    fields.forEach(f => {
      const storedVal = pc.config?.[f.key];
      current[f.key] = storedVal !== undefined ? String(storedVal) : (f.default !== undefined ? String(f.default) : '');
    });
    setConfigValues(current);
    setShowSecrets({});
    setTestResult(null);
    setConfigTarget(pc);
  };

  const handleConfigure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configTarget) return;
    setConfigSaving(true);
    try {
      const fields = parseConfigSchema(configTarget.catalog_entry?.config_schema);
      const config: Record<string, unknown> = {};
      const credentials: Record<string, unknown> = {};
      fields.forEach(f => {
        const val = configValues[f.key];
        if (val !== undefined && val !== '') {
          if (f.secret) credentials[f.key] = val;
          else config[f.key] = val;
        }
      });
      await projectConnectorApi.configure(projectId, configTarget.id, { config, credentials });
      notify.success('Connector configured');
      setConfigTarget(null);
      fetchAll();
    } catch {
      notify.error('Failed to save configuration');
    } finally {
      setConfigSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!configTarget) return;
    setTestingId(configTarget.id);
    setTestResult(null);
    try {
      const fields = parseConfigSchema(configTarget.catalog_entry?.config_schema);
      const config: Record<string, unknown> = {};
      const credentials: Record<string, unknown> = {};
      fields.forEach(f => {
        const val = configValues[f.key];
        if (val !== undefined && val !== '') {
          if (f.secret) credentials[f.key] = val;
          else config[f.key] = val;
        }
      });
      const res = await projectConnectorApi.test(projectId, configTarget.id, { config, credentials });
      const data = res.data;
      setTestResult({
        success: data.success,
        message: data.success ? 'Connection successful' : (data.error || 'Connection failed'),
        ms: data.response_time_ms,
      });
      if (data.success) {
        fetchAll();
      }
    } catch {
      setTestResult({ success: false, message: 'Test request failed' });
    } finally {
      setTestingId(null);
    }
  };

  const handleToggle = async (pc: ProjectConnector) => {
    try {
      await projectConnectorApi.toggle(projectId, pc.id, !pc.is_enabled);
      setConnectors(prev => prev.map(c => c.id === pc.id ? { ...c, is_enabled: !c.is_enabled } : c));
    } catch {
      notify.error('Failed to toggle connector');
    }
  };

  const handlePriority = async (pc: ProjectConnector, direction: 'up' | 'down') => {
    const delta = direction === 'up' ? -1 : 1;
    const newPriority = Math.max(0, pc.priority + delta);
    try {
      await projectConnectorApi.configure(projectId, pc.id, { priority: newPriority });
      fetchAll();
    } catch {
      notify.error('Failed to update priority');
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoveSaving(true);
    try {
      await projectConnectorApi.remove(projectId, removeTarget.id);
      notify.success('Connector removed from project');
      setRemoveTarget(null);
      fetchAll();
    } catch {
      notify.error('Failed to remove connector');
    } finally {
      setRemoveSaving(false);
    }
  };

  const alreadyAssignedIds = new Set(connectors.map(c => c.catalog_entry_id));
  const availableCatalog = catalog.filter(c => !alreadyAssignedIds.has(c.id));
  const configFields = configTarget ? parseConfigSchema(configTarget.catalog_entry?.config_schema) : [];

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-neutral-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">Project Connectors</h3>
          <p className="text-xs text-neutral-400 mt-0.5">{connectors.length} connector{connectors.length !== 1 ? 's' : ''} assigned</p>
        </div>
        {canManage && (
          <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openAssign}>
            Assign Connector
          </Button>
        )}
      </div>

      {connectors.length === 0 ? (
        <EmptyState
          icon={Plug}
          title="No connectors assigned"
          description="Assign connectors from the global catalog to start monitoring this project."
          action={canManage ? (
            <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openAssign}>
              Assign Connector
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="space-y-2">
          {connectors.map((pc, idx) => (
            <ConnectorRow
              key={pc.id}
              pc={pc}
              idx={idx}
              total={connectors.length}
              canManage={canManage}
              onConfigure={openConfigure}
              onToggle={handleToggle}
              onPriority={handlePriority}
              onRemove={setRemoveTarget}
            />
          ))}
        </div>
      )}

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign Connector"
        subtitle="Select a connector from the global catalog"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button type="submit" form="assign-form" loading={assignSaving}>Assign</Button>
          </>
        }
      >
        <form id="assign-form" onSubmit={handleAssign} className="space-y-4">
          <Select
            label="Connector"
            value={assignForm.catalog_entry_id}
            onChange={e => handleCatalogSelect(e.target.value)}
            required
            options={[
              { value: '', label: 'Select from catalog...' },
              ...availableCatalog.map(c => ({
                value: c.id,
                label: `${c.name}${c.vendor ? ` — ${c.vendor}` : ''} (${CATEGORY_LABELS[c.category] || c.category})`,
              })),
            ]}
          />
          <Input
            label="Display Name"
            value={assignForm.name}
            onChange={e => setAssignForm(f => ({ ...f, name: e.target.value }))}
            placeholder="My Connector"
            required
          />
          <Input
            label="Description"
            value={assignForm.description}
            onChange={e => setAssignForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Optional description"
          />
          <Input
            label="Priority"
            type="number"
            min={0}
            value={String(assignForm.priority)}
            onChange={e => setAssignForm(f => ({ ...f, priority: parseInt(e.target.value) || 0 }))}
            hint="Lower number = higher priority"
          />
          {availableCatalog.length === 0 && (
            <p className="text-xs text-neutral-400">All available connectors are already assigned to this project.</p>
          )}
        </form>
      </Modal>

      <Modal
        open={!!configTarget}
        onClose={() => setConfigTarget(null)}
        title={`Configure: ${configTarget?.name || ''}`}
        subtitle={configTarget?.catalog_entry?.vendor ? `${configTarget.catalog_entry.vendor} · ${configTarget.catalog_entry.version || ''}` : undefined}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="secondary"
              size="sm"
              icon={testingId === configTarget?.id ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
              onClick={handleTestConnection}
              loading={testingId === configTarget?.id}
              disabled={testingId !== null && testingId !== configTarget?.id}
            >
              Test Connection
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setConfigTarget(null)}>Cancel</Button>
              <Button type="submit" form="config-form" loading={configSaving}>Save Config</Button>
            </div>
          </div>
        }
      >
        <form id="config-form" onSubmit={handleConfigure} className="space-y-4">
          {testResult && (
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
              style={{
                background: testResult.success ? 'rgba(48,209,88,0.1)' : 'rgba(255,69,58,0.1)',
                border: `1px solid ${testResult.success ? 'rgba(48,209,88,0.2)' : 'rgba(255,69,58,0.2)'}`,
                color: testResult.success ? '#30D158' : '#FF453A',
              }}
            >
              {testResult.success ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
              <span>{testResult.message}</span>
              {testResult.ms !== undefined && (
                <span className="ml-auto text-xs opacity-70">{testResult.ms}ms</span>
              )}
            </div>
          )}

          {configTarget?.catalog_entry?.docs_url && (
            <a
              href={configTarget.catalog_entry.docs_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-400 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              View documentation
            </a>
          )}

          {configFields.length === 0 ? (
            <p className="text-sm text-neutral-400 py-4 text-center">No configuration fields defined for this connector type.</p>
          ) : (
            <div className="space-y-3">
              {configFields.map(field => (
                <ConfigFieldInput
                  key={field.key}
                  field={field}
                  value={configValues[field.key] ?? ''}
                  onChange={val => setConfigValues(prev => ({ ...prev, [field.key]: val }))}
                  showSecret={!!showSecrets[field.key]}
                  onToggleSecret={() => setShowSecrets(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                />
              ))}
            </div>
          )}
        </form>
      </Modal>

      <ConfirmModal
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
        title="Remove Connector"
        message={`Remove "${removeTarget?.name}" from this project? Configuration will be lost.`}
        confirmLabel="Remove"
        variant="danger"
        loading={removeSaving}
      />
    </div>
  );
}

function ConfigFieldInput({
  field, value, onChange, showSecret, onToggleSecret,
}: {
  field: ConfigField;
  value: string;
  onChange: (v: string) => void;
  showSecret: boolean;
  onToggleSecret: () => void;
}) {
  if (field.enum) {
    return (
      <Select
        label={field.title}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={field.required}
        hint={field.description}
        options={field.enum.map(v => ({ value: v, label: v }))}
      />
    );
  }

  if (field.type === 'boolean') {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold tracking-wide uppercase" style={{ color: '#667085' }}>
          {field.title}
        </label>
        <Select
          value={value === '' ? String(field.default ?? 'true') : value}
          onChange={e => onChange(e.target.value)}
          options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]}
        />
        {field.description && <p className="text-xs leading-relaxed" style={{ color: '#667085' }}>{field.description}</p>}
      </div>
    );
  }

  if (field.type === 'integer' || field.type === 'number') {
    return (
      <Input
        label={field.title}
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        required={field.required}
        hint={field.description}
      />
    );
  }

  if (field.secret) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold tracking-wide uppercase flex items-center gap-1.5" style={{ color: '#667085' }}>
          <Lock className="w-3 h-3" />
          {field.title}
          {field.required && <span className="text-[10px]" style={{ color: '#EF4444' }}>*</span>}
        </label>
        <div className="relative">
          <Input
            type={showSecret ? 'text' : 'password'}
            value={value}
            onChange={e => onChange(e.target.value)}
            required={field.required}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={onToggleSecret}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-300 transition-colors"
          >
            {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {field.description && <p className="text-xs leading-relaxed" style={{ color: '#667085' }}>{field.description}</p>}
      </div>
    );
  }

  return (
    <Input
      label={field.title}
      value={value}
      onChange={e => onChange(e.target.value)}
      required={field.required}
      hint={field.description}
      placeholder={`Enter ${field.title.toLowerCase()}`}
    />
  );
}

function ConnectorRow({
  pc, idx, total, canManage, onConfigure, onToggle, onPriority, onRemove,
}: {
  pc: ProjectConnector;
  idx: number;
  total: number;
  canManage: boolean;
  onConfigure: (pc: ProjectConnector) => void;
  onToggle: (pc: ProjectConnector) => void;
  onPriority: (pc: ProjectConnector, dir: 'up' | 'down') => void;
  onRemove: (pc: ProjectConnector) => void;
}) {
  const catalog = pc.catalog_entry;
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 bg-white rounded-2xl border transition-all group',
      pc.is_enabled ? 'border-neutral-100 hover:border-neutral-200' : 'border-neutral-100 opacity-60',
    )}>
      <ConnectorIcon icon={catalog?.icon} color={catalog?.color} name={catalog?.name || pc.name} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-neutral-900 truncate">{pc.name}</span>
          <ConnectorStatusBadge status={pc.status} />
          {!pc.is_enabled && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-400">Disabled</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-400">
          {catalog && <span className="capitalize">{CATEGORY_LABELS[catalog.category] || catalog.category}</span>}
          {catalog?.vendor && <><span>·</span><span>{catalog.vendor}</span></>}
          {pc.last_test_at && (
            <>
              <span>·</span>
              <span>
                Last tested{' '}
                {new Date(pc.last_test_at).toLocaleDateString()}
                {pc.last_test_response_ms !== undefined && ` (${pc.last_test_response_ms}ms)`}
              </span>
            </>
          )}
          <span>· Priority {pc.priority}</span>
        </div>
        {pc.last_test_error && pc.status === 'error' && (
          <p className="text-xs mt-0.5 truncate" style={{ color: '#FF453A' }}>{pc.last_test_error}</p>
        )}
      </div>

      {canManage && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onPriority(pc, 'up')}
            disabled={idx === 0}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Increase priority"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onPriority(pc, 'down')}
            disabled={idx === total - 1}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Decrease priority"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onToggle(pc)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-all"
            title={pc.is_enabled ? 'Disable' : 'Enable'}
          >
            {pc.is_enabled
              ? <ToggleRight className="w-4 h-4 text-green-500" />
              : <ToggleLeft className="w-4 h-4" />
            }
          </button>
          <button
            onClick={() => onConfigure(pc)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-500 hover:bg-primary-50 transition-all"
            title="Configure"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onRemove(pc)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-danger-500 hover:bg-danger-50 transition-all"
            title="Remove"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
