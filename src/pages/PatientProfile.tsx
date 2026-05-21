import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Printer,
  Baby,
  Calendar,
  Trash2,
  Copy,
  Check,
  Info,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { calculateAllZScores, zToPercentile } from '../utils/zscore';
import {
  resolveStandard,
  pickDefaultStandard,
  STANDARD_LABELS,
  availableStandards,
  type StandardKey,
} from '../utils/curveStandards';
import { format, differenceInMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import GrowthChart from '../components/GrowthChart';
import ConsultationTimeline from '../components/ConsultationTimeline';
import PrintReport from '../components/PrintReport';
import { buildTimeline } from '../utils/timeline';

type TabKey = 'laudo' | 'grafico' | 'historico';

const PatientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getPatient, addConsultation, deleteConsultation } = useAppContext();

  const isParentView = searchParams.get('view') === 'parent';
  const patient = id ? getPatient(id) : undefined;

  const [activeTab, setActiveTab] = useState<TabKey>('laudo');
  const [showModal, setShowModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // New Consultation State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [headCirc, setHeadCirc] = useState('');
  const [formError, setFormError] = useState('');

  // ---- Standard selector (default WHO/CDC based on age, doctor can change) ----
  const defaultStandard: StandardKey = patient
    ? pickDefaultStandard(
        differenceInMonths(new Date(), parseISO(patient.birthDate))
      )
    : 'who';
  const [standard, setStandard] = useState<StandardKey>(defaultStandard);

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h2 className="text-xl">Paciente não encontrado.</h2>
        <button
          className="btn btn-primary mt-4"
          onClick={() => navigate(isParentView ? '/' : '/dashboard')}
        >
          Voltar
        </button>
      </div>
    );
  }

  const isGirl = patient.gender === 'F';

  const sortedConsultations = useMemo(
    () =>
      [...patient.consultations].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [patient.consultations]
  );

  const getAgeInMonths = (targetDate: string) =>
    differenceInMonths(parseISO(targetDate), parseISO(patient.birthDate));

  const chartDataWeight = patient.consultations
    .filter((c) => typeof c.weight === 'number')
    .map((c) => ({
      months: getAgeInMonths(c.date),
      value: c.weight!,
      date: format(parseISO(c.date), 'dd/MM/yyyy'),
    }));

  const chartDataHeight = patient.consultations
    .filter((c) => typeof c.height === 'number')
    .map((c) => ({
      months: getAgeInMonths(c.date),
      value: c.height!,
      date: format(parseISO(c.date), 'dd/MM/yyyy'),
    }));

  const chartDataHead = patient.consultations
    .filter((c) => typeof c.headCirc === 'number')
    .map((c) => ({
      months: getAgeInMonths(c.date),
      value: c.headCirc!,
      date: format(parseISO(c.date), 'dd/MM/yyyy'),
    }));

  const chartDataBMI = patient.consultations
    .filter((c) => typeof c.weight === 'number' && typeof c.height === 'number')
    .map((c) => {
      const h = c.height! / 100;
      return {
        months: getAgeInMonths(c.date),
        value: Number((c.weight! / (h * h)).toFixed(2)),
        date: format(parseISO(c.date), 'dd/MM/yyyy'),
      };
    });

  // Plausible upper bounds for clinical measurements.
  const MAX_WEIGHT = 150; // kg
  const MAX_HEIGHT = 200; // cm
  const MAX_HEAD = 100; // cm

  const closeConsultModal = () => {
    setShowModal(false);
    setFormError('');
  };

  const handleAddConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const w = weight.trim() ? parseFloat(weight) : undefined;
    const h = height.trim() ? parseFloat(height) : undefined;
    const hc = headCirc.trim() ? parseFloat(headCirc) : undefined;

    // --- Date validation (no future / pre-birth dates) ---
    if (!date) {
      setFormError('Informe a data da consulta.');
      return;
    }
    const consultDate = new Date(date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(consultDate.getTime()) || consultDate.getTime() > today.getTime()) {
      setFormError('A data da consulta não pode ser no futuro.');
      return;
    }
    if (consultDate.getTime() < new Date(patient.birthDate + 'T00:00:00').getTime()) {
      setFormError('A data da consulta não pode ser anterior ao nascimento.');
      return;
    }

    // --- Absurd / negative value guards ---
    const checks: [string, number | undefined, number][] = [
      ['Peso', w, MAX_WEIGHT],
      ['Estatura', h, MAX_HEIGHT],
      ['Perímetro cefálico', hc, MAX_HEAD],
    ];
    for (const [label, val, max] of checks) {
      if (val !== undefined) {
        if (Number.isNaN(val) || val <= 0) {
          setFormError(`${label} deve ser um valor positivo.`);
          return;
        }
        if (val > max) {
          setFormError(`${label} acima do limite plausível (máx. ${max}).`);
          return;
        }
      }
    }

    // --- Age-based required-measure rule ---
    const ageMonths = getAgeInMonths(date);
    if (ageMonths < 24) {
      if (w === undefined && h === undefined && hc === undefined) {
        setFormError(
          'Para menores de 2 anos, informe ao menos Peso, Estatura ou Perímetro Cefálico.'
        );
        return;
      }
    } else if (w === undefined && h === undefined) {
      setFormError('A partir de 2 anos, informe ao menos o Peso ou a Estatura.');
      return;
    }

    addConsultation(patient.id, { date, weight: w, height: h, headCirc: hc });
    setShowModal(false);
    setFormError('');
    setDate(new Date().toISOString().split('T')[0]);
    setWeight('');
    setHeight('');
    setHeadCirc('');
  };

  const handlePrint = () => window.print();

  const copyAccessCode = async () => {
    try {
      await navigator.clipboard.writeText(patient.accessCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1500);
    } catch { /* ignore */ }
  };

  // ---- Datasets for the four charts ----
  const wfaDs = resolveStandard(standard, 'weight', patient.gender);
  const lhfaDs = resolveStandard(standard, 'height', patient.gender);
  const bmiDs = resolveStandard(standard, 'bmi', patient.gender);
  const hcDs = resolveStandard('who', 'headCirc', patient.gender); // PC always WHO

  const lastConsultation = sortedConsultations[0];
  const EMPTY_Z = { value: null, status: 'unknown', message: '—' } as const;
  const zscores = lastConsultation
    ? calculateAllZScores(
        patient.gender,
        getAgeInMonths(lastConsultation.date),
        lastConsultation.weight,
        lastConsultation.height,
        lastConsultation.headCirc,
        standard
      )
    : null;

  return (
    <div className="flex flex-col min-h-screen pb-12">
      {/* Header */}
      <header className="page-header print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(isParentView ? '/' : '/dashboard')}
            className="btn btn-ghost"
            style={{ padding: '0.5rem', width: 40, height: 40 }}
            title="Voltar"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1
              className="text-xl md:text-2xl font-bold text-dark m-0 flex items-center gap-2"
            >
              <Baby
                size={20}
                style={{ color: isGirl ? '#f472b6' : 'var(--color-primary)' }}
              />
              {patient.name}
            </h1>
            <p className="text-sm text-muted">
              Nascimento:{' '}
              {format(parseISO(patient.birthDate), "dd 'de' MMMM, yyyy", {
                locale: ptBR,
              })}{' '}
              • Responsável: {patient.parentName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn btn-ghost" onClick={handlePrint} title="Imprimir / PDF">
            <Printer size={18} />
            <span className="hidden sm:inline">Imprimir / PDF</span>
          </button>
          {!isParentView && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={18} /> Nova Avaliação
            </button>
          )}
        </div>
      </header>

      {/* Parent view notice */}
      {isParentView && (
        <div
          className="card mb-4 print:hidden"
          style={{
            background: 'rgba(126, 211, 193, 0.18)',
            borderColor: 'rgba(126, 211, 193, 0.4)',
          }}
        >
          <p className="text-sm text-dark flex items-center gap-2">
            <Info size={16} style={{ color: 'var(--color-primary-dark)' }} />
            Você está no modo somente-leitura. Os dados são mantidos atualizados
            pelo profissional de saúde responsável.
          </p>
        </div>
      )}

      {/* Doctor-only: Access code card */}
      {!isParentView && (
        <div
          className="card mb-4 flex items-center justify-between flex-wrap gap-3 print:hidden"
          style={{ background: 'linear-gradient(135deg, rgba(34,182,168,0.08), rgba(126,211,193,0.18))' }}
        >
          <div>
            <p className="text-xs text-muted uppercase tracking-wider font-semibold">
              Código de acesso para os pais
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="access-code" style={{ fontSize: '1.1rem' }}>
                {patient.accessCode}
              </span>
              <button
                className="btn btn-ghost"
                style={{ padding: '0.4rem 0.6rem' }}
                onClick={copyAccessCode}
              >
                {copiedCode ? (
                  <>
                    <Check size={14} style={{ color: '#16a34a' }} /> Copiado
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copiar
                  </>
                )}
              </button>
            </div>
          </div>
          <p className="text-xs text-muted" style={{ maxWidth: 320 }}>
            Compartilhe este código com o(a) responsável para acesso somente-leitura
            ao perfil de desenvolvimento.
          </p>
        </div>
      )}

      {/* Printer/PDF report — hidden on screen, shown only when printing.
          Uses fixed-size charts so Recharts renders real SVG in the PDF. */}
      <PrintReport patient={patient} standard={standard} />

      {/* Tabs */}
      <div className="tabs print:hidden">
        {(
          [
            { key: 'laudo', label: 'Resumo / Laudo' },
            { key: 'grafico', label: 'Gráficos' },
            { key: 'historico', label: 'Histórico' },
          ] as { key: TabKey; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Standard selector (chart standard) */}
      <div
        className="flex items-center justify-between flex-wrap gap-2 mb-4 print:hidden"
      >
        <div className="text-xs text-muted">
          Curvas de referência:{' '}
          <strong className="text-dark">{STANDARD_LABELS[standard]}</strong>
        </div>
        <select
          value={standard}
          onChange={(e) => setStandard(e.target.value as StandardKey)}
          style={{ maxWidth: 260, width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
        >
          {availableStandards().map((s) => (
            <option key={s} value={s}>
              {STANDARD_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {/* ===== Tab content ===== */}
      <div className="flex-1">
        {/* ---- RESUMO / LAUDO ---- */}
        <div
          style={{
            display: activeTab === 'laudo' ? 'block' : 'none',
          }}
          className="print:hidden"
        >
          {!lastConsultation ? (
            <div className="card muted-block">
              <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>Nenhuma avaliação registrada ainda.</p>
              {!isParentView && (
                <button
                  className="btn btn-primary mt-4"
                  onClick={() => setShowModal(true)}
                >
                  <Plus size={16} /> Registrar primeira avaliação
                </button>
              )}
            </div>
          ) : (
            <div className="card">
              <h3 className="text-lg font-bold text-dark mb-4">
                Última Avaliação —{' '}
                {format(parseISO(lastConsultation.date), 'dd/MM/yyyy')}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Idade" value={`${getAgeInMonths(lastConsultation.date)} meses`} />
                <Stat label="Peso" value={lastConsultation.weight ? `${lastConsultation.weight} kg` : '—'} />
                <Stat label="Estatura" value={lastConsultation.height ? `${lastConsultation.height} cm` : '—'} />
                <Stat label="Perímetro cefálico" value={lastConsultation.headCirc ? `${lastConsultation.headCirc} cm` : '—'} />
              </div>

              {/* Z-Scores Table */}
              <div className="mt-8">
                <h4 className="text-base font-semibold text-dark mb-3">
                  Escore-Z e Percentil ({STANDARD_LABELS[standard]})
                </h4>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Indicador</th>
                        <th>Escore-Z</th>
                        <th>Percentil</th>
                        <th>Classificação</th>
                      </tr>
                    </thead>
                    <tbody>
                      <ZRow label="Peso por Idade" result={zscores?.weight ?? EMPTY_Z} />
                      <ZRow label="Estatura por Idade" result={zscores?.height ?? EMPTY_Z} />
                      <ZRow label="IMC por Idade" result={zscores?.bmi ?? EMPTY_Z} />
                      <ZRow label="Perímetro Cefálico" result={zscores?.headCirc ?? EMPTY_Z} />
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted mt-3">
                  Referência: padrão {STANDARD_LABELS[standard]} (ajustado por
                  idade e sexo). Valores entre Z = -2 e Z = +2 são considerados
                  adequados.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ---- GRÁFICOS ---- */}
        <div
          style={{
            display: activeTab === 'grafico' ? 'block' : 'none',
          }}
          className="print:hidden"
        >
          {patient.consultations.length === 0 ? (
            <div className="card muted-block">
              <p>Adicione avaliações para visualizar os gráficos de crescimento.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {wfaDs && (
                <div className="print:break-inside-avoid">
                  <GrowthChart
                    title={wfaDs.title}
                    yAxisLabel={wfaDs.yAxisLabel}
                    referenceData={wfaDs.data}
                    patientData={chartDataWeight}
                    isGirl={isGirl}
                    caption={`Padrão ${STANDARD_LABELS[standard]} • ${patient.gender === 'M' ? 'meninos' : 'meninas'}`}
                  />
                </div>
              )}
              {lhfaDs && (
                <div className="print:break-inside-avoid">
                  <GrowthChart
                    title={lhfaDs.title}
                    yAxisLabel={lhfaDs.yAxisLabel}
                    referenceData={lhfaDs.data}
                    patientData={chartDataHeight}
                    isGirl={isGirl}
                    caption={`Padrão ${STANDARD_LABELS[standard]} • ${patient.gender === 'M' ? 'meninos' : 'meninas'}`}
                  />
                </div>
              )}
              {bmiDs && (
                <div className="print:break-inside-avoid">
                  <GrowthChart
                    title={bmiDs.title}
                    yAxisLabel={bmiDs.yAxisLabel}
                    referenceData={bmiDs.data}
                    patientData={chartDataBMI}
                    isGirl={isGirl}
                    caption={`Padrão ${STANDARD_LABELS[standard]} • ${patient.gender === 'M' ? 'meninos' : 'meninas'}`}
                  />
                </div>
              )}
              {hcDs && (
                <div className="print:break-inside-avoid">
                  <GrowthChart
                    title={hcDs.title}
                    yAxisLabel={hcDs.yAxisLabel}
                    referenceData={hcDs.data}
                    patientData={chartDataHead}
                    isGirl={isGirl}
                    caption="OMS • 0 a 5 anos"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ---- HISTÓRICO ---- */}
        <div
          style={{
            display: activeTab === 'historico' ? 'block' : 'none',
          }}
          className="print:hidden"
        >
          <div className="card">
            <h3 className="text-lg font-bold text-dark mb-4">
              Histórico de Consultas
            </h3>
            {sortedConsultations.length === 0 ? (
              <p className="text-muted text-center py-8">
                Nenhum histórico encontrado.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Idade (meses)</th>
                      <th>Peso (kg)</th>
                      <th>Estatura (cm)</th>
                      <th>PC (cm)</th>
                      <th>IMC</th>
                      {!isParentView && <th style={{ width: 60 }} />}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedConsultations.map((c) => {
                      const bmi =
                        c.weight && c.height
                          ? (c.weight / Math.pow(c.height / 100, 2)).toFixed(1)
                          : '—';
                      return (
                        <tr key={c.id}>
                          <td className="font-medium text-dark">
                            {format(parseISO(c.date), 'dd/MM/yyyy')}
                          </td>
                          <td>{getAgeInMonths(c.date)}</td>
                          <td>{c.weight ?? '—'}</td>
                          <td>{c.height ?? '—'}</td>
                          <td>{c.headCirc ?? '—'}</td>
                          <td>{bmi}</td>
                          {!isParentView && (
                            <td>
                              <button
                                className="btn btn-ghost"
                                style={{
                                  padding: '0.35rem 0.5rem',
                                  background: 'transparent',
                                  color: 'var(--color-accent)',
                                }}
                                title="Excluir avaliação"
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Excluir a avaliação de ${format(
                                        parseISO(c.date),
                                        'dd/MM/yyyy'
                                      )}?`
                                    )
                                  ) {
                                    deleteConsultation(patient.id, c.id);
                                  }
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {patient.consultations.length > 0 && (
            <div className="mt-6">
              <ConsultationTimeline data={buildTimeline(patient)} />
            </div>
          )}
        </div>
      </div>

      {/* Modal: Nova Avaliação */}
      {showModal && (
        <div className="modal-overlay" onClick={closeConsultModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-dark mb-4">Nova Avaliação</h2>
            <form
              onSubmit={handleAddConsultation}
              className="flex flex-col gap-3"
            >
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Data da Consulta</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={patient.birthDate}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Peso (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="150"
                    placeholder="Ex: 8.5"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Estatura (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="200"
                    placeholder="Ex: 72.5"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Perímetro Cefálico (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="Ex: 45.2"
                  value={headCirc}
                  onChange={(e) => setHeadCirc(e.target.value)}
                />
              </div>

              {formError && (
                <p
                  className="text-sm"
                  style={{ color: 'var(--color-accent)', marginTop: '0.25rem' }}
                  role="alert"
                >
                  {formError}
                </p>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-outline flex-1"
                  onClick={closeConsultModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- Helpers ----------

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="stat-block">
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value}</div>
  </div>
);

const ZRow: React.FC<{
  label: string;
  result: { value: number | null; status: string; message: string };
}> = ({ label, result }) => {
  const statusClass =
    result.status === 'normal'
      ? 'status-normal'
      : result.status === 'warning'
      ? 'status-warning'
      : result.status === 'danger'
      ? 'status-danger'
      : 'status-unknown';

  const percentile =
    result.value !== null ? `P${zToPercentile(result.value)}` : '—';

  return (
    <tr>
      <td className="font-medium text-dark">{label}</td>
      <td className="font-bold">{result.value !== null ? result.value : '—'}</td>
      <td>{percentile}</td>
      <td className={`text-sm ${statusClass}`} style={{ fontWeight: 500 }}>
        {result.message}
      </td>
    </tr>
  );
};

export default PatientProfile;
