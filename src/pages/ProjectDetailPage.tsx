import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FolderOpen, Plug, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle,
  CircleAlert as AlertCircle, ArrowLeft, Users, Plus, Trash2,
  Pencil, ChevronRight, Settings,
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { projectApi, userApi, lobApi } from '@/lib/api';
import { Project, ProjectMember, User, Lob } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { notify } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { isLobAdmin, canManageProjects } from '@/lib/permissions';
import { cn } from '@/lib/utils';

const MEMBER_ROLE_OPTIONS = [
  { value: 'project_admin', label: 'Project Admin' },
  { value: 'project_user', label: 'Project User' },
];

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const { user } = useAuthStore();
  const canManage = user ? canManageProjects(user.role) : false;
  const canDelete = user ? isLobAdmin(user.role) : false;

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [lob, setLob] = useState<Lob | null>(null);
  const [loading, setLoading] = useState(true);

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [removeMemberTarget, setRemoveMemberTarget] = useState<ProjectMember | null>(null);
  const [editMemberTarget, setEditMemberTarget] = useState<ProjectMember | null>(null);
  const [saving, setSaving] = useState(false);

  const [addForm, setAddForm] = useState({ user_id: '', role: 'project_user' as 'project_admin' | 'project_user' });
  const [editRole, setEditRole] = useState<'project_admin' | 'project_user'>('project_user');

  useEffect(() => {
    if (!projectId) return;
    fetchAll();
  }, [projectId]);

  const fetchAll = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [projRes, membersRes] = await Promise.all([
        projectApi.get(projectId),
        projectApi.getMembers(projectId),
      ]);
      setProject(projRes.data);
      setMembers(membersRes.data);

      const lobRes = await lobApi.get(projRes.data.lob_id);
      setLob(lobRes.data);

      setPageTitle(projRes.data.name);
      setBreadcrumbs([
        { label: 'Projects', href: '/projects' },
        { label: projRes.data.name },
      ]);
    } catch {
      notify.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersForAssign = async () => {
    try {
      const res = await userApi.list({ is_active: true });
      setAllUsers(res.data);
    } catch {
      notify.error('Failed to load users');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setSaving(true);
    try {
      await projectApi.addMember(projectId, addForm);
      notify.success('Member added');
      setAddMemberOpen(false);
      setAddForm({ user_id: '', role: 'project_user' });
      fetchAll();
    } catch (err: unknown) {
      notify.error('Failed to add member', (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMember = async () => {
    if (!projectId || !editMemberTarget) return;
    setSaving(true);
    try {
      await projectApi.updateMember(projectId, editMemberTarget.id, { role: editRole });
      notify.success('Member role updated');
      setEditMemberTarget(null);
      fetchAll();
    } catch {
      notify.error('Failed to update member');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!projectId || !removeMemberTarget) return;
    setSaving(true);
    try {
      await projectApi.removeMember(projectId, removeMemberTarget.id);
      notify.success('Member removed');
      setRemoveMemberTarget(null);
      fetchAll();
    } catch {
      notify.error('Failed to remove member');
    } finally {
      setSaving(false);
    }
  };

  const openAddMember = () => {
    fetchUsersForAssign();
    setAddForm({ user_id: '', role: 'project_user' });
    setAddMemberOpen(true);
  };

  const openEditMember = (m: ProjectMember) => {
    setEditRole(m.role);
    setEditMemberTarget(m);
  };

  const existingUserIds = new Set(members.map(m => m.user_id));
  const availableUsers = allUsers.filter(u => !existingUserIds.has(u.id));

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 bg-neutral-100 rounded-xl w-64 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-neutral-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-neutral-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FolderOpen className="w-12 h-12 text-neutral-200 mx-auto mb-3" />
          <p className="text-neutral-500">Project not found</p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/projects')}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const total = project.connector_count;
  const healthPct = total > 0 ? Math.round((project.healthy_count / total) * 100) : 100;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/projects')}
          className="p-2 rounded-xl border border-neutral-200 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ backgroundColor: (project.color || '#30D158') + '20' }}
          >
            <FolderOpen className="w-6 h-6" style={{ color: project.color || '#30D158' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-neutral-900">{project.name}</h1>
              <StatusBadge status={project.status} size="xs" />
              <span className="text-xs px-2 py-0.5 bg-neutral-100 rounded-full text-neutral-500 capitalize">{project.environment}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-neutral-400 font-mono">{project.slug}</p>
              {lob && (
                <>
                  <span className="text-neutral-300">·</span>
                  <button
                    onClick={() => navigate(`/lobs/${project.lob_id}`)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    {lob.name}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        {canManage && (
          <Button
            variant="secondary"
            size="sm"
            icon={<Settings className="w-3.5 h-3.5" />}
            onClick={() => navigate('/projects')}
          >
            Settings
          </Button>
        )}
      </div>

      {project.description && (
        <p className="text-sm text-neutral-600 max-w-2xl">{project.description}</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<Plug className="w-5 h-5" />} label="Connectors" value={project.connector_count} color={project.color || '#30D158'} />
        <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Healthy" value={project.healthy_count} color="#30D158" />
        <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Degraded" value={project.degraded_count} color="#FF9F0A" />
        <StatCard icon={<AlertCircle className="w-5 h-5" />} label="Down" value={project.down_count} color="#FF453A" />
      </div>

      {total > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-700">Overall Health</span>
            <span className="text-sm font-bold" style={{ color: healthPct >= 90 ? '#30D158' : healthPct >= 70 ? '#FF9F0A' : '#FF453A' }}>
              {healthPct}%
            </span>
          </div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${healthPct}%`,
                background: healthPct >= 90 ? '#30D158' : healthPct >= 70 ? '#FF9F0A' : '#FF453A',
              }}
            />
          </div>
          <div className="flex items-center gap-6 mt-3 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-success inline-block" />{project.healthy_count} healthy</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />{project.degraded_count} degraded</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-danger-500 inline-block" />{project.down_count} down</span>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-neutral-900">Connectors</h2>
            <Button
              variant="secondary"
              size="sm"
              icon={<ChevronRight className="w-3.5 h-3.5" />}
              onClick={() => navigate(`/connectors?project_id=${project.id}`)}
            >
              View All
            </Button>
          </div>
          <Card>
            <EmptyState
              icon={Plug}
              title="Manage Connectors"
              description="View and manage connectors for this project."
              action={
                <Button size="sm" icon={<ChevronRight className="w-3.5 h-3.5" />} onClick={() => navigate(`/connectors?project_id=${project.id}`)}>
                  Go to Connectors
                </Button>
              }
            />
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-neutral-900">Members</h2>
            {canManage && (
              <Button
                size="sm"
                variant="secondary"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={openAddMember}
              >
                Add Member
              </Button>
            )}
          </div>

          {members.length === 0 ? (
            <Card>
              <div className="text-center py-4">
                <Users className="w-8 h-8 text-neutral-200 mx-auto mb-2" />
                <p className="text-sm text-neutral-400">No members assigned</p>
                {canManage && (
                  <button
                    onClick={openAddMember}
                    className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Assign members
                  </button>
                )}
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {members.map(m => (
                <MemberRow
                  key={m.id}
                  member={m}
                  canManage={canManage}
                  onEdit={openEditMember}
                  onRemove={setRemoveMemberTarget}
                />
              ))}
            </div>
          )}

          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
            <p className="text-xs text-neutral-500 leading-relaxed">
              <strong>Project Admin</strong> can manage connectors and members.
              <br />
              <strong>Project User</strong> has read-only access to this project.
            </p>
          </div>
        </div>
      </div>

      <Modal
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        title="Add Project Member"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddMemberOpen(false)}>Cancel</Button>
            <Button type="submit" form="add-member-form" loading={saving}>Add Member</Button>
          </>
        }
      >
        <form id="add-member-form" onSubmit={handleAddMember} className="space-y-4">
          <Select
            label="User"
            value={addForm.user_id}
            onChange={e => setAddForm({ ...addForm, user_id: e.target.value })}
            options={[
              { value: '', label: 'Select a user...' },
              ...availableUsers.map(u => ({ value: u.id, label: `${u.full_name} (${u.email})` })),
            ]}
            required
          />
          <Select
            label="Role"
            value={addForm.role}
            onChange={e => setAddForm({ ...addForm, role: e.target.value as 'project_admin' | 'project_user' })}
            options={MEMBER_ROLE_OPTIONS}
          />
          {availableUsers.length === 0 && (
            <p className="text-xs text-neutral-400">All users are already members of this project.</p>
          )}
        </form>
      </Modal>

      <Modal
        open={!!editMemberTarget}
        onClose={() => setEditMemberTarget(null)}
        title="Update Member Role"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditMemberTarget(null)}>Cancel</Button>
            <Button loading={saving} onClick={handleUpdateMember}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          {editMemberTarget && (
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-semibold flex-shrink-0">
                {(editMemberTarget.user_full_name || editMemberTarget.user_email || '?')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">{editMemberTarget.user_full_name}</p>
                <p className="text-xs text-neutral-400">{editMemberTarget.user_email}</p>
              </div>
            </div>
          )}
          <Select
            label="New Role"
            value={editRole}
            onChange={e => setEditRole(e.target.value as 'project_admin' | 'project_user')}
            options={MEMBER_ROLE_OPTIONS}
          />
        </div>
      </Modal>

      <ConfirmModal
        open={!!removeMemberTarget}
        onClose={() => setRemoveMemberTarget(null)}
        onConfirm={handleRemoveMember}
        title="Remove Member"
        message={`Remove "${removeMemberTarget?.user_full_name || removeMemberTarget?.user_email}" from this project?`}
        confirmLabel="Remove"
        variant="danger"
        loading={saving}
      />
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + '15' }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div>
        <p className="text-xl font-bold text-neutral-900">{value}</p>
        <p className="text-xs text-neutral-500">{label}</p>
      </div>
    </div>
  );
}

function MemberRow({ member, canManage, onEdit, onRemove }: {
  member: ProjectMember;
  canManage: boolean;
  onEdit: (m: ProjectMember) => void;
  onRemove: (m: ProjectMember) => void;
}) {
  const isAdmin = member.role === 'project_admin';
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-neutral-100 group hover:border-neutral-200 transition-all">
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0',
        isAdmin ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-600'
      )}>
        {(member.user_full_name || member.user_email || '?')[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 truncate">{member.user_full_name || member.user_email}</p>
        <p className="text-xs text-neutral-400 truncate">{member.user_email}</p>
      </div>
      <Badge variant={isAdmin ? 'active' : 'default'} size="xs">
        {isAdmin ? 'Admin' : 'User'}
      </Badge>
      {canManage && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(member)}
            className="p-1 rounded-lg text-neutral-400 hover:text-primary-500 hover:bg-primary-50 transition-all"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={() => onRemove(member)}
            className="p-1 rounded-lg text-neutral-400 hover:text-danger-500 hover:bg-danger-50 transition-all"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
