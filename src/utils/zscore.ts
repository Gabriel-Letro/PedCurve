/**
 * Z-Score calculator using LMS parameters.
 *
 * Datasets are sourced through `curveStandards.ts` so this module stays
 * agnostic of WHO / CDC / Down / Fenton — adding a new standard there
 * automatically makes it available here.
 */
import {
  resolveStandard,
  pickDefaultStandard,
  type Gender,
  type Indicator,
  type ReferenceRow,
  type StandardKey,
} from './curveStandards';

export type { Gender } from './curveStandards';

export interface ZScoreResult {
  value: number | null;
  status: 'normal' | 'warning' | 'danger' | 'unknown';
  message: string;
}

const computeFormula = (value: number, L: number, M: number, S: number): number => {
  if (L === 0) return Math.log(value / M) / S;
  return (Math.pow(value / M, L) - 1) / (L * S);
};

const getStatus = (z: number): ZScoreResult['status'] => {
  if (z >= -2 && z <= 2) return 'normal';
  if ((z >= -3 && z < -2) || (z > 2 && z <= 3)) return 'warning';
  return 'danger';
};

const getMessage = (z: number): string => {
  if (z < -3) return 'Severamente abaixo do esperado';
  if (z < -2) return 'Abaixo do esperado';
  if (z > 3) return 'Severamente acima do esperado';
  if (z > 2) return 'Acima do esperado';
  return 'Adequado';
};

/**
 * Convert a Z-score to an approximate percentile (0-100, rounded).
 * Uses an Abramowitz & Stegun approximation of the normal CDF —
 * accurate to ~7.5e-8.
 */
export function zToPercentile(z: number): number {
  // Normal CDF approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-(z * z) / 2);
  let p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (z > 0) p = 1 - p;
  return Math.round(p * 100);
}

function findLMS(data: ReferenceRow[], month: number): { L: number; M: number; S: number } | null {
  if (!data || data.length === 0) return null;
  const exact = data.find(
    (d) => Number(d.Month) === month || Number(d.Agemos) === month
  );
  if (exact) return { L: Number(exact.L), M: Number(exact.M), S: Number(exact.S) };
  // Closest fallback (CDC uses half-months, WHO uses whole months)
  let closest: ReferenceRow | undefined;
  let minDiff = Infinity;
  for (const d of data) {
    const dMonth = Number(d.Month ?? d.Agemos);
    if (Number.isNaN(dMonth)) continue;
    const diff = Math.abs(dMonth - month);
    if (diff < minDiff) {
      minDiff = diff;
      closest = d;
    }
  }
  if (!closest) return null;
  return { L: Number(closest.L), M: Number(closest.M), S: Number(closest.S) };
}

function calcOneIndicator(
  gender: Gender,
  months: number,
  value: number,
  indicator: Indicator,
  preferredStandard?: StandardKey
): ZScoreResult {
  const standard = preferredStandard ?? pickDefaultStandard(months);
  const ds = resolveStandard(standard, indicator, gender)
    // Head circumference fallback to WHO regardless of age (only WHO has it bundled)
    ?? (indicator === 'headCirc' ? resolveStandard('who', indicator, gender) : undefined);

  if (!ds) {
    return { value: null, status: 'unknown', message: 'Sem dados de referência para esta idade' };
  }
  const lms = findLMS(ds.data, months);
  if (!lms) return { value: null, status: 'unknown', message: 'Idade fora do intervalo' };
  const z = computeFormula(value, lms.L, lms.M, lms.S);
  return {
    value: Number(z.toFixed(2)),
    status: getStatus(z),
    message: getMessage(z),
  };
}

export interface AllZScores {
  weight: ZScoreResult;
  height: ZScoreResult;
  bmi: ZScoreResult;
  headCirc: ZScoreResult;
}

export const calculateAllZScores = (
  gender: Gender,
  months: number,
  weight?: number,
  height?: number,
  headCircumference?: number,
  preferredStandard?: StandardKey
): AllZScores => {
  const empty: ZScoreResult = { value: null, status: 'unknown', message: 'N/A' };
  const results: AllZScores = {
    weight: empty,
    height: empty,
    bmi: empty,
    headCirc: empty,
  };

  if (weight) {
    results.weight = calcOneIndicator(gender, months, weight, 'weight', preferredStandard);
  }
  if (height) {
    results.height = calcOneIndicator(gender, months, height, 'height', preferredStandard);
  }
  if (weight && height) {
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    results.bmi = calcOneIndicator(gender, months, bmi, 'bmi', preferredStandard);
  }
  if (headCircumference) {
    if (months > 60) {
      results.headCirc = {
        value: null,
        status: 'unknown',
        message: 'Apenas para 0 a 5 anos',
      };
    } else {
      results.headCirc = calcOneIndicator(gender, months, headCircumference, 'headCirc', preferredStandard);
    }
  }
  return results;
};
