import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Shield, Pencil, UserX, UserCheck, X, ChevronDown } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { userApi } from '@/lib/api';
import { User, UserRole } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { notify } from '@/store/notificationStore';
import { formatRelativeTime, cn } from '@/lib/utils';
import { ROLE_LABELS, ROLE_COLORS, ALL_ROLES, isAdmin, isSuperAdmin, canAssignRole } from '@/lib/permissions';
import { TableRowSkeleton } from '@/components/ui/Skeleton';

function RoleBadge({ role }: { role: UserRole }) {
  const colors = ROLE_COLORS[role];
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border', colors.bg, colors.text, colors.border)}>
      <Shield className="w-2.5 h-2.5" />
      {ROLE_LABELS[role]}
    </span>
  );
}

interface UserFormData {
  email: string;
  full_name: string;
  password: string;
  role: UserRole;
}

interface EditFormData {
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

const DEFAULT_FORM: UserFormData = { email: '', full_name: '', password: '', role: 'project_user' };

function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    super_admin: 'Full platform access, can manage all users, settings, and data.',
    lob_admin: 'Manages LOB settings, members, and all projects within their LOB.',
    project_admin: 'Manages connectors, health checks, and members within their projects.',
    project_user: 'Read and interact access to assigned project data and connectors.',
    admin: 'Legacy admin role with broad platform access.',
    analyst: 'Read access to analytics, dashboards, and health reports.',
    viewer: 'Read-only access to assigned resources.',
  };
  return descriptions[role] || '';
}

export function UsersPage() {
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const { user: currentUser } = useAuthStore();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  const [createForm, setCreateForm] = useState<UserFormData>({ ...DEFAULT_FORM });
  const [editForm, setEditForm] = useState<EditFormData>({ full_name: '', role: 'project_user', is_active: true });

  useEffect(() => {
    setPageTitle('Users');
    setBreadcrumbs([{ label: 'Users' }]);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: { search?: string; role?: string; is_active?: boolean } = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter !== '') params.is_active = statusFilter === 'active';
      const res = await userApi.list(params);
      setUsers(res.data);
    } catch {
      notify.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userApi.create(createForm);
      notify.success('User created successfully');
      setCreateOpen(false);
      setCreateForm({ ...DEFAULT_FORM });
      fetchUsers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      notify.error('Failed to create user', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    try {
      await userApi.update(editTarget.id, editForm);
      notify.success('User updated successfully');
      setEditTarget(null);
      fetchUsers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      notify.error('Failed to update user', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setSaving(true);
    try {
      await userApi.deactivate(deactivateTarget.id);
      notify.success('User deactivated');
      setDeactivateTarget(null);
      fetchUsers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      notify.error('Failed to deactivate user', msg);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (u: User) => {
    setEditForm({ full_name: u.full_name, role: u.role, is_active: u.is_active });
    setEditTarget(u);
  };

  const userIsAdmin = currentUser ? isAdmin(currentUser.role) : false;
  const userIsSuperAdmin = currentUser ? isSuperAdmin(currentUser.role) : false;

  const availableRoles = ALL_ROLES.filter((r) => {
    if (r === 'super_admin') return userIsSuperAdmin;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Users"
        subtitle={`${users.length} team member${users.length !== 1 ? 's' : ''}`}
        actions={
          userIsAdmin ? (
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>
              Add User
            </Button>
          ) : undefined
        }
      />

      <Card padding="none">
        <div className="px-5 py-4 border-b border-neutral-50 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl outline-none transition-all duration-150"
              style={{
                background: 'var(--app-surface)',
                border: '1px solid var(--app-border)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--accent)';
                (e.currentTarget as HTMLInputElement).style.boxShadow = '0 0 0 3px var(--accent-subtle)';
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--app-border)';
                (e.currentTarget as HTMLInputElement).style.boxShadow = '';
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2.5 text-sm rounded-xl outline-none transition-all cursor-pointer"
                  style={{
                    background: 'var(--app-surface)',
                    border: '1px solid var(--app-border)',
                    color: 'var(--text-secondary)',
                  }}
              >
                <option value="">All roles</option>
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2.5 text-sm rounded-xl outline-none transition-all cursor-pointer"
                  style={{
                    background: 'var(--app-surface)',
                    border: '1px solid var(--app-border)',
                    color: 'var(--text-secondary)',
                  }}
              >
                <option value="">All status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="divide-y divide-neutral-50">
            {Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={4} />)}
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="No users found"
            description={
              search || roleFilter || statusFilter
                ? 'Try adjusting your filters.'
                : 'Add the first team member to get started.'
            }
            action={
              !search && !roleFilter && !statusFilter && userIsAdmin
                ? <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>Add User</Button>
                : undefined
            }
          />
        ) : (
          <div className="divide-y divide-neutral-50/80">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-neutral-50/50 transition-colors group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                      <span className="text-white text-[12px] font-bold">
                        {u.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span
                      className={cn(
                        'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white',
                        u.is_active ? 'bg-success' : 'bg-neutral-300',
                      )}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{u.full_name}</p>
                      {u.id === currentUser?.id && (
                        <span className="text-[10px] font-semibold text-primary-500 bg-primary-50 px-1.5 py-0.5 rounded-full flex-shrink-0">You</span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 truncate">{u.email}</p>
                  </div>
                </div>

                <div className="hidden sm:block flex-shrink-0">
                  <RoleBadge role={u.role} />
                </div>

                <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
                  <span className={cn('w-1.5 h-1.5 rounded-full', u.is_active ? 'bg-success' : 'bg-neutral-300')} />
                  <span className="text-xs text-neutral-500">{u.is_active ? 'Active' : 'Inactive'}</span>
                </div>

                <div className="hidden lg:block text-xs text-neutral-400 flex-shrink-0 w-24 text-right">
                  {u.last_login ? formatRelativeTime(u.last_login) : 'Never'}
                </div>

                {userIsAdmin && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => openEdit(u)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-500 hover:bg-primary-50 transition-all"
                      title="Edit user"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {userIsSuperAdmin && u.id !== currentUser?.id && (
                      <button
                        onClick={() => setDeactivateTarget(u)}
                        className={cn(
                          'p-1.5 rounded-lg transition-all',
                          u.is_active
                            ? 'text-neutral-400 hover:text-danger-500 hover:bg-danger-50'
                            : 'text-neutral-400 hover:text-success-600 hover:bg-success-50',
                        )}
                        title={u.is_active ? 'Deactivate user' : 'Deactivate user'}
                      >
                        {u.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {users.length > 0 && (
          <div className="px-5 py-3 border-t border-neutral-50 text-xs text-neutral-400">
            Showing {users.length} user{users.length !== 1 ? 's' : ''}
          </div>
        )}
      </Card>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add User"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" form="create-user-form" loading={saving}>Create User</Button>
          </>
        }
      >
        <form id="create-user-form" onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Jane Doe"
            value={createForm.full_name}
            onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="jane@company.com"
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Minimum 8 characters"
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            required
          />
          <Select
            label="Role"
            value={createForm.role}
            onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
            options={availableRoles.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
          />
          <div className="px-4 py-3 bg-neutral-50 rounded-xl border border-neutral-100">
            <p className="text-xs text-neutral-500 leading-relaxed">
              <span className="font-semibold text-neutral-700">{ROLE_LABELS[createForm.role]}</span>{' '}
              — {getRoleDescription(createForm.role)}
            </p>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit User"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button type="submit" form="edit-user-form" loading={saving}>Save Changes</Button>
          </>
        }
      >
        <form id="edit-user-form" onSubmit={handleEdit} className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">{editTarget?.full_name?.charAt(0)}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">{editTarget?.full_name}</p>
              <p className="text-xs text-neutral-400">{editTarget?.email}</p>
            </div>
          </div>

          <Input
            label="Full Name"
            value={editForm.full_name}
            onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
            required
          />

          {userIsAdmin && editTarget?.id !== currentUser?.id && (
            <Select
              label="Role"
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
              options={availableRoles
                .filter((r) => currentUser ? canAssignRole(currentUser.role, r) : false)
                .map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
            />
          )}

          {userIsSuperAdmin && editTarget?.id !== currentUser?.id && (
            <div className="flex items-center gap-3 py-1">
              <button
                type="button"
                onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
                className={cn(
                  'relative flex-shrink-0 rounded-full transition-colors duration-200',
                  editForm.is_active ? 'bg-success' : 'bg-neutral-200',
                )}
                style={{ width: '36px', height: '20px' }}
              >
                <span
                  className={cn(
                    'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200',
                    editForm.is_active ? 'translate-x-4' : 'translate-x-0.5',
                  )}
                />
              </button>
              <span className="text-sm text-neutral-700">Account active</span>
            </div>
          )}
        </form>
      </Modal>

      <ConfirmModal
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        title="Deactivate User"
        message={`Deactivate "${deactivateTarget?.full_name}"? They will lose all access to the platform.`}
        confirmLabel="Deactivate"
        variant="danger"
        loading={saving}
      />
    </div>
  );
}
