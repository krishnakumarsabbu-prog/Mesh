import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface StatusDonutChartProps {
  healthy: number;
  degraded: number;
  down: number;
  unknown?: number;
  size?: number;
}

const COLORS = ['#30D158', '#FF9F0A', '#FF453A', '#A1A1AA'];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{name: string; value: number}> }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-xl px-3 py-2 text-xs shadow-glass">
      <span className="font-medium">{payload[0].name}:</span>{' '}
      <span className="text-neutral-600">{payload[0].value}</span>
    </div>
  );
};

export function StatusDonutChart({ healthy, degraded, down, unknown = 0, size = 180 }: StatusDonutChartProps) {
  const data = [
    { name: 'Healthy', value: healthy },
    { name: 'Degraded', value: degraded },
    { name: 'Down', value: down },
    { name: 'Unknown', value: unknown },
  ].filter((d) => d.value > 0);

  const total = healthy + degraded + down + unknown;
  const healthPct = total > 0 ? Math.round((healthy / total) * 100) : 100;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="62%"
            outerRadius="80%"
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold text-neutral-900">{healthPct}%</span>
        <span className="text-xs text-neutral-400 mt-0.5">Healthy</span>
      </div>
    </div>
  );
}
