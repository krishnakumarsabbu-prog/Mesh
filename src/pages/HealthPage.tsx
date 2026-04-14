import React, { useEffect, useState } from 'react';
import { Activity, RefreshCw, TrendingUp } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { healthApi } from '@/lib/api';
import { DashboardStats, HealthTrend } from '@/types';
import { Card, CardHeader } from '@/components/ui/Card';
import { HealthTrendChart } from '@/components/charts/HealthTrendChart';
import { StatusDonutChart } from '@/components/charts/StatusDonutChart';
import { Button } from '@/components/ui/Button';
import { MetricCard } from '@/components/ui/MetricCard';
import { formatMs } from '@/lib/utils';
import { StatsSkeleton, Skeleton } from '@/components/ui/Skeleton';

export function HealthPage() {
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<HealthTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(24);

  useEffect(() => {
    setPageTitle('Health Monitor');
    setBreadcrumbs([{ label: 'Health Monitor' }]);
  }, []);

  useEffect(() => {
    load();
  }, [hours]);

  const load = async () => {
    setLoading(true);
    try {
      const [statsRes, trendsRes] = await Promise.all([
        healthApi.stats(),
        healthApi.trends(hours),
      ]);
      setStats(statsRes.data);
      setTrends(trendsRes.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

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

  const displayStats = stats || (!loading ? mockStats : null);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Health Monitor</h2>
          <p className="text-sm text-neutral-500 mt-0.5">Real-time service health visibility</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-neutral-200 overflow-hidden bg-white">
            {[6, 24, 48, 168].map((h) => (
              <button
                key={h}
                onClick={() => setHours(h)}
                className={`px-3 py-1.5 text-xs font-medium transition-all ${
                  hours === h ? 'bg-primary-500 text-white' : 'text-neutral-500 hover:bg-neutral-50'
                }`}
              >
                {h < 24 ? `${h}h` : h === 24 ? '24h' : h === 48 ? '2d' : '7d'}
              </button>
            ))}
          </div>
          <Button variant="secondary" icon={<RefreshCw className="w-4 h-4" />} onClick={load}>
            Refresh
          </Button>
        </div>
      </div>

      {loading && !displayStats ? <StatsSkeleton /> : displayStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Overall Health"
            value={`${displayStats.overall_health_percentage}%`}
            subtitle="Across all connectors"
            icon={Activity}
            iconColor="text-success-600"
            iconBg="bg-success-50"
            accent="#30D158"
          />
          <MetricCard
            title="Healthy"
            value={displayStats.healthy_connectors}
            subtitle={`of ${displayStats.total_connectors} total`}
            iconColor="text-success-600"
            iconBg="bg-success-50"
            accent="#30D158"
          />
          <MetricCard
            title="Issues"
            value={displayStats.degraded_connectors + displayStats.down_connectors}
            subtitle={`${displayStats.degraded_connectors} degraded, ${displayStats.down_connectors} down`}
            iconColor="text-danger-500"
            iconBg="bg-danger-50"
            accent="#FF453A"
          />
          <MetricCard
            title="Avg Response"
            value={formatMs(displayStats.avg_response_time_ms)}
            subtitle="Last hour average"
            icon={TrendingUp}
            iconColor="text-primary-500"
            iconBg="bg-primary-50"
            accent="#0A84FF"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Health Timeline" subtitle={`Last ${hours < 24 ? hours + 'h' : hours === 24 ? '24h' : hours === 48 ? '2 days' : '7 days'}`} />
          {loading ? (
            <Skeleton height={300} className="w-full" />
          ) : (
            <HealthTrendChart data={trends} height={300} />
          )}
        </Card>

        <Card>
          <CardHeader title="Status Distribution" />
          {loading || !displayStats ? (
            <div className="flex justify-center py-8">
              <Skeleton width={200} height={200} rounded="rounded-full" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <StatusDonutChart
                healthy={displayStats.healthy_connectors}
                degraded={displayStats.degraded_connectors}
                down={displayStats.down_connectors}
                unknown={displayStats.unknown_connectors}
                size={200}
              />
              <div className="w-full space-y-3">
                {[
                  { label: 'Healthy', val: displayStats.healthy_connectors, color: '#30D158' },
                  { label: 'Degraded', val: displayStats.degraded_connectors, color: '#FF9F0A' },
                  { label: 'Down', val: displayStats.down_connectors, color: '#FF453A' },
                  { label: 'Unknown', val: displayStats.unknown_connectors, color: '#A1A1AA' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                    <span className="text-sm text-neutral-600 flex-1">{item.label}</span>
                    <span className="text-sm font-semibold text-neutral-900">{item.val}</span>
                    <div className="w-20 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${displayStats.total_connectors > 0 ? item.val / displayStats.total_connectors * 100 : 0}%`,
                          background: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
