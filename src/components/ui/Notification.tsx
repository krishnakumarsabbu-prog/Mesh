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
  success: 'bg-success-50 border-success-100 text-success-600',
  error: 'bg-danger-50 border-danger-100 text-danger-500',
  warning: 'bg-warning-50 border-warning-100 text-amber-600',
  info: 'bg-primary-50 border-primary-100 text-primary-600',
};

function NotificationItem({ notification }: { notification: Notification }) {
  const { remove } = useNotificationStore();
  const Icon = icons[notification.type];

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-glass-lg animate-slide-up',
        'min-w-72 max-w-sm',
        styles[notification.type]
      )}
    >
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{notification.title}</p>
        {notification.message && (
          <p className="text-xs opacity-80 mt-0.5">{notification.message}</p>
        )}
      </div>
      <button
        onClick={() => remove(notification.id)}
        className="text-current opacity-50 hover:opacity-80 transition-opacity mt-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function NotificationContainer() {
  const { notifications } = useNotificationStore();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {notifications.map((n) => (
        <div key={n.id} className="pointer-events-auto">
          <NotificationItem notification={n} />
        </div>
      ))}
    </div>
  );
}
