import React, { useState, useCallback } from 'react';
import {
  ArrowLeft, ArrowRight, Baby, Brain, AlertTriangle, Heart,
  ChevronRight, CheckCircle, XCircle, BarChart2, BookOpen, Save, Users, Info, Bone
} from 'lucide-react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceDot, Label
} from 'recharts';

import GrowthChart, { type ChartDisplayMode } from '../components/GrowthChart';
import { useTheme } from '../context/ThemeContext';
import { useAppContext } from '../context/AppContext';
import { resolveStandard } from '../utils/curveStandards';
import type { PatientType, CurveKey, Gender, Indicator, GeneratorResult, IndicatorResult } from '../types/curveGenerator';
import { INDICATOR_LABELS, INDICATOR_UNITS } from '../types/curveGenerator';
import {
  getCurvesForPatientType, getCurveDefinition, calculateResults,
  getPercentileChartData, getFentonChartData,
} from '../utils/generatorCurves';
import type { CurveDefinition } from '../types/curveGenerator';

// ============================================================
// Step 1 – Patient Type Selection
// ============================================================

const PATIENT_TYPES: { key: PatientType; label: string; sub: string; icon: React.ReactNode; color: string }[] = [
  {
    key: 'normal',
    label: 'Paciente sem comorbidades',
    sub: 'Curvas OMS — Score Z',
    icon: <Baby size={28} />,
    color: '#22B6A8',
  },
  {
    key: 'down',
    label: 'Síndrome de Down',
    sub: 'Curvas Brasileiras — Percentil',
    icon: <Heart size={28} />,
    color: '#7C3AED',
  },
  {
    key: 'premature',
    label: 'Prematuro',
    sub: 'Fenton 2013 / Intergrowth-21',
    icon: <Brain size={28} />,
    color: '#0EA5E9',
  },
  {
    key: 'turner',
    label: 'Síndrome de Turner',
    sub: 'Curvas específicas — Percentil',
    icon: <AlertTriangle size={28} />,
    color: '#F59E0B',
  },
  {
    key: 'williams',
    label: 'Síndrome de Williams-Beuren',
    sub: 'Curvas específicas — Percentil',
    icon: <Heart size={28} />,
    color: '#EC4899',
  },
  {
    key: 'achondro',
    label: 'Acondroplasia',
    sub: 'Curvas Clarity/Horton — Percentil',
    icon: <Bone size={28} />,
    color: '#8B5CF6',
  },
];

function PatientTypeStep({ onSelect }: { onSelect: (t: PatientType) => void }) {
  return (
    <div className="gen-step">
      <div className="gen-step-header">
        <h2 className="gen-step-title">Selecione o Perfil Clínico do Paciente</h2>
        <p className="gen-step-sub">Esta seleção determina quais curvas e métricas estarão disponíveis.</p>
      </div>
      <div className="gen-type-grid">
        {PATIENT_TYPES.map((t) => (
          <button
            key={t.key}
            className="gen-type-card"
            style={{ '--card-color': t.color } as React.CSSProperties}
            onClick={() => onSelect(t.key)}
          >
            <div className="gen-type-icon" style={{ background: `${t.color}18`, color: t.color }}>
              {t.icon}
            </div>
            <div className="gen-type-info">
              <span className="gen-type-label">{t.label}</span>
              <span className="gen-type-sub">{t.sub}</span>
            </div>
            <ChevronRight size={20} className="gen-type-arrow" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Step 2 – Curve Selection
// ============================================================

function CurveSelectionStep({
  patientType,
  onSelect,
  onBack,
}: {
  patientType: PatientType;
  onSelect: (c: CurveDefinition) => void;
  onBack: () => void;
}) {
  const curves = getCurvesForPatientType(patientType);
  const typeLabel = PATIENT_TYPES.find((t) => t.key === patientType)?.label ?? '';

  return (
    <div className="gen-step">
      <div className="gen-step-header">
        <button className="gen-back-btn" onClick={onBack} aria-label="Voltar ao passo anterior">
          <ArrowLeft size={16} /> Voltar
        </button>
        <h2 className="gen-step-title">Selecione a Curva de Crescimento</h2>
        <p className="gen-step-sub">Perfil: <strong>{typeLabel}</strong></p>
      </div>
      <div className="gen-curve-list">
        {curves.map((c) => (
          <div key={c.key} className="gen-curve-card" onClick={() => onSelect(c)}>
            <div className="gen-curve-header">
              <span className="gen-curve-name">{c.name}</span>
              <span className={`gen-output-badge ${c.outputMode}`}>
                {c.outputMode === 'zscore' ? 'Score Z' : 'Percentil'}
              </span>
            </div>
            <p className="gen-curve-desc">{c.description}</p>
            <div className="gen-curve-when">
              <Info size={13} />
              <span>{c.whenToUse}</span>
            </div>
            <div className="gen-curve-meta">
              <span>Faixa etária: {formatAgeRange(c)}</span>
              <span>Sexo: {c.availableGenders.join(', ')}</span>
            </div>
            <button className="btn btn-primary gen-curve-btn">
              Usar esta curva <ArrowRight size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatAgeRange(c: CurveDefinition): string {
  if (c.ageUnit === 'weeks_ga') {
    return `${c.ageRange[0]}–${c.ageRange[1]} semanas`;
  }
  const [minM, maxM] = c.ageRange;
  const toLabel = (m: number) => m >= 24 ? `${Math.round(m / 12)} anos` : `${m} meses`;
  return `${toLabel(minM)}–${toLabel(maxM)}`;
}

// ============================================================
// Step 3 – Data Entry Form
// ============================================================

interface FormState {
  gender: Gender | '';
  ageYears: string;
  ageMonths: string;
  gestationalWeeks: string;
  weight: string;
  height: string;
  headCirc: string;
}

function DataEntryStep({
  curve,
  onSubmit,
  onBack,
}: {
  curve: CurveDefinition;
  onSubmit: (form: FormState, ageMonths: number, gestWeeks?: number) => void;
  onBack: () => void;
}) {
  const [form, setForm] = useState<FormState>({
    gender: curve.availableGenders.length === 1 ? curve.availableGenders[0] : '',
    ageYears: '',
    ageMonths: '',
    gestationalWeeks: '',
    weight: '',
    height: '',
    headCirc: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isPremature = curve.ageUnit === 'weeks_ga';

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!form.gender) errs.gender = 'Selecione o sexo';

    const years = parseInt(form.ageYears || '0', 10);
    const months = parseInt(form.ageMonths || '0', 10);

    if (isPremature) {
      const gw = parseFloat(form.gestationalWeeks);
      if (!form.gestationalWeeks || isNaN(gw)) {
        errs.gestationalWeeks = 'Informe a idade gestacional';
      } else if (gw < curve.ageRange[0] || gw > curve.ageRange[1]) {
        errs.gestationalWeeks = `Faixa aceita: ${curve.ageRange[0]}–${curve.ageRange[1]} semanas`;
      }
    } else {
      const totalMonths = years * 12 + months;
      if (totalMonths < curve.ageRange[0] || totalMonths > curve.ageRange[1]) {
        errs.age = `Faixa etária aceita: ${formatAgeRange(curve)}`;
      }
    }

    if (form.weight) {
      const w = parseFloat(form.weight);
      if (isNaN(w) || w <= 0 || w > 300) errs.weight = 'Peso inválido (0–300 kg)';
    }
    if (form.height) {
      const h = parseFloat(form.height);
      if (isNaN(h) || h <= 0 || h > 250) errs.height = 'Estatura inválida (0–250 cm)';
    }
    if (form.headCirc) {
      const hc = parseFloat(form.headCirc);
      if (isNaN(hc) || hc <= 0 || hc > 80) errs.headCirc = 'Perímetro cefálico inválido (0–80 cm)';
    }

    const hasAnyMeasurement = form.weight || form.height || form.headCirc;
    if (!hasAnyMeasurement) errs.measurement = 'Informe ao menos uma medida';

    // Validate against curve's available indicators
    if (curve.key === 'turner' && !form.height) errs.height = 'A curva de Turner requer a estatura';
    if (curve.key === 'williams' && !form.height) errs.height = 'A curva de Williams-Beuren requer a estatura';
    if (curve.key === 'achondro' && !form.height) errs.height = 'A curva de Acondroplasia requer a estatura';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const years = parseInt(form.ageYears || '0', 10);
    const months = parseInt(form.ageMonths || '0', 10);
    const ageMonths = isPremature ? 0 : years * 12 + months;
    const gestWeeks = isPremature ? parseFloat(form.gestationalWeeks) : undefined;
    onSubmit(form, ageMonths, gestWeeks);
  };

  const showIndicator = (ind: Indicator) => curve.availableIndicators.includes(ind);

  return (
    <div className="gen-step">
      <div className="gen-step-header">
        <button className="gen-back-btn" onClick={onBack} aria-label="Voltar ao passo anterior">
          <ArrowLeft size={16} /> Voltar
        </button>
        <h2 className="gen-step-title">Inserir Dados Antropométricos</h2>
        <div className="gen-curve-badge">
          <BarChart2 size={14} />
          {curve.name}
          <span className={`gen-output-badge ${curve.outputMode}`}>
            {curve.outputMode === 'zscore' ? 'Score Z' : 'Percentil'}
          </span>
        </div>
      </div>

      <form className="gen-form" onSubmit={handleSubmit}>
        <div className="gen-form-section">
          <h3 className="gen-section-title">Identificação</h3>
          <div className="gen-form-row">
            <div className="gen-field">
              <label>Sexo <span className="required">*</span></label>
              <select value={form.gender} onChange={set('gender')} disabled={curve.availableGenders.length === 1}>
                <option value="">Selecione</option>
                {curve.availableGenders.map((g) => (
                  <option key={g} value={g}>{g === 'M' ? 'Masculino' : 'Feminino'}</option>
                ))}
              </select>
              {errors.gender && <span className="field-error">{errors.gender}</span>}
            </div>
          </div>
        </div>

        <div className="gen-form-section">
          <h3 className="gen-section-title">Idade</h3>
          {isPremature ? (
            <div className="gen-form-row">
              <div className="gen-field">
                <label>Idade Gestacional / PMA (semanas) <span className="required">*</span></label>
                <input
                  type="number"
                  placeholder={`${curve.ageRange[0]}–${curve.ageRange[1]}`}
                  value={form.gestationalWeeks}
                  onChange={set('gestationalWeeks')}
                  min={curve.ageRange[0]}
                  max={curve.ageRange[1]}
                  step="0.5"
                />
                {errors.gestationalWeeks && <span className="field-error">{errors.gestationalWeeks}</span>}
                <span className="field-hint">Para prematuros, use a idade pós-menstrual (IG ao nascer + semanas de vida)</span>
              </div>
            </div>
          ) : (
            <div className="gen-form-row two-col">
              <div className="gen-field">
                <label>Anos</label>
                <input type="number" placeholder="0" value={form.ageYears} onChange={set('ageYears')} min="0" max="19" />
              </div>
              <div className="gen-field">
                <label>Meses</label>
                <input type="number" placeholder="0" value={form.ageMonths} onChange={set('ageMonths')} min="0" max="11" />
              </div>
            </div>
          )}
          {errors.age && <span className="field-error">{errors.age}</span>}
        </div>

        <div className="gen-form-section">
          <h3 className="gen-section-title">Medidas Antropométricas</h3>
          <p className="gen-section-hint">Informe ao menos uma medida</p>
          <div className="gen-form-row two-col">
            {showIndicator('weight') && (
              <div className="gen-field">
                <label>Peso (kg)</label>
                <input type="number" placeholder="ex: 10.5" value={form.weight} onChange={set('weight')} min="0.1" max="300" step="0.01" />
                {errors.weight && <span className="field-error">{errors.weight}</span>}
              </div>
            )}
            {showIndicator('height') && (
              <div className="gen-field">
                <label>{isPremature ? 'Comprimento (cm)' : 'Estatura/Comprimento (cm)'}</label>
                <input type="number" placeholder="ex: 75.0" value={form.height} onChange={set('height')} min="10" max="250" step="0.1" />
                {errors.height && <span className="field-error">{errors.height}</span>}
              </div>
            )}
          </div>
          {showIndicator('headCirc') && (
            <div className="gen-form-row">
              <div className="gen-field">
                <label>Perímetro Cefálico (cm)</label>
                <input type="number" placeholder="ex: 45.0" value={form.headCirc} onChange={set('headCirc')} min="10" max="80" step="0.1" />
                {errors.headCirc && <span className="field-error">{errors.headCirc}</span>}
              </div>
            </div>
          )}
          {errors.measurement && <span className="field-error">{errors.measurement}</span>}
        </div>

        <div className="gen-form-actions">
          <button type="submit" className="btn btn-primary gen-submit-btn">
            Calcular e Gerar Curva <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================
// Step 4 – Results
// ============================================================

const STATUS_CONFIG = {
  normal:  { color: '#22c55e', bg: '#f0fdf4', border: '#86efac', label: 'Normal' },
  warning: { color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d', label: 'Atenção' },
  danger:  { color: '#ef4444', bg: '#fef2f2', border: '#fca5a5', label: 'Alerta' },
};

function ResultsStep({
  result,
  onRestart,
  onBack,
}: {
  result: GeneratorResult;
  onRestart: () => void;
  onBack: () => void;
}) {
  const { patients, addConsultation, addPatientWithConsultation } = useAppContext();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveMode, setSaveMode] = useState<'existing' | 'new'>('existing');
  const [saveDate, setSaveDate] = useState(new Date().toISOString().split('T')[0]);
  const [saveDone, setSaveDone] = useState(false);
  const [chartDisplayMode, setChartDisplayMode] = useState<ChartDisplayMode>('zscore');

  // Existing patient mode
  const [savePatientId, setSavePatientId] = useState('');

  // New patient mode
  const [newName, setNewName] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('');
  const [newGender, setNewGender] = useState<'M' | 'F'>(result.gender);
  const [newParentName, setNewParentName] = useState('');
  const [newFormError, setNewFormError] = useState('');

  // Shared: clinical notes
  const [saveNotes, setSaveNotes] = useState('');

  const curveDef = getCurveDefinition(result.curveKey);
  // Curves with outputMode 'zscore' support both display modes; percentile-only curves don't have Z-Score data
  const supportsZScore = curveDef?.outputMode === 'zscore';

  const worstStatus = result.indicators.reduce<'normal' | 'warning' | 'danger'>((worst, r) => {
    if (r.status === 'danger') return 'danger';
    if (r.status === 'warning' && worst === 'normal') return 'warning';
    return worst;
  }, 'normal');

  const age = result.gestationalAgeWeeks
    ? `${result.gestationalAgeWeeks} semanas (IG/PMA)`
    : formatAgeMonths(result.ageMonths);

  const activePatientsForSelect = patients.filter((p) => (p.status ?? 'active') === 'active');

  const consultationPayload = () => {
    const w = result.indicators.find((i) => i.indicator === 'weight')?.value;
    const h = result.indicators.find((i) => i.indicator === 'height')?.value;
    const hc = result.indicators.find((i) => i.indicator === 'headCirc')?.value;
    return { date: saveDate, weight: w, height: h, headCirc: hc, notes: saveNotes.trim() || undefined };
  };

  const handleSaveExisting = () => {
    if (!savePatientId) return;
    addConsultation(savePatientId, consultationPayload());
    setSaveDone(true);
    setShowSaveModal(false);
  };

  const handleSaveNew = () => {
    setNewFormError('');
    if (!newName.trim()) { setNewFormError('Informe o nome da criança.'); return; }
    if (!newBirthDate) { setNewFormError('Informe a data de nascimento.'); return; }
    const birth = new Date(newBirthDate + 'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    if (birth > today) { setNewFormError('Data de nascimento não pode ser no futuro.'); return; }
    const maxAge = new Date(); maxAge.setFullYear(maxAge.getFullYear() - 19);
    if (birth < maxAge) { setNewFormError('Idade máxima suportada: 19 anos.'); return; }
    if (!newParentName.trim()) { setNewFormError('Informe o nome do responsável.'); return; }
    addPatientWithConsultation(
      { name: newName.trim(), birthDate: newBirthDate, gender: newGender, parentName: newParentName.trim() },
      consultationPayload()
    );
    setSaveDone(true);
    setShowSaveModal(false);
  };

  const computeBirthDate = (): string => {
    const base = new Date(saveDate + 'T00:00:00');
    if (result.gestationalAgeWeeks !== undefined) {
      base.setDate(base.getDate() - Math.round(result.gestationalAgeWeeks * 7));
    } else {
      base.setMonth(base.getMonth() - result.ageMonths);
    }
    return base.toISOString().split('T')[0];
  };

  const openModal = () => {
    setSaveMode('existing');
    setSavePatientId('');
    setNewName(''); setNewBirthDate(computeBirthDate()); setNewGender(result.gender); setNewParentName(''); setNewFormError('');
    setSaveNotes('');
    setShowSaveModal(true);
  };

  return (
    <div className="gen-step">
      <div className="gen-step-header">
        <button className="gen-back-btn" onClick={onBack}>
          <ArrowLeft size={16} /> Corrigir dados
        </button>
        <h2 className="gen-step-title">Resultado — Curva de Crescimento</h2>
      </div>

      {/* Summary header */}
      <div className={`gen-result-summary ${worstStatus}`}>
        <div className="gen-result-meta">
          <span><strong>Curva:</strong> {result.curveName}</span>
          <span><strong>Sexo:</strong> {result.gender === 'M' ? 'Masculino' : 'Feminino'}</span>
          <span><strong>Idade:</strong> {age}</span>
          <span><strong>Saída:</strong> {curveDef?.outputMode === 'zscore' ? 'Escore Z (OMS)' : 'Percentil'}</span>
        </div>
        <div className={`gen-result-status-badge ${worstStatus}`}>
          {worstStatus === 'normal'  && <CheckCircle size={18} />}
          {worstStatus === 'warning' && <AlertTriangle size={18} />}
          {worstStatus === 'danger'  && <AlertTriangle size={18} />}
          {STATUS_CONFIG[worstStatus].label}
        </div>
      </div>

      {saveDone && (
        <div className="gen-save-success">
          <CheckCircle size={16} /> Avaliação salva com sucesso no perfil do paciente.
        </div>
      )}

      {/* Chart display mode toggle */}
      <div className="flex items-center gap-2 mb-2" style={{ flexWrap: 'wrap' }}>
        <span className="text-xs text-muted font-semibold uppercase tracking-wider">Exibir curvas em:</span>
        <div style={{ display: 'flex', background: 'var(--color-gray-100)', borderRadius: 8, padding: 3, gap: 2, border: '1px solid var(--color-gray-200)' }}>
          <button
            onClick={() => supportsZScore && setChartDisplayMode('zscore')}
            title={!supportsZScore ? 'Escore-Z não disponível para esta curva de referência' : undefined}
            style={{
              padding: '0.3rem 0.75rem',
              borderRadius: 6,
              fontSize: '0.8rem',
              fontWeight: 600,
              border: 'none',
              cursor: supportsZScore ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
              background: chartDisplayMode === 'zscore' && supportsZScore ? 'var(--color-primary)' : 'transparent',
              color: !supportsZScore
                ? 'var(--color-text-muted)'
                : chartDisplayMode === 'zscore' ? '#fff' : 'var(--color-text-muted)',
              opacity: !supportsZScore ? 0.45 : 1,
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
              background: chartDisplayMode === 'percentile' || !supportsZScore ? 'var(--color-primary)' : 'transparent',
              color: chartDisplayMode === 'percentile' || !supportsZScore ? '#fff' : 'var(--color-text-muted)',
            }}
          >
            Percentil
          </button>
        </div>
        {!supportsZScore && (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-warning-cl)', display: 'flex', alignItems: 'center', gap: 4 }}>
            Escore-Z não disponível para esta curva de referência
          </span>
        )}
      </div>

      {/* Stacked indicator cards — each with chart + info */}
      <div className="flex flex-col gap-6" style={{ marginBottom: '1.5rem' }}>
        {result.indicators.map((indicResult) => (
          <IndicatorCard
            key={indicResult.indicator}
            indicResult={indicResult}
            result={result}
            curveDef={curveDef}
            displayMode={!supportsZScore ? 'percentile' : chartDisplayMode}
          />
        ))}
      </div>

      {/* Clinical notes */}
      {result.indicators.some((r) => r.clinicalNote) && (
        <div className="gen-clinical-notes">
          <h3>Notas Clínicas</h3>
          {result.indicators.filter((r) => r.clinicalNote).map((r) => (
            <div key={r.indicator} className={`clinical-note ${r.status}`}>
              <strong>{r.label}:</strong> {r.clinicalNote}
            </div>
          ))}
        </div>
      )}

      {/* Reference */}
      <div className="gen-reference">
        <BookOpen size={15} />
        <div>
          <strong>Referência bibliográfica:</strong><br />
          {result.reference}
        </div>
      </div>

      <div className="gen-result-actions">
        <button className="btn btn-outline" onClick={onBack}>Corrigir dados</button>
        {!saveDone && (
          <button className="btn btn-secondary" onClick={openModal}>
            <Save size={16} /> Salvar Paciente
          </button>
        )}
        <button className="btn btn-ghost" onClick={() => window.print()}>Imprimir</button>
        <button className="btn btn-primary" onClick={onRestart}>Nova Consulta</button>
      </div>

      {/* Save modal */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal-card" style={{ maxWidth: '30rem' }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(34,182,168,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', flexShrink: 0 }}>
                <Users size={20} />
              </div>
              <h2 className="text-lg font-bold text-dark m-0">Salvar como Avaliação</h2>
            </div>

            {/* Mode toggle */}
            <div className="save-mode-tabs">
              <button
                className={`save-mode-tab ${saveMode === 'existing' ? 'active' : ''}`}
                onClick={() => { setSaveMode('existing'); setNewFormError(''); }}
              >
                Paciente existente
              </button>
              <button
                className={`save-mode-tab ${saveMode === 'new' ? 'active' : ''}`}
                onClick={() => { setSaveMode('new'); setNewFormError(''); }}
              >
                Novo paciente
              </button>
            </div>

            {/* Shared: consultation date */}
            <div className="input-group" style={{ marginBottom: '0.75rem' }}>
              <label>Data da consulta</label>
              <input
                type="date"
                value={saveDate}
                onChange={(e) => setSaveDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Shared: clinical notes */}
            <div className="input-group" style={{ marginBottom: '0.75rem' }}>
              <label>Observações clínicas <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '0.8em' }}>(opcional)</span></label>
              <textarea
                placeholder="Ex: sem intercorrências, aleitamento materno exclusivo..."
                value={saveNotes}
                onChange={(e) => setSaveNotes(e.target.value)}
                rows={2}
                style={{ resize: 'vertical', minHeight: 56, fontFamily: 'inherit', fontSize: '0.875rem' }}
              />
            </div>

            {/* Mode: existing patient */}
            {saveMode === 'existing' && (
              <div className="flex flex-col gap-3">
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Paciente</label>
                  <select value={savePatientId} onChange={(e) => setSavePatientId(e.target.value)}>
                    <option value="">Selecione um paciente…</option>
                    {activePatientsForSelect.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                {activePatientsForSelect.length === 0 && (
                  <p className="text-sm text-muted">Nenhum paciente ativo. Crie um novo paciente na aba ao lado.</p>
                )}
                <div className="flex gap-2 mt-2">
                  <button className="btn btn-outline flex-1" onClick={() => setShowSaveModal(false)}>Cancelar</button>
                  <button
                    className="btn btn-primary flex-1"
                    disabled={!savePatientId}
                    onClick={handleSaveExisting}
                  >
                    <Save size={16} /> Salvar
                  </button>
                </div>
              </div>
            )}

            {/* Mode: new patient */}
            {saveMode === 'new' && (
              <div className="flex flex-col gap-3">
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Nome da criança <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    placeholder="Ex: Maria Eduarda"
                    value={newName}
                    onChange={(e) => { setNewName(e.target.value); setNewFormError(''); }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>Nascimento <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="date"
                      value={newBirthDate}
                      onChange={(e) => { setNewBirthDate(e.target.value); setNewFormError(''); }}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>Sexo</label>
                    <select value={newGender} onChange={(e) => setNewGender(e.target.value as 'M' | 'F')}>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </select>
                  </div>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Nome do responsável <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    placeholder="Ex: Camila Souza"
                    value={newParentName}
                    onChange={(e) => { setNewParentName(e.target.value); setNewFormError(''); }}
                  />
                </div>
                {newFormError && (
                  <p className="text-sm" style={{ color: 'var(--color-accent)', marginTop: 0 }} role="alert">
                    {newFormError}
                  </p>
                )}
                <div className="flex gap-2 mt-2">
                  <button className="btn btn-outline flex-1" onClick={() => setShowSaveModal(false)}>Cancelar</button>
                  <button className="btn btn-primary flex-1" onClick={handleSaveNew}>
                    <Save size={16} /> Criar e Salvar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function IndicatorCard({
  indicResult,
  result,
  curveDef,
  displayMode,
}: {
  indicResult: IndicatorResult;
  result: GeneratorResult;
  curveDef: CurveDefinition | undefined;
  displayMode: ChartDisplayMode;
}) {
  const cfg = STATUS_CONFIG[indicResult.status];

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Card header strip */}
      <div className="gen-indcard-header" style={{ borderLeft: `4px solid ${cfg.color}` }}>
        <div>
          <span className="gen-indcard-title">{indicResult.label}</span>
          <span className="gen-indcard-value">
            {indicResult.value.toFixed(2)} <span style={{ fontWeight: 400, fontSize: '0.85em' }}>{indicResult.unit}</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {indicResult.resultType === 'zscore' ? (
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: cfg.color }}>
              Z = {indicResult.result.toFixed(2)} <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '0.8em' }}>≈ P{indicResult.percentile}</span>
            </span>
          ) : (
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: cfg.color }}>
              P{Math.round(indicResult.result)}
            </span>
          )}
          <span className={`status-chip ${indicResult.status}`} style={{ gap: 4 }}>
            {indicResult.status === 'normal'  && <CheckCircle size={10} />}
            {indicResult.status === 'warning' && <AlertTriangle size={10} />}
            {indicResult.status === 'danger'  && <XCircle size={10} />}
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ padding: '0 1.25rem' }}>
        <IndicatorChart indicResult={indicResult} result={result} curveDef={curveDef} displayMode={displayMode} />
      </div>

      {/* Interpretation */}
      <div className="gen-indcard-info">
        <p className="gen-indcard-interp">{indicResult.interpretation}</p>
        {indicResult.clinicalNote && (
          <p className="gen-indcard-note">{indicResult.clinicalNote}</p>
        )}
      </div>
    </div>
  );
}

function IndicatorChart({
  indicResult,
  result,
  curveDef,
  displayMode,
}: {
  indicResult: IndicatorResult;
  result: GeneratorResult;
  curveDef: CurveDefinition | undefined;
  displayMode: ChartDisplayMode;
}) {
  const isFenton = result.curveKey === 'fenton' || result.curveKey === 'intergrowth';

  // Premature curves (Fenton / Intergrowth): always Percentile
  if (isFenton && (indicResult.indicator === 'weight' || indicResult.indicator === 'height' || indicResult.indicator === 'headCirc')) {
    return <FentonChart gender={result.gender} indicator={indicResult.indicator} week={result.gestationalAgeWeeks ?? 40} patientValue={indicResult.value} />;
  }

  // WHO/CDC curves: support both Z-Score and Percentile modes
  if (curveDef?.outputMode === 'zscore') {
    const standard = result.ageMonths <= 60 ? 'who' : 'cdc';
    const ds = resolveStandard(standard, indicResult.indicator, result.gender);
    if (!ds) return <div className="chart-no-data">Dados gráficos não disponíveis para esta faixa etária</div>;
    const patientPt = [{ months: result.ageMonths, value: indicResult.value, date: result.generatedAt }];
    const modeLabel = displayMode === 'zscore' ? 'Score Z' : 'Percentil';
    const caption = `OMS${standard === 'cdc' ? '/CDC' : ''} • ${result.gender === 'M' ? 'meninos' : 'meninas'} • ${modeLabel}`;
    return (
      <GrowthChart
        title=""
        yAxisLabel={ds.yAxisLabel}
        referenceData={ds.data}
        patientData={patientPt}
        isGirl={result.gender === 'F'}
        caption={caption}
        displayMode={displayMode}
      />
    );
  }

  // Percentile-only curves (Down, Turner, Williams, Achondro): always Percentile
  return (
    <PercentileChartComp
      curveKey={result.curveKey}
      gender={result.gender}
      indicator={indicResult.indicator}
      age={result.ageMonths}
      patientValue={indicResult.value}
    />
  );
}

function PercentileChartComp({
  curveKey, gender, indicator, age, patientValue
}: {
  curveKey: CurveKey; gender: Gender; indicator: Indicator; age: number; patientValue: number;
}) {
  const { theme } = useTheme();
  const isDark     = theme === 'dark';
  const gridColor  = isDark ? '#243240' : '#f0f0f0';
  const tickColor  = isDark ? '#8fa0ae' : '#6B7280';
  const chartBg    = isDark ? '#1a2a35' : '#ffffff';
  const tooltipBg  = isDark ? '#1e2d38' : '#ffffff';
  const tooltipBdr = isDark ? '#2d3d4a' : '#E5E7EB';
  const tooltipClr = isDark ? '#e2e8f0' : '#1B3A4B';

  const data = getPercentileChartData(curveKey, gender, indicator);
  if (!data || data.length === 0) return <div className="chart-no-data">Dados gráficos não disponíveis</div>;

  const unit = INDICATOR_UNITS[indicator];
  const chartData = data.map((row) => ({
    age: row.age,
    P3_P97: [row.P3, row.P97],
    P10_P90: [row.P10, row.P90],
    P25_P75: [row.P25, row.P75],
    P50: row.P50,
  }));

  return (
    <div className="gen-chart-wrap" style={{ background: chartBg, borderRadius: 8, padding: '0.5rem 0' }}>
      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 30 }} style={{ background: chartBg }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="age" tick={{ fontSize: 11, fill: tickColor }}>
            <Label value="Idade (meses)" offset={-8} position="insideBottom" style={{ fontSize: 11, fill: tickColor }} />
          </XAxis>
          <YAxis tick={{ fontSize: 11, fill: tickColor }}>
            <Label value={`${INDICATOR_LABELS[indicator]} (${unit})`} angle={-90} position="insideLeft" style={{ fontSize: 11, fill: tickColor }} />
          </YAxis>
          <Tooltip
            formatter={(v: any) => {
              if (Array.isArray(v)) return `${(v as number[])[0].toFixed(1)} – ${(v as number[])[1].toFixed(1)} ${unit}`;
              return `${(v as number).toFixed(1)} ${unit}`;
            }}
            labelFormatter={(l) => `Idade: ${l} meses`}
            contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBdr}`, borderRadius: 8, fontSize: 12, color: tooltipClr }}
          />
          <Area dataKey="P3_P97"  name="P3–P97"  fill="#22B6A8" fillOpacity={0.07} stroke="none" />
          <Area dataKey="P10_P90" name="P10–P90" fill="#22B6A8" fillOpacity={0.09} stroke="none" />
          <Area dataKey="P25_P75" name="P25–P75" fill="#22B6A8" fillOpacity={0.12} stroke="none" />
          <Line dataKey="P50" name="P50 (mediana)" stroke="#22B6A8" strokeWidth={2} dot={false} />
          <ReferenceDot x={age} y={patientValue} r={7} fill="#FF8B8B" stroke="#fff" strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="chart-legend-note" style={{ color: tickColor }}>Faixa: P3–P97 · Linha central: P50 (mediana) · Ponto vermelho: paciente</p>
    </div>
  );
}

function FentonChart({
  gender, indicator, week, patientValue
}: {
  gender: Gender; indicator: 'weight' | 'height' | 'headCirc'; week: number; patientValue: number;
}) {
  const { theme } = useTheme();
  const isDark     = theme === 'dark';
  const gridColor  = isDark ? '#243240' : '#f0f0f0';
  const tickColor  = isDark ? '#8fa0ae' : '#6B7280';
  const chartBg    = isDark ? '#1a2a35' : '#ffffff';
  const tooltipBg  = isDark ? '#1e2d38' : '#ffffff';
  const tooltipBdr = isDark ? '#2d3d4a' : '#E5E7EB';
  const tooltipClr = isDark ? '#e2e8f0' : '#1B3A4B';

  const data = getFentonChartData(gender, indicator);
  const unit = INDICATOR_UNITS[indicator];
  const chartData = data.map((r) => ({ week: r.week, P3_P97: [r.P3, r.P97], P10_P90: [r.P10, r.P90], P50: r.P50 }));

  return (
    <div className="gen-chart-wrap" style={{ background: chartBg, borderRadius: 8, padding: '0.5rem 0' }}>
      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 30 }} style={{ background: chartBg }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="week" tick={{ fontSize: 11, fill: tickColor }}>
            <Label value="Semana gestacional" offset={-8} position="insideBottom" style={{ fontSize: 11, fill: tickColor }} />
          </XAxis>
          <YAxis tick={{ fontSize: 11, fill: tickColor }}>
            <Label value={`${INDICATOR_LABELS[indicator]} (${unit})`} angle={-90} position="insideLeft" style={{ fontSize: 11, fill: tickColor }} />
          </YAxis>
          <Tooltip
            formatter={(v: any) => {
              if (Array.isArray(v)) return `${(v as number[])[0].toFixed(2)} – ${(v as number[])[1].toFixed(2)} ${unit}`;
              return `${(v as number).toFixed(2)} ${unit}`;
            }}
            labelFormatter={(l) => `Semana: ${l}`}
            contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBdr}`, borderRadius: 8, fontSize: 12, color: tooltipClr }}
          />
          <Area dataKey="P3_P97"  name="P3–P97"  fill="#0EA5E9" fillOpacity={0.07} stroke="none" />
          <Area dataKey="P10_P90" name="P10–P90" fill="#0EA5E9" fillOpacity={0.12} stroke="none" />
          <Line dataKey="P50" name="P50 (mediana)" stroke="#0EA5E9" strokeWidth={2} dot={false} />
          <ReferenceDot x={week} y={patientValue} r={7} fill="#FF8B8B" stroke="#fff" strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="chart-legend-note" style={{ color: tickColor }}>Fenton 2013 · Faixa: P3–P97 · Ponto vermelho: paciente</p>
    </div>
  );
}

// ============================================================
// Progress indicator
// ============================================================

const STEPS = ['Perfil Clínico', 'Curva', 'Dados', 'Resultado'];

function StepProgress({ current }: { current: number }) {
  return (
    <div className="gen-progress">
      {STEPS.map((label, i) => (
        <React.Fragment key={label}>
          <div className={`gen-progress-step ${i < current ? 'done' : i === current ? 'active' : ''}`}>
            <div className="gen-progress-dot">
              {i < current ? <CheckCircle size={14} /> : <span>{i + 1}</span>}
            </div>
            <span className="gen-progress-label">{label}</span>
          </div>
          {i < STEPS.length - 1 && <div className={`gen-progress-line ${i < current ? 'done' : ''}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

// ============================================================
// Main orchestrator
// ============================================================

function formatAgeMonths(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} meses`;
  if (m === 0) return `${y} anos`;
  return `${y} anos e ${m} meses`;
}

export default function CurveGenerator() {
  const [step, setStep] = useState(0);
  const [patientType, setPatientType] = useState<PatientType | null>(null);
  const [selectedCurve, setSelectedCurve] = useState<CurveDefinition | null>(null);
  const [result, setResult] = useState<GeneratorResult | null>(null);

  const handleTypeSelect = useCallback((t: PatientType) => {
    setPatientType(t);
    setSelectedCurve(null);
    setResult(null);
    setStep(1);
  }, []);

  const handleCurveSelect = useCallback((c: CurveDefinition) => {
    setSelectedCurve(c);
    setResult(null);
    setStep(2);
  }, []);

  const handleFormSubmit = useCallback(
    (form: FormState, ageMonths: number, gestWeeks?: number) => {
      if (!selectedCurve) return;

      const gender = form.gender as Gender;
      const weight = form.weight ? parseFloat(form.weight) : undefined;
      const height = form.height ? parseFloat(form.height) : undefined;
      const headCirc = form.headCirc ? parseFloat(form.headCirc) : undefined;

      const indicators = calculateResults(
        selectedCurve.key,
        gender,
        ageMonths,
        gestWeeks,
        weight,
        height,
        headCirc
      );

      setResult({
        patientType: patientType!,
        curveKey: selectedCurve.key,
        curveName: selectedCurve.name,
        gender,
        ageMonths,
        gestationalAgeWeeks: gestWeeks,
        indicators,
        reference: selectedCurve.reference,
        referenceShort: selectedCurve.referenceShort,
        generatedAt: new Date().toLocaleString('pt-BR'),
      });
      setStep(3);
    },
    [selectedCurve, patientType]
  );

  const handleRestart = useCallback(() => {
    setStep(0);
    setPatientType(null);
    setSelectedCurve(null);
    setResult(null);
  }, []);

  return (
    <>
      <div className="shell-topbar">
        <span className="shell-topbar-title">Gerador de Curvas de Crescimento</span>
      </div>

      <div className="shell-content-inner">
        <div className="gen-container">
          <StepProgress current={step} />

          <div className="gen-content">
            {step === 0 && <PatientTypeStep onSelect={handleTypeSelect} />}
            {step === 1 && patientType && (
              <CurveSelectionStep
                patientType={patientType}
                onSelect={handleCurveSelect}
                onBack={() => setStep(0)}
              />
            )}
            {step === 2 && selectedCurve && (
              <DataEntryStep
                curve={selectedCurve}
                onSubmit={handleFormSubmit}
                onBack={() => setStep(1)}
              />
            )}
            {step === 3 && result && (
              <ResultsStep
                result={result}
                onRestart={handleRestart}
                onBack={() => setStep(2)}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
