import React from 'react';
import { TrendingUp, TriangleAlert as AlertTriangle, Activity, CircleCheck as CheckCircle, Clock, ChartBar as BarChart2, Table, ThermometerSun, ChartPie as PieChart, Zap } from 'lucide-react';
import { DashboardWidgetCreate, WidgetType } from '@/types';
import { cn } from '@/lib/utils';

const WIDGET_ACCENT: Record<WidgetType, string> = {
  kpi_card: '#0A84FF',
  gauge: '#30D158',
  progress_ring: '#FF9F0A',
  sparkline: '#0A84FF',
  line_chart: '#0A84FF',
  area_chart: '#30D158',
  bar_chart: '#FF9F0A',
  stacked_bar: '#FF9F0A',
  pie_donut: '#BF5AF2',
  sla_card: '#30D158',
  alert_panel: '#FF453A',
  status_timeline: '#64D2FF',
  comparison_grid: '#0A84FF',
  table_widget: '#636366',
  heatmap: '#FF9F0A',
  health_distribution: '#30D158',
};

const WIDGET_LABEL: Record<WidgetType, string> = {
  kpi_card: 'KPI Card',
  gauge: 'Gauge',
  progress_ring: 'Progress Ring',
  sparkline: 'Sparkline',
  line_chart: 'Line Chart',
  area_chart: 'Area Chart',
  bar_chart: 'Bar Chart',
  stacked_bar: 'Stacked Bar',
  pie_donut: 'Pie / Donut',
  sla_card: 'SLA Card',
  alert_panel: 'Alert Panel',
  status_timeline: 'Status Timeline',
  comparison_grid: 'Comparison Grid',
  table_widget: 'Table',
  heatmap: 'Heatmap',
  health_distribution: 'Health Distribution',
};

export function DashboardWidgetRenderer({
  widget,
  preview,
}: {
  widget: DashboardWidgetCreate & { _localId?: string };
  preview: boolean;
}) {
  const accent = WIDGET_ACCENT[widget.widget_type as WidgetType] || '#0A84FF';
  const label = WIDGET_LABEL[widget.widget_type as WidgetType] || widget.widget_type;

  return (
    <div className="w-full h-full flex flex-col p-3 overflow-hidden">
      <div className="flex items-start justify-between mb-2 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
            {widget.title}
          </p>
          {widget.subtitle && (
            <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
              {widget.subtitle}
            </p>
          )}
        </div>
        <span
          className="flex-shrink-0 ml-2 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
          style={{ background: accent + '15', color: accent }}
        >
          {label}
        </span>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center">
        <WidgetPlaceholder type={widget.widget_type as WidgetType} hasBindings={(widget.metric_bindings || []).length > 0} accent={accent} />
      </div>

      {(widget.metric_bindings || []).length > 0 && (
        <div className="flex-shrink-0 mt-1.5 flex items-center gap-1 flex-wrap">
          {widget.metric_bindings.slice(0, 3).map((mb, i) => (
            <span
              key={i}
              className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: (mb.color_override || accent) + '15', color: mb.color_override || accent }}
            >
              {mb.display_label || mb.metric_key}
            </span>
          ))}
          {widget.metric_bindings.length > 3 && (
            <span className="text-[9px] text-neutral-400">+{widget.metric_bindings.length - 3} more</span>
          )}
        </div>
      )}
    </div>
  );
}

function WidgetPlaceholder({ type, hasBindings, accent }: { type: WidgetType; hasBindings: boolean; accent: string }) {
  const opacity = hasBindings ? 0.9 : 0.25;

  switch (type) {
    case 'kpi_card':
      return (
        <div className="text-center" style={{ opacity }}>
          <div className="text-3xl font-bold mb-0.5" style={{ color: accent }}>98.4%</div>
          <div className="flex items-center justify-center gap-1 text-xs text-green-500">
            <TrendingUp className="w-3 h-3" /> +2.1%
          </div>
        </div>
      );

    case 'gauge':
      return (
        <div className="relative" style={{ opacity }}>
          <svg viewBox="0 0 100 60" className="w-28 h-16">
            <path d="M10 55 A40 40 0 0 1 90 55" fill="none" stroke="#e5e7eb" strokeWidth="8" strokeLinecap="round" />
            <path d="M10 55 A40 40 0 0 1 90 55" fill="none" stroke={accent} strokeWidth="8" strokeLinecap="round"
              strokeDasharray="125" strokeDashoffset="40" />
            <text x="50" y="52" textAnchor="middle" fontSize="14" fontWeight="bold" fill={accent}>76%</text>
          </svg>
        </div>
      );

    case 'progress_ring':
      return (
        <div style={{ opacity }}>
          <svg viewBox="0 0 60 60" className="w-16 h-16">
            <circle cx="30" cy="30" r="24" fill="none" stroke="#e5e7eb" strokeWidth="6" />
            <circle cx="30" cy="30" r="24" fill="none" stroke={accent} strokeWidth="6"
              strokeDasharray={`${0.76 * 2 * Math.PI * 24} ${2 * Math.PI * 24}`}
              strokeLinecap="round" transform="rotate(-90 30 30)" />
            <text x="30" y="34" textAnchor="middle" fontSize="11" fontWeight="bold" fill={accent}>76%</text>
          </svg>
        </div>
      );

    case 'sparkline':
      return (
        <div className="w-full px-2" style={{ opacity }}>
          <svg viewBox="0 0 120 30" className="w-full h-8">
            <polyline
              points="0,25 20,18 40,22 60,8 80,15 100,5 120,10"
              fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </div>
      );

    case 'line_chart':
    case 'area_chart':
      return (
        <div className="w-full h-full px-1" style={{ opacity }}>
          <svg viewBox="0 0 200 80" className="w-full h-full">
            {type === 'area_chart' && (
              <path
                d="M0,70 L30,55 L65,45 L100,20 L140,35 L175,15 L200,25 L200,80 L0,80 Z"
                fill={accent} fillOpacity="0.12"
              />
            )}
            <polyline
              points="0,70 30,55 65,45 100,20 140,35 175,15 200,25"
              fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            />
            <line x1="0" y1="80" x2="200" y2="80" stroke="#e5e7eb" strokeWidth="1" />
          </svg>
        </div>
      );

    case 'bar_chart':
      return (
        <div className="w-full h-full flex items-end justify-around px-2 pb-1" style={{ opacity }}>
          {[60, 80, 45, 90, 70, 85].map((h, i) => (
            <div
              key={i}
              className="rounded-t flex-1 mx-0.5"
              style={{ height: `${h}%`, background: i === 3 ? accent : accent + '60' }}
            />
          ))}
        </div>
      );

    case 'stacked_bar':
      return (
        <div className="w-full h-full flex items-end justify-around px-2 pb-1" style={{ opacity }}>
          {[70, 85, 60, 90, 75].map((total, i) => (
            <div key={i} className="flex flex-col-reverse flex-1 mx-0.5 rounded-t overflow-hidden" style={{ height: `${total}%` }}>
              <div style={{ height: '60%', background: accent + '80' }} />
              <div style={{ height: '40%', background: accent }} />
            </div>
          ))}
        </div>
      );

    case 'pie_donut':
      return (
        <div style={{ opacity }}>
          <svg viewBox="0 0 60 60" className="w-16 h-16">
            <circle cx="30" cy="30" r="20" fill="none" stroke={accent} strokeWidth="12"
              strokeDasharray={`${0.65 * 2 * Math.PI * 20} ${2 * Math.PI * 20}`}
              transform="rotate(-90 30 30)" />
            <circle cx="30" cy="30" r="20" fill="none" stroke={accent + '40'} strokeWidth="12"
              strokeDasharray={`${0.35 * 2 * Math.PI * 20} ${2 * Math.PI * 20}`}
              strokeDashoffset={`${-0.65 * 2 * Math.PI * 20}`}
              transform="rotate(-90 30 30)" />
            <circle cx="30" cy="30" r="14" fill="var(--app-surface-raised)" />
          </svg>
        </div>
      );

    case 'sla_card':
      return (
        <div className="text-center" style={{ opacity }}>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <CheckCircle className="w-5 h-5" style={{ color: accent }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: accent }}>99.9%</div>
          <div className="text-[10px] text-neutral-400 mt-0.5">SLA Compliance</div>
        </div>
      );

    case 'alert_panel':
      return (
        <div className="w-full space-y-1 px-1" style={{ opacity }}>
          {[['CRITICAL', '#FF453A'], ['HIGH', '#FF9F0A'], ['MEDIUM', '#FFD60A']].map(([sev, col]) => (
            <div key={sev} className="flex items-center gap-2 px-2 py-1 rounded-lg" style={{ background: col + '10' }}>
              <AlertTriangle className="w-3 h-3 flex-shrink-0" style={{ color: col }} />
              <span className="text-[10px] font-medium" style={{ color: col }}>{sev}</span>
              <span className="text-[9px] text-neutral-400 ml-auto">Connector timeout</span>
            </div>
          ))}
        </div>
      );

    case 'status_timeline':
      return (
        <div className="w-full h-full px-2 flex flex-col justify-center gap-1" style={{ opacity }}>
          {['Connector A', 'Connector B'].map((name, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[9px] text-neutral-400 w-16 truncate flex-shrink-0">{name}</span>
              <div className="flex-1 flex gap-0.5 h-4">
                {Array.from({ length: 20 }).map((_, j) => (
                  <div
                    key={j}
                    className="flex-1 rounded-sm"
                    style={{
                      background: j === 8 || j === 9 ? '#FF453A' : accent,
                      opacity: 0.7,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      );

    case 'comparison_grid':
      return (
        <div className="w-full" style={{ opacity }}>
          <div className="grid grid-cols-3 gap-1 text-center">
            {['Score', 'SLA', 'Uptime'].map(label => (
              <div key={label} className="py-1">
                <div className="text-xs font-bold" style={{ color: accent }}>
                  {label === 'Score' ? '94' : label === 'SLA' ? '99.5%' : '99.8%'}
                </div>
                <div className="text-[9px] text-neutral-400">{label}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'table_widget':
      return (
        <div className="w-full overflow-hidden" style={{ opacity }}>
          <div className="text-[9px] grid grid-cols-3 gap-1 mb-1 font-semibold text-neutral-400 uppercase px-1">
            <span>Name</span><span>Status</span><span>Score</span>
          </div>
          {[['API Gateway', '✅', '98'], ['Auth Service', '⚠️', '72'], ['DB Pool', '✅', '95']].map(([n, s, sc]) => (
            <div key={n} className="text-[9px] grid grid-cols-3 gap-1 px-1 py-0.5 rounded hover:bg-neutral-50">
              <span className="text-neutral-700 truncate">{n}</span>
              <span>{s}</span>
              <span style={{ color: accent }} className="font-semibold">{sc}</span>
            </div>
          ))}
        </div>
      );

    case 'heatmap':
      return (
        <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(8, 1fr)', opacity }}>
          {Array.from({ length: 32 }).map((_, i) => {
            const v = Math.random();
            return (
              <div
                key={i}
                className="rounded-sm aspect-square"
                style={{ background: accent, opacity: 0.1 + v * 0.8 }}
              />
            );
          })}
        </div>
      );

    case 'health_distribution':
      return (
        <div className="text-center" style={{ opacity }}>
          <svg viewBox="0 0 60 60" className="w-14 h-14 mx-auto">
            <circle cx="30" cy="30" r="20" fill="none" stroke="#30D158" strokeWidth="10"
              strokeDasharray={`${0.6 * 2 * Math.PI * 20} ${2 * Math.PI * 20}`}
              transform="rotate(-90 30 30)" />
            <circle cx="30" cy="30" r="20" fill="none" stroke="#FF9F0A" strokeWidth="10"
              strokeDasharray={`${0.25 * 2 * Math.PI * 20} ${2 * Math.PI * 20}`}
              strokeDashoffset={`${-0.6 * 2 * Math.PI * 20}`}
              transform="rotate(-90 30 30)" />
            <circle cx="30" cy="30" r="20" fill="none" stroke="#FF453A" strokeWidth="10"
              strokeDasharray={`${0.15 * 2 * Math.PI * 20} ${2 * Math.PI * 20}`}
              strokeDashoffset={`${-0.85 * 2 * Math.PI * 20}`}
              transform="rotate(-90 30 30)" />
            <circle cx="30" cy="30" r="14" fill="var(--app-surface-raised)" />
          </svg>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-[9px] text-green-500 font-semibold">60%</span>
            <span className="text-[9px] text-amber-500 font-semibold">25%</span>
            <span className="text-[9px] text-red-500 font-semibold">15%</span>
          </div>
        </div>
      );

    default:
      return (
        <div className="flex flex-col items-center gap-1.5" style={{ opacity: 0.3 }}>
          <BarChart2 className="w-8 h-8 text-neutral-400" />
          <span className="text-[10px] text-neutral-400">Configure widget</span>
        </div>
      );
  }
}
