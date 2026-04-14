import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Users, FolderOpen, ArrowLeft, Plus, Trash2, Play, RefreshCw,
  Activity, UserPlus, UserMinus,
  ChevronRight,
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { teamApi, projectApi, lobApi, userApi, healthRunApi } from '@/lib/api';
import { Team, TeamMember, TeamProject, Project, Lob, User, HealthRunDetail } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { notify } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { canManageProjects } from '@/lib/permissions';
import { cn } from '@/lib/utils';

type Tab = 'projects' | 'members' | 'health';

function HealthStatusBadge({ status }: { status: string }) {
  const configs: Record<string, { color: string; bg: string; label: string }> = {
    healthy: { color: '#30D158', bg: 'rgba(48,209,88,0.12)', label: 'Healthy' },
    degraded: { color: '#FF9F0A', bg: 'rgba(255,159,10,0.12)', label: 'Degraded' },
    down: { color: '#FF453A', bg: 'rgba(255,69,58,0.12)', label: 'Down' },
    unknown: { color: '#8E8E93', bg: 'rgba(142,142,147,0.12)', label: 'Unknown' },
  };
  const cfg = configs[status] || configs['unknown'];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

export function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const { user } = useAuthStore();
  const canManage = user ? canManageProjects(user.role) : false;

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [teamProjects, setTeamProjects] = useState<TeamProject[]>([]);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [lob, setLob] = useState<Lob | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('projects');

  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [removeProjectTarget, setRemoveProjectTarget] = useState<TeamProject | null>(null);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [removeMemberTarget, setRemoveMemberTarget] = useState<TeamMember | null>(null);
  const [saving, setSaving] = useState(false);

  const [addProjectForm, setAddProjectForm] = useState({ project_id: '' });
  const [addMemberForm, setAddMemberForm] = useState({ user_id: '', role: 'member' });

  const [runningProject, setRunningProject] = useState<string | null>(null);
  const [runningAll, setRunningAll] = useState(false);
  const [lastRunResults, setLastRunResults] = useState<Record<string, HealthRunDetail>>({});

  useEffect(() => {
    if (!teamId) return;
    fetchAll();
  }, [teamId]);

  const fetchAll = async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const [teamRes, membersRes, projectsRes] = await Promise.all([
        teamApi.get(teamId),
        teamApi.getMembers(teamId),
        teamApi.getProjects(teamId),
      ]);
      const t = teamRes.data as Team;
      setTeam(t);
      setMembers(membersRes.data);
      setTeamProjects(projectsRes.data);

      const lobRes = await lobApi.get(t.lob_id);
      setLob(lobRes.data);

      const allProjRes = await projectApi.list();
      const assignedIds = new Set((projectsRes.data as TeamProject[]).map(tp => tp.project_id));
      setAvailableProjects((allProjRes.data as Project[]).filter(p => !assignedIds.has(p.id)));

      setPageTitle(t.name);
      setBreadcrumbs([
        { label: 'Teams', href: '/teams' },
        { label: t.name },
      ]);
    } catch {
      notify.error('Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersForAssign = async () => {
    try {
      const res = await userApi.list();
      const existingIds = new Set(members.map(m => m.user_id));
      setAllUsers((res.data as User[]).filter(u => !existingIds.has(u.id)));
    } catch {
      notify.error('Failed to load users');
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || !addProjectForm.project_id) return;
    setSaving(true);
    try {
      await teamApi.assignProject(teamId, addProjectForm.project_id);
      notify.success('Project assigned to team');
      setAddProjectOpen(false);
      setAddProjectForm({ project_id: '' });
      fetchAll();
    } catch (err: unknown) {
      notify.error('Failed to assign project', (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveProject = async () => {
    if (!teamId || !removeProjectTarget) return;
    setSaving(true);
    try {
      await teamApi.removeProject(teamId, removeProjectTarget.id);
      notify.success('Project removed from team');
      setRemoveProjectTarget(null);
      fetchAll();
    } catch {
      notify.error('Failed to remove project');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || !addMemberForm.user_id) return;
    setSaving(true);
    try {
      await teamApi.addMember(teamId, addMemberForm);
      notify.success('Member added to team');
      setAddMemberOpen(false);
      setAddMemberForm({ user_id: '', role: 'member' });
      fetchAll();
    } catch (err: unknown) {
      notify.error('Failed to add member', (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!teamId || !removeMemberTarget) return;
    setSaving(true);
    try {
      await teamApi.removeMember(teamId, removeMemberTarget.id);
      notify.success('Member removed from team');
      setRemoveMemberTarget(null);
      fetchAll();
    } catch {
      notify.error('Failed to remove member');
    } finally {
      setSaving(false);
    }
  };

  const handleRunProject = async (projectId: string) => {
    setRunningProject(projectId);
    try {
      const res = await healthRunApi.run(projectId);
      const runDetail = res.data as HealthRunDetail;
      setLastRunResults(prev => ({ ...prev, [projectId]: runDetail }));
      notify.success('Health run completed');
    } catch {
      notify.error('Health run failed');
    } finally {
      setRunningProject(null);
    }
  };

  const handleRunAll = async () => {
    if (teamProjects.length === 0) return;
    setRunningAll(true);
    notify.info('Running health checks for all projects...');
    const results: Record<string, HealthRunDetail> = {};
    for (const tp of teamProjects) {
      try {
        const res = await healthRunApi.run(tp.project_id);
        results[tp.project_id] = res.data as HealthRunDetail;
      } catch {
        // continue for other projects
      }
    }
    setLastRunResults(prev => ({ ...prev, ...results }));
    setRunningAll(false);
    const successCount = Object.keys(results).length;
    notify.success(`Health runs completed: ${successCount}/${teamProjects.length} projects`);
    fetchAll();
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: 'projects', label: 'Projects', icon: FolderOpen, count: teamProjects.length },
    { key: 'members', label: 'Members', icon: Users, count: members.length },
    { key: 'health', label: 'Health Runs', icon: Activity },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-page-enter">
        <div className="h-8 w-48 rounded-xl animate-pulse" style={{ background: 'var(--app-bg-muted)' }} />
        <div className="h-32 rounded-xl animate-pulse" style={{ background: 'var(--app-bg-muted)' }} />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: 'var(--text-muted)' }}>Team not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-page-enter">
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate('/teams')}
          className="p-2 rounded-xl mt-0.5 transition-all"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--app-surface)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = ''; }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: team.color + '22' }}
            >
              <Users className="w-5 h-5" style={{ color: team.color }} />
            </div>
            <div>
              <h1 className="text-[20px] font-bold" style={{ color: 'var(--text-primary)' }}>{team.name}</h1>
              {lob && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Link to={`/lobs/${lob.id}`} className="text-[12px] hover:underline" style={{ color: 'var(--accent)' }}>{lob.name}</Link>
                  <ChevronRight className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                  <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Team</span>
                </div>
              )}
            </div>
          </div>
          {team.description && (
            <p className="text-[13px] mt-2 ml-[52px]" style={{ color: 'var(--text-muted)' }}>{team.description}</p>
          )}
        </div>

        {canManage && teamProjects.length > 0 && (
          <Button
            icon={runningAll ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            onClick={handleRunAll}
            loading={runningAll}
            variant="secondary"
          >
            Run All Projects
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="flex flex-col items-center py-4">
          <p className="text-[24px] font-bold" style={{ color: 'var(--text-primary)' }}>{team.project_count}</p>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Projects</p>
        </Card>
        <Card className="flex flex-col items-center py-4">
          <p className="text-[24px] font-bold" style={{ color: 'var(--text-primary)' }}>{team.member_count}</p>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Members</p>
        </Card>
        <Card className="flex flex-col items-center py-4">
          <p className="text-[24px] font-bold" style={{ color: team.is_active ? '#30D158' : 'var(--text-muted)' }}>
            {team.is_active ? 'Active' : 'Inactive'}
          </p>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Status</p>
        </Card>
      </div>

      <div className="flex gap-1 border-b" style={{ borderColor: 'var(--app-border)' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-all',
                activeTab === tab.key
                  ? 'border-current'
                  : 'border-transparent'
              )}
              style={{
                color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-muted)',
                borderColor: activeTab === tab.key ? 'var(--accent)' : 'transparent',
              }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    background: activeTab === tab.key ? 'var(--accent-subtle)' : 'var(--app-bg-muted)',
                    color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-muted)',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
              {teamProjects.length} project{teamProjects.length !== 1 ? 's' : ''} assigned to this team
            </p>
            {canManage && (
              <Button
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setAddProjectOpen(true)}
                variant="secondary"
                size="sm"
              >
                Assign Project
              </Button>
            )}
          </div>

          {teamProjects.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No projects assigned"
              description="Assign projects to this team to manage and run health checks."
              action={canManage ? <Button icon={<Plus className="w-4 h-4" />} onClick={() => setAddProjectOpen(true)}>Assign Project</Button> : undefined}
            />
          ) : (
            <div className="space-y-2">
              {teamProjects.map(tp => {
                const runResult = lastRunResults[tp.project_id];
                const isRunning = runningProject === tp.project_id;
                const healthPct = tp.connector_count > 0
                  ? Math.round((tp.healthy_count / tp.connector_count) * 100)
                  : null;

                return (
                  <Card key={tp.id} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: (tp.project_color || '#30D158') + '22' }}
                      >
                        <FolderOpen className="w-4 h-4" style={{ color: tp.project_color || '#30D158' }} />
                      </div>
                      <div className="min-w-0">
                        <button
                          onClick={() => navigate(`/projects/${tp.project_id}`)}
                          className="text-[13px] font-semibold hover:underline text-left"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {tp.project_name}
                        </button>
                        <div className="flex items-center gap-2 mt-0.5">
                          {tp.project_environment && (
                            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--app-bg-muted)', color: 'var(--text-muted)' }}>
                              {tp.project_environment}
                            </span>
                          )}
                          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            {tp.connector_count} connector{tp.connector_count !== 1 ? 's' : ''}
                          </span>
                          {healthPct !== null && (
                            <span className="text-[11px]" style={{ color: healthPct >= 80 ? '#30D158' : healthPct >= 50 ? '#FF9F0A' : '#FF453A' }}>
                              {healthPct}% healthy
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {runResult && runResult.overall_health_status && (
                        <HealthStatusBadge status={runResult.overall_health_status} />
                      )}
                      {tp.project_status && (
                        <StatusBadge status={tp.project_status} />
                      )}
                      {canManage && (
                        <button
                          onClick={() => handleRunProject(tp.project_id)}
                          disabled={isRunning || runningAll}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                          style={{
                            background: 'var(--accent-subtle)',
                            color: 'var(--accent)',
                            opacity: isRunning || runningAll ? 0.5 : 1,
                          }}
                          onMouseEnter={e => { if (!isRunning && !runningAll) e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = 'white'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-subtle)'; e.currentTarget.style.color = 'var(--accent)'; }}
                        >
                          {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                          {isRunning ? 'Running...' : 'Run'}
                        </button>
                      )}
                      {canManage && (
                        <button
                          onClick={() => setRemoveProjectTarget(tp)}
                          className="p-1.5 rounded-lg transition-all"
                          style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#FF453A'; e.currentTarget.style.background = 'rgba(255,69,58,0.1)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = ''; }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
              {members.length} member{members.length !== 1 ? 's' : ''} in this team
            </p>
            {canManage && (
              <Button
                icon={<UserPlus className="w-4 h-4" />}
                onClick={() => { setAddMemberOpen(true); fetchUsersForAssign(); }}
                variant="secondary"
                size="sm"
              >
                Add Member
              </Button>
            )}
          </div>

          {members.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No members yet"
              description="Add members to this team to grant access to its projects."
              action={canManage ? <Button icon={<UserPlus className="w-4 h-4" />} onClick={() => { setAddMemberOpen(true); fetchUsersForAssign(); }}>Add Member</Button> : undefined}
            />
          ) : (
            <div className="space-y-2">
              {members.map(member => (
                <Card key={member.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[11px] font-bold">
                        {(member.user_full_name || member.user_email || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                        {member.user_full_name || member.user_email}
                      </p>
                      {member.user_email && member.user_full_name && (
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{member.user_email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-medium capitalize"
                      style={{ background: 'var(--app-bg-muted)', color: 'var(--text-secondary)' }}
                    >
                      {member.role}
                    </span>
                    {canManage && (
                      <button
                        onClick={() => setRemoveMemberTarget(member)}
                        className="p-1.5 rounded-lg transition-all"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#FF453A'; e.currentTarget.style.background = 'rgba(255,69,58,0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = ''; }}
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'health' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
              Health run results for this session
            </p>
            {canManage && teamProjects.length > 0 && (
              <Button
                icon={runningAll ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                onClick={handleRunAll}
                loading={runningAll}
              >
                Run All Projects
              </Button>
            )}
          </div>

          {Object.keys(lastRunResults).length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No health runs yet"
              description="Run health checks on individual projects or run all at once."
              action={canManage && teamProjects.length > 0
                ? <Button icon={<Play className="w-4 h-4" />} onClick={handleRunAll} loading={runningAll}>Run All Projects</Button>
                : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {teamProjects.map(tp => {
                const runResult = lastRunResults[tp.project_id];
                if (!runResult) return null;
                return (
                  <Card key={tp.project_id}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4" style={{ color: tp.project_color || '#30D158' }} />
                        <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{tp.project_name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {runResult.overall_health_status && (
                          <HealthStatusBadge status={runResult.overall_health_status} />
                        )}
                        {runResult.overall_score !== undefined && (
                          <span className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>
                            {Math.round(runResult.overall_score)}%
                          </span>
                        )}
                      </div>
                    </div>

                    {runResult.connector_results && runResult.connector_results.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {runResult.connector_results.slice(0, 5).map(cr => (
                          <div key={cr.id} className="flex items-center justify-between text-[12px] px-3 py-1.5 rounded-lg" style={{ background: 'var(--app-bg-muted)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{cr.connector_name}</span>
                            <span style={{ color: cr.outcome === 'success' ? '#30D158' : '#FF453A' }}>
                              {cr.outcome}
                              {cr.response_time_ms !== undefined && ` · ${cr.response_time_ms}ms`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-4 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      <span>{runResult.success_count} success</span>
                      <span>{runResult.failure_count} failed</span>
                      <span>{runResult.connector_count} total</span>
                      {runResult.total_duration_ms && <span>{runResult.total_duration_ms}ms</span>}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      <Modal
        open={addProjectOpen}
        onClose={() => setAddProjectOpen(false)}
        title="Assign Project"
        subtitle="Add a project to this team"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddProjectOpen(false)}>Cancel</Button>
            <Button type="submit" form="add-project-form" loading={saving}>Assign</Button>
          </>
        }
      >
        <form id="add-project-form" onSubmit={handleAddProject} className="space-y-4">
          <Select
            label="Project"
            value={addProjectForm.project_id}
            onChange={e => setAddProjectForm({ project_id: e.target.value })}
            options={[
              { value: '', label: 'Select a project...' },
              ...availableProjects.map(p => ({ value: p.id, label: p.name })),
            ]}
            required
          />
          {availableProjects.length === 0 && (
            <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
              All projects are already assigned to this team.
            </p>
          )}
        </form>
      </Modal>

      <Modal
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        title="Add Member"
        subtitle="Add a user to this team"
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
            value={addMemberForm.user_id}
            onChange={e => setAddMemberForm({ ...addMemberForm, user_id: e.target.value })}
            options={[
              { value: '', label: 'Select a user...' },
              ...allUsers.map(u => ({ value: u.id, label: `${u.full_name} (${u.email})` })),
            ]}
            required
          />
          <Select
            label="Role"
            value={addMemberForm.role}
            onChange={e => setAddMemberForm({ ...addMemberForm, role: e.target.value })}
            options={[
              { value: 'member', label: 'Member' },
              { value: 'lead', label: 'Team Lead' },
              { value: 'admin', label: 'Team Admin' },
            ]}
          />
        </form>
      </Modal>

      <ConfirmModal
        open={!!removeProjectTarget}
        onClose={() => setRemoveProjectTarget(null)}
        onConfirm={handleRemoveProject}
        title="Remove Project"
        message={`Remove "${removeProjectTarget?.project_name}" from this team? The project itself will not be deleted.`}
        confirmLabel="Remove"
        variant="danger"
        loading={saving}
      />

      <ConfirmModal
        open={!!removeMemberTarget}
        onClose={() => setRemoveMemberTarget(null)}
        onConfirm={handleRemoveMember}
        title="Remove Member"
        message={`Remove ${removeMemberTarget?.user_full_name || removeMemberTarget?.user_email} from this team?`}
        confirmLabel="Remove"
        variant="danger"
        loading={saving}
      />
    </div>
  );
}
