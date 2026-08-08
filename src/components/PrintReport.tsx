import React from 'react';
import { format, differenceInMonths, parseISO } from 'date-fns';
import type { Patient } from '../context/AppContext';
import { calculateAllZScores, zToPercentile } from '../utils/zscore';
import {
  resolveStandard,
  STANDARD_LABELS,
  type StandardKey,
} from '../utils/curveStandards';
import GrowthChart from './GrowthChart';
import Logo from './Logo';

interface Props {
  patient: Patient;
  standard: StandardKey;
}

// Fixed render size so Recharts always produces real SVG inside the
// (screen-hidden) print container. Largura limitada para caber na área útil
// de uma A4 retrato (~688px): 620 + padding(48) + borda(2) = 670px < 688px,
// evitando que o lado direito do gráfico (rótulos Z+3/P97) seja cortado.
const CHART = { width: 620, height: 320 };

/**
 * Printer/PDF-friendly report. Rendered inside a `.print-report` wrapper that
 * is hidden on screen and shown only when printing. All charts use a fixed
 * pixel size (no ResponsiveContainer) so they render correctly in the PDF.
 */
const PrintReport: React.FC<Props> = ({ patient, standard }) => {
  const ageAt = (date: string) =>
    differenceInMonths(parseISO(date), parseISO(patient.birthDate));

  const sorted = [...patient.consultations].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const last = sorted[0];

  const mk = (pick: (c: Patient['consultations'][number]) => number | undefined) =>
    patient.consultations
      .filter((c) => typeof pick(c) === 'number')
      .map((c) => ({
        months: ageAt(c.date),
        value: pick(c) as number,
        date: format(parseISO(c.date), 'dd/MM/yyyy'),
      }));

  const weightData = mk((c) => c.weight);
  const heightData = mk((c) => c.height);
  const headData = mk((c) => c.headCirc);
  const bmiData = patient.consultations
    .filter((c) => typeof c.weight === 'number' && typeof c.height === 'number')
    .map((c) => {
      const h = (c.height as number) / 100;
      return {
        months: ageAt(c.date),
        value: Number(((c.weight as number) / (h * h)).toFixed(2)),
        date: format(parseISO(c.date), 'dd/MM/yyyy'),
      };
    });

  const wfaDs = resolveStandard(standard, 'weight', patient.gender);
  const lhfaDs = resolveStandard(standard, 'height', patient.gender);
  const bmiDs = resolveStandard(standard, 'bmi', patient.gender);
  const hcDs = resolveStandard('who', 'headCirc', patient.gender);

  const z = last
    ? calculateAllZScores(
        patient.gender,
        ageAt(last.date),
        last.weight,
        last.height,
        last.headCirc,
        standard
      )
    : null;

  const STATUS_COLORS: Record<string, React.CSSProperties> = {
    normal:  { color: '#2E7D4F', background: '#E4F1E7', padding: '2px 7px', borderRadius: 4, fontWeight: 600, display: 'inline-block' },
    warning: { color: '#B45309', background: '#FCEEDC', padding: '2px 7px', borderRadius: 4, fontWeight: 600, display: 'inline-block' },
    danger:  { color: '#B3362B', background: '#FAE4E0', padding: '2px 7px', borderRadius: 4, fontWeight: 600, display: 'inline-block' },
  };

  const zRow = (label: string, r?: { value: number | null; status?: string; message: string }) => (
    <tr>
      <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee' }}>{label}</td>
      <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee', fontWeight: 700 }}>
        {r && r.value !== null ? r.value : '—'}
      </td>
      <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee' }}>
        {r && r.value !== null ? `P${zToPercentile(r.value)}` : '—'}
      </td>
      <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee' }}>
        <span style={r?.status && STATUS_COLORS[r.status] ? STATUS_COLORS[r.status] : { color: '#6B6860' }}>
          {r ? r.message : '—'}
        </span>
      </td>
    </tr>
  );

  return (
    <div className="print-report">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
          <Logo size={44} withWordmark />
        </div>
        <h1 style={{ fontSize: 20, margin: '6px 0' }}>
          Relatório de Desenvolvimento
        </h1>
        <p style={{ fontSize: 13, color: '#555', margin: 0 }}>
          Paciente: <strong>{patient.name}</strong> •{' '}
          {format(parseISO(patient.birthDate), 'dd/MM/yyyy')} •{' '}
          {patient.gender === 'M' ? 'Masculino' : 'Feminino'} • Responsável:{' '}
          {patient.parentName}
        </p>
        <p style={{ fontSize: 12, color: '#777', margin: '4px 0' }}>
          Curvas de referência: {STANDARD_LABELS[standard]} • Emitido em{' '}
          {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
        </p>
        <hr style={{ border: 0, borderTop: '1px solid #ddd', margin: '12px 0' }} />
      </div>

      {/* Summary + z-scores */}
      {last && z && (
        <div className="print-section card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, marginBottom: 8 }}>
            Última avaliação — {format(parseISO(last.date), 'dd/MM/yyyy')} (
            {ageAt(last.date)} meses)
          </h3>
          <p style={{ fontSize: 13, marginBottom: 10 }}>
            Peso: <strong>{last.weight ?? '—'} kg</strong> &nbsp;•&nbsp; Estatura:{' '}
            <strong>{last.height ?? '—'} cm</strong> &nbsp;•&nbsp; PC:{' '}
            <strong>{last.headCirc ?? '—'} cm</strong>
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                <th style={{ padding: '6px 8px' }}>Indicador</th>
                <th style={{ padding: '6px 8px' }}>Escore-Z</th>
                <th style={{ padding: '6px 8px' }}>Percentil</th>
                <th style={{ padding: '6px 8px' }}>Classificação</th>
              </tr>
            </thead>
            <tbody>
              {zRow('Peso por Idade', z.weight)}
              {zRow('Estatura por Idade', z.height)}
              {zRow('IMC por Idade', z.bmi)}
              {zRow('Perímetro Cefálico', z.headCirc)}
            </tbody>
          </table>
        </div>
      )}

      {/* Charts (static size) */}
      {patient.consultations.length > 0 && (
        <>
          {wfaDs && (
            <div className="print-section">
              <GrowthChart title={wfaDs.title} yAxisLabel={wfaDs.yAxisLabel} referenceData={wfaDs.data} patientData={weightData} staticSize={CHART} forceLight />
            </div>
          )}
          {lhfaDs && (
            <div className="print-section">
              <GrowthChart title={lhfaDs.title} yAxisLabel={lhfaDs.yAxisLabel} referenceData={lhfaDs.data} patientData={heightData} staticSize={CHART} forceLight />
            </div>
          )}
          {bmiDs && (
            <div className="print-section">
              <GrowthChart title={bmiDs.title} yAxisLabel={bmiDs.yAxisLabel} referenceData={bmiDs.data} patientData={bmiData} staticSize={CHART} forceLight />
            </div>
          )}
          {hcDs && (
            <div className="print-section">
              <GrowthChart title={hcDs.title} yAxisLabel={hcDs.yAxisLabel} referenceData={hcDs.data} patientData={headData} staticSize={CHART} forceLight />
            </div>
          )}
        </>
      )}

      {/* History table */}
      <div className="print-section card">
        <h3 style={{ fontSize: 15, marginBottom: 8 }}>Histórico de Consultas</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th style={{ padding: '6px 8px' }}>Data</th>
              <th style={{ padding: '6px 8px' }}>Idade (m)</th>
              <th style={{ padding: '6px 8px' }}>Peso (kg)</th>
              <th style={{ padding: '6px 8px' }}>Estatura (cm)</th>
              <th style={{ padding: '6px 8px' }}>PC (cm)</th>
              <th style={{ padding: '6px 8px' }}>Observações</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr key={c.id}>
                <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee' }}>
                  {format(parseISO(c.date), 'dd/MM/yyyy')}
                </td>
                <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee' }}>{ageAt(c.date)}</td>
                <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee' }}>{c.weight ?? '—'}</td>
                <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee' }}>{c.height ?? '—'}</td>
                <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee' }}>{c.headCirc ?? '—'}</td>
                <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee', fontSize: 11, color: '#555', maxWidth: 160 }}>
                  {c.notes ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrintReport;
