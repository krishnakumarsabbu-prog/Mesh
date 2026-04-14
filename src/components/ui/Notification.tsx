import React from 'react';
import { CircleCheck as CheckCircle, CircleAlert as AlertCircle, TriangleAlert as AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/store/notificationStore';
import { Notification } from '@/types';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: {
    bg: 'rgba(48,209,88,0.08)',
    border: 'rgba(48,209,88,0.2)',
    iconColor: '#30D158',
    titleColor: '#166534',
    barColor: '#30D158',
  },
  error: {
    bg: 'rgba(255,69,58,0.08)',
    border: 'rgba(255,69,58,0.2)',
    iconColor: '#FF453A',
    titleColor: '#991b1b',
    barColor: '#FF453A',
  },
  warning: {
    bg: 'rgba(255,159,10,0.08)',
    border: 'rgba(255,159,10,0.2)',
    iconColor: '#FF9F0A',
    titleColor: '#92400e',
    barColor: '#FF9F0A',
  },
  info: {
    bg: 'rgba(10,132,255,0.08)',
    border: 'rgba(10,132,255,0.2)',
    iconColor: '#0A84FF',
    titleColor: '#1e40af',
    barColor: '#0A84FF',
  },
};

function NotificationItem({ notification }: { notification: Notification }) {
  const { remove } = useNotificationStore();
  const Icon = icons[notification.type];
  const s = styles[notification.type];

  return (
    <div
      className="relative flex items-start gap-3 px-4 py-3.5 rounded-2xl animate-notification-in overflow-hidden"
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        boxShadow: '0 8px 32px -6px rgba(0,0,0,0.15), 0 2px 8px -2px rgba(0,0,0,0.08)',
        backdropFilter: 'blur(12px)',
        minWidth: '300px',
        maxWidth: '380px',
      }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl"
        style={{ background: s.barColor }}
      />
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${s.barColor}18` }}
      >
        <Icon className="w-4 h-4" style={{ color: s.iconColor }} />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm font-semibold leading-tight" style={{ color: s.titleColor }}>
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {notification.message}
          </p>
        )}
      </div>
      <button
        onClick={() => remove(notification.id)}
        className="flex-shrink-0 p-1 rounded-lg transition-all duration-150 mt-0.5"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.06)';
          (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = '';
          (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
        }}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function NotificationContainer() {
  const { notifications } = useNotificationStore();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 pointer-events-none">
      {notifications.map((n) => (
        <div key={n.id} className="pointer-events-auto">
          <NotificationItem notification={n} />
        </div>
      ))}
    </div>
  );
}
