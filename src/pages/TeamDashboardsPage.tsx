import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Plus, Star, StarOff, Trash2, GripVertical, Eye,
  ChevronRight, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle,
  Info, RefreshCw, Settings, ArrowLeft, X, Clock, Shield,
  ChartBar as BarChart2, Users, Activity,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useUIStore } from '@/store/uiStore';
import { teamDashboardAssignmentApi, dashboardTemplateApi, teamApi } from '@/lib/api';
import { notify } from '@/store/notificationStore';
import {
  TeamAssignmentResponse, DashboardTemplate, TeamAssignmentValidationResult, Team,
} from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

const REFRESH_OPTIONS = [
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 120, label: '2 minutes' },
  { value: 300, label: '5 minutes' },
  { value: 600, label: '10 minutes' },
];

const SCOPE_COLORS: Record<string, string> = {
  project: '#0A84FF',
  team: '#30D158',
  lob: '#FF9F0A',
  global: '#636366',
};

const TEAM_AGGREGATE_KEYS = [
  'avg_project_health',
  'healthy_projects_count',
  'warning_projects_count',
  'critical_projects_count',
  'total_open_incidents',
  'avg_latency',
  'max_latency',
  'avg_availability',
  'sla_breach_count',
  'total_alerts',
  'project_count',
];

export function TeamDashboardsPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { setPageTitle, setBreadcrumbs } = useUIStore();

  const [team, setTeam] = useState<Team | null>(null);
  const [assignments, setAssignments] = useState<TeamAssignmentResponse[]>([]);
  const [templates, setTemplates] = useState<DashboardTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [assignDisplayName, setAssignDisplayName] = useState('');
  const [assignRefresh, setAssignRefresh] = useState(60);
  const [assignAsDefault, setAssignAsDefault] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [validationResult, setValidationResult] = useState<TeamAssignmentValidationResult | null>(null);
  const [validating, setValidating] = useState(false);

  const [removeTarget, setRemoveTarget] = useState<TeamAssignmentResponse | null>(null);
  const [removing, setRemoving] = useState(false);

  const [editTarget, setEditTarget] = useState<TeamAssignmentResponse | null>(null);
  const [editName, setEditName] = useState('');
  const [editRefresh, setEditRefresh] = useState(60);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const [teamRes, assignRes, templatesRes] = await Promise.all([
        teamApi.get(teamId),
        teamDashboardAssignmentApi.list(teamId),
        dashboardTemplateApi.list({ scope: 'team' }),
      ]);
      setTeam(teamRes.data);
      setAssignments(assignRes.data);

      const allTemplatesRes = await dashboardTemplateApi.list();
      setTemplates(allTemplatesRes.data);

      setPageTitle(teamRes.data.name + ' — Dashboards');
      setBreadcrumbs([
        { label: 'Teams', href: '/teams' },
        { label: teamRes.data.name, href: `/teams/${teamId}` },
        { label: 'Dashboards' },
      ]);
    } catch {
      notify.error('Failed to load team dashboards');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const assignedTemplateIds = new Set(assignments.map(a => a.template_id));
  const availableTemplates = templates.filter(t => !assignedTemplateIds.has(t.id));
  const teamScopedTemplates = availableTemplates.filter(t => t.scope === 'team' || t.scope === 'global');
  const otherTemplates = availableTemplates.filter(t => t.scope !== 'team' && t.scope !== 'global');

  const handleTemplateSelect = async (templateId: string) => {
    setSelectedTemplateId(templateId);
    setValidationResult(null);
    if (!templateId || !teamId) return;
    setValidating(true);
    try {
      const res = await teamDashboardAssignmentApi.validate(teamId, templateId);
      setValidationResult(res.data);
    } catch {
      setValidationResult(null);
    } finally {
      setValidating(false);
    }
  };

  const handleAssign = async () => {
    if (!teamId || !selectedTemplateId) return;
    if (validationResult && validationResult.errors.length > 0) return;
    setAssigning(true);
    try {
      await teamDashboardAssignmentApi.assign(teamId, {
        template_id: selectedTemplateId,
        display_name: assignDisplayName || null,
        is_default: assignAsDefault,
        refresh_interval_seconds: assignRefresh,
      });
      notify.success('Dashboard assigned to team');
      setAssignModalOpen(false);
      setSelectedTemplateId('');
      setAssignDisplayName('');
      setAssignAsDefault(false);
      setAssignRefresh(60);
      setValidationResult(null);
      fetchAll();
    } catch {
      notify.error('Failed to assign dashboard');
    } finally {
      setAssigning(false);
    }
  };

  const handleSetDefault = async (assignment: TeamAssignmentResponse) => {
    if (!teamId) return;
    try {
      await teamDashboardAssignmentApi.setDefault(teamId, assignment.id);
      notify.success(`"${assignment.display_name || assignment.template_name}" set as default`);
      fetchAll();
    } catch {
      notify.error('Failed to set default');
    }
  };

  const handleRemove = async () => {
    if (!teamId || !removeTarget) return;
    setRemoving(true);
    try {
      await teamDashboardAssignmentApi.remove(teamId, removeTarget.id);
      notify.success('Dashboard removed');
      setRemoveTarget(null);
      fetchAll();
    } catch {
      notify.error('Failed to remove dashboard');
    } finally {
      setRemoving(false);
    }
  };

  const handleEdit = (a: TeamAssignmentResponse) => {
    setEditTarget(a);
    setEditName(a.display_name || '');
    setEditRefresh(a.refresh_interval_seconds);
  };

  const handleSaveEdit = async () => {
    if (!teamId || !editTarget) return;
    setSaving(true);
    try {
      await teamDashboardAssignmentApi.update(teamId, editTarget.id, {
        display_name: editName || null,
        refresh_interval_seconds: editRefresh,
      });
      notify.success('Dashboard updated');
      setEditTarget(null);
      fetchAll();
    } catch {
      notify.error('Failed to update dashboard');
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };
  const handleDrop = async (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex || !teamId) return;
    const reordered = [...assignments];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    setAssignments(reordered);
    setDragIndex(null);
    setDragOverIndex(null);
    try {
      await teamDashboardAssignmentApi.reorder(teamId, reordered.map(a => a.id));
    } catch {
      notify.error('Failed to reorder');
      fetchAll();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-neutral-100 rounded-xl w-80" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-neutral-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  const teamColor = team?.color || '#30D158';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/teams/${teamId}`)}
          className="p-2 rounded-xl border border-neutral-200 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: teamColor + '20' }}
          >
            <Activity className="w-4 h-4" style={{ color: teamColor }} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-neutral-900 truncate">{team?.name} — Team Dashboards</h1>
            <p className="text-xs text-neutral-400">Assign and render executive roll-up dashboards from team aggregate metrics</p>
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setAssignModalOpen(true)}
          disabled={availableTemplates.length === 0}
        >
          Assign Template
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Assigned Dashboards', value: assignments.length, icon: LayoutDashboard, color: '#0A84FF' },
          { label: 'Default Dashboard', value: assignments.find(a => a.is_default)?.display_name || assignments.find(a => a.is_default)?.template_name || 'None set', icon: Star, color: '#FF9F0A' },
          { label: 'Team Scope Templates', value: templates.filter(t => t.scope === 'team').length, icon: Users, color: '#30D158' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-neutral-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + '15' }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-neutral-400">{label}</p>
              <p className="text-sm font-semibold text-neutral-900 truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {assignments.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LayoutDashboard className="w-8 h-8 text-neutral-300" />
            </div>
            <h3 className="text-base font-semibold text-neutral-700 mb-1">No Team Dashboards Assigned</h3>
            <p className="text-sm text-neutral-400 mb-6 max-w-sm mx-auto">
              Assign dashboard templates scoped to this team. Widgets bound to
              <code className="mx-1 px-1.5 py-0.5 bg-neutral-100 rounded text-xs">team_aggregate</code>
              metrics will render live from pre-computed team rollup data.
            </p>
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setAssignModalOpen(true)}
              disabled={availableTemplates.length === 0}
            >
              Assign Template
            </Button>
            {availableTemplates.length === 0 && (
              <p className="text-xs text-neutral-400 mt-3">
                No templates available.{' '}
                <button
                  onClick={() => navigate('/dashboard-builder')}
                  className="text-primary-600 hover:underline"
                >
                  Create a team-scoped template in Dashboard Builder
                </button>
              </p>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-neutral-400 flex items-center gap-1.5">
            <GripVertical className="w-3.5 h-3.5" />
            Drag rows to reorder dashboards
          </p>
          {assignments.map((assignment, index) => (
            <AssignmentRow
              key={assignment.id}
              assignment={assignment}
              index={index}
              isDragging={dragIndex === index}
              isDragOver={dragOverIndex === index}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
              onSetDefault={handleSetDefault}
              onEdit={handleEdit}
              onRemove={setRemoveTarget}
              onOpen={(a) => navigate(`/teams/${teamId}/dashboards/${a.id}`)}
              teamId={teamId!}
            />
          ))}
        </div>
      )}

      <Modal
        open={assignModalOpen}
        onClose={() => { setAssignModalOpen(false); setValidationResult(null); setSelectedTemplateId(''); }}
        title="Assign Team Dashboard Template"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setAssignModalOpen(false); setValidationResult(null); setSelectedTemplateId(''); }}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              loading={assigning}
              disabled={!selectedTemplateId || (validationResult?.errors.length ?? 0) > 0}
            >
              Assign Dashboard
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700 flex items-start gap-2">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Team dashboards render widgets using <strong>team aggregate metrics</strong> computed from all
              projects assigned to this team. Use templates with <code className="bg-blue-100 px-1 rounded">team_aggregate</code> metric bindings for best results.
            </span>
          </div>

          {teamScopedTemplates.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Recommended — Team Scope</label>
              <div className="grid grid-cols-1 gap-2 max-h-44 overflow-y-auto pr-1">
                {teamScopedTemplates.map(t => (
                  <TemplateOption key={t.id} template={t} selected={selectedTemplateId === t.id} onSelect={handleTemplateSelect} />
                ))}
              </div>
            </div>
          )}

          {otherTemplates.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Other Templates</label>
              <div className="grid grid-cols-1 gap-2 max-h-36 overflow-y-auto pr-1">
                {otherTemplates.map(t => (
                  <TemplateOption key={t.id} template={t} selected={selectedTemplateId === t.id} onSelect={handleTemplateSelect} />
                ))}
              </div>
            </div>
          )}

          {availableTemplates.length === 0 && (
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-sm text-neutral-400 text-center">
              All templates are already assigned to this team.
            </div>
          )}

          {validating && (
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Validating template against team aggregate metrics...
            </div>
          )}

          {validationResult && !validating && (
            <TeamValidationResultPanel result={validationResult} />
          )}

          {selectedTemplateId && (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Display Name <span className="text-neutral-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  placeholder="Custom name for this team dashboard..."
                  value={assignDisplayName}
                  onChange={e => setAssignDisplayName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Auto-Refresh Interval</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-primary-400"
                    value={assignRefresh}
                    onChange={e => setAssignRefresh(Number(e.target.value))}
                  >
                    {REFRESH_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => setAssignAsDefault(v => !v)}
                      className={cn(
                        'w-9 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0',
                        assignAsDefault ? 'bg-primary-500' : 'bg-neutral-200'
                      )}
                    >
                      <div className={cn(
                        'w-4 h-4 bg-white rounded-full shadow-sm mt-0.5 transition-transform',
                        assignAsDefault ? 'translate-x-4.5' : 'translate-x-0.5'
                      )} />
                    </div>
                    <span className="text-sm text-neutral-700">Set as default</span>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Dashboard Assignment"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button loading={saving} onClick={handleSaveEdit}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Display Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              placeholder={editTarget?.template_name || 'Dashboard name...'}
              value={editName}
              onChange={e => setEditName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Auto-Refresh Interval</label>
            <select
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:border-primary-400"
              value={editRefresh}
              onChange={e => setEditRefresh(Number(e.target.value))}
            >
              {REFRESH_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
        title="Remove Dashboard"
        message={`Remove "${removeTarget?.display_name || removeTarget?.template_name}" from this team? Widget overrides will also be deleted.`}
        confirmLabel="Remove"
        variant="danger"
        loading={removing}
      />
    </div>
  );
}

function TemplateOption({ template, selected, onSelect }: {
  template: DashboardTemplate;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const scopeColor = SCOPE_COLORS[template.scope] || '#636366';
  return (
    <button
      onClick={() => onSelect(template.id)}
      className={cn(
        'w-full text-left p-3 rounded-xl border transition-all',
        selected
          ? 'border-primary-500 bg-primary-50'
          : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: scopeColor }}
          />
          <span className="font-medium text-sm text-neutral-900 truncate">{template.name}</span>
          {template.category && (
            <span className="text-xs text-neutral-400 shrink-0">· {template.category}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-400 flex-shrink-0">
          <span>{template.widget_count}w</span>
          <span
            className="capitalize px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: scopeColor + '15', color: scopeColor }}
          >
            {template.scope}
          </span>
        </div>
      </div>
      {template.description && (
        <p className="text-xs text-neutral-400 mt-1 truncate">{template.description}</p>
      )}
    </button>
  );
}

function AssignmentRow({
  assignment, index, isDragging, isDragOver,
  onDragStart, onDragOver, onDrop, onDragEnd,
  onSetDefault, onEdit, onRemove, onOpen, teamId,
}: {
  assignment: TeamAssignmentResponse;
  index: number;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: (i: number) => void;
  onDragOver: (e: React.DragEvent, i: number) => void;
  onDrop: (i: number) => void;
  onDragEnd: () => void;
  onSetDefault: (a: TeamAssignmentResponse) => void;
  onEdit: (a: TeamAssignmentResponse) => void;
  onRemove: (a: TeamAssignmentResponse) => void;
  onOpen: (a: TeamAssignmentResponse) => void;
  teamId: string;
}) {
  const displayName = assignment.display_name || assignment.template_name || 'Unnamed Dashboard';
  const scopeColor = SCOPE_COLORS[assignment.template_scope || 'team'] || '#30D158';

  return (
    <motion.div
      layout
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e as unknown as React.DragEvent, index)}
      onDrop={() => onDrop(index)}
      onDragEnd={onDragEnd}
      className={cn(
        'group bg-white rounded-2xl border transition-all',
        isDragOver ? 'border-primary-400 shadow-lg scale-[1.01]' : 'border-neutral-100 shadow-sm hover:border-neutral-200 hover:shadow-md',
        isDragging ? 'opacity-40' : 'opacity-100',
      )}
    >
      <div className="flex items-center gap-3 p-4">
        <div className="cursor-grab active:cursor-grabbing p-1 text-neutral-300 hover:text-neutral-500 transition-colors flex-shrink-0">
          <GripVertical className="w-4 h-4" />
        </div>

        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: scopeColor + '15' }}
        >
          <Activity className="w-5 h-5" style={{ color: scopeColor }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-neutral-900">{displayName}</span>
            {assignment.is_default && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-xs font-medium border border-amber-200">
                <Star className="w-3 h-3" />
                Default
              </span>
            )}
            {assignment.display_name && (
              <span className="text-xs text-neutral-400 font-normal">({assignment.template_name})</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-neutral-400">
            <span className="flex items-center gap-1">
              <BarChart2 className="w-3 h-3" />
              {assignment.widget_count} widgets
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {REFRESH_OPTIONS.find(o => o.value === assignment.refresh_interval_seconds)?.label || `${assignment.refresh_interval_seconds}s`}
            </span>
            <span
              className="capitalize px-1.5 py-0.5 rounded-full text-xs"
              style={{ backgroundColor: scopeColor + '15', color: scopeColor }}
            >
              {assignment.template_scope || 'team'}
            </span>
            {assignment.overrides.length > 0 && (
              <span className="flex items-center gap-1 text-neutral-400">
                <Shield className="w-3 h-3" />
                {assignment.overrides.length} override{assignment.overrides.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onSetDefault(assignment)}
            className={cn(
              'p-2 rounded-xl transition-all',
              assignment.is_default
                ? 'text-amber-400 bg-amber-50'
                : 'text-neutral-400 hover:text-amber-400 hover:bg-amber-50'
            )}
            title={assignment.is_default ? 'Default dashboard' : 'Set as default'}
          >
            {assignment.is_default ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onEdit(assignment)}
            className="p-2 rounded-xl text-neutral-400 hover:text-primary-500 hover:bg-primary-50 transition-all"
            title="Edit settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRemove(assignment)}
            className="p-2 rounded-xl text-neutral-400 hover:text-danger-500 hover:bg-danger-50 transition-all"
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpen(assignment)}
            className="p-2 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-all flex items-center gap-1.5 text-xs font-medium px-3"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>
        </div>

        <button
          onClick={() => onOpen(assignment)}
          className="p-2 rounded-xl text-neutral-300 hover:text-primary-500 transition-colors ml-1 opacity-100 group-hover:opacity-0 absolute right-4"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

function TeamValidationResultPanel({ result }: { result: TeamAssignmentValidationResult }) {
  if (result.errors.length === 0 && result.warnings.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-success-50 rounded-xl border border-success-200 text-success-700 text-sm">
        <CheckCircle className="w-4 h-4 flex-shrink-0" />
        <div>
          <span className="font-medium">Template is compatible with team aggregate metrics.</span>
          {result.total_bindings > 0 && (
            <span className="ml-1 text-success-600">
              {result.satisfied_bindings}/{result.total_bindings} team metric bindings satisfied.
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {result.errors.map((e, i) => (
        <div key={i} className="flex items-start gap-2 p-3 bg-danger-50 rounded-xl border border-danger-200 text-danger-700 text-sm">
          <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">{e.message}</span>
            {e.code === 'NO_RESOLVABLE_BINDINGS' && result.missing_metric_keys.length > 0 && (
              <p className="text-xs mt-0.5">Missing keys: {result.missing_metric_keys.join(', ')}</p>
            )}
          </div>
        </div>
      ))}

      {result.warnings.length > 0 && (
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
          <div className="flex items-center gap-2 text-amber-700 text-sm font-medium mb-2">
            <AlertTriangle className="w-4 h-4" />
            {result.warnings.length} binding{result.warnings.length > 1 ? 's' : ''} have scope notes
          </div>
          <div className="space-y-1">
            {result.warnings.slice(0, 4).map((w, i) => (
              <p key={i} className="text-xs text-amber-600">· {w.widget_title}: {w.message}</p>
            ))}
            {result.warnings.length > 4 && (
              <p className="text-xs text-amber-500">+{result.warnings.length - 4} more</p>
            )}
          </div>
        </div>
      )}

      {result.available_metric_keys.length > 0 && (
        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
          <p className="text-xs text-neutral-500 font-medium mb-1">Available team aggregate keys:</p>
          <div className="flex flex-wrap gap-1">
            {result.available_metric_keys.slice(0, 8).map(k => (
              <code key={k} className="text-xs bg-white border border-neutral-200 px-1.5 py-0.5 rounded">{k}</code>
            ))}
          </div>
        </div>
      )}

      {result.errors.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <Info className="w-3.5 h-3.5" />
          Dashboard can be assigned. Some widgets may show no data if bindings are non-team scoped.
        </div>
      )}
    </div>
  );
}
