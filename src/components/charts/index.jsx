'use client';
// src/components/charts/index.jsx — Reusable Recharts wrappers

import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';

// ── Design tokens ─────────────────────────────────────────────────────────────
const COLORS = {
  blue:  '#6C8EF5',
  indigo:'#A78BFA',
  green: '#34D399',
  red:   '#F87171',
  amber: '#FBBF24',
  cyan:  '#22D3EE',
  pink:  '#F472B6',
};

const SERIES_COLORS = [COLORS.blue, COLORS.green, COLORS.amber, COLORS.red, COLORS.indigo, COLORS.cyan];

const CHART_STYLE = {
  background: 'transparent',
  fontFamily: 'Inter, sans-serif',
  fontSize: 11,
};

const AXIS_PROPS = {
  tick: { fill: '#6B7280', fontSize: 10, fontFamily: 'Inter' },
  axisLine: { stroke: 'rgba(255,255,255,0.06)' },
  tickLine: false,
};

const GRID_PROPS = {
  strokeDasharray: '3 3',
  stroke: 'rgba(255,255,255,0.05)',
  vertical: false,
};

const TOOLTIP_STYLE = {
  contentStyle: {
    background: 'rgba(16,19,26,0.97)',
    border: '1px solid rgba(108,142,245,0.25)',
    borderRadius: 10,
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#F0F2F8',
    padding: '8px 12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  },
  labelStyle: { color: '#6B7280', marginBottom: 4, fontWeight: 600 },
  cursor: { stroke: 'rgba(108,142,245,0.2)', strokeWidth: 1 },
};

const LEGEND_PROPS = {
  wrapperStyle: { fontSize: 11, fontFamily: 'Inter', paddingTop: 12, color: '#9CA3AF' },
  iconType: 'circle',
  iconSize: 7,
};

// ── Chart shell (title + container + skeleton) ────────────────────────────────
export function ChartCard({ title, subtitle, loading, height = 220, children }) {
  return (
    <div className="card" style={{ padding: '18px 20px 12px' }}>
      {title && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 2 }}>{subtitle}</div>}
        </div>
      )}
      {loading
        ? <div className="skeleton" style={{ height, borderRadius: 10 }} />
        : <div style={{ width: '100%', height }}>{children}</div>
      }
    </div>
  );
}

// ── 1. Line Chart ─────────────────────────────────────────────────────────────
export function LineChartComponent({ data = [], lines = [], xKey = 'time', title, subtitle, loading, height }) {
  return (
    <ChartCard title={title} subtitle={subtitle} loading={loading} height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} style={CHART_STYLE} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey={xKey} {...AXIS_PROPS} interval="preserveStartEnd" />
          <YAxis {...AXIS_PROPS} />
          <Tooltip {...TOOLTIP_STYLE} />
          <Legend {...LEGEND_PROPS} />
          {lines.map(({ key, color, dashed }, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color ?? SERIES_COLORS[i % SERIES_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
              strokeDasharray={dashed ? '5 3' : undefined}
              animationDuration={900}
              animationEasing="ease-out"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── 2. Bar Chart ──────────────────────────────────────────────────────────────
export function BarChartComponent({ data = [], bars = [], xKey = 'name', title, subtitle, loading, height }) {
  return (
    <ChartCard title={title} subtitle={subtitle} loading={loading} height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} style={CHART_STYLE} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey={xKey} {...AXIS_PROPS} />
          <YAxis {...AXIS_PROPS} />
          <Tooltip {...TOOLTIP_STYLE} />
          <Legend {...LEGEND_PROPS} />
          {bars.map(({ key, color }, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={color ?? SERIES_COLORS[i % SERIES_COLORS.length]}
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
              animationDuration={800}
              animationEasing="ease-out"
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── 3. Area Chart ─────────────────────────────────────────────────────────────
export function AreaChartComponent({ data = [], areas = [], xKey = 'time', title, subtitle, loading, height }) {
  return (
    <ChartCard title={title} subtitle={subtitle} loading={loading} height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} style={CHART_STYLE} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            {areas.map(({ key, color }, i) => {
              const c = color ?? SERIES_COLORS[i % SERIES_COLORS.length];
              return (
                <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={c} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={c} stopOpacity={0.01} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey={xKey} {...AXIS_PROPS} interval="preserveStartEnd" />
          <YAxis {...AXIS_PROPS} />
          <Tooltip {...TOOLTIP_STYLE} />
          <Legend {...LEGEND_PROPS} />
          {areas.map(({ key, color }, i) => {
            const c = color ?? SERIES_COLORS[i % SERIES_COLORS.length];
            return (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={c}
                fill={`url(#grad-${key})`}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
                animationDuration={900}
                animationEasing="ease-out"
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── 4. Pie / Donut Chart ──────────────────────────────────────────────────────
const PIE_COLORS = {
  CLEARED:  COLORS.green,
  CLEARING: COLORS.amber,
  PENDING:  '#4B5563',
  NORMAL:   '#374151',
  Critical: COLORS.red,
  Warning:  COLORS.amber,
  Info:     COLORS.blue,
};

const RADIAN = Math.PI / 180;
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.08) return null;
  const r  = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x  = cx + r * Math.cos(-midAngle * RADIAN);
  const y  = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function PieChartComponent({ data = [], title, subtitle, loading, height = 220, donut = false }) {
  return (
    <ChartCard title={title} subtitle={subtitle} loading={loading} height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart style={CHART_STYLE}>
          <Pie
            data={data}
            cx="50%" cy="50%"
            outerRadius={donut ? '75%' : '80%'}
            innerRadius={donut ? '48%' : 0}
            dataKey="value"
            nameKey="name"
            labelLine={false}
            label={donut ? undefined : renderLabel}
            paddingAngle={donut ? 3 : 1}
            animationDuration={900}
            animationEasing="ease-out"
          >
            {data.map((entry, i) => (
              <Cell
                key={entry.name}
                fill={PIE_COLORS[entry.name] ?? SERIES_COLORS[i % SERIES_COLORS.length]}
                stroke="rgba(0,0,0,0.2)"
                strokeWidth={1}
              />
            ))}
          </Pie>
          <Tooltip {...TOOLTIP_STYLE} />
          <Legend {...LEGEND_PROPS} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
