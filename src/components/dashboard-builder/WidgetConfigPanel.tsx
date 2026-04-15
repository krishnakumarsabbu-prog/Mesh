import React, { useState } from 'react';
import { X, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { DashboardWidgetCreate, WidgetType, WidgetTypeMeta, WidgetMetricBindingCreate, MetricSourceScope, AggregationMode, DashboardScope } from '@/types';
import { cn } from '@/lib/utils';

const AGGREGATION_OPTIONS: { value: AggregationMode; label: string }[] = [
  { value: 'latest', label: 'Latest' },
  { value: 'avg', label: 'Average' },
  { value: 'sum', label: 'Sum' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
  { value: 'count', label: 'Count' },
  { value: 'p95', label: 'P95' },
  { value: 'p99', label: 'P99' },
];

const METRIC_SOURCE_OPTIONS: { value: MetricSourceScope; label: string }[] = [
  { value: 'connector_metric', label: 'Connector Metric' },
  { value: 'project_aggregate', label: 'Project Aggregate' },
  { value: 'team_aggregate', label: 'Team Aggregate' },
  { value: 'lob_aggregate', label: 'LOB Aggregate' },
];

const ACCENT_COLORS = ['#0A84FF', '#30D158', '#FF9F0A', '#FF453A', '#BF5AF2', '#64D2FF', '#FF375F', '#FFD60A'];

const TIME_RANGES = ['5m', '15m', '1h', '6h', '24h', '7d', '30d'];

interface SectionProps { title: string; children: React.ReactNode; defaultOpen?: boolean }

function Section({ title, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b" style={{ borderColor: 'var(--app-border)' }}>
      <button
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-neutral-50 transition-all"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{title}</span>
        {open ? <ChevronUp className="w-3 h-3 text-neutral-400" /> : <ChevronDown className="w-3 h-3 text-neutral-400" />}
      </button>
      {open && <div className="px-4 pb-3 space-y-2.5">{children}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide block mb-1">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-2.5 py-1.5 text-xs border border-neutral-200 rounded-xl outline-none focus:border-primary-400 bg-white transition-all"
    />
  );
}

function NumInput({ value, onChange, placeholder, min, max }: { value: string | number; onChange: (v: string) => void; placeholder?: string; min?: number; max?: number }) {
  return (
    <input
      type="number"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      className="w-full px-2.5 py-1.5 text-xs border border-neutral-200 rounded-xl outline-none focus:border-primary-400 bg-white transition-all"
    />
  );
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-2.5 py-1.5 text-xs border border-neutral-200 rounded-xl outline-none focus:border-primary-400 bg-white transition-all"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function WidgetConfigPanel({
  widget, widgetTypes, templateScope, onChange, onClose,
}: {
  widget: DashboardWidgetCreate & { _localId?: string };
  widgetTypes: WidgetTypeMeta[];
  templateScope: DashboardScope;
  onChange: (patch: Partial<DashboardWidgetCreate>) => void;
  onClose: () => void;
}) {
  const wm = widgetTypes.find(t => t.value === widget.widget_type);
  const displayCfg = (widget.display_config as Record<string, unknown>) || {};
  const thresholdCfg = (widget.threshold_config as Record<string, unknown>) || {};
  const chartCfg = (widget.chart_config as Record<string, unknown>) || {};

  const updateDisplay = (patch: Record<string, unknown>) => {
    onChange({ display_config: { ...displayCfg, ...patch } });
  };
  const updateThreshold = (patch: Record<string, unknown>) => {
    onChange({ threshold_config: { ...thresholdCfg, ...patch } });
  };
  const updateChart = (patch: Record<string, unknown>) => {
    onChange({ chart_config: { ...chartCfg, ...patch } });
  };

  const addBinding = () => {
    const newBinding: WidgetMetricBindingCreate = {
      metric_source_scope: getDefaultScope(templateScope),
      metric_key: '',
      connector_type: null,
      aggregation_mode: 'latest',
      display_label: '',
      color_override: ACCENT_COLORS[widget.metric_bindings.length % ACCENT_COLORS.length],
      sort_order: widget.metric_bindings.length,
    };
    onChange({ metric_bindings: [...widget.metric_bindings, newBinding] });
  };

  const updateBinding = (idx: number, patch: Partial<WidgetMetricBindingCreate>) => {
    const updated = widget.metric_bindings.map((b, i) => i === idx ? { ...b, ...patch } : b);
    onChange({ metric_bindings: updated });
  };

  const removeBinding = (idx: number) => {
    onChange({ metric_bindings: widget.metric_bindings.filter((_, i) => i !== idx) });
  };

  return (
    <div
      className="w-72 flex-shrink-0 border-l flex flex-col overflow-hidden"
      style={{ background: 'var(--app-surface-raised)', borderColor: 'var(--app-border)' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--app-border)' }}>
        <div>
          <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Widget Config</span>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{wm?.label || widget.widget_type}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Section title="Widget Type">
          <SelectInput
            value={widget.widget_type}
            onChange={v => onChange({ widget_type: v as WidgetType })}
            options={widgetTypes.map(t => ({ value: t.value, label: t.label }))}
          />
        </Section>

        <Section title="Identity">
          <Field label="Title">
            <TextInput value={widget.title} onChange={v => onChange({ title: v })} placeholder="Widget title" />
          </Field>
          <Field label="Subtitle">
            <TextInput value={widget.subtitle || ''} onChange={v => onChange({ subtitle: v || null })} placeholder="Optional subtitle" />
          </Field>
        </Section>

        <Section title="Layout">
          <div className="grid grid-cols-2 gap-2">
            <Field label="X Position">
              <NumInput value={widget.layout_x} onChange={v => onChange({ layout_x: parseInt(v) || 0 })} min={0} max={11} />
            </Field>
            <Field label="Y Position">
              <NumInput value={widget.layout_y} onChange={v => onChange({ layout_y: parseInt(v) || 0 })} min={0} />
            </Field>
            <Field label="Width (cols)">
              <NumInput value={widget.width} onChange={v => onChange({ width: Math.max(wm?.min_width || 1, parseInt(v) || 1) })} min={wm?.min_width || 1} max={12} />
            </Field>
            <Field label="Height (rows)">
              <NumInput value={widget.height} onChange={v => onChange({ height: Math.max(wm?.min_height || 1, parseInt(v) || 1) })} min={wm?.min_height || 1} />
            </Field>
          </div>
        </Section>

        <Section title="Display">
          <Field label="Time Range">
            <SelectInput
              value={String(displayCfg.time_range || '1h')}
              onChange={v => updateDisplay({ time_range: v })}
              options={TIME_RANGES.map(r => ({ value: r, label: r }))}
            />
          </Field>
          <div className="flex items-center justify-between py-0.5">
            <span className="text-xs text-neutral-600">Show Legend</span>
            <button
              onClick={() => updateDisplay({ show_legend: !displayCfg.show_legend })}
              className={cn(
                'w-8 h-4 rounded-full transition-all relative',
                displayCfg.show_legend ? 'bg-primary-500' : 'bg-neutral-300',
              )}
            >
              <span className={cn(
                'absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow-sm',
                displayCfg.show_legend ? 'left-4.5' : 'left-0.5',
              )} style={{ left: displayCfg.show_legend ? '17px' : '2px' }} />
            </button>
          </div>
          <div className="flex items-center justify-between py-0.5">
            <span className="text-xs text-neutral-600">Show Title</span>
            <button
              onClick={() => updateDisplay({ show_title: !(displayCfg.show_title !== false) })}
              className={cn(
                'w-8 h-4 rounded-full transition-all relative',
                displayCfg.show_title !== false ? 'bg-primary-500' : 'bg-neutral-300',
              )}
            >
              <span
                className="absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow-sm"
                style={{ left: displayCfg.show_title !== false ? '17px' : '2px' }}
              />
            </button>
          </div>
        </Section>

        {['line_chart', 'area_chart', 'bar_chart', 'stacked_bar', 'sparkline'].includes(widget.widget_type) && (
          <Section title="Chart Config">
            <Field label="Color Scheme">
              <SelectInput
                value={String(chartCfg.color_scheme || 'default')}
                onChange={v => updateChart({ color_scheme: v })}
                options={[
                  { value: 'default', label: 'Default' },
                  { value: 'monochrome', label: 'Monochrome' },
                  { value: 'warm', label: 'Warm' },
                  { value: 'cool', label: 'Cool' },
                  { value: 'status', label: 'Status' },
                ]}
              />
            </Field>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-xs text-neutral-600">Smooth Lines</span>
              <button
                onClick={() => updateChart({ smooth: !chartCfg.smooth })}
                className={cn('w-8 h-4 rounded-full transition-all relative', chartCfg.smooth ? 'bg-primary-500' : 'bg-neutral-300')}
              >
                <span
                  className="absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow-sm"
                  style={{ left: chartCfg.smooth ? '17px' : '2px' }}
                />
              </button>
            </div>
          </Section>
        )}

        {['kpi_card', 'gauge', 'progress_ring', 'sla_card'].includes(widget.widget_type) && (
          <Section title="Thresholds">
            <Field label="Warning">
              <NumInput
                value={String(thresholdCfg.warning || '')}
                onChange={v => updateThreshold({ warning: v ? parseFloat(v) : null })}
                placeholder="e.g. 80"
              />
            </Field>
            <Field label="Critical">
              <NumInput
                value={String(thresholdCfg.critical || '')}
                onChange={v => updateThreshold({ critical: v ? parseFloat(v) : null })}
                placeholder="e.g. 60"
              />
            </Field>
            <Field label="Unit">
              <TextInput
                value={String(thresholdCfg.unit || '')}
                onChange={v => updateThreshold({ unit: v })}
                placeholder="%, ms, count..."
              />
            </Field>
          </Section>
        )}

        <Section title={`Metric Bindings (${widget.metric_bindings.length})`} defaultOpen>
          {widget.metric_bindings.map((mb, i) => (
            <MetricBindingRow
              key={i}
              binding={mb}
              index={i}
              onUpdate={patch => updateBinding(i, patch)}
              onRemove={() => removeBinding(i)}
            />
          ))}
          <button
            onClick={addBinding}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-neutral-300 text-xs text-neutral-500 hover:border-primary-400 hover:text-primary-600 transition-all"
          >
            <Plus className="w-3 h-3" /> Add Metric Binding
          </button>
        </Section>
      </div>
    </div>
  );
}

function MetricBindingRow({
  binding, index, onUpdate, onRemove,
}: {
  binding: WidgetMetricBindingCreate;
  index: number;
  onUpdate: (patch: Partial<WidgetMetricBindingCreate>) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(index === 0);

  return (
    <div className="rounded-xl border border-neutral-100 overflow-hidden">
      <div
        className="flex items-center gap-2 px-2.5 py-2 cursor-pointer hover:bg-neutral-50 transition-all"
        onClick={() => setOpen(o => !o)}
      >
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ background: binding.color_override || '#0A84FF' }}
        />
        <span className="flex-1 text-xs font-medium text-neutral-700 truncate">
          {binding.display_label || binding.metric_key || `Binding ${index + 1}`}
        </span>
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="p-0.5 rounded text-neutral-300 hover:text-red-400 transition-all"
        >
          <Trash2 className="w-3 h-3" />
        </button>
        {open ? <ChevronUp className="w-3 h-3 text-neutral-300" /> : <ChevronDown className="w-3 h-3 text-neutral-300" />}
      </div>
      {open && (
        <div className="px-2.5 pb-2.5 space-y-2 border-t border-neutral-50">
          <Field label="Metric Key">
            <input
              type="text"
              value={binding.metric_key}
              onChange={e => onUpdate({ metric_key: e.target.value })}
              placeholder="e.g. error_rate, response_time_ms"
              className="w-full px-2.5 py-1.5 text-xs border border-neutral-200 rounded-xl outline-none focus:border-primary-400 bg-white transition-all mt-1"
            />
          </Field>
          <Field label="Source Scope">
            <SelectInput
              value={binding.metric_source_scope}
              onChange={v => onUpdate({ metric_source_scope: v as MetricSourceScope })}
              options={METRIC_SOURCE_OPTIONS}
            />
          </Field>
          {binding.metric_source_scope === 'connector_metric' && (
            <Field label="Connector Type">
              <input
                type="text"
                value={binding.connector_type || ''}
                onChange={e => onUpdate({ connector_type: e.target.value || null })}
                placeholder="splunk, grafana..."
                className="w-full px-2.5 py-1.5 text-xs border border-neutral-200 rounded-xl outline-none focus:border-primary-400 bg-white transition-all mt-1"
              />
            </Field>
          )}
          <Field label="Aggregation">
            <SelectInput
              value={binding.aggregation_mode}
              onChange={v => onUpdate({ aggregation_mode: v as AggregationMode })}
              options={AGGREGATION_OPTIONS}
            />
          </Field>
          <Field label="Display Label">
            <input
              type="text"
              value={binding.display_label || ''}
              onChange={e => onUpdate({ display_label: e.target.value || null })}
              placeholder="Human-readable name"
              className="w-full px-2.5 py-1.5 text-xs border border-neutral-200 rounded-xl outline-none focus:border-primary-400 bg-white transition-all mt-1"
            />
          </Field>
          <Field label="Color">
            <div className="flex items-center gap-1.5 mt-0.5">
              {ACCENT_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => onUpdate({ color_override: c })}
                  className={cn(
                    'w-5 h-5 rounded-full transition-all',
                    binding.color_override === c ? 'ring-2 ring-offset-1 ring-neutral-400 scale-110' : 'hover:scale-105',
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </Field>
        </div>
      )}
    </div>
  );
}

function getDefaultScope(templateScope: DashboardScope): MetricSourceScope {
  switch (templateScope) {
    case 'team': return 'team_aggregate';
    case 'lob': return 'lob_aggregate';
    case 'global': return 'project_aggregate';
    default: return 'connector_metric';
  }
}
