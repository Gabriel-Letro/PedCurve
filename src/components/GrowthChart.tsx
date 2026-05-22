import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ReferenceRow } from '../utils/curveStandards';

export interface PatientDataPoint {
  months: number;
  value: number;
  date: string;
}

interface GrowthChartProps {
  title: string;
  referenceData: ReferenceRow[];
  patientData: PatientDataPoint[];
  yAxisLabel: string;
  isGirl?: boolean;
  caption?: string;
  staticSize?: { width: number; height: number };
}

const GrowthChart: React.FC<GrowthChartProps> = ({
  title,
  referenceData,
  patientData,
  yAxisLabel,
  isGirl = false,
  caption,
  staticSize,
}) => {
  const { mergedData, zColor } = useMemo(() => {
    const refByMonth: Record<number, any> = {};

    for (const d of referenceData) {
      const month = Number(d.Month ?? d.Agemos);
      if (Number.isNaN(month)) continue;
      refByMonth[month] = {
        month,
        z_m3: d.SD3neg !== undefined ? Number(d.SD3neg) : undefined,
        z_m2: d.SD2neg !== undefined ? Number(d.SD2neg) : undefined,
        z_m1: d.SD1neg !== undefined ? Number(d.SD1neg) : undefined,
        z_0:  d.SD0   !== undefined ? Number(d.SD0)   : undefined,
        z_p1: d.SD1   !== undefined ? Number(d.SD1)   : undefined,
        z_p2: d.SD2   !== undefined ? Number(d.SD2)   : undefined,
        z_p3: d.SD3   !== undefined ? Number(d.SD3)   : undefined,
      };
    }

    for (const p of patientData) {
      const m = Math.round(p.months);
      if (!refByMonth[m]) refByMonth[m] = { month: m };
      refByMonth[m].patient = p.value;
      refByMonth[m].patientDate = p.date;
    }

    const merged = Object.values(refByMonth).sort(
      (a: any, b: any) => a.month - b.month
    );
    const color = isGirl ? '#f472b6' : '#38bdf8';
    return { mergedData: merged, zColor: color };
  }, [referenceData, patientData, isGirl]);

  const unit = yAxisLabel.includes('(')
    ? yAxisLabel.split('(')[1]?.replace(')', '')
    : '';

  const renderChart = (extra: { width?: number; height?: number }) => {
    const lastIdx = mergedData.length - 1;

    // Returns a dot renderer that draws a text label only at the last data point.
    const endLabel = (label: string, color: string, opacity = 1) =>
      (props: any) => {
        const { cx, cy, index } = props;
        if (index !== lastIdx || cx == null || cy == null) return <g key={`z-${index}-${label}`} />;
        return (
          <text
            key={`z-${index}-${label}`}
            x={cx + 5}
            y={cy + 1}
            fill={color}
            fontSize={9.5}
            fontWeight={700}
            dominantBaseline="middle"
            opacity={opacity}
          >
            {label}
          </text>
        );
      };

    return (
      <ComposedChart
        {...extra}
        data={mergedData as any[]}
        margin={{ top: 8, right: 48, bottom: 36, left: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="month"
          type="number"
          domain={['dataMin', 'dataMax']}
          height={48}
          tick={{ fontSize: 11, fill: '#6B7280' }}
          label={{
            value: 'Idade (meses)',
            position: 'insideBottom',
            offset: 0,
            fill: '#6B7280',
            fontSize: 12,
          }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#6B7280' }}
          label={{
            value: yAxisLabel,
            angle: -90,
            position: 'insideLeft',
            offset: 10,
            fill: '#6B7280',
            fontSize: 12,
          }}
        />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: 12,
            boxShadow: '0 8px 16px -4px rgba(0,0,0,0.1)',
            fontSize: 12,
          }}
          labelFormatter={(month) => `${month} meses`}
          formatter={(value: any, name: any, ctx: any) => {
            if (name === 'Paciente') {
              const date = ctx?.payload?.patientDate;
              return [`${value} ${unit}${date ? ` • ${date}` : ''}`, 'Paciente'];
            }
            return [`${value}`, name];
          }}
        />

        {/* Reference Z-score curves — labels appear at the end of each line */}
        <Line name="Z = -3" type="monotone" dataKey="z_m3" stroke={zColor} strokeWidth={1}   strokeDasharray="3 4" strokeOpacity={0.5}  dot={endLabel('Z-3', zColor, 0.55)} isAnimationActive={false} />
        <Line name="Z = -2" type="monotone" dataKey="z_m2" stroke={zColor} strokeWidth={1.5} strokeDasharray="5 3" dot={endLabel('Z-2', zColor)} isAnimationActive={false} />
        <Line name="Z = -1" type="monotone" dataKey="z_m1" stroke={zColor} strokeWidth={1}   strokeOpacity={0.75} dot={endLabel('Z-1', zColor, 0.75)} isAnimationActive={false} />
        <Line name="Z = 0"  type="monotone" dataKey="z_0"  stroke={zColor} strokeWidth={2.5} dot={endLabel('Z 0', zColor)} isAnimationActive={false} />
        <Line name="Z = +1" type="monotone" dataKey="z_p1" stroke={zColor} strokeWidth={1}   strokeOpacity={0.75} dot={endLabel('Z+1', zColor, 0.75)} isAnimationActive={false} />
        <Line name="Z = +2" type="monotone" dataKey="z_p2" stroke={zColor} strokeWidth={1.5} strokeDasharray="5 3" dot={endLabel('Z+2', zColor)} isAnimationActive={false} />
        <Line name="Z = +3" type="monotone" dataKey="z_p3" stroke={zColor} strokeWidth={1}   strokeDasharray="3 4" strokeOpacity={0.5}  dot={endLabel('Z+3', zColor, 0.55)} isAnimationActive={false} />

        {/* Patient measurements line */}
        <Line
          name="Paciente"
          type="monotone"
          dataKey="patient"
          stroke="#FF8B8B"
          strokeWidth={2.5}
          dot={{ r: 5, fill: '#FF8B8B', stroke: 'white', strokeWidth: 1.5 }}
          connectNulls
          isAnimationActive={false}
        />
      </ComposedChart>
    );
  };

  return (
    <div className="card w-full">
      {(title || caption) && (
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            {title && <h3 className="text-lg font-bold text-dark">{title}</h3>}
            {caption && <p className="text-xs text-muted mt-1">{caption}</p>}
          </div>
        </div>
      )}

      {staticSize ? (
        <div style={{ width: staticSize.width, height: staticSize.height }}>
          {renderChart({ width: staticSize.width, height: staticSize.height })}
        </div>
      ) : (
        <div className="h-[440px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart({})}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default GrowthChart;
