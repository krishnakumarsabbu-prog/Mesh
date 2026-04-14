import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff, ArrowRight, Shield, Activity, GitBranch } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { notify } from '@/store/notificationStore';
import { cn } from '@/lib/utils';

const FEATURES = [
  { icon: Shield, label: 'Enterprise RBAC', desc: 'Role-based access control across teams' },
  { icon: Activity, label: 'Real-time Health', desc: 'Live monitoring of all connectors' },
  { icon: GitBranch, label: 'Multi-LOB', desc: 'Manage all lines of business in one place' },
];

const STATS = [
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '<2ms', label: 'Avg Latency' },
  { value: '10k+', label: 'Connectors' },
  { value: '50+', label: 'LOBs' },
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

export function LoginPage() {
  const { isAuthenticated, setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });
  const [error, setError] = useState('');

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

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

            <div className="space-y-3 mb-12">
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

            <div className="grid grid-cols-2 gap-3">
              {STATS.map((stat) => (
                <div key={stat.label} className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            © {new Date().getFullYear()} HealthMesh AI. All rights reserved.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[380px] animate-fade-in">
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

          <div className="flex p-1 bg-neutral-100/80 rounded-2xl mb-8 gap-1">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
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
              onChange={(v) => setForm({ ...form, email: v })}
              required
              autoComplete="email"
            />
            <FloatingInput
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
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

          {mode === 'login' && (
            <p className="mt-4 text-center text-xs text-neutral-400">
              Demo: <span className="font-medium text-neutral-600">admin@healthmesh.ai</span> / <span className="font-medium text-neutral-600">admin123</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
