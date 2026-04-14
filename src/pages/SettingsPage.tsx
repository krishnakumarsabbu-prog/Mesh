import React, { useEffect } from 'react';
import { Settings, User, Bell, Shield, Database, Palette } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { Card, CardHeader } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function SettingsPage() {
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const { user } = useAuthStore();

  useEffect(() => {
    setPageTitle('Settings');
    setBreadcrumbs([{ label: 'Settings' }]);
  }, []);

  const sections = [
    { icon: User, label: 'Profile', active: true },
    { icon: Bell, label: 'Notifications', active: false },
    { icon: Shield, label: 'Security', active: false },
    { icon: Database, label: 'Integrations', active: false },
    { icon: Palette, label: 'Appearance', active: false },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Settings</h2>
        <p className="text-sm text-neutral-500 mt-0.5">Manage your account and workspace preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card padding="sm">
          <nav className="space-y-0.5">
            {sections.map((s) => (
              <button
                key={s.label}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  s.active
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'
                }`}
              >
                <s.icon className="w-4 h-4" />
                {s.label}
              </button>
            ))}
          </nav>
        </Card>

        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader title="Profile Settings" subtitle="Update your personal information" />
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-neutral-100">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">{user?.full_name?.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{user?.full_name}</p>
                  <p className="text-xs text-neutral-400 capitalize">{user?.role?.replace('_', ' ')}</p>
                  <Button variant="secondary" size="xs" className="mt-2">Change Avatar</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Full Name" defaultValue={user?.full_name || ''} />
                <Input label="Email" defaultValue={user?.email || ''} type="email" />
              </div>
              <div className="flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Platform" subtitle="Tenant and workspace settings" />
            <div className="space-y-3">
              <div className="flex items-center justify-between px-4 py-3.5 bg-neutral-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-neutral-700">Tenant ID</p>
                  <p className="text-xs text-neutral-400">Your workspace identifier</p>
                </div>
                <code className="text-xs font-mono bg-white border border-neutral-200 px-2.5 py-1 rounded-lg text-neutral-700">
                  {user?.tenant_id || 'default'}
                </code>
              </div>
              <div className="flex items-center justify-between px-4 py-3.5 bg-neutral-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-neutral-700">API Version</p>
                  <p className="text-xs text-neutral-400">Current backend version</p>
                </div>
                <code className="text-xs font-mono bg-white border border-neutral-200 px-2.5 py-1 rounded-lg text-neutral-700">v1</code>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
