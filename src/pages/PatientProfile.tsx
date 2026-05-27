import React, { useEffect, useMemo, useState } from 'react';
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
  AlertTriangle,
  CheckCircle,
  XCircle,
  Minus,
  Clock,
  FileText,
  QrCode,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getNextConsultInfo, intervalLabel, getRecommendedIntervalMonths } from '../utils/consultationSchedule';
import { useToast } from '../context/ToastContext';
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

import GrowthChart, { type ChartDisplayMode } from '../components/GrowthChart';
import PrintReport from '../components/PrintReport';

type TabKey = 'laudo' | 'grafico' | 'historico';

const PatientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getPatient, addConsultation, deleteConsultation } = useAppContext();

  const isParentView = searchParams.get('view') === 'parent';
  const patient = id ? getPatient(id) : undefined;

  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabKey>('laudo');
  const [showModal, setShowModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; dateLabel: string } | null>(null);
  const [chartDisplayMode, setChartDisplayMode] = useState<ChartDisplayMode>('zscore');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [headCirc, setHeadCirc] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const ageMonths = patient ? differenceInMonths(new Date(), parseISO(patient.birthDate)) : 0;
  const defaultStandard: StandardKey = patient ? pickDefaultStandard(ageMonths) : 'who';
  const [standard, setStandard] = useState<StandardKey>(defaultStandard);
  const recommendedStandard = pickDefaultStandard(ageMonths);

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h2 className="text-xl">Paciente não encontrado.</h2>
        <button className="btn btn-primary mt-4" onClick={() => navigate(isParentView ? '/' : '/dashboard')}>
          Voltar
        </button>
      </div>
    );
  }

  const isGirl = patient.gender === 'F';

  const sortedConsultations = useMemo(
    () => [...patient.consultations].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [patient.consultations]
  );

  const getAgeInMonths = (targetDate: string) =>
    differenceInMonths(parseISO(targetDate), parseISO(patient.birthDate));

  const chartDataWeight = patient.consultations
    .filter((c) => typeof c.weight === 'number')
    .map((c) => ({ months: getAgeInMonths(c.date), value: c.weight!, date: format(parseISO(c.date), 'dd/MM/yyyy') }));

  const chartDataHeight = patient.consultations
    .filter((c) => typeof c.height === 'number')
    .map((c) => ({ months: getAgeInMonths(c.date), value: c.height!, date: format(parseISO(c.date), 'dd/MM/yyyy') }));

  const chartDataHead = patient.consultations
    .filter((c) => typeof c.headCirc === 'number')
    .map((c) => ({ months: getAgeInMonths(c.date), value: c.headCirc!, date: format(parseISO(c.date), 'dd/MM/yyyy') }));

  const chartDataBMI = patient.consultations
    .filter((c) => typeof c.weight === 'number' && typeof c.height === 'number')
    .map((c) => {
      const h = c.height! / 100;
      return { months: getAgeInMonths(c.date), value: Number((c.weight! / (h * h)).toFixed(2)), date: format(parseISO(c.date), 'dd/MM/yyyy') };
    });

  const MAX_WEIGHT = 150;
  const MAX_HEIGHT = 200;
  const MAX_HEAD = 100;

  const closeConsultModal = () => { setShowModal(false); setFormError(''); setNotes(''); };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmDelete) setConfirmDelete(null);
        else if (showModal) closeConsultModal();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [showModal, confirmDelete]);

  const handleAddConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const w = weight.trim() ? parseFloat(weight) : undefined;
    const h = height.trim() ? parseFloat(height) : undefined;
    const hc = headCirc.trim() ? parseFloat(headCirc) : undefined;

    if (!date) { setFormError('Informe a data da consulta.'); return; }
    const consultDate = new Date(date + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (Number.isNaN(consultDate.getTime()) || consultDate.getTime() > today.getTime()) {
      setFormError('A data da consulta não pode ser no futuro.'); return;
    }
    if (consultDate.getTime() < new Date(patient.birthDate + 'T00:00:00').getTime()) {
      setFormError('A data da consulta não pode ser anterior ao nascimento.'); return;
    }

    const checks: [string, number | undefined, number][] = [
      ['Peso', w, MAX_WEIGHT], ['Estatura', h, MAX_HEIGHT], ['Perímetro cefálico', hc, MAX_HEAD],
    ];
    for (const [label, val, max] of checks) {
      if (val !== undefined) {
        if (Number.isNaN(val) || val <= 0) { setFormError(`${label} deve ser um valor positivo.`); return; }
        if (val > max) { setFormError(`${label} acima do limite plausível (máx. ${max}).`); return; }
      }
    }

    const ageMonths = getAgeInMonths(date);
    if (ageMonths < 24) {
      if (w === undefined && h === undefined && hc === undefined) {
        setFormError('Para menores de 2 anos, informe ao menos Peso, Estatura ou Perímetro Cefálico.'); return;
      }
    } else if (w === undefined && h === undefined) {
      setFormError('A partir de 2 anos, informe ao menos o Peso ou a Estatura.'); return;
    }

    addConsultation(patient.id, { date, weight: w, height: h, headCirc: hc, notes: notes.trim() || undefined });
    setShowModal(false); setFormError('');
    setDate(new Date().toISOString().split('T')[0]);
    setWeight(''); setHeight(''); setHeadCirc(''); setNotes('');
    showToast('Avaliação salva com sucesso!');
  };

  const handlePrint = () => window.print();

  const copyAccessCode = async () => {
    try {
      await navigator.clipboard.writeText(patient.accessCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1500);
      showToast('Código copiado!');
    } catch {
      showToast('Não foi possível copiar o código.', 'error');
    }
  };

  const wfaDs = resolveStandard(standard, 'weight', patient.gender);
  const lhfaDs = resolveStandard(standard, 'height', patient.gender);
  const bmiDs = resolveStandard(standard, 'bmi', patient.gender);
  const hcDs = resolveStandard('who', 'headCirc', patient.gender);

  const lastConsultation = sortedConsultations[0];
  const EMPTY_Z = { value: null, status: 'unknown', message: '—' } as const;
  const zscores = lastConsultation
    ? calculateAllZScores(
        patient.gender, getAgeInMonths(lastConsultation.date),
        lastConsultation.weight, lastConsultation.height, lastConsultation.headCirc, standard
      )
    : null;

  // ------ Shared content ------
  const accessCodeCard = !isParentView && (
    <div
      className="card mb-4 print:hidden"
      style={{ background: 'linear-gradient(135deg, rgba(11,122,110,0.06), rgba(11,122,110,0.12))' }}
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-muted uppercase tracking-wider font-semibold">
            Código de acesso para os pais
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span className="access-code" style={{ fontSize: '1.1rem' }}>{patient.accessCode}</span>
            <button className="btn btn-ghost" style={{ padding: '0.4rem 0.6rem' }} onClick={copyAccessCode}>
              {copiedCode ? <><Check size={14} style={{ color: 'var(--color-normal)' }} /> Copiado</> : <><Copy size={14} /> Copiar</>}
            </button>
            <button
              className="btn btn-ghost"
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
              onClick={() => setShowQR((v) => !v)}
              title={showQR ? 'Ocultar QR Code' : 'Gerar QR Code'}
            >
              <QrCode size={14} /> {showQR ? 'Ocultar QR' : 'QR Code'}
            </button>
          </div>
        </div>
        <p className="text-xs text-muted" style={{ maxWidth: 320 }}>
          Compartilhe este código com o(a) responsável para acesso somente-leitura ao perfil.
        </p>
      </div>
      {showQR && (
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ background: '#ffffff', padding: 8, borderRadius: 8, display: 'inline-flex', flexShrink: 0 }}>
            <QRCodeSVG value={patient.accessCode} size={112} />
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', maxWidth: 220, alignSelf: 'center', lineHeight: 1.5 }}>
            Escaneie o QR Code para ver o código de acesso, ou compartilhe diretamente o código{' '}
            <strong style={{ color: 'var(--color-dark)', letterSpacing: '0.08em' }}>{patient.accessCode}</strong>{' '}
            na tela de acesso do responsável.
          </div>
        </div>
      )}
    </div>
  );

  const tabContent = (
    <>
      {/* Standard selector */}
      <div className="flex items-start justify-between flex-wrap gap-2 mb-4 print:hidden">
        <div>
          <div className="text-xs text-muted">
            Referência ativa: <strong className="text-dark">{STANDARD_LABELS[standard]}</strong>
          </div>
          {standard !== recommendedStandard && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-warning-cl)' }}>
              <AlertTriangle size={11} style={{ display: 'inline', marginRight: 3 }} />
              Recomendado para esta idade: <strong>{STANDARD_LABELS[recommendedStandard]}</strong>
            </p>
          )}
          {standard === recommendedStandard && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-normal)' }}>
              <CheckCircle size={11} style={{ display: 'inline', marginRight: 3 }} />
              Padrão recomendado para esta faixa etária
            </p>
          )}
        </div>
        <select
          value={standard}
          onChange={(e) => setStandard(e.target.value as StandardKey)}
          style={{ maxWidth: 260, width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
        >
          {availableStandards().map((s) => (
            <option key={s} value={s}>{STANDARD_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Laudo */}
      <div style={{ display: activeTab === 'laudo' ? 'block' : 'none' }} className="print:hidden">
        {!lastConsultation ? (
          <div className="card muted-block">
            <Calendar size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <p>Nenhuma avaliação registrada ainda.</p>
            {!isParentView && (
              <button className="btn btn-primary mt-4" onClick={() => setShowModal(true)}>
                <Plus size={16} /> Registrar primeira avaliação
              </button>
            )}
          </div>
        ) : (
          <div className="card">
            <h3 className="text-lg font-bold text-dark mb-4">
              Última Avaliação — {format(parseISO(lastConsultation.date), 'dd/MM/yyyy')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat label="Idade" value={`${getAgeInMonths(lastConsultation.date)} meses`} />
              <Stat label="Peso" value={lastConsultation.weight ? `${lastConsultation.weight} kg` : '—'} />
              <Stat label="Estatura" value={lastConsultation.height ? `${lastConsultation.height} cm` : '—'} />
              <Stat label="Perímetro cefálico" value={lastConsultation.headCirc ? `${lastConsultation.headCirc} cm` : '—'} />
            </div>
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
                Referência: padrão {STANDARD_LABELS[standard]}. Valores entre Z = -2 e Z = +2 são considerados adequados.
              </p>
            </div>

            {/* Próxima Consulta Recomendada */}
            {(() => {
              const nextInfo = getNextConsultInfo(lastConsultation.date, patient.birthDate);
              const intervalM = getRecommendedIntervalMonths(getAgeInMonths(lastConsultation.date));
              return (
                <div className={`next-consult-card ${nextInfo.urgency}`} style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={15} />
                    <span className="next-consult-card-title">Próxima Consulta Recomendada</span>
                  </div>
                  <div className="next-consult-card-body">
                    <div>
                      <span className="next-consult-card-date">
                        {nextInfo.dueDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="next-consult-card-label"> · {nextInfo.label}</span>
                    </div>
                    <span className="next-consult-card-interval">
                      Frequência: {intervalLabel(intervalM)}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Gráficos */}
      <div style={{ display: activeTab === 'grafico' ? 'block' : 'none' }} className="print:hidden">
        {patient.consultations.length === 0 ? (
          <div className="card muted-block">
            <p>Adicione avaliações para visualizar os gráficos de crescimento.</p>
          </div>
        ) : (
          <>
            {/* Display mode toggle */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-muted font-semibold uppercase tracking-wider">Exibir curvas em:</span>
              <div style={{ display: 'flex', background: 'var(--color-gray-100)', borderRadius: 8, padding: 3, gap: 2, border: '1px solid var(--color-gray-200)' }}>
                <button
                  onClick={() => setChartDisplayMode('zscore')}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: 6,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: chartDisplayMode === 'zscore' ? 'var(--color-primary)' : 'transparent',
                    color: chartDisplayMode === 'zscore' ? '#fff' : 'var(--color-text-muted)',
                  }}
                >
                  Escore-Z
                </button>
                <button
                  onClick={() => setChartDisplayMode('percentile')}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: 6,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: chartDisplayMode === 'percentile' ? 'var(--color-primary)' : 'transparent',
                    color: chartDisplayMode === 'percentile' ? '#fff' : 'var(--color-text-muted)',
                  }}
                >
                  Percentil
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {wfaDs && <div className="print:break-inside-avoid"><GrowthChart title={wfaDs.title} yAxisLabel={wfaDs.yAxisLabel} referenceData={wfaDs.data} patientData={chartDataWeight} isGirl={isGirl} caption={`Padrão ${STANDARD_LABELS[standard]} • ${patient.gender === 'M' ? 'meninos' : 'meninas'}`} displayMode={chartDisplayMode} /></div>}
              {lhfaDs && <div className="print:break-inside-avoid"><GrowthChart title={lhfaDs.title} yAxisLabel={lhfaDs.yAxisLabel} referenceData={lhfaDs.data} patientData={chartDataHeight} isGirl={isGirl} caption={`Padrão ${STANDARD_LABELS[standard]} • ${patient.gender === 'M' ? 'meninos' : 'meninas'}`} displayMode={chartDisplayMode} /></div>}
              {bmiDs && <div className="print:break-inside-avoid"><GrowthChart title={bmiDs.title} yAxisLabel={bmiDs.yAxisLabel} referenceData={bmiDs.data} patientData={chartDataBMI} isGirl={isGirl} caption={`Padrão ${STANDARD_LABELS[standard]} • ${patient.gender === 'M' ? 'meninos' : 'meninas'}`} displayMode={chartDisplayMode} /></div>}
              {hcDs && <div className="print:break-inside-avoid"><GrowthChart title={hcDs.title} yAxisLabel={hcDs.yAxisLabel} referenceData={hcDs.data} patientData={chartDataHead} isGirl={isGirl} caption="OMS • 0 a 5 anos" displayMode={chartDisplayMode} /></div>}
            </div>
          </>
        )}
      </div>

      {/* Histórico */}
      <div style={{ display: activeTab === 'historico' ? 'block' : 'none' }} className="print:hidden">
        <div className="card">
          <h3 className="text-lg font-bold text-dark mb-4">Histórico de Consultas</h3>
          {sortedConsultations.length === 0 ? (
            <p className="text-muted text-center py-8">Nenhum histórico encontrado.</p>
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
                    <th>Observações</th>
                    {!isParentView && <th style={{ width: 48 }} />}
                  </tr>
                </thead>
                <tbody>
                  {sortedConsultations.map((c) => {
                    const bmi = c.weight && c.height ? (c.weight / Math.pow(c.height / 100, 2)).toFixed(1) : '—';
                    return (
                      <tr key={c.id}>
                        <td className="font-medium text-dark">{format(parseISO(c.date), 'dd/MM/yyyy')}</td>
                        <td>{getAgeInMonths(c.date)}</td>
                        <td>{c.weight ?? '—'}</td>
                        <td>{c.height ?? '—'}</td>
                        <td>{c.headCirc ?? '—'}</td>
                        <td>{bmi}</td>
                        <td style={{ maxWidth: 200 }}>
                          {c.notes ? (
                            <span
                              title={c.notes}
                              style={{ display: 'block', fontSize: 12, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            >
                              <FileText size={11} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />
                              {c.notes}
                            </span>
                          ) : (
                            <span style={{ opacity: 0.3, fontSize: 12 }}>—</span>
                          )}
                        </td>
                        {!isParentView && (
                          <td>
                            <button
                              className="btn btn-ghost"
                              style={{ padding: '0.35rem 0.5rem', background: 'transparent', color: 'var(--color-danger-cl)' }}
                              title="Excluir avaliação"
                              onClick={() => setConfirmDelete({ id: c.id, dateLabel: format(parseISO(c.date), 'dd/MM/yyyy') })}
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
      </div>
    </>
  );

  const modals = (
    <>
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-card" style={{ maxWidth: '24rem' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--color-danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-danger-cl)', flexShrink: 0 }}>
                <AlertTriangle size={18} />
              </div>
              <h2 className="text-lg font-bold text-dark m-0">Excluir avaliação</h2>
            </div>
            <p className="text-sm text-muted mb-4">
              Excluir a avaliação de <strong>{confirmDelete.dateLabel}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2">
              <button className="btn btn-outline flex-1" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn btn-danger flex-1" onClick={() => { deleteConsultation(patient.id, confirmDelete.id); setConfirmDelete(null); showToast('Avaliação excluída.', 'info'); }}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeConsultModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-dark mb-4">Nova Avaliação</h2>
            <form onSubmit={handleAddConsultation} className="flex flex-col gap-3">
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Data da Consulta</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={patient.birthDate} max={new Date().toISOString().split('T')[0]} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Peso (kg)</label>
                  <input type="number" step="0.01" min="0" max="150" placeholder="Ex: 8.5" value={weight} onChange={(e) => setWeight(e.target.value)} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Estatura (cm)</label>
                  <input type="number" step="0.1" min="0" max="200" placeholder="Ex: 72.5" value={height} onChange={(e) => setHeight(e.target.value)} />
                </div>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Perímetro Cefálico (cm)</label>
                <input type="number" step="0.1" min="0" max="100" placeholder="Ex: 45.2" value={headCirc} onChange={(e) => setHeadCirc(e.target.value)} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <FileText size={13} /> Observações clínicas <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(opcional)</span>
                </label>
                <textarea
                  placeholder="Ex: Aleitamento materno exclusivo, sem intercorrências..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  style={{ resize: 'vertical', minHeight: 60, fontFamily: 'inherit', fontSize: '0.875rem' }}
                />
              </div>
              {formError && <p className="text-sm" style={{ color: 'var(--color-danger-cl)' }} role="alert">{formError}</p>}
              <div className="flex gap-2 mt-4">
                <button type="button" className="btn btn-outline flex-1" onClick={closeConsultModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary flex-1">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );

  // ------ Parent view layout ------
  if (isParentView) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="page-header print:hidden">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="btn btn-ghost" style={{ padding: '0.5rem', width: 40, height: 40 }} title="Voltar">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-dark m-0 flex items-center gap-2">
                <Baby size={18} style={{ color: isGirl ? '#c9707a' : 'var(--color-primary)' }} />
                {patient.name}
              </h1>
              <p className="text-sm text-muted">
                {format(parseISO(patient.birthDate), "dd 'de' MMMM, yyyy", { locale: ptBR })} · {patient.parentName}
              </p>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={handlePrint} title="Imprimir">
            <Printer size={18} />
          </button>
        </header>

        <div style={{ padding: '0 1.5rem 3rem', maxWidth: 900, width: '100%', margin: '0 auto' }}>
          <div className="card mb-4 print:hidden" style={{ background: 'rgba(11,122,110,0.06)', borderColor: 'rgba(11,122,110,0.2)' }}>
            <p className="text-sm text-dark flex items-center gap-2 mb-3">
              <Info size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              Você está no modo somente-leitura. Os dados são mantidos atualizados pelo profissional responsável.
            </p>
            <div className="text-xs text-muted font-semibold uppercase tracking-wider mb-2">Entendendo os resultados:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="status-legend-chip" style={{ background: 'var(--color-normal-bg)', color: 'var(--color-normal)' }}>
                  <CheckCircle size={11} /> Normal
                </span>
                <span className="text-xs text-muted">Medida dentro do esperado para a idade</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="status-legend-chip" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning-cl)' }}>
                  <AlertTriangle size={11} /> Atenção
                </span>
                <span className="text-xs text-muted">Medida um pouco abaixo ou acima do esperado — acompanhar</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="status-legend-chip" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger-cl)' }}>
                  <XCircle size={11} /> Risco
                </span>
                <span className="text-xs text-muted">Medida significativamente fora do padrão — consulte o profissional</span>
              </div>
            </div>
          </div>

          <PrintReport patient={patient} standard={standard} />

          <div className="tabs print:hidden">
            {(['laudo', 'grafico', 'historico'] as TabKey[]).map((key) => (
              <button key={key} className={`tab-btn ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>
                {key === 'laudo' ? 'Resumo' : key === 'grafico' ? 'Gráficos' : 'Histórico'}
              </button>
            ))}
          </div>

          {tabContent}
        </div>

        {modals}
      </div>
    );
  }

  // ------ Doctor view layout (inside AppShell) ------
  return (
    <>
      <div className="shell-topbar print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-ghost"
            style={{ padding: '0.4rem', width: 34, height: 34 }}
            title="Voltar"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="shell-topbar-title" style={{ fontSize: 14, gap: 6 }}>
              <Baby size={15} style={{ color: isGirl ? '#c9707a' : 'var(--color-primary)' }} />
              {patient.name}
            </div>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)', marginTop: 1 }}>
              {format(parseISO(patient.birthDate), "dd 'de' MMMM, yyyy", { locale: ptBR })} · {patient.parentName}
            </p>
          </div>
        </div>
        <div className="shell-topbar-right">
          <button className="btn btn-ghost" onClick={handlePrint} title="Imprimir / PDF">
            <Printer size={15} />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Nova Avaliação
          </button>
        </div>
      </div>

      <div className="shell-content-inner" style={{ paddingBottom: 48 }}>
        {accessCodeCard}

        <PrintReport patient={patient} standard={standard} />

        <div className="tabs print:hidden" style={{ marginBottom: '1rem' }}>
          {([
            { key: 'laudo', label: 'Resumo / Laudo' },
            { key: 'grafico', label: 'Gráficos' },
            { key: 'historico', label: 'Histórico' },
          ] as { key: TabKey; label: string }[]).map((t) => (
            <button key={t.key} className={`tab-btn ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {tabContent}
      </div>

      {modals}
    </>
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
    result.status === 'normal' ? 'status-normal'
    : result.status === 'warning' ? 'status-warning'
    : result.status === 'danger' ? 'status-danger'
    : 'status-unknown';

  const StatusIcon =
    result.status === 'normal' ? CheckCircle
    : result.status === 'warning' ? AlertTriangle
    : result.status === 'danger' ? XCircle
    : Minus;

  const percentile = result.value !== null ? `P${zToPercentile(result.value)}` : '—';

  return (
    <tr>
      <td className="font-medium text-dark">{label}</td>
      <td className="font-bold">{result.value !== null ? result.value : '—'}</td>
      <td>{percentile}</td>
      <td className={`text-sm ${statusClass}`} style={{ fontWeight: 500 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <StatusIcon size={13} />
          {result.message}
        </span>
      </td>
    </tr>
  );
};

export default PatientProfile;
