import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
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
  /** Optional small caption shown in the chart header (e.g. standard label) */
  caption?: string;
  /**
   * When provided, the chart renders at a fixed pixel size instead of using
   * ResponsiveContainer. This is essential for print/PDF: ResponsiveContainer
   * relies on a ResizeObserver and reports 0x0 inside hidden/print containers,
   * producing blank charts. A fixed size always renders real SVG.
   */
  staticSize?: { width: number; height: number };
}

/**
 * WHO/CDC-style growth-curve chart.
 *
 * Renders 5 percentile bands (P3 / P15 / P50 / P85 / P97) derived from the
 * SD reference lines, plus the patient's longitudinal data line in the
 * coral brand accent.
 */
const GrowthChart: React.FC<GrowthChartProps> = ({
  title,
  referenceData,
  patientData,
  yAxisLabel,
  isGirl = false,
  caption,
  staticSize,
}) => {
  const { mergedData, percentileColor } = useMemo(() => {
    const refByMonth: Record<number, any> = {};

    for (const d of referenceData) {
      const month = Number(d.Month ?? d.Agemos);
      if (Number.isNaN(month)) continue;
      refByMonth[month] = {
        month,
        P3: Number(d.SD2neg),
        P15: Number(d.SD1neg),
        P50: Number(d.SD0),
        P85: Number(d.SD1),
        P97: Number(d.SD2),
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
    return { mergedData: merged, percentileColor: color };
  }, [referenceData, patientData, isGirl]);

  const unit = yAxisLabel.includes('(')
    ? yAxisLabel.split('(')[1]?.replace(')', '')
    : '';

  // Chart body factored out so on-screen (responsive) and print (static)
  // renders share identical configuration.
  const renderChart = (extra: { width?: number; height?: number }) => (
    <ComposedChart
      {...extra}
      data={mergedData as any[]}
      margin={{ top: 8, right: 20, bottom: 36, left: 8 }}
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
      {/* Legend pinned to the TOP so it never overlaps the bottom
          "Idade (meses)" axis label. */}
      <Legend
        verticalAlign="top"
        align="center"
        height={32}
        iconType="line"
        wrapperStyle={{ fontSize: 11, paddingBottom: 6 }}
      />

      {/* Reference percentile curves */}
      <Line name="P97" type="monotone" dataKey="P97" stroke={percentileColor} strokeWidth={1} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
      <Line name="P85" type="monotone" dataKey="P85" stroke={percentileColor} strokeWidth={1} strokeOpacity={0.7} dot={false} isAnimationActive={false} />
      <Line name="P50" type="monotone" dataKey="P50" stroke={percentileColor} strokeWidth={2.2} dot={false} isAnimationActive={false} />
      <Line name="P15" type="monotone" dataKey="P15" stroke={percentileColor} strokeWidth={1} strokeOpacity={0.7} dot={false} isAnimationActive={false} />
      <Line name="P3" type="monotone" dataKey="P3" stroke={percentileColor} strokeWidth={1} strokeDasharray="4 3" dot={false} isAnimationActive={false} />

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

  return (
    <div className="card w-full">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-bold text-dark">{title}</h3>
          {caption && <p className="text-xs text-muted mt-1">{caption}</p>}
        </div>
      </div>

      {staticSize ? (
        // Fixed-size render for print/PDF (always produces real SVG).
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
