import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2, FolderOpen, Users, ArrowLeft, ShieldCheck,
  Pencil, Plus, ChevronRight, LayoutDashboard,
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { lobApi, projectApi, lobDashboardAssignmentApi } from '@/lib/api';
import { Lob, LobMember, Project, LobAssignmentResponse } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { notify } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { isSuperAdmin } from '@/lib/permissions';
import { cn } from '@/lib/utils';

export function LobDetailPage() {
  const { lobId } = useParams<{ lobId: string }>();
  const navigate = useNavigate();
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const { user } = useAuthStore();
  const superAdmin = user ? isSuperAdmin(user.role) : false;

  const [lob, setLob] = useState<Lob | null>(null);
  const [admins, setAdmins] = useState<LobMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [dashboards, setDashboards] = useState<LobAssignmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'dashboards'>('overview');

  useEffect(() => {
    if (!lobId) return;
    fetchAll();
  }, [lobId]);

  const fetchAll = async () => {
    if (!lobId) return;
    setLoading(true);
    try {
      const [lobRes, adminsRes, projectsRes, dashboardsRes] = await Promise.all([
        lobApi.get(lobId),
        lobApi.getAdmins(lobId),
        projectApi.list(lobId),
        lobDashboardAssignmentApi.list(lobId).catch(() => ({ data: [] })),
      ]);
      setLob(lobRes.data);
      setAdmins(adminsRes.data);
      setProjects(projectsRes.data);
      setDashboards(dashboardsRes.data);
      setPageTitle(lobRes.data.name);
      setBreadcrumbs([
        { label: 'Lines of Business', href: '/lobs' },
        { label: lobRes.data.name },
      ]);
    } catch {
      notify.error('Failed to load LOB details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 bg-neutral-100 rounded-xl w-64 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-neutral-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-neutral-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!lob) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-neutral-200 mx-auto mb-3" />
          <p className="text-neutral-500">LOB not found</p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/lobs')}>
            Back to LOBs
          </Button>
        </div>
      </div>
    );
  }

  const defaultDashboard = dashboards.find(d => d.is_default);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/lobs')}
          className="p-2 rounded-xl border border-neutral-200 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ backgroundColor: lob.color + '20' }}
          >
            <Building2 className="w-6 h-6" style={{ color: lob.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-900 truncate">{lob.name}</h1>
              <Badge variant={lob.is_active ? 'active' : 'inactive'} size="xs">
                {lob.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-sm text-neutral-400 font-mono">{lob.slug}</p>
          </div>
        </div>
        {superAdmin && (
          <Button
            variant="secondary"
            size="sm"
            icon={<Pencil className="w-3.5 h-3.5" />}
            onClick={() => navigate('/lobs')}
          >
            Edit
          </Button>
        )}
      </div>

      {lob.description && (
        <p className="text-sm text-neutral-600 max-w-2xl">{lob.description}</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<FolderOpen className="w-5 h-5" />}
          label="Total Projects"
          value={lob.project_count}
          color={lob.color}
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Members"
          value={lob.member_count}
          color={lob.color}
        />
        <StatCard
          icon={<ShieldCheck className="w-5 h-5" />}
          label="LOB Admins"
          value={admins.length}
          color={lob.color}
        />
        <div
          className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 flex items-center gap-4 cursor-pointer hover:border-amber-200 hover:shadow-md transition-all"
          onClick={() => navigate(`/lobs/${lobId}/dashboards`)}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#FF9F0A15' }}
          >
            <LayoutDashboard className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900">{dashboards.length}</p>
            <p className="text-xs text-neutral-500 mt-0.5">Dashboards</p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-neutral-100">
        {[
          { key: 'overview', label: 'Overview', icon: Building2 },
          { key: 'dashboards', label: `Dashboards (${dashboards.length})`, icon: LayoutDashboard },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as 'overview' | 'dashboards')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === key
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-neutral-900">Projects</h2>
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => navigate(`/projects?lob_id=${lob.id}`)}
              >
                View All
              </Button>
            </div>

            {projects.length === 0 ? (
              <Card>
                <EmptyState
                  icon={FolderOpen}
                  title="No Projects"
                  description="No projects have been added to this LOB yet."
                  action={
                    <Button
                      size="sm"
                      icon={<Plus className="w-3.5 h-3.5" />}
                      onClick={() => navigate('/projects')}
                    >
                      Add Project
                    </Button>
                  }
                />
              </Card>
            ) : (
              <div className="space-y-2">
                {projects.slice(0, 8).map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 bg-white rounded-xl border border-neutral-100 hover:border-neutral-200 hover:shadow-sm transition-all cursor-pointer group"
                    onClick={() => navigate(`/projects`)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: (project.color || '#0A84FF') + '20' }}
                      >
                        <FolderOpen className="w-4 h-4" style={{ color: project.color || '#0A84FF' }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{project.name}</p>
                        <p className="text-xs text-neutral-400 font-mono">{project.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          project.status === 'active' ? 'active'
                            : project.status === 'maintenance' ? 'warning'
                            : 'inactive'
                        }
                        size="xs"
                      >
                        {project.status}
                      </Badge>
                      <div className="text-xs text-neutral-400">
                        {project.connector_count} connectors
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-neutral-400 transition-colors" />
                    </div>
                  </div>
                ))}
                {projects.length > 8 && (
                  <button
                    className="w-full py-2.5 text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors"
                    onClick={() => navigate(`/projects?lob_id=${lob.id}`)}
                  >
                    View all {projects.length} projects
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-neutral-900">LOB Admins</h2>
              {superAdmin && (
                <button
                  className="text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors"
                  onClick={() => navigate('/lobs')}
                >
                  Manage
                </button>
              )}
            </div>

            {admins.length === 0 ? (
              <Card>
                <div className="text-center py-4">
                  <ShieldCheck className="w-8 h-8 text-neutral-200 mx-auto mb-2" />
                  <p className="text-sm text-neutral-400">No admins assigned</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-2">
                {admins.map((admin) => (
                  <div key={admin.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-neutral-100">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-semibold flex-shrink-0">
                      {(admin.user_full_name || admin.user_email || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">{admin.user_full_name}</p>
                      <p className="text-xs text-neutral-400 truncate">{admin.user_email}</p>
                    </div>
                    <Badge variant="warning" size="xs">Admin</Badge>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
              <p className="text-xs text-neutral-500 leading-relaxed">
                LOB Admins can manage projects and members within this Line of Business.
                Only Super Admins can assign or remove LOB Admins.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dashboards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Portfolio Dashboards</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Executive roll-up dashboards rendered from LOB aggregate metrics
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => navigate(`/lobs/${lobId}/dashboards`)}
            >
              Manage Dashboards
            </Button>
          </div>

          {dashboards.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <div className="w-14 h-14 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <LayoutDashboard className="w-7 h-7 text-neutral-300" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-700 mb-1">No Dashboards Assigned</h3>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto mb-4">
                  Assign portfolio dashboard templates to this LOB for executive visibility across all teams and projects.
                </p>
                <Button
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => navigate(`/lobs/${lobId}/dashboards`)}
                >
                  Assign Dashboard
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {dashboards.map(d => (
                <div
                  key={d.id}
                  className="bg-white rounded-2xl border border-neutral-100 shadow-sm hover:border-neutral-200 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => navigate(`/lobs/${lobId}/dashboards/${d.id}`)}
                >
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-50">
                      <LayoutDashboard className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-neutral-900 truncate">
                          {d.display_name || d.template_name}
                        </span>
                        {d.is_default && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-xs border border-amber-200">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {d.widget_count} widgets · scope: {d.template_scope || 'lob'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-500 transition-colors" />
                  </div>
                </div>
              ))}
              {defaultDashboard && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate(`/lobs/${lobId}/dashboards/${defaultDashboard.id}`)}
                >
                  Open Default Dashboard
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: color + '15' }}
      >
        <div style={{ color }}>{icon}</div>
      </div>
      <div>
        <p className="text-2xl font-bold text-neutral-900">{value}</p>
        <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
