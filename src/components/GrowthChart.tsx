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
import { zToPercentile } from '../utils/zscore';
import { useTheme } from '../context/ThemeContext';

export interface PatientDataPoint {
  months: number;
  value: number;
  date: string;
}

export type ChartDisplayMode = 'zscore' | 'percentile';

interface GrowthChartProps {
  title: string;
  referenceData: ReferenceRow[];
  patientData: PatientDataPoint[];
  yAxisLabel: string;
  isGirl?: boolean;
  caption?: string;
  staticSize?: { width: number; height: number };
  displayMode?: ChartDisplayMode;
}

function useChartColors(isDark: boolean) {
  return {
    cardBg:        isDark ? '#1a2a35' : '#FFFFFF',
    border:        isDark ? '#2d3d4a' : '#E5DFD5',
    grid:          isDark ? '#243240' : '#E5E7EB',
    label:         isDark ? '#8fa0ae' : '#6B7280',
    title:         isDark ? '#e2e8f0' : '#1B3A4B',
    muted:         isDark ? '#5c7080' : '#9CA3AF',
    tooltip:       isDark ? '#1e2d38' : '#FFFFFF',
    tooltipBorder: isDark ? '#2d3d4a' : '#E5E7EB',
    noData:        isDark ? '#5c7080' : '#9CA3AF',
  };
}

// Standard normal Z-scores for common percentiles (used for inverse LMS)
const PCT_Z: Record<string, number> = {
  p3: -1.8808, p10: -1.2816, p25: -0.6745,
  p50: 0,
  p75: 0.6745, p90: 1.2816, p97: 1.8808,
};

function valueFromZ(Z: number, L: number, M: number, S: number): number {
  if (L === 0) return M * Math.exp(S * Z);
  const inner = 1 + L * S * Z;
  if (inner <= 0) return NaN;
  return M * Math.pow(inner, 1 / L);
}

function computePatientZ(value: number, L: number, M: number, S: number): number {
  if (L === 0) return Math.log(value / M) / S;
  return (Math.pow(value / M, L) - 1) / (L * S);
}

// ── Z-Score display config ────────────────────────────────────
const Z_END_LABELS = ['Z-3','Z-2','Z-1','Z 0','Z+1','Z+2','Z+3'];
const Z_NAMES      = ['Z = -3','Z = -2','Z = -1','Z = 0','Z = +1','Z = +2','Z = +3'];
const Z_KEYS       = ['z_m3','z_m2','z_m1','z_0','z_p1','z_p2','z_p3'];
const Z_WIDTHS     = [1, 1.5, 1, 2.5, 1, 1.5, 1];
const Z_DASHES     = ['3 4','5 3','','','','5 3','3 4'];
const Z_OPACITIES  = [0.5, 1, 0.75, 1, 0.75, 1, 0.5];

// ── Percentile display config ─────────────────────────────────
const P_END_LABELS = ['P3','P10','P25','P50','P75','P90','P97'];
const P_NAMES      = ['P3','P10','P25','P50 (mediana)','P75','P90','P97'];
const P_KEYS       = ['pct3','pct10','pct25','pct50','pct75','pct90','pct97'];
const P_WIDTHS     = [1, 1, 1, 2.5, 1, 1, 1];
const P_DASHES     = ['4 3','3 2','','','','3 2','4 3'];
const P_OPACITIES  = [0.65, 0.8, 0.9, 1, 0.9, 0.8, 0.65];

const GrowthChart: React.FC<GrowthChartProps> = ({
  title,
  referenceData,
  patientData,
  yAxisLabel,
  isGirl = false,
  caption,
  staticSize,
  displayMode = 'zscore',
}) => {
  const { theme } = useTheme();
  const C = useChartColors(theme === 'dark');

  const { mergedData, zColor, hasLMS } = useMemo(() => {
    const refByMonth: Record<number, any> = {};
    let lmsFound = false;

    for (const d of referenceData) {
      const month = Number(d.Month ?? d.Agemos);
      if (Number.isNaN(month)) continue;

      const L = d.L !== undefined ? Number(d.L) : undefined;
      const M = d.M !== undefined ? Number(d.M) : undefined;
      const S = d.S !== undefined ? Number(d.S) : undefined;
      const lmsOk = L !== undefined && M !== undefined && S !== undefined
                 && !Number.isNaN(L) && !Number.isNaN(M) && !Number.isNaN(S) && M > 0;

      if (lmsOk) lmsFound = true;

      refByMonth[month] = {
        month,
        // Z-Score lines (from precomputed SD columns)
        z_m3: d.SD3neg !== undefined ? Number(d.SD3neg) : undefined,
        z_m2: d.SD2neg !== undefined ? Number(d.SD2neg) : undefined,
        z_m1: d.SD1neg !== undefined ? Number(d.SD1neg) : undefined,
        z_0:  d.SD0    !== undefined ? Number(d.SD0)    : undefined,
        z_p1: d.SD1    !== undefined ? Number(d.SD1)    : undefined,
        z_p2: d.SD2    !== undefined ? Number(d.SD2)    : undefined,
        z_p3: d.SD3    !== undefined ? Number(d.SD3)    : undefined,
        // Percentile lines (computed from LMS)
        ...(lmsOk ? {
          pct3:  valueFromZ(PCT_Z.p3,  L!, M!, S!),
          pct10: valueFromZ(PCT_Z.p10, L!, M!, S!),
          pct25: valueFromZ(PCT_Z.p25, L!, M!, S!),
          pct50: valueFromZ(PCT_Z.p50, L!, M!, S!),
          pct75: valueFromZ(PCT_Z.p75, L!, M!, S!),
          pct90: valueFromZ(PCT_Z.p90, L!, M!, S!),
          pct97: valueFromZ(PCT_Z.p97, L!, M!, S!),
        } : {}),
        // Keep LMS for patient Z-score in tooltip
        _L: L, _M: M, _S: S, _lmsOk: lmsOk,
      };
    }

    for (const p of patientData) {
      const m = Math.round(p.months);
      if (!refByMonth[m]) refByMonth[m] = { month: m };
      refByMonth[m].patient = p.value;
      refByMonth[m].patientDate = p.date;
      const row = refByMonth[m];
      if (row._lmsOk) {
        refByMonth[m].patientZ = Number(
          computePatientZ(p.value, row._L, row._M, row._S).toFixed(2)
        );
      }
    }

    const merged = Object.values(refByMonth).sort((a: any, b: any) => a.month - b.month);
    return { mergedData: merged, zColor: isGirl ? '#f472b6' : '#38bdf8', hasLMS: lmsFound };
  }, [referenceData, patientData, isGirl]);

  const unit = yAxisLabel.includes('(')
    ? yAxisLabel.split('(')[1]?.replace(')', '')
    : '';

  // Pick which set of lines to render
  const isPercentileMode = displayMode === 'percentile' && hasLMS;
  const endLabels = isPercentileMode ? P_END_LABELS : Z_END_LABELS;
  const lineNames = isPercentileMode ? P_NAMES      : Z_NAMES;
  const lineKeys  = isPercentileMode ? P_KEYS       : Z_KEYS;
  const lineWidths  = isPercentileMode ? P_WIDTHS   : Z_WIDTHS;
  const lineDashes  = isPercentileMode ? P_DASHES   : Z_DASHES;
  const lineOpacs   = isPercentileMode ? P_OPACITIES : Z_OPACITIES;

  const renderChart = (extra: { width?: number; height?: number }) => {
    const lastIdx = mergedData.length - 1;

    const endLabelDot = (idx: number, color: string) =>
      (props: any) => {
        const { cx, cy, index } = props;
        if (index !== lastIdx || cx == null || cy == null) return <g key={`el-${index}-${idx}`} />;
        return (
          <text
            key={`el-${index}-${idx}`}
            x={cx + 5} y={cy + 1}
            fill={color}
            fontSize={9.5} fontWeight={700}
            dominantBaseline="middle"
            opacity={lineOpacs[idx]}
          >
            {endLabels[idx]}
          </text>
        );
      };

    return (
      <ComposedChart
        {...extra}
        data={mergedData as any[]}
        margin={{ top: 8, right: 48, bottom: 36, left: 8 }}
        style={{ background: C.cardBg }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
        <XAxis
          dataKey="month"
          type="number"
          domain={['dataMin', 'dataMax']}
          height={48}
          tick={{ fontSize: 11, fill: C.label }}
          label={{ value: 'Idade (meses)', position: 'insideBottom', offset: 0, fill: C.label, fontSize: 12 }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: C.label }}
          label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', offset: 10, fill: C.label, fontSize: 12 }}
        />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{
            background: C.tooltip,
            border: `1px solid ${C.tooltipBorder}`,
            borderRadius: 12,
            boxShadow: '0 8px 16px -4px rgba(0,0,0,0.1)',
            fontSize: 12,
            color: C.title,
          }}
          labelFormatter={(month) => `${month} meses`}
          formatter={(value: any, name: any, ctx: any) => {
            if (name === 'Paciente') {
              const date = ctx?.payload?.patientDate;
              const z = ctx?.payload?.patientZ;
              let scoreStr = '';
              if (z !== undefined) {
                scoreStr = displayMode === 'zscore'
                  ? ` • Z: ${z}`
                  : ` • P${zToPercentile(z)}`;
              }
              return [`${value} ${unit}${date ? ` • ${date}` : ''}${scoreStr}`, 'Paciente'];
            }
            return [`${Number(value).toFixed(2)}`, name];
          }}
        />

        {/* Reference lines */}
        {lineKeys.map((key, i) => (
          <Line
            key={key}
            name={lineNames[i]}
            type="monotone"
            dataKey={key}
            stroke={zColor}
            strokeWidth={lineWidths[i]}
            strokeDasharray={lineDashes[i] || undefined}
            strokeOpacity={lineOpacs[i]}
            dot={endLabelDot(i, zColor)}
            isAnimationActive={false}
          />
        ))}

        {/* Patient line */}
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
    <div
      style={{
        background: C.cardBg,
        borderRadius: 14,
        padding: '1.5rem',
        border: `1px solid ${C.border}`,
        boxShadow: '0 1px 2px 0 rgba(27,58,75,0.07)',
        width: '100%',
      }}
    >
      {(title || caption) && (
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            {title && <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: C.title }}>{title}</h3>}
            {caption && <p style={{ fontSize: '0.75rem', color: C.muted, marginTop: 4 }}>{caption}</p>}
          </div>
        </div>
      )}

      {staticSize ? (
        <div style={{ width: staticSize.width, height: staticSize.height, background: C.cardBg }}>
          {renderChart({ width: staticSize.width, height: staticSize.height })}
        </div>
      ) : (
        <div className="h-[440px] w-full" style={{ background: C.cardBg }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart({})}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default GrowthChart;
