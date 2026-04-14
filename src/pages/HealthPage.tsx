import React, { useEffect, useState } from "react";
import { Activity, RefreshCw, TrendingUp, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { healthApi } from "@/lib/api";
import { DashboardStats, HealthTrend } from "@/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { HealthTrendChart } from "@/components/charts/HealthTrendChart";
import { StatusDonutChart } from "@/components/charts/StatusDonutChart";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatsSkeleton, ChartSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { formatMs } from "@/lib/utils";
import { cn } from "@/lib/utils";

const TIME_OPTIONS = [
  { h: 6, label: "6h" },
  { h: 24, label: "24h" },
  { h: 48, label: "2d" },
  { h: 168, label: "7d" },
];

const STATUS_ITEMS = [
  { key: "healthy", label: "Healthy", color: "#30D158", Icon: CheckCircle },
  { key: "degraded", label: "Degraded", color: "#FF9F0A", Icon: AlertTriangle },
  { key: "down", label: "Down", color: "#FF453A", Icon: AlertCircle },
  { key: "unknown", label: "Unknown", color: "#A1A1AA", Icon: AlertCircle },
] as const;

function TimeFilter({ hours, onChange }: { hours: number; onChange: (h: number) => void }) {
  return (
    <div
      className="flex rounded-xl overflow-hidden p-0.5 gap-0.5"
      style={{ background: "var(--app-bg-muted)", border: "1px solid var(--app-border)" }}
    >
      {TIME_OPTIONS.map((opt) => (
        <button
          key={opt.h}
          onClick={() => onChange(opt.h)}
          className="px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-150"
          style={
            hours === opt.h
              ? { background: "var(--app-surface-raised)", color: "var(--text-primary)", boxShadow: "var(--shadow-xs)" }
              : { color: "var(--text-muted)" }
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function HealthPage() {
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<HealthTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(24);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setPageTitle("Health Monitor");
    setBreadcrumbs([{ label: "Health Monitor" }]);
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
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
  const timeLabel = hours < 24 ? hours + "h" : hours === 24 ? "24h" : hours === 48 ? "2 days" : "7 days";
  const healthColor = displayStats
    ? displayStats.overall_health_percentage >= 90 ? "#30D158"
      : displayStats.overall_health_percentage >= 70 ? "#FF9F0A"
      : "#FF453A"
    : "#30D158";

  return (
    <div className="space-y-6 animate-page-enter">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[18px] font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Health Monitor
          </h2>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            Real-time service health visibility
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TimeFilter hours={hours} onChange={setHours} />
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all duration-150"
            style={{
              background: "var(--app-bg-muted)",
              border: "1px solid var(--app-border)",
              color: "var(--text-secondary)",
              opacity: refreshing ? 0.6 : 1,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--app-border)"; }}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", (refreshing || loading) && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {displayStats && (
        <div
          className="flex items-center justify-between rounded-2xl px-5 py-4"
          style={{
            background: healthColor + "0d",
            border: "1px solid " + healthColor + "25",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: healthColor + "18" }}
            >
              <Activity className="w-5 h-5" style={{ color: healthColor }} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: healthColor }}>
                Overall Health
              </p>
              <p className="text-[24px] font-bold leading-tight tabular-nums" style={{ color: healthColor }}>
                {displayStats.overall_health_percentage}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 flex-wrap">
            {[
              { label: "Healthy", value: displayStats.healthy_connectors, color: "#30D158" },
              { label: "Degraded", value: displayStats.degraded_connectors, color: "#FF9F0A" },
              { label: "Down", value: displayStats.down_connectors, color: "#FF453A" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  {s.label}
                </p>
                <p className="text-[18px] font-bold tabular-nums" style={{ color: s.color }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && !displayStats ? (
        <StatsSkeleton />
      ) : displayStats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          <MetricCard
            title="Overall Health"
            value={displayStats.overall_health_percentage + "%"}
            subtitle="Across all connectors"
            icon={Activity}
            iconColor="text-success-600"
            iconBg="bg-success-50"
            accent="#30D158"
            className="animate-slide-up"
          />
          <MetricCard
            title="Healthy"
            value={displayStats.healthy_connectors}
            subtitle={"of " + displayStats.total_connectors + " total"}
            iconColor="text-success-600"
            iconBg="bg-success-50"
            accent="#30D158"
            className="animate-slide-up"
          />
          <MetricCard
            title="Issues"
            value={displayStats.degraded_connectors + displayStats.down_connectors}
            subtitle={displayStats.degraded_connectors + " degraded, " + displayStats.down_connectors + " down"}
            iconColor="text-danger-500"
            iconBg="bg-danger-50"
            accent="#FF453A"
            className="animate-slide-up"
          />
          <MetricCard
            title="Avg Response"
            value={formatMs(displayStats.avg_response_time_ms)}
            subtitle="Last hour average"
            icon={TrendingUp}
            iconColor="text-primary-500"
            iconBg="bg-primary-50"
            accent="#0A84FF"
            className="animate-slide-up"
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2" padding="md">
          <CardHeader title="Health Timeline" subtitle={"Last " + timeLabel} />
          {loading ? (
            <ChartSkeleton height={300} />
          ) : (
            <HealthTrendChart data={trends} height={300} />
          )}
        </Card>

        <Card padding="md">
          <CardHeader title="Status Distribution" />
          {loading || !displayStats ? (
            <div className="flex flex-col items-center gap-5">
              <Skeleton width={200} height={200} rounded="rounded-full" />
              <div className="w-full space-y-2">
                {[140, 100, 70, 50].map((w, i) => (
                  <Skeleton key={i} height={12} width={w} />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5">
              <StatusDonutChart
                healthy={displayStats.healthy_connectors}
                degraded={displayStats.degraded_connectors}
                down={displayStats.down_connectors}
                unknown={displayStats.unknown_connectors}
                size={200}
              />
              <div className="w-full space-y-2.5">
                {STATUS_ITEMS.map((item) => {
                  const val = displayStats[(item.key + "_connectors") as keyof DashboardStats] as number;
                  const pct = displayStats.total_connectors > 0 ? val / displayStats.total_connectors * 100 : 0;
                  return (
                    <div key={item.key}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                        <span className="text-[12px] flex-1" style={{ color: "var(--text-secondary)" }}>
                          {item.label}
                        </span>
                        <span className="text-[12px] font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                          {val}
                        </span>
                        <span className="text-[10px] w-8 text-right" style={{ color: "var(--text-muted)" }}>
                          {Math.round(pct)}%
                        </span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--app-bg-muted)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: pct + "%", background: item.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
