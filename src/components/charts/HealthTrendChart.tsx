import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { HealthTrend } from '@/types';

interface HealthTrendChartProps {
  data: HealthTrend[];
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{value: number; name: string; color: string}>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-xl px-3 py-2.5 text-sm shadow-glass-lg">
      <p className="text-neutral-400 text-xs mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-neutral-600 capitalize">{p.name}:</span>
          <span className="font-semibold text-neutral-900">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export function HealthTrendChart({ data, height = 280 }: HealthTrendChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    time: new Date(d.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={formatted} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="healthyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#30D158" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#30D158" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="degradedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF9F0A" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#FF9F0A" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="downGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF453A" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#FF453A" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
        <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#A1A1AA' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#A1A1AA' }} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
        <Area type="monotone" dataKey="healthy" stroke="#30D158" strokeWidth={2} fill="url(#healthyGrad)" />
        <Area type="monotone" dataKey="degraded" stroke="#FF9F0A" strokeWidth={2} fill="url(#degradedGrad)" />
        <Area type="monotone" dataKey="down" stroke="#FF453A" strokeWidth={2} fill="url(#downGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
