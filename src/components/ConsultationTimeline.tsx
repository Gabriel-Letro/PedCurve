import React, { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import type { TimelinePoint } from '../utils/timeline';

interface Props {
  data: TimelinePoint[];
  staticSize?: { width: number; height: number };
}

/**
 * Consultation history over time.
 *
 * Bars = number of indicators recorded per visit (completeness),
 * Line = interval in days since the previous visit (cadence).
 * Both are anchored to the consultation date on the X axis.
 */
const ConsultationTimeline: React.FC<Props> = ({ data, staticSize }) => {
  const chartData = useMemo(() => data, [data]);

  if (chartData.length === 0) {
    return (
      <div className="muted-block">
        <p>Sem consultas suficientes para montar a linha do tempo.</p>
      </div>
    );
  }

  const renderChart = (extra: { width?: number; height?: number }) => (
    <ComposedChart
      {...extra}
      data={chartData}
      margin={{ top: 8, right: 20, bottom: 36, left: 8 }}
    >
      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
      <XAxis
        dataKey="label"
        height={48}
        tick={{ fontSize: 11, fill: '#6B7280' }}
        label={{
          value: 'Data da consulta',
          position: 'insideBottom',
          offset: 0,
          fill: '#6B7280',
          fontSize: 12,
        }}
      />
      <YAxis
        yAxisId="left"
        allowDecimals={false}
        tick={{ fontSize: 11, fill: '#6B7280' }}
        label={{ value: 'Indicadores', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 12 }}
      />
      <YAxis
        yAxisId="right"
        orientation="right"
        tick={{ fontSize: 11, fill: '#6B7280' }}
        label={{ value: 'Intervalo (dias)', angle: 90, position: 'insideRight', fill: '#6B7280', fontSize: 12 }}
      />
      <Tooltip
        contentStyle={{
          background: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          boxShadow: '0 8px 16px -4px rgba(0,0,0,0.1)',
          fontSize: 12,
        }}
        formatter={(value: any, name: any) => {
          if (name === 'Intervalo') return [`${value} dias`, name];
          if (name === 'Indicadores') return [`${value}`, name];
          return [value, name];
        }}
        labelFormatter={(label: any, payload: any) => {
          const age = payload?.[0]?.payload?.ageMonths;
          return age != null ? `${label} • ${age} meses` : label;
        }}
      />
      <Legend verticalAlign="top" align="center" height={32} wrapperStyle={{ fontSize: 11, paddingBottom: 6 }} />
      <Bar
        yAxisId="left"
        name="Indicadores"
        dataKey="indicators"
        fill="#7ED3C1"
        radius={[6, 6, 0, 0]}
        barSize={28}
        isAnimationActive={false}
      />
      <Line
        yAxisId="right"
        name="Intervalo"
        type="monotone"
        dataKey="intervalDays"
        stroke="#22B6A8"
        strokeWidth={2.5}
        dot={{ r: 4, fill: '#22B6A8', stroke: 'white', strokeWidth: 1.5 }}
        isAnimationActive={false}
      />
    </ComposedChart>
  );

  return (
    <div className="card w-full">
      <h3 className="text-lg font-bold text-dark mb-1">Linha do tempo de consultas</h3>
      <p className="text-xs text-muted mb-3">
        Barras: indicadores registrados por consulta. Linha: intervalo desde a
        consulta anterior.
      </p>
      {staticSize ? (
        <div style={{ width: staticSize.width, height: staticSize.height }}>
          {renderChart({ width: staticSize.width, height: staticSize.height })}
        </div>
      ) : (
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart({})}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ConsultationTimeline;
