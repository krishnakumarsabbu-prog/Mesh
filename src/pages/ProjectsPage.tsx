import React, { useEffect, useState } from 'react';
import { Plus, FolderOpen, Plug, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, CircleAlert as AlertCircle, Trash2 } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { projectApi, lobApi } from '@/lib/api';
import { Project, Lob } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Input, TextArea, Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { notify } from '@/store/notificationStore';
import { slugify } from '@/lib/utils';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function ProjectsPage() {
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lobIdFilter = searchParams.get('lob_id');
  const [projects, setProjects] = useState<Project[]>([]);
  const [lobs, setLobs] = useState<Lob[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '', lob_id: lobIdFilter || '', environment: 'production', color: '#30D158' });

  useEffect(() => {
    setPageTitle('Projects');
    setBreadcrumbs([{ label: 'Projects' }]);
    fetchData();
  }, [lobIdFilter]);

  const fetchData = async () => {
    try {
      const [projRes, lobRes] = await Promise.all([
        projectApi.list(lobIdFilter || undefined),
        lobApi.list(),
      ]);
      setProjects(projRes.data);
      setLobs(lobRes.data);
    } catch {
      notify.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await projectApi.create(form);
      notify.success('Project created');
      setCreateOpen(false);
      setForm({ name: '', slug: '', description: '', lob_id: '', environment: 'production', color: '#30D158' });
      fetchData();
    } catch (err: unknown) {
      notify.error('Failed to create project', (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await projectApi.delete(deleteTarget.id);
      notify.success('Project deleted');
      setDeleteTarget(null);
      fetchData();
    } catch {
      notify.error('Failed to delete project');
    } finally {
      setSaving(false);
    }
  };

  const getLobName = (id: string) => lobs.find((l) => l.id === id)?.name || id;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} project${projects.length !== 1 ? 's' : ''}${lobIdFilter ? ' in this LOB' : ''}`}
        actions={
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>
            New Project
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <EmptyState
            icon={FolderOpen}
            title="No Projects"
            description="Create your first project to start adding connectors."
            action={<Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>Create Project</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => {
            const total = proj.connector_count;
            const healthPct = total > 0 ? Math.round((proj.healthy_count / total) * 100) : 100;
            return (
              <Card
                key={proj.id}
                hoverable
                className="cursor-pointer group relative"
                onClick={() => navigate(`/connectors?project_id=${proj.id}`)}
              >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(proj); }}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-danger-500 hover:bg-danger-50 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: (proj.color || '#30D158') + '20' }}
                  >
                    <FolderOpen className="w-5 h-5" style={{ color: proj.color || '#30D158' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-neutral-900 truncate">{proj.name}</h3>
                    <p className="text-xs text-neutral-400">{getLobName(proj.lob_id)}</p>
                  </div>
                  <StatusBadge status={proj.status} size="xs" />
                </div>

                {total > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-neutral-500 mb-1.5">
                      <span>Health</span>
                      <span className="font-medium">{healthPct}%</span>
                    </div>
                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${healthPct}%`,
                          background: healthPct >= 90 ? '#30D158' : healthPct >= 70 ? '#FF9F0A' : '#FF453A',
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 text-xs text-neutral-500">
                  <div className="flex items-center gap-1">
                    <Plug className="w-3 h-3" />
                    <span>{proj.connector_count}</span>
                  </div>
                  <div className="flex items-center gap-1 text-success-600">
                    <CheckCircle className="w-3 h-3" />
                    <span>{proj.healthy_count}</span>
                  </div>
                  {proj.degraded_count > 0 && (
                    <div className="flex items-center gap-1 text-amber-500">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{proj.degraded_count}</span>
                    </div>
                  )}
                  {proj.down_count > 0 && (
                    <div className="flex items-center gap-1 text-danger-500">
                      <AlertCircle className="w-3 h-3" />
                      <span>{proj.down_count}</span>
                    </div>
                  )}
                  <span className="ml-auto text-xs px-2 py-0.5 bg-neutral-100 rounded-full capitalize">{proj.environment}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Project"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" form="create-project-form" loading={saving}>Create Project</Button>
          </>
        }
      >
        <form id="create-project-form" onSubmit={handleCreate} className="space-y-4">
          <Select
            label="Line of Business"
            value={form.lob_id}
            onChange={(e) => setForm({ ...form, lob_id: e.target.value })}
            options={[{ value: '', label: 'Select a LOB...' }, ...lobs.map((l) => ({ value: l.id, label: l.name }))]}
            required
          />
          <Input
            label="Name"
            placeholder="e.g., Payment Gateway"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })}
            required
          />
          <Input label="Slug" placeholder="auto-generated" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
          <TextArea label="Description" placeholder="Optional..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Select
            label="Environment"
            value={form.environment}
            onChange={(e) => setForm({ ...form, environment: e.target.value })}
            options={['production', 'staging', 'development', 'testing'].map((e) => ({ value: e, label: e.charAt(0).toUpperCase() + e.slice(1) }))}
          />
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Delete "${deleteTarget?.name}"? This will also remove all associated connectors.`}
        confirmLabel="Delete"
        variant="danger"
        loading={saving}
      />
    </div>
  );
}
