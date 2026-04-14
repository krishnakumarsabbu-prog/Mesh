import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Zap, Eye, EyeOff, ArrowRight, Shield, Activity,
  ChevronDown, Check, Copy, Layers, Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { notify } from '@/store/notificationStore';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';

const FEATURES = [
  { icon: Shield, label: 'Enterprise RBAC', desc: 'Role-based access control across teams', iconColor: '#00E599', glow: 'rgba(0,229,153,0.15)' },
  { icon: Activity, label: 'Real-time Health', desc: 'Live monitoring of all connectors', iconColor: '#3B82F6', glow: 'rgba(59,130,246,0.15)' },
  { icon: Layers, label: 'Multi-LOB Observability', desc: 'Manage all lines of business in one place', iconColor: '#F59E0B', glow: 'rgba(245,158,11,0.15)' },
];

interface DemoAccount {
  role: UserRole;
  label: string;
  email: string;
  password: string;
  description: string;
  accent: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'super_admin', label: 'Super Admin', email: 'superadmin@healthmesh.ai', password: 'superadmin123', description: 'Full platform access, manage all users & settings', accent: '#EF4444' },
  { role: 'admin', label: 'Admin', email: 'admin@healthmesh.ai', password: 'admin123', description: 'Broad platform access across LOBs and projects', accent: '#F59E0B' },
  { role: 'lob_admin', label: 'LOB Admin', email: 'lobadmin@healthmesh.ai', password: 'lobadmin123', description: 'Manages a Line of Business and its projects', accent: '#F97316' },
  { role: 'project_admin', label: 'Project Admin', email: 'projectadmin@healthmesh.ai', password: 'projectadmin123', description: 'Manages connectors and health within a project', accent: '#3B82F6' },
  { role: 'analyst', label: 'Analyst', email: 'analyst@healthmesh.ai', password: 'analyst123', description: 'Read access to analytics, health reports & dashboards', accent: '#14B8A6' },
  { role: 'viewer', label: 'Viewer', email: 'viewer@healthmesh.ai', password: 'viewer123', description: 'Read-only access to assigned resources', accent: '#6B7280' },
  { role: 'project_user', label: 'Project User', email: 'user@healthmesh.ai', password: 'user123', description: 'Interact with assigned project data and connectors', accent: '#00E599' },
];

type Mode = 'login' | 'register';

function GlowOrb({ x, y, size, color, opacity }: { x: string; y: string; size: string; color: string; opacity: number }) {
  return (
    <div className="absolute rounded-full pointer-events-none" style={{ left: x, top: y, width: size, height: size, background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, opacity, transform: 'translate(-50%, -50%)', filter: 'blur(1px)' }} />
  );
}

function AnimatedGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs><pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.5"/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

function SignalPulse() {
  return (
    <div className="absolute bottom-16 right-8 pointer-events-none">
      {[0, 1, 2].map((i) => (
        <div key={i} className="absolute rounded-full border" style={{ width: `${(i + 1) * 36}px`, height: `${(i + 1) * 36}px`, borderColor: '#00E599', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0, animation: `signalPulse 3s ease-out ${i * 0.8}s infinite` }} />
      ))}
      <div className="relative w-3 h-3 rounded-full" style={{ background: '#00E599', boxShadow: '0 0 12px #00E599' }} />
    </div>
  );
}

function FeatureChip({ feature }: { feature: typeof FEATURES[0] }) {
  const [hovered, setHovered] = useState(false);
  const Icon = feature.icon;
  return (
    <div
      className="flex items-center gap-3.5 p-3.5 rounded-2xl transition-all duration-200 cursor-default"
      style={{ background: hovered ? `radial-gradient(ellipse at left, ${feature.glow} 0%, rgba(255,255,255,0.04) 70%)` : 'rgba(255,255,255,0.04)', border: `1px solid ${hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)'}`, transform: hovered ? 'translateX(4px)' : 'translateX(0)', boxShadow: hovered ? `0 4px 24px ${feature.glow}` : 'none' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${feature.glow} 0%, transparent 100%)`, border: `1px solid ${feature.glow}`, boxShadow: hovered ? `0 0 20px ${feature.glow}` : 'none', transition: 'box-shadow 0.2s ease' }}>
        <Icon className="w-4 h-4" style={{ color: feature.iconColor }} />
      </div>
      <div>
        <p className="text-sm font-semibold text-white leading-tight">{feature.label}</p>
        <p className="text-[11px] mt-0.5 leading-tight" style={{ color: 'rgba(255,255,255,0.45)' }}>{feature.desc}</p>
      </div>
    </div>
  );
}

function GlassInput({ label, type, value, onChange, required, autoComplete, suffix }: {
  label: string; type: string; value: string; onChange: (v: string) => void;
  required?: boolean; autoComplete?: string; suffix?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;
  return (
    <div className="relative">
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        required={required} autoComplete={autoComplete}
        className="peer w-full px-4 pt-6 pb-2.5 text-sm rounded-2xl outline-none transition-all duration-150 placeholder-transparent"
        style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${focused ? 'rgba(0,229,153,0.5)' : 'rgba(255,255,255,0.08)'}`, boxShadow: focused ? '0 0 0 3px rgba(0,229,153,0.10), 0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.3)', color: '#F9FAFB', paddingRight: suffix ? '3rem' : undefined }}
        placeholder={label}
      />
      <label className="absolute left-4 transition-all duration-150 pointer-events-none select-none font-medium" style={{ top: active ? '0.5rem' : '50%', transform: active ? 'none' : 'translateY(-50%)', fontSize: active ? '10px' : '13.5px', letterSpacing: active ? '0.06em' : undefined, textTransform: active ? 'uppercase' : undefined, color: focused ? '#00E599' : 'rgba(255,255,255,0.35)' }}>
        {label}
      </label>
      {suffix && <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{suffix}</div>}
    </div>
  );
}

function RoleSelector({ selected, onSelect }: { selected: DemoAccount | null; onSelect: (a: DemoAccount) => void }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, key: string) => { navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 1500); };
  return (
    <div className="space-y-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'rgba(255,255,255,0.3)' }}>Quick Access — Select a Role</p>
      <div className="relative">
        <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all duration-150" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${open ? 'rgba(0,229,153,0.5)' : 'rgba(255,255,255,0.08)'}`, boxShadow: open ? '0 0 0 3px rgba(0,229,153,0.12)' : '0 2px 8px rgba(0,0,0,0.3)' }}>
          {selected ? (
            <>
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold flex-shrink-0" style={{ background: selected.accent + '20', color: selected.accent, border: `1px solid ${selected.accent}30` }}>{selected.label}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#F9FAFB' }}>{selected.email}</p>
                <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{selected.description}</p>
              </div>
            </>
          ) : (
            <span className="text-sm flex-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Choose a demo role to auto-fill credentials</span>
          )}
          <ChevronDown className={cn('w-4 h-4 flex-shrink-0 transition-transform duration-200', open && 'rotate-180')} style={{ color: 'rgba(255,255,255,0.3)' }} />
        </button>
        {open && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl overflow-hidden animate-dropdown-in" style={{ background: 'rgba(13,17,23,0.98)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}>
            <div className="max-h-64 overflow-y-auto py-1.5 scrollbar-none">
              {DEMO_ACCOUNTS.map((account) => (
                <button key={account.role} type="button" onClick={() => { onSelect(account); setOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-100 text-left" onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold flex-shrink-0" style={{ background: account.accent + '20', color: account.accent, border: `1px solid ${account.accent}30` }}>{account.label}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium truncate" style={{ color: '#D1D5DB' }}>{account.email}</p>
                    <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{account.description}</p>
                  </div>
                  {selected?.role === account.role && <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#00E599' }} />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {selected && (
        <div className="rounded-2xl px-4 py-3 space-y-2.5" style={{ background: selected.accent + '12', border: `1px solid ${selected.accent}25` }}>
          <p className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: selected.accent + 'AA' }}>Credentials</p>
          {(['email', 'password'] as const).map((field) => (
            <div key={field} className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>{field}</p>
                <p className="text-xs font-mono font-semibold" style={{ color: selected.accent }}>{selected[field]}</p>
              </div>
              <button type="button" onClick={() => copy(selected[field], field)} className="p-1.5 rounded-lg transition-all duration-150" style={{ color: 'rgba(255,255,255,0.35)' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)'; (e.currentTarget as HTMLElement).style.color = selected.accent; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'; }}>
                {copied === field ? <Check className="w-3 h-3" style={{ color: '#00E599' }} /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GradientButton({ children, loading, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button {...props} disabled={loading || props.disabled} className="relative w-full h-12 rounded-2xl font-semibold text-sm transition-all duration-200 overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
      style={{ background: hovered ? 'linear-gradient(135deg, #00C97F 0%, #009966 100%)' : 'linear-gradient(135deg, #00E599 0%, #00C97F 100%)', boxShadow: hovered ? '0 8px 32px rgba(0,229,153,0.5), 0 2px 8px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,229,153,0.3), 0 1px 4px rgba(0,0,0,0.3)', color: '#0F1115', transform: hovered ? 'translateY(-1px) scale(1.005)' : 'none' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 50%)' }} />
      {loading ? (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      ) : (
        <><span>{children}</span><ArrowRight className="w-4 h-4 transition-transform duration-150" style={{ transform: hovered ? 'translateX(3px)' : 'none' }} /></>
      )}
    </button>
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
  const [mounted, setMounted] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.classList.add('dark');
  }, []);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleDemoSelect = (account: DemoAccount) => { setSelectedDemo(account); setForm((f) => ({ ...f, email: account.email, password: account.password })); setError(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = mode === 'login'
        ? await authApi.login(form.email, form.password)
        : await authApi.register(form.email, form.full_name, form.password);
      setAuth(res.data.user, res.data.access_token, res.data.refresh_token);
      notify.success(`Welcome${res.data.user.full_name ? `, ${res.data.user.full_name.split(' ')[0]}` : ''}!`);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Something went wrong. Please try again.';
      setError(msg); setShake(true); setTimeout(() => setShake(false), 600);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: '#0F1115' }}>
      <div className="hidden lg:flex flex-col w-[500px] xl:w-[560px] flex-shrink-0 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, #060B12 0%, #0A1628 50%, #061020 100%)' }} />
        <GlowOrb x="70%" y="15%" size="400px" color="rgba(0,229,153,0.14)" opacity={1} />
        <GlowOrb x="20%" y="75%" size="300px" color="rgba(59,130,246,0.10)" opacity={1} />
        <GlowOrb x="85%" y="60%" size="200px" color="rgba(245,158,11,0.06)" opacity={1} />
        <AnimatedGrid />
        <SignalPulse />
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`, backgroundRepeat: 'repeat', backgroundSize: '128px', opacity: 0.4 }} />
        <div className="relative z-10 flex flex-col h-full px-10 xl:px-12 py-10">
          <div className={cn('flex items-center gap-3', mounted && 'animate-fade-in-up')} style={{ animationDelay: '0ms' }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00E599 0%, #00C97F 100%)', boxShadow: '0 4px 20px rgba(0,229,153,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
              <Zap className="w-5 h-5 text-[#0F1115]" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-white font-bold text-[15px] tracking-tight leading-tight">HealthMesh AI</p>
              <p className="text-[10px] font-semibold tracking-[0.12em] uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>Unified Application Health Intelligence</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center mt-10">
            <div className={cn(mounted && 'animate-fade-in-up')} style={{ animationDelay: '80ms' }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6" style={{ background: 'rgba(0,229,153,0.10)', border: '1px solid rgba(0,229,153,0.25)' }}>
                <Sparkles className="w-3 h-3" style={{ color: '#00E599' }} />
                <span className="text-[11px] font-semibold tracking-wide" style={{ color: '#00E599' }}>AI-Powered Observability</span>
              </div>
              <h2 className="font-bold text-white leading-[1.08] tracking-tight mb-5" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.6rem)' }}>
                Enterprise Health<br />Monitoring<br />
                <span style={{ background: 'linear-gradient(135deg, #00E599 0%, #3B82F6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>at Scale</span>
              </h2>
              <p className="text-[14px] leading-relaxed max-w-[280px] mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Unified visibility across all your Lines of Business, projects, and service connectors.
              </p>
            </div>
            <div className={cn('space-y-2.5', mounted && 'animate-fade-in-up')} style={{ animationDelay: '160ms' }}>
              {FEATURES.map((f) => <FeatureChip key={f.label} feature={f} />)}
            </div>
            <div className={cn('mt-8 rounded-2xl p-4', mounted && 'animate-fade-in-up')} style={{ animationDelay: '380ms', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] mb-2.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Demo Roles Available</p>
              <div className="flex flex-wrap gap-1.5">
                {DEMO_ACCOUNTS.map((a) => (
                  <span key={a.role} className="text-[10px] font-semibold px-2 py-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>{a.label}</span>
                ))}
              </div>
            </div>
          </div>
          <p className="text-[11px] mt-6" style={{ color: 'rgba(255,255,255,0.2)' }}>&copy; {new Date().getFullYear()} HealthMesh AI. All rights reserved.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 80% at 70% 20%, rgba(0,229,153,0.05) 0%, transparent 55%), radial-gradient(ellipse 70% 60% at 20% 80%, rgba(59,130,246,0.04) 0%, transparent 50%)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute top-0 right-0 pointer-events-none" style={{ width: '400px', height: '300px', background: 'radial-gradient(ellipse at top right, rgba(0,229,153,0.06) 0%, transparent 70%)' }} />
        <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,229,153,0.15) 30%, rgba(59,130,246,0.15) 70%, transparent 100%)' }} />
        <div className="absolute pointer-events-none" style={{ top: '6%', right: '5%', opacity: mounted ? 1 : 0, transition: 'opacity 0.8s ease 0.6s' }}>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(0,229,153,0.08)', border: '1px solid rgba(0,229,153,0.18)', backdropFilter: 'blur(12px)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00E599', animationDuration: '2s' }} />
            <span className="text-[10px] font-semibold tracking-wide" style={{ color: '#00E599' }}>All systems operational</span>
          </div>
        </div>

        <div className={cn('relative w-full max-w-[420px]', mounted && 'animate-auth-panel-in')}>
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00E599, #00C97F)', boxShadow: '0 4px 12px rgba(0,229,153,0.3)' }}>
              <Zap className="w-4 h-4 text-[#0F1115]" strokeWidth={2.5} />
            </div>
            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>HealthMesh AI</p>
          </div>

          <div className="mb-7">
            <h1 className="font-bold tracking-tight leading-tight" style={{ fontSize: 'clamp(1.65rem, 3vw, 2rem)', color: '#F9FAFB' }}>
              {mode === 'login' ? (
                <>Welcome{' '}<span style={{ background: 'linear-gradient(135deg, #00E599 0%, #3B82F6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>back</span></>
              ) : 'Create account'}
            </h1>
            <p className="text-[13.5px] mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {mode === 'login' ? 'Sign in to your workspace' : 'Get started with HealthMesh AI'}
            </p>
          </div>

          <div className="relative flex p-1 rounded-2xl mb-6" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl transition-all duration-250" style={{ left: mode === 'login' ? '4px' : 'calc(50%)', background: 'rgba(255,255,255,0.08)', boxShadow: '0 1px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)' }} />
            <button type="button" onClick={() => { setMode('login'); setError(''); setSelectedDemo(null); }} className="relative flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 z-10" style={{ color: mode === 'login' ? '#F9FAFB' : 'rgba(255,255,255,0.35)' }}>Sign In</button>
            <button type="button" onClick={() => { setMode('register'); setError(''); setSelectedDemo(null); }} className="relative flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 z-10" style={{ color: mode === 'register' ? '#F9FAFB' : 'rgba(255,255,255,0.35)' }}>Register</button>
          </div>

          <div className={cn('relative rounded-3xl', shake && 'animate-error-shake')} style={{ padding: '1px', background: 'linear-gradient(135deg, rgba(0,229,153,0.20) 0%, rgba(255,255,255,0.06) 40%, rgba(59,130,246,0.15) 100%)', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}>
            <div className="rounded-3xl p-6 space-y-4" style={{ background: 'rgba(12,17,27,0.95)', backdropFilter: 'blur(24px)' }}>
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === 'login' && <RoleSelector selected={selectedDemo} onSelect={handleDemoSelect} />}
                {mode === 'register' && (
                  <GlassInput label="Full Name" type="text" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} required autoComplete="name" />
                )}
                <GlassInput label="Email address" type="email" value={form.email} onChange={(v) => { setForm({ ...form, email: v }); if (selectedDemo) setSelectedDemo(null); }} required autoComplete="email" />
                <GlassInput label="Password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(v) => { setForm({ ...form, password: v }); if (selectedDemo) setSelectedDemo(null); }} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  suffix={
                    <button type="button" onClick={() => setShowPassword((p) => !p)} className="transition-all duration-150 p-0.5" style={{ color: 'rgba(255,255,255,0.3)' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'; }}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
                {error && (
                  <div className="flex items-start gap-3 px-4 py-3 rounded-2xl" style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)' }}>
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#EF4444' }}><span className="text-white text-[9px] font-bold">!</span></div>
                    <p className="text-sm leading-snug" style={{ color: '#FCA5A5' }}>{error}</p>
                  </div>
                )}
                {mode === 'login' && (
                  <div className="flex justify-end">
                    <button type="button" className="text-[12px] font-medium transition-colors duration-150" style={{ color: 'rgba(255,255,255,0.35)' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#00E599'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'; }}>
                      Forgot password?
                    </button>
                  </div>
                )}
                <div className="pt-1">
                  <GradientButton type="submit" loading={loading}>
                    {mode === 'login' ? 'Sign in to workspace' : 'Create account'}
                  </GradientButton>
                </div>
              </form>
            </div>
          </div>

          <p className="text-center text-[12px] mt-5" style={{ color: 'rgba(255,255,255,0.2)' }}>
            By continuing, you agree to our{' '}
            <span className="cursor-pointer transition-colors duration-150" style={{ color: 'rgba(255,255,255,0.35)' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#00E599'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'; }}>Terms of Service</span>
            {' '}&amp;{' '}
            <span className="cursor-pointer transition-colors duration-150" style={{ color: 'rgba(255,255,255,0.35)' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#00E599'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'; }}>Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}
