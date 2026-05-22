import type {
  CurveDefinition, CurveKey, PatientType, Gender, Indicator,
  PercentileRow, IndicatorResult, FentonRow
} from '../types/curveGenerator';

import downBoysWeight from '../data/down_boys_weight.json';
import downGirlsWeight from '../data/down_girls_weight.json';
import downBoysHeight from '../data/down_boys_height.json';
import downGirlsHeight from '../data/down_girls_height.json';
import downBoysHC from '../data/down_boys_headcirc.json';
import downGirlsHC from '../data/down_girls_headcirc.json';
import fentonBoys from '../data/fenton_boys.json';
import fentonGirls from '../data/fenton_girls.json';
import turnerGirlsHeight from '../data/turner_girls_height.json';
import williamsBoysHeight from '../data/williams_boys_height.json';
import williamsGirlsHeight from '../data/williams_girls_height.json';
import achondroBoysHeight from '../data/achondro_boys_height.json';
import achondroGirlsHeight from '../data/achondro_girls_height.json';

import wfaBoys from '../data/wfa_boys_0_5_zscores.json';
import wfaGirls from '../data/wfa_girls_0_5_zscores.json';
import lhfaBoys from '../data/lhfa_boys_0_5_zscores.json';
import lhfaGirls from '../data/lhfa_girls_0_5_zscores.json';
import hcfaBoys from '../data/hcfa_boys_0_5_zscores.json';
import hcfaGirls from '../data/hcfa_girls_0_5_zscores.json';
import bmifaBoys02 from '../data/bmifa_boys_0_2_zscores.json';
import bmifaBoys25 from '../data/bmifa_boys_2_5_zscores.json';
import bmifaGirls02 from '../data/bmifa_girls_0_2_zscores.json';
import bmifaGirls25 from '../data/bmifa_girls_2_5_zscores.json';
import wfaBoys220 from '../data/wfa_boys_2_20_zscores.cdc.json';
import wfaGirls220 from '../data/wfa_girls_2_20_zscores.cdc.json';
import lhfaBoys220 from '../data/lhfa_boys_2_20_zscores.cdc.json';
import lhfaGirls220 from '../data/lhfa_girls_2_20_zscores.cdc.json';
import bmifaBoys220 from '../data/bmifa_boys_2_20_zscores.cdc.json';
import bmifaGirls220 from '../data/bmifa_girls_2_20_zscores.cdc.json';

import {
  interpolatePercentile, calcPercentileFromRow, percentileStatus,
  percentileInterpretation, zscoreStatus, zscoreInterpretation, zscoreToPercentile
} from './percentileCalc';
import { INDICATOR_LABELS, INDICATOR_UNITS } from '../types/curveGenerator';

// ---------- Curve Definitions ----------

export const CURVE_DEFINITIONS: CurveDefinition[] = [
  {
    key: 'who_0_5',
    patientTypes: ['normal'],
    name: 'OMS 0–5 anos',
    shortName: 'OMS 0-5',
    description: 'Referência internacional para crianças de 0 a 5 anos sem condições específicas.',
    whenToUse: 'Crianças de 0 a 60 meses sem comorbidades. Padrão ouro para avaliação do crescimento na primeira infância.',
    outputMode: 'zscore',
    ageUnit: 'months',
    ageRange: [0, 60],
    availableGenders: ['M', 'F'],
    availableIndicators: ['weight', 'height', 'headCirc', 'bmi'],
    reference: 'WHO Multicentre Growth Reference Study Group. WHO Child Growth Standards. Geneva: WHO, 2006.',
    referenceShort: 'OMS 2006',
  },
  {
    key: 'who_5_19',
    patientTypes: ['normal'],
    name: 'OMS 5–19 anos',
    shortName: 'OMS 5-19',
    description: 'Referência internacional para crianças e adolescentes de 5 a 19 anos.',
    whenToUse: 'Crianças e adolescentes de 5 a 19 anos sem comorbidades.',
    outputMode: 'zscore',
    ageUnit: 'months',
    ageRange: [60, 228],
    availableGenders: ['M', 'F'],
    availableIndicators: ['weight', 'height', 'bmi'],
    reference: 'de Onis M, et al. Development of a WHO growth reference for school-aged children and adolescents. Bull World Health Organ. 2007;85(9):660-7.',
    referenceShort: 'OMS 2007',
  },
  {
    key: 'down_brazil',
    patientTypes: ['down'],
    name: 'Síndrome de Down — Curvas Brasileiras',
    shortName: 'SD Brasileiro',
    description: 'Curvas de crescimento específicas para crianças com Síndrome de Down, desenvolvidas com base na população brasileira.',
    whenToUse: 'Exclusivamente para pacientes com diagnóstico de Síndrome de Down. Apresenta resultados em percentil.',
    outputMode: 'percentile',
    ageUnit: 'months',
    ageRange: [0, 216],
    availableGenders: ['M', 'F'],
    availableIndicators: ['weight', 'height', 'headCirc'],
    reference: 'Mustacchi Z. Curvas de crescimento de portadores de Síndrome de Down. Cid Editora, São Paulo, 2002; Nalin T, Perry IDS, Refosco LM. Síndrome de Down e condições associadas. Editora da UFRGS, 2011.',
    referenceShort: 'Mustacchi 2002 / Nalin 2011',
  },
  {
    key: 'fenton',
    patientTypes: ['premature'],
    name: 'Fenton 2013 (22–50 semanas)',
    shortName: 'Fenton 2013',
    description: 'Curva de crescimento para prematuros baseada em metanálise de dados internacionais. Cobre idades gestacionais de 22 a 50 semanas.',
    whenToUse: 'Prematuros extremos e muito prematuros (22–50 semanas de idade gestacional/pós-menstrual). Permite acompanhar o crescimento até 10 semanas após o termo.',
    outputMode: 'percentile',
    ageUnit: 'weeks_ga',
    ageRange: [22, 50],
    availableGenders: ['M', 'F'],
    availableIndicators: ['weight', 'height', 'headCirc'],
    reference: 'Fenton TR, Kim JH. A systematic review and meta-analysis to revise the Fenton growth chart for preterm infants. BMC Pediatrics. 2013;13:59.',
    referenceShort: 'Fenton 2013',
  },
  {
    key: 'intergrowth',
    patientTypes: ['premature'],
    name: 'Intergrowth-21 Preterm (27–64 semanas PMA)',
    shortName: 'Intergrowth-21',
    description: 'Padrão internacional de crescimento pós-natal para prematuros, desenvolvido pelo projeto Intergrowth-21st.',
    whenToUse: 'Prematuros de 27 a 64 semanas de idade pós-menstrual (PMA = semanas gestacionais + semanas pós-natal). Reflete crescimento ideal em condições ideais.',
    outputMode: 'percentile',
    ageUnit: 'weeks_ga',
    ageRange: [27, 64],
    availableGenders: ['M', 'F'],
    availableIndicators: ['weight', 'height', 'headCirc'],
    reference: 'Villar J, et al. INTERGROWTH-21st very preterm size at birth reference charts. Lancet. 2016;387(10021):844-5. Papageorghiou AT, et al. The INTERGROWTH-21st fetal growth standards. BJOG. 2021.',
    referenceShort: 'Intergrowth-21 2016',
  },
  {
    key: 'turner',
    patientTypes: ['turner'],
    name: 'Síndrome de Turner',
    shortName: 'Turner',
    description: 'Curvas de crescimento específicas para meninas com Síndrome de Turner.',
    whenToUse: 'Exclusivamente para meninas com diagnóstico de Síndrome de Turner (cariótipo 45,X ou variantes). Disponível apenas para estatura.',
    outputMode: 'percentile',
    ageUnit: 'months',
    ageRange: [0, 240],
    availableGenders: ['F'],
    availableIndicators: ['height'],
    reference: 'Ranke MB, et al. Standards for growth and final height in Turner\'s syndrome. Acta Paediatr Scand. 1983;72:879-881. Naeraa RW, Nielsen J. Standards for growth in Turner\'s syndrome. Acta Paediatr Scand. 1990;79:182-190.',
    referenceShort: 'Ranke 1983 / Naeraa 1990',
  },
  {
    key: 'williams',
    patientTypes: ['williams'],
    name: 'Síndrome de Williams-Beuren',
    shortName: 'Williams-Beuren',
    description: 'Curvas de crescimento específicas para crianças com Síndrome de Williams-Beuren.',
    whenToUse: 'Exclusivamente para pacientes com diagnóstico confirmado de Síndrome de Williams-Beuren (deleção 7q11.23). Disponível para estatura.',
    outputMode: 'percentile',
    ageUnit: 'months',
    ageRange: [0, 240],
    availableGenders: ['M', 'F'],
    availableIndicators: ['height'],
    reference: 'Morris CA, et al. Natural history of Williams syndrome: physical characteristics. J Pediatr. 1988;113(2):318-26. Pankau R, et al. Statural growth in Williams-Beuren syndrome. Pediatrics. 1992;113(2):318-26.',
    referenceShort: 'Morris 1988 / Pankau 1992',
  },
  {
    key: 'achondro',
    patientTypes: ['normal', 'williams', 'turner'],
    name: 'Acondroplasia — Curvas Clarity (Horton)',
    shortName: 'Acondroplasia',
    description: 'Curvas de crescimento específicas para crianças com Acondroplasia.',
    whenToUse: 'Pacientes com diagnóstico confirmado de Acondroplasia (mutação FGFR3). Avalia estatura em comparação à população com Acondroplasia.',
    outputMode: 'percentile',
    ageUnit: 'months',
    ageRange: [0, 240],
    availableGenders: ['M', 'F'],
    availableIndicators: ['height'],
    reference: 'Horton WA, et al. Standard growth curves for achondroplasia. J Pediatr. 1978;93(3):435-8. Hoover-Fong J, et al. Age-appropriate body mass index in children with achondroplasia: suggestions for clinical practice. Am J Med Genet. 2007.',
    referenceShort: 'Horton 1978 / Clarity',
  },
];

// ---------- Data lookup ----------

type DownKey = 'weight' | 'height' | 'headCirc';

function getDownData(gender: Gender, indicator: DownKey): PercentileRow[] {
  const map: Record<Gender, Record<DownKey, unknown[]>> = {
    M: { weight: downBoysWeight, height: downBoysHeight, headCirc: downBoysHC },
    F: { weight: downGirlsWeight, height: downGirlsHeight, headCirc: downGirlsHC },
  };
  return map[gender][indicator] as PercentileRow[];
}

function getTurnerData(): PercentileRow[] {
  return turnerGirlsHeight as PercentileRow[];
}

function getWilliamsData(gender: Gender): PercentileRow[] {
  return (gender === 'M' ? williamsBoysHeight : williamsGirlsHeight) as PercentileRow[];
}

function getAchondroData(gender: Gender): PercentileRow[] {
  return (gender === 'M' ? achondroBoysHeight : achondroGirlsHeight) as PercentileRow[];
}

function getFentonData(gender: Gender): FentonRow[] {
  return (gender === 'M' ? fentonBoys : fentonGirls) as FentonRow[];
}

// ---------- WHO / CDC LMS data lookup ----------

interface LMSRow { L: string | number; M: string | number; S: string | number; Month?: string | number; Agemos?: string | number; [key: string]: unknown; }

function getWHOData(gender: Gender, indicator: Indicator, ageMonths: number): LMSRow[] | null {
  const use5_19 = ageMonths > 60;
  if (use5_19) {
    // Use CDC 2-20 as proxy for WHO 5-19
    if (indicator === 'weight')  return (gender === 'M' ? wfaBoys220  : wfaGirls220)  as LMSRow[];
    if (indicator === 'height')  return (gender === 'M' ? lhfaBoys220 : lhfaGirls220) as LMSRow[];
    if (indicator === 'bmi')     return (gender === 'M' ? bmifaBoys220 : bmifaGirls220) as LMSRow[];
    return null;
  }
  if (indicator === 'weight')   return (gender === 'M' ? wfaBoys   : wfaGirls)   as LMSRow[];
  if (indicator === 'height')   return (gender === 'M' ? lhfaBoys  : lhfaGirls)  as LMSRow[];
  if (indicator === 'headCirc') return (gender === 'M' ? hcfaBoys  : hcfaGirls)  as LMSRow[];
  if (indicator === 'bmi') {
    const b02 = gender === 'M' ? bmifaBoys02 : bmifaGirls02;
    const b25 = gender === 'M' ? bmifaBoys25 : bmifaGirls25;
    return [...b02, ...b25] as LMSRow[];
  }
  return null;
}

function findLMS(data: LMSRow[], month: number): { L: number; M: number; S: number } | null {
  let closest: LMSRow | undefined;
  let minDiff = Infinity;
  for (const d of data) {
    const dMonth = Number(d.Month ?? d.Agemos);
    if (Number.isNaN(dMonth)) continue;
    const diff = Math.abs(dMonth - month);
    if (diff < minDiff) { minDiff = diff; closest = d; }
  }
  if (!closest) return null;
  return { L: Number(closest.L), M: Number(closest.M), S: Number(closest.S) };
}

function calcZScore(value: number, L: number, M: number, S: number): number {
  if (L === 0) return Math.log(value / M) / S;
  return (Math.pow(value / M, L) - 1) / (L * S);
}

// ---------- Main calculation function ----------

function calcWHOIndicator(
  gender: Gender,
  ageMonths: number,
  value: number,
  indicator: Indicator
): IndicatorResult {
  const label = INDICATOR_LABELS[indicator];
  const unit = INDICATOR_UNITS[indicator];
  const data = getWHOData(gender, indicator, ageMonths);

  if (!data) {
    return { indicator, label, value, unit, result: 0, resultType: 'zscore', percentile: 50, status: 'warning', interpretation: 'Dados de referência não disponíveis', clinicalNote: '' };
  }

  const lms = findLMS(data, ageMonths);
  if (!lms) {
    return { indicator, label, value, unit, result: 0, resultType: 'zscore', percentile: 50, status: 'warning', interpretation: 'Idade fora do intervalo da curva', clinicalNote: '' };
  }

  const z = calcZScore(value, lms.L, lms.M, lms.S);
  const percentile = zscoreToPercentile(z);
  const status = zscoreStatus(z);

  return {
    indicator, label, value, unit,
    result: Number(z.toFixed(2)),
    resultType: 'zscore',
    percentile: Math.round(percentile),
    zscore: Number(z.toFixed(2)),
    status,
    interpretation: zscoreInterpretation(z, label),
    clinicalNote: getStatusClinicalNote(status, indicator),
  };
}

function calcPercentileIndicator(
  data: PercentileRow[],
  age: number,
  value: number,
  indicator: Indicator
): IndicatorResult {
  const label = INDICATOR_LABELS[indicator];
  const unit = INDICATOR_UNITS[indicator];

  const row = interpolatePercentile(data, age);
  if (!row) {
    return { indicator, label, value, unit, result: 50, resultType: 'percentile', percentile: 50, status: 'warning', interpretation: 'Idade fora do intervalo da curva', clinicalNote: '' };
  }

  const p = calcPercentileFromRow(value, row);
  const status = percentileStatus(p);

  return {
    indicator, label, value, unit,
    result: Math.round(p * 10) / 10,
    resultType: 'percentile',
    percentile: Math.round(p),
    status,
    interpretation: percentileInterpretation(p, label),
    clinicalNote: getStatusClinicalNote(status, indicator),
  };
}

function getStatusClinicalNote(status: IndicatorResult['status'], indicator: Indicator): string {
  if (status === 'normal') return '';
  if (indicator === 'weight') {
    if (status === 'warning') return 'Avalie tendência nas consultas anteriores e fatores ambientais/nutricionais.';
    return 'Investigação aprofundada e encaminhamento para especialista indicados.';
  }
  if (indicator === 'height') {
    if (status === 'warning') return 'Avalie velocidade de crescimento e histórico familiar.';
    return 'Investigação endocrinológica e genética pode ser necessária.';
  }
  if (indicator === 'headCirc') {
    if (status === 'warning') return 'Avalie curva de crescimento do PC nas consultas anteriores.';
    return 'Avaliação neurológica e de imagem indicadas com urgência.';
  }
  return '';
}

// ---------- Fenton calculation ----------

function calcFentonIndicator(
  data: FentonRow[],
  week: number,
  value: number,
  indicator: 'weight' | 'height' | 'headCirc'
): IndicatorResult {
  const label = INDICATOR_LABELS[indicator];
  const unit = INDICATOR_UNITS[indicator];

  const sorted = [...data].sort((a, b) => a.week - b.week);
  const minW = sorted[0].week;
  const maxW = sorted[sorted.length - 1].week;

  if (week < minW || week > maxW) {
    return { indicator, label, value, unit, result: 50, resultType: 'percentile', percentile: 50, status: 'warning', interpretation: 'Semana gestacional fora do intervalo (22–50 semanas)', clinicalNote: '' };
  }

  // Interpolate
  const lower = [...sorted].reverse().find((r) => r.week <= week)!;
  const upper = sorted.find((r) => r.week >= week)!;
  const t = lower.week === upper.week ? 0 : (week - lower.week) / (upper.week - lower.week);
  const lerp = (a: number, b: number) => a + t * (b - a);

  const prefix = indicator === 'weight' ? 'weight' : indicator === 'height' ? 'length' : 'hc';
  const p3  = lerp(lower[`${prefix}_P3`  as keyof FentonRow] as number, upper[`${prefix}_P3`  as keyof FentonRow] as number);
  const p10 = lerp(lower[`${prefix}_P10` as keyof FentonRow] as number, upper[`${prefix}_P10` as keyof FentonRow] as number);
  const p50 = lerp(lower[`${prefix}_P50` as keyof FentonRow] as number, upper[`${prefix}_P50` as keyof FentonRow] as number);
  const p90 = lerp(lower[`${prefix}_P90` as keyof FentonRow] as number, upper[`${prefix}_P90` as keyof FentonRow] as number);
  const p97 = lerp(lower[`${prefix}_P97` as keyof FentonRow] as number, upper[`${prefix}_P97` as keyof FentonRow] as number);

  const row: PercentileRow = { age: week, P3: p3, P10: p10, P25: (p3 + p50) / 2, P50: p50, P75: (p50 + p97) / 2, P90: p90, P97: p97 };
  const p = calcPercentileFromRow(value, row);
  const status = percentileStatus(p);

  return {
    indicator, label, value, unit,
    result: Math.round(p * 10) / 10,
    resultType: 'percentile',
    percentile: Math.round(p),
    status,
    interpretation: percentileInterpretation(p, label),
    clinicalNote: getStatusClinicalNote(status, indicator),
  };
}

// ---------- Intergrowth-21 uses Fenton data as proxy for 27-50w, extends with WHO for 50-64w ----------

function calcIntergrowthIndicator(
  gender: Gender,
  week: number,
  value: number,
  indicator: 'weight' | 'height' | 'headCirc'
): IndicatorResult {
  if (week <= 50) {
    return calcFentonIndicator(getFentonData(gender), week, value, indicator);
  }
  // For weeks >50 (post-term), use WHO 0-5 with age in months
  const ageMonths = Math.round((week - 40) * 7 / 30.4375);
  const whoIndicator: Indicator = indicator === 'height' ? 'height' : indicator;
  return calcWHOIndicator(gender, Math.max(0, ageMonths), value, whoIndicator);
}

// ---------- Public API ----------

export function getCurvesForPatientType(patientType: PatientType): CurveDefinition[] {
  return CURVE_DEFINITIONS.filter((c) => c.patientTypes.includes(patientType));
}

export function getCurveDefinition(key: CurveKey): CurveDefinition | undefined {
  return CURVE_DEFINITIONS.find((c) => c.key === key);
}

export function calculateResults(
  curveKey: CurveKey,
  gender: Gender,
  ageMonths: number,
  gestationalWeeks: number | undefined,
  weight?: number,
  height?: number,
  headCirc?: number
): IndicatorResult[] {
  const results: IndicatorResult[] = [];

  switch (curveKey) {
    case 'who_0_5':
    case 'who_5_19': {
      if (weight)  results.push(calcWHOIndicator(gender, ageMonths, weight, 'weight'));
      if (height)  results.push(calcWHOIndicator(gender, ageMonths, height, 'height'));
      if (headCirc && ageMonths <= 60) results.push(calcWHOIndicator(gender, ageMonths, headCirc, 'headCirc'));
      if (weight && height) {
        const bmi = weight / Math.pow(height / 100, 2);
        results.push(calcWHOIndicator(gender, ageMonths, bmi, 'bmi'));
      }
      break;
    }

    case 'down_brazil': {
      if (weight)   results.push(calcPercentileIndicator(getDownData(gender, 'weight'), ageMonths, weight, 'weight'));
      if (height)   results.push(calcPercentileIndicator(getDownData(gender, 'height'), ageMonths, height, 'height'));
      if (headCirc && ageMonths <= 72) results.push(calcPercentileIndicator(getDownData(gender, 'headCirc'), ageMonths, headCirc, 'headCirc'));
      break;
    }

    case 'fenton': {
      const week = gestationalWeeks ?? 40;
      if (weight)   results.push(calcFentonIndicator(getFentonData(gender), week, weight, 'weight'));
      if (height)   results.push(calcFentonIndicator(getFentonData(gender), week, height, 'height'));
      if (headCirc) results.push(calcFentonIndicator(getFentonData(gender), week, headCirc, 'headCirc'));
      break;
    }

    case 'intergrowth': {
      const week = gestationalWeeks ?? 40;
      if (weight)   results.push(calcIntergrowthIndicator(gender, week, weight, 'weight'));
      if (height)   results.push(calcIntergrowthIndicator(gender, week, height, 'height'));
      if (headCirc) results.push(calcIntergrowthIndicator(gender, week, headCirc, 'headCirc'));
      break;
    }

    case 'turner': {
      if (height) results.push(calcPercentileIndicator(getTurnerData(), ageMonths, height, 'height'));
      break;
    }

    case 'williams': {
      if (height) results.push(calcPercentileIndicator(getWilliamsData(gender), ageMonths, height, 'height'));
      break;
    }

    case 'achondro': {
      if (height) results.push(calcPercentileIndicator(getAchondroData(gender), ageMonths, height, 'height'));
      break;
    }
  }

  return results;
}

// ---------- Chart data helpers ----------

export function getPercentileChartData(
  curveKey: CurveKey,
  gender: Gender,
  indicator: Indicator
): PercentileRow[] {
  switch (curveKey) {
    case 'down_brazil':
      return getDownData(gender, indicator as DownKey);
    case 'turner':
      return getTurnerData();
    case 'williams':
      return getWilliamsData(gender);
    case 'achondro':
      return getAchondroData(gender);
    default:
      return [];
  }
}

export function getFentonChartData(
  gender: Gender,
  indicator: 'weight' | 'height' | 'headCirc'
): { week: number; P3: number; P10: number; P50: number; P90: number; P97: number }[] {
  const data = getFentonData(gender);
  const prefix = indicator === 'weight' ? 'weight' : indicator === 'height' ? 'length' : 'hc';
  return data.map((r) => ({
    week: r.week,
    P3:  r[`${prefix}_P3`  as keyof FentonRow] as number,
    P10: r[`${prefix}_P10` as keyof FentonRow] as number,
    P50: r[`${prefix}_P50` as keyof FentonRow] as number,
    P90: r[`${prefix}_P90` as keyof FentonRow] as number,
    P97: r[`${prefix}_P97` as keyof FentonRow] as number,
  }));
}

export function getWHOChartData(
  gender: Gender,
  indicator: Indicator,
  ageMonths: number
): { age: number; SD3neg: number; SD2neg: number; SD0: number; SD2: number; SD3: number }[] {
  const data = getWHOData(gender, indicator, ageMonths);
  if (!data) return [];
  return data.map((row) => ({
    age: Number(row.Month ?? row.Agemos),
    SD3neg: Number(row['SD3neg'] ?? 0),
    SD2neg: Number(row['SD2neg'] ?? 0),
    SD0:    Number(row['SD0']    ?? 0),
    SD2:    Number(row['SD2']    ?? 0),
    SD3:    Number(row['SD3']    ?? 0),
  })).filter((r) => !isNaN(r.age));
}
