import type { PercentileRow, ResultStatus } from '../types/curveGenerator';

export function interpolatePercentile(data: PercentileRow[], age: number): PercentileRow | null {
  if (!data || data.length === 0) return null;

  const exact = data.find((r) => r.age === age);
  if (exact) return exact;

  // Sort and find bracketing rows
  const sorted = [...data].sort((a, b) => a.age - b.age);
  const minAge = sorted[0].age;
  const maxAge = sorted[sorted.length - 1].age;

  if (age < minAge || age > maxAge) return null;

  const lower = [...sorted].reverse().find((r) => r.age <= age)!;
  const upper = sorted.find((r) => r.age >= age)!;

  if (lower.age === upper.age) return lower;

  const t = (age - lower.age) / (upper.age - lower.age);
  const lerp = (a: number, b: number) => a + t * (b - a);

  return {
    age,
    P3:  lerp(lower.P3,  upper.P3),
    P10: lerp(lower.P10, upper.P10),
    P25: lerp(lower.P25, upper.P25),
    P50: lerp(lower.P50, upper.P50),
    P75: lerp(lower.P75, upper.P75),
    P90: lerp(lower.P90, upper.P90),
    P97: lerp(lower.P97, upper.P97),
  };
}

export function calcPercentileFromRow(value: number, row: PercentileRow): number {
  if (value <= row.P3)  return 3 * (value / row.P3);
  if (value >= row.P97) return Math.min(99.9, 97 + 2.9 * ((value - row.P97) / (row.P97 - row.P90)));

  const breakpoints: Array<[number, number, number, number]> = [
    [row.P3,  row.P10,  3,  10],
    [row.P10, row.P25, 10,  25],
    [row.P25, row.P50, 25,  50],
    [row.P50, row.P75, 50,  75],
    [row.P75, row.P90, 75,  90],
    [row.P90, row.P97, 90,  97],
  ];

  for (const [lo, hi, loP, hiP] of breakpoints) {
    if (value >= lo && value <= hi) {
      const t = (value - lo) / (hi - lo);
      return loP + t * (hiP - loP);
    }
  }
  return 50;
}

export function percentileStatus(p: number): ResultStatus {
  if (p < 3 || p > 97) return 'danger';
  if (p < 10 || p > 90) return 'warning';
  return 'normal';
}

export function percentileInterpretation(p: number, indicator: string): string {
  const rounded = Math.round(p);
  if (p < 3)  return `${indicator} severamente abaixo do esperado para a população de referência (< P3)`;
  if (p < 10) return `${indicator} abaixo do esperado (P${rounded}, entre P3 e P10)`;
  if (p > 97) return `${indicator} severamente acima do esperado (> P97)`;
  if (p > 90) return `${indicator} acima do esperado (P${rounded}, entre P90 e P97)`;
  return `${indicator} dentro da normalidade (P${rounded})`;
}

export function zscoreStatus(z: number): ResultStatus {
  if (z >= -2 && z <= 2) return 'normal';
  if ((z >= -3 && z < -2) || (z > 2 && z <= 3)) return 'warning';
  return 'danger';
}

export function zscoreInterpretation(z: number, indicator: string): string {
  const zStr = z.toFixed(2);
  if (z < -3) return `${indicator} severamente abaixo do esperado (Escore Z: ${zStr})`;
  if (z < -2) return `${indicator} abaixo do esperado (Escore Z: ${zStr})`;
  if (z > 3)  return `${indicator} severamente acima do esperado (Escore Z: ${zStr})`;
  if (z > 2)  return `${indicator} acima do esperado (Escore Z: ${zStr})`;
  return `${indicator} adequado para a idade e sexo (Escore Z: ${zStr})`;
}

export function zscoreToPercentile(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-(z * z) / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (z > 0) p = 1 - p;
  return Math.max(0.1, Math.min(99.9, p * 100));
}
