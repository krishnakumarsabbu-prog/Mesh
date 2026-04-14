import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff, ArrowRight, Shield, Activity, GitBranch, ChevronDown, Check, Copy } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { notify } from '@/store/notificationStore';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';

const FEATURES = [
  { icon: Shield, label: 'Enterprise RBAC', desc: 'Role-based access control across teams' },
  { icon: Activity, label: 'Real-time Health', desc: 'Live monitoring of all connectors' },
  { icon: GitBranch, label: 'Multi-LOB', desc: 'Manage all lines of business in one place' },
];

interface DemoAccount {
  role: UserRole;
  label: string;
  email: string;
  password: string;
  description: string;
  color: string;
  textColor: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'super_admin',
    label: 'Super Admin',
    email: 'superadmin@healthmesh.ai',
    password: 'superadmin123',
    description: 'Full platform access, manage all users & settings',
    color: 'bg-red-50 border-red-200',
    textColor: 'text-red-700',
  },
  {
    role: 'admin',
    label: 'Admin',
    email: 'admin@healthmesh.ai',
    password: 'admin123',
    description: 'Broad platform access across LOBs and projects',
    color: 'bg-amber-50 border-amber-200',
    textColor: 'text-amber-700',
  },
  {
    role: 'lob_admin',
    label: 'LOB Admin',
    email: 'lobadmin@healthmesh.ai',
    password: 'lobadmin123',
    description: 'Manages a Line of Business and its projects',
    color: 'bg-orange-50 border-orange-200',
    textColor: 'text-orange-700',
  },
  {
    role: 'project_admin',
    label: 'Project Admin',
    email: 'projectadmin@healthmesh.ai',
    password: 'projectadmin123',
    description: 'Manages connectors and health within a project',
    color: 'bg-sky-50 border-sky-200',
    textColor: 'text-sky-700',
  },
  {
    role: 'analyst',
    label: 'Analyst',
    email: 'analyst@healthmesh.ai',
    password: 'analyst123',
    description: 'Read access to analytics, health reports & dashboards',
    color: 'bg-teal-50 border-teal-200',
    textColor: 'text-teal-700',
  },
  {
    role: 'viewer',
    label: 'Viewer',
    email: 'viewer@healthmesh.ai',
    password: 'viewer123',
    description: 'Read-only access to assigned resources',
    color: 'bg-neutral-50 border-neutral-200',
    textColor: 'text-neutral-600',
  },
  {
    role: 'project_user',
    label: 'Project User',
    email: 'user@healthmesh.ai',
    password: 'user123',
    description: 'Interact with assigned project data and connectors',
    color: 'bg-green-50 border-green-200',
    textColor: 'text-green-700',
  },
];

type Mode = 'login' | 'register';

function FloatingInput({
  label,
  type,
  value,
  onChange,
  required,
  autoComplete,
  suffix,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  autoComplete?: string;
  suffix?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;

  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        autoComplete={autoComplete}
        className={cn(
          'peer w-full px-4 pt-5 pb-2 text-sm text-neutral-900 bg-white rounded-2xl outline-none transition-all duration-150',
          'border placeholder-transparent',
          focused
            ? 'border-primary-400 shadow-[0_0_0_3px_rgba(10,132,255,0.10)]'
            : 'border-neutral-200 hover:border-neutral-300',
          suffix ? 'pr-11' : '',
        )}
        placeholder={label}
      />
      <label
        className={cn(
          'absolute left-4 transition-all duration-150 pointer-events-none select-none',
          active
            ? 'top-2 text-[10px] font-semibold tracking-wide'
            : 'top-1/2 -translate-y-1/2 text-sm',
          focused ? 'text-primary-500' : 'text-neutral-400',
        )}
      >
        {label}
      </label>
      {suffix && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>
      )}
    </div>
  );
}

function RoleSelector({
  selected,
  onSelect,
}: {
  selected: DemoAccount | null;
  onSelect: (account: DemoAccount) => void;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-0.5">
        Quick Access — Select a Role
      </p>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all duration-150',
            'bg-white hover:border-neutral-300',
            open
              ? 'border-primary-400 shadow-[0_0_0_3px_rgba(10,132,255,0.10)]'
              : 'border-neutral-200',
          )}
        >
          {selected ? (
            <>
              <span className={cn('px-2 py-0.5 rounded-lg text-[11px] font-bold border', selected.color, selected.textColor)}>
                {selected.label}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-800 truncate">{selected.email}</p>
                <p className="text-[11px] text-neutral-400 truncate">{selected.description}</p>
              </div>
            </>
          ) : (
            <span className="text-sm text-neutral-400 flex-1">Choose a demo role to auto-fill credentials</span>
          )}
          <ChevronDown className={cn('w-4 h-4 text-neutral-400 flex-shrink-0 transition-transform duration-150', open && 'rotate-180')} />
        </button>

        {open && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-neutral-200 rounded-2xl shadow-xl overflow-hidden animate-fade-in">
            <div className="max-h-72 overflow-y-auto py-1.5">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => { onSelect(account); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 transition-colors text-left group"
                >
                  <span className={cn('px-2 py-0.5 rounded-lg text-[11px] font-bold border flex-shrink-0', account.color, account.textColor)}>
                    {account.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-neutral-700 truncate">{account.email}</p>
                    <p className="text-[10px] text-neutral-400 truncate">{account.description}</p>
                  </div>
                  {selected?.role === account.role && (
                    <Check className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div className={cn('rounded-2xl border px-4 py-3 space-y-2', selected.color)}>
          <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Credentials</p>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] text-neutral-400">Email</p>
              <p className="text-xs font-mono font-semibold text-neutral-700">{selected.email}</p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(selected.email, 'email')}
              className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-white/60 transition-colors"
            >
              {copied === 'email' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] text-neutral-400">Password</p>
              <p className="text-xs font-mono font-semibold text-neutral-700">{selected.password}</p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(selected.password, 'password')}
              className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-white/60 transition-colors"
            >
              {copied === 'password' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function LoginPage() {
  const { isAuthenticated, setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });
  const [error, setError] = useState('');
  const [selectedDemo, setSelectedDemo] = useState<DemoAccount | null>(null);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleDemoSelect = (account: DemoAccount) => {
    setSelectedDemo(account);
    setForm((f) => ({ ...f, email: account.email, password: account.password }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = mode === 'login'
        ? await authApi.login(form.email, form.password)
        : await authApi.register(form.email, form.full_name, form.password);
      setAuth(res.data.user, res.data.access_token, res.data.refresh_token);
      notify.success(`Welcome${res.data.user.full_name ? `, ${res.data.user.full_name.split(' ')[0]}` : ''}!`);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#F5F2EC' }}>
      <div className="hidden lg:flex flex-col w-[520px] xl:w-[580px] flex-shrink-0 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0D2137 40%, #0A1628 100%)' }} />
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #0A84FF 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-[0.08]" style={{ background: 'radial-gradient(circle, #30D158 0%, transparent 70%)', transform: 'translate(-40%, 40%)' }} />

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0A84FF, #0066CC)' }}>
              <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-white font-bold text-lg tracking-tight leading-tight">HealthMesh AI</p>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Enterprise Platform</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center mt-12">
            <h2 className="text-[2.4rem] font-bold text-white tracking-tight leading-[1.15] mb-5">
              Enterprise Health<br />Monitoring<br />at Scale
            </h2>
            <p className="text-base leading-relaxed max-w-xs mb-10" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Unified visibility across all your Lines of Business, projects, and service connectors.
            </p>

            <div className="space-y-3 mb-10">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(10,132,255,0.15)' }}>
                    <Icon className="w-4 h-4" style={{ color: '#0A84FF' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">{label}</p>
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>Demo Roles Available</p>
              <div className="flex flex-wrap gap-1.5">
                {DEMO_ACCOUNTS.map((a) => (
                  <span key={a.role} className="text-[10px] font-semibold px-2 py-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                    {a.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            © {new Date().getFullYear()} HealthMesh AI. All rights reserved.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[420px] animate-fade-in">
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0A84FF, #0066CC)' }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <p className="font-bold text-neutral-900">HealthMesh AI</p>
          </div>

          <div className="mb-8">
            <h1 className="text-[26px] font-bold text-neutral-900 tracking-tight leading-tight">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-neutral-500 text-sm mt-1.5">
              {mode === 'login' ? 'Sign in to your workspace' : 'Get started with HealthMesh AI'}
            </p>
          </div>

          <div className="flex p-1 bg-neutral-100/80 rounded-2xl mb-6 gap-1">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSelectedDemo(null); }}
                className={cn(
                  'flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-150',
                  mode === m
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700',
                )}
              >
                {m === 'login' ? 'Sign in' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'login' && (
              <RoleSelector selected={selectedDemo} onSelect={handleDemoSelect} />
            )}

            {mode === 'register' && (
              <FloatingInput
                label="Full Name"
                type="text"
                value={form.full_name}
                onChange={(v) => setForm({ ...form, full_name: v })}
                required
                autoComplete="name"
              />
            )}
            <FloatingInput
              label="Email address"
              type="email"
              value={form.email}
              onChange={(v) => { setForm({ ...form, email: v }); if (selectedDemo) setSelectedDemo(null); }}
              required
              autoComplete="email"
            />
            <FloatingInput
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(v) => { setForm({ ...form, password: v }); if (selectedDemo) setSelectedDemo(null); }}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {error && (
              <div className="flex items-start gap-2.5 px-4 py-3 bg-danger-50 border border-danger-100 rounded-2xl">
                <div className="w-1.5 h-1.5 rounded-full bg-danger-400 mt-1.5 flex-shrink-0" />
                <p className="text-sm text-danger-600 leading-snug">{error}</p>
              </div>
            )}

            <div className="pt-1">
              <Button
                type="submit"
                className="w-full justify-center"
                size="lg"
                loading={loading}
                iconRight={!loading ? <ArrowRight className="w-4 h-4" /> : undefined}
              >
                {mode === 'login' ? 'Sign in' : 'Create account'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
