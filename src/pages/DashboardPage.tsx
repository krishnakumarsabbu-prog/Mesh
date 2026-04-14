import React, { useEffect, useState } from 'react';
import { Activity, Building2, FolderOpen, Plug, TrendingUp, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { healthApi } from '@/lib/api';
import { DashboardStats, HealthTrend } from '@/types';
import { MetricCard } from '@/components/ui/MetricCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { HealthTrendChart } from '@/components/charts/HealthTrendChart';
import { StatusDonutChart } from '@/components/charts/StatusDonutChart';
import { StatsSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { formatMs } from '@/lib/utils';

export function DashboardPage() {
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<HealthTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageTitle('Dashboard');
    setBreadcrumbs([{ label: 'Dashboard' }]);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, trendsRes] = await Promise.all([
          healthApi.stats(),
          healthApi.trends(24),
        ]);
        setStats(statsRes.data);
        setTrends(trendsRes.data);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const mockStats: DashboardStats = {
    total_lobs: 8,
    total_projects: 34,
    total_connectors: 142,
    healthy_connectors: 128,
    degraded_connectors: 10,
    down_connectors: 4,
    unknown_connectors: 0,
    overall_health_percentage: 90.1,
    avg_response_time_ms: 245,
  };

  const displayStats = stats || (loading ? null : mockStats);

  return (
    <div className="space-y-6 animate-fade-in">
      {loading && !displayStats ? (
        <StatsSkeleton />
      ) : displayStats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Lines of Business"
            value={displayStats.total_lobs}
            subtitle="Active LOBs"
            icon={Building2}
            iconColor="text-primary-500"
            iconBg="bg-primary-50"
            accent="#0A84FF"
          />
          <MetricCard
            title="Projects"
            value={displayStats.total_projects}
            subtitle="Across all LOBs"
            icon={FolderOpen}
            iconColor="text-teal-600"
            iconBg="bg-teal-50"
            accent="#0D9488"
          />
          <MetricCard
            title="Connectors"
            value={displayStats.total_connectors}
            subtitle="Monitored services"
            icon={Plug}
            iconColor="text-amber-500"
            iconBg="bg-amber-50"
            accent="#FF9F0A"
          />
          <MetricCard
            title="Health Score"
            value={`${displayStats.overall_health_percentage}%`}
            subtitle={`Avg ${formatMs(displayStats.avg_response_time_ms)} response`}
            icon={Activity}
            iconColor="text-success-600"
            iconBg="bg-success-50"
            accent="#30D158"
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Health Trends" subtitle="Last 24 hours" />
          {loading ? (
            <Skeleton height={280} className="w-full" />
          ) : (
            <HealthTrendChart data={trends} />
          )}
        </Card>

        <Card>
          <CardHeader title="Status Overview" subtitle="Current state" />
          {loading || !displayStats ? (
            <div className="flex justify-center py-8">
              <Skeleton width={180} height={180} rounded="rounded-full" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <StatusDonutChart
                healthy={displayStats.healthy_connectors}
                degraded={displayStats.degraded_connectors}
                down={displayStats.down_connectors}
                unknown={displayStats.unknown_connectors}
              />
              <div className="w-full space-y-2.5">
                {[
                  { label: 'Healthy', value: displayStats.healthy_connectors, color: '#30D158', icon: CheckCircle },
                  { label: 'Degraded', value: displayStats.degraded_connectors, color: '#FF9F0A', icon: AlertTriangle },
                  { label: 'Down', value: displayStats.down_connectors, color: '#FF453A', icon: AlertCircle },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <item.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: item.color }} />
                    <span className="text-sm text-neutral-600 flex-1">{item.label}</span>
                    <span className="text-sm font-semibold text-neutral-900">{item.value}</span>
                    <span className="text-xs text-neutral-400">
                      {displayStats.total_connectors > 0
                        ? `${Math.round(item.value / displayStats.total_connectors * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {displayStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Healthy', value: displayStats.healthy_connectors, color: 'text-success-600', bg: 'bg-success-50' },
            { title: 'Degraded', value: displayStats.degraded_connectors, color: 'text-amber-600', bg: 'bg-warning-50' },
            { title: 'Down', value: displayStats.down_connectors, color: 'text-danger-500', bg: 'bg-danger-50' },
            { title: 'Avg Response', value: formatMs(displayStats.avg_response_time_ms), color: 'text-neutral-700', bg: 'bg-neutral-50' },
          ].map((item) => (
            <div key={item.title} className={`${item.bg} rounded-2xl px-5 py-4 border border-neutral-100`}>
              <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium mb-1">{item.title}</p>
              <p className={`text-2xl font-bold ${item.color} tracking-tight`}>{item.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
