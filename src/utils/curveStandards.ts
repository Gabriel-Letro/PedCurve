/**
 * Curve Standards Registry
 * ------------------------
 * This module is the single point of truth for which dataset is used for
 * each (indicator × age × gender × standard) combination.
 *
 * It is structured so future curves — Down Syndrome, Tanner pubertal
 * stages, Achondroplasia/Dwarfism, Fenton (premature) — can be plugged in
 * by adding entries to STANDARDS and (optionally) JSON files in /data.
 *
 * The PatientProfile + GrowthChart components pick the right dataset by
 * calling `resolveStandard(...)`. Charts and z-score calculations stay
 * decoupled from any specific reference table.
 */

// WHO 0-5
import wfa_boys_0_5 from '../data/wfa_boys_0_5_zscores.json';
import wfa_girls_0_5 from '../data/wfa_girls_0_5_zscores.json';
import lhfa_boys_0_5 from '../data/lhfa_boys_0_5_zscores.json';
import lhfa_girls_0_5 from '../data/lhfa_girls_0_5_zscores.json';
import hcfa_boys_0_5 from '../data/hcfa_boys_0_5_zscores.json';
import hcfa_girls_0_5 from '../data/hcfa_girls_0_5_zscores.json';
import bmifa_boys_0_2 from '../data/bmifa_boys_0_2_zscores.json';
import bmifa_boys_2_5 from '../data/bmifa_boys_2_5_zscores.json';
import bmifa_girls_0_2 from '../data/bmifa_girls_0_2_zscores.json';
import bmifa_girls_2_5 from '../data/bmifa_girls_2_5_zscores.json';

// CDC 2-20 (used for 5-19y range as common practice)
import wfa_boys_2_20 from '../data/wfa_boys_2_20_zscores.cdc.json';
import wfa_girls_2_20 from '../data/wfa_girls_2_20_zscores.cdc.json';
import lhfa_boys_2_20 from '../data/lhfa_boys_2_20_zscores.cdc.json';
import lhfa_girls_2_20 from '../data/lhfa_girls_2_20_zscores.cdc.json';
import bmifa_boys_2_20 from '../data/bmifa_boys_2_20_zscores.cdc.json';
import bmifa_girls_2_20 from '../data/bmifa_girls_2_20_zscores.cdc.json';

export type Gender = 'M' | 'F';

export type Indicator = 'weight' | 'height' | 'bmi' | 'headCirc';

export type StandardKey =
  | 'who'         // WHO 0-5 (default for kids under 5y)
  | 'cdc'         // CDC 2-20 (default for >=5y)
  | 'down'        // Down Syndrome (future)
  | 'tanner'      // Tanner stages (future, separate flow)
  | 'achondro'    // Achondroplasia / Dwarfism (future)
  | 'fenton';     // Fenton premature (future)

export interface ReferenceRow {
  // Source JSON stores numeric fields as strings; consumers coerce via Number().
  L: number | string;
  M: number | string;
  S: number | string;
  // The age axis – months (Month) or months-as-decimals (Agemos).
  Month?: number | string;
  Agemos?: number | string;
  // Optional pre-computed SD reference lines for chart rendering
  SD3neg?: number | string;
  SD2neg?: number | string;
  SD1neg?: number | string;
  SD0?:    number | string;
  SD1?:    number | string;
  SD2?:    number | string;
  SD3?:    number | string;
}

export interface CurveDataset {
  /** WHO/CDC/etc. label */
  standard: StandardKey;
  /** Indicator being charted */
  indicator: Indicator;
  /** Display title for the chart card */
  title: string;
  /** Y axis label, e.g. "Peso (kg)" */
  yAxisLabel: string;
  /** Min/max age (months) for which this dataset is meaningful */
  ageRange: [number, number];
  /** Reference rows */
  data: ReferenceRow[];
}

// ---------- Concrete combined BMI datasets ----------
const bmifa_boys_0_5  = [...(bmifa_boys_0_2 as ReferenceRow[]),  ...(bmifa_boys_2_5 as ReferenceRow[])];
const bmifa_girls_0_5 = [...(bmifa_girls_0_2 as ReferenceRow[]), ...(bmifa_girls_2_5 as ReferenceRow[])];

// ---------- The registry ----------
// Outer key: standard, then indicator, then gender.
const STANDARDS: Record<StandardKey, Partial<Record<Indicator, Record<Gender, CurveDataset | undefined>>>> = {
  who: {
    weight: {
      M: {
        standard: 'who', indicator: 'weight',
        title: 'Peso por Idade (OMS 0-5 anos)',
        yAxisLabel: 'Peso (kg)',
        ageRange: [0, 60],
        data: wfa_boys_0_5 as ReferenceRow[],
      },
      F: {
        standard: 'who', indicator: 'weight',
        title: 'Peso por Idade (OMS 0-5 anos)',
        yAxisLabel: 'Peso (kg)',
        ageRange: [0, 60],
        data: wfa_girls_0_5 as ReferenceRow[],
      },
    },
    height: {
      M: {
        standard: 'who', indicator: 'height',
        title: 'Estatura por Idade (OMS 0-5 anos)',
        yAxisLabel: 'Estatura (cm)',
        ageRange: [0, 60],
        data: lhfa_boys_0_5 as ReferenceRow[],
      },
      F: {
        standard: 'who', indicator: 'height',
        title: 'Estatura por Idade (OMS 0-5 anos)',
        yAxisLabel: 'Estatura (cm)',
        ageRange: [0, 60],
        data: lhfa_girls_0_5 as ReferenceRow[],
      },
    },
    bmi: {
      M: {
        standard: 'who', indicator: 'bmi',
        title: 'IMC por Idade (OMS 0-5 anos)',
        yAxisLabel: 'IMC (kg/m²)',
        ageRange: [0, 60],
        data: bmifa_boys_0_5,
      },
      F: {
        standard: 'who', indicator: 'bmi',
        title: 'IMC por Idade (OMS 0-5 anos)',
        yAxisLabel: 'IMC (kg/m²)',
        ageRange: [0, 60],
        data: bmifa_girls_0_5,
      },
    },
    headCirc: {
      M: {
        standard: 'who', indicator: 'headCirc',
        title: 'Perímetro Cefálico (OMS 0-5 anos)',
        yAxisLabel: 'Perímetro Cefálico (cm)',
        ageRange: [0, 60],
        data: hcfa_boys_0_5 as ReferenceRow[],
      },
      F: {
        standard: 'who', indicator: 'headCirc',
        title: 'Perímetro Cefálico (OMS 0-5 anos)',
        yAxisLabel: 'Perímetro Cefálico (cm)',
        ageRange: [0, 60],
        data: hcfa_girls_0_5 as ReferenceRow[],
      },
    },
  },
  cdc: {
    weight: {
      M: {
        standard: 'cdc', indicator: 'weight',
        title: 'Peso por Idade (CDC 2-20 anos)',
        yAxisLabel: 'Peso (kg)',
        ageRange: [24, 240],
        data: wfa_boys_2_20 as ReferenceRow[],
      },
      F: {
        standard: 'cdc', indicator: 'weight',
        title: 'Peso por Idade (CDC 2-20 anos)',
        yAxisLabel: 'Peso (kg)',
        ageRange: [24, 240],
        data: wfa_girls_2_20 as ReferenceRow[],
      },
    },
    height: {
      M: {
        standard: 'cdc', indicator: 'height',
        title: 'Estatura por Idade (CDC 2-20 anos)',
        yAxisLabel: 'Estatura (cm)',
        ageRange: [24, 240],
        data: lhfa_boys_2_20 as ReferenceRow[],
      },
      F: {
        standard: 'cdc', indicator: 'height',
        title: 'Estatura por Idade (CDC 2-20 anos)',
        yAxisLabel: 'Estatura (cm)',
        ageRange: [24, 240],
        data: lhfa_girls_2_20 as ReferenceRow[],
      },
    },
    bmi: {
      M: {
        standard: 'cdc', indicator: 'bmi',
        title: 'IMC por Idade (CDC 2-20 anos)',
        yAxisLabel: 'IMC (kg/m²)',
        ageRange: [24, 240],
        data: bmifa_boys_2_20 as ReferenceRow[],
      },
      F: {
        standard: 'cdc', indicator: 'bmi',
        title: 'IMC por Idade (CDC 2-20 anos)',
        yAxisLabel: 'IMC (kg/m²)',
        ageRange: [24, 240],
        data: bmifa_girls_2_20 as ReferenceRow[],
      },
    },
  },
  // Placeholders – populate once the corresponding JSON datasets are added.
  down:     { },
  tanner:   { },
  achondro: { },
  fenton:   { },
};

/**
 * Decide which standard to use given the patient's age in months.
 * Doctors can also override this manually via the chart toggle.
 */
export function pickDefaultStandard(ageInMonths: number): StandardKey {
  if (ageInMonths <= 60) return 'who';
  return 'cdc';
}

/**
 * Look up the dataset for a (standard × indicator × gender) triple.
 * Returns undefined if the dataset is not yet bundled (e.g. future standards).
 */
export function resolveStandard(
  standard: StandardKey,
  indicator: Indicator,
  gender: Gender
): CurveDataset | undefined {
  return STANDARDS[standard]?.[indicator]?.[gender];
}

/** Human-readable label for the standard – used by UI badges. */
export const STANDARD_LABELS: Record<StandardKey, string> = {
  who: 'OMS',
  cdc: 'CDC',
  down: 'Síndrome de Down',
  tanner: 'Tanner',
  achondro: 'Acondroplasia',
  fenton: 'Fenton (Prematuro)',
};

/**
 * True only if the standard has at least one indicator whose gender entry
 * points to a dataset with actual reference rows. Guards against partially
 * stubbed standards (e.g. `down: { weight: {} }`) showing up in the dropdown.
 */
function hasUsableData(standard: StandardKey): boolean {
  const byIndicator = STANDARDS[standard];
  if (!byIndicator) return false;
  return Object.values(byIndicator).some((byGender) => {
    if (!byGender) return false;
    return Object.values(byGender).some(
      (ds) => !!ds && Array.isArray(ds.data) && ds.data.length > 0
    );
  });
}

/** All standards available in the UI (only ones with populated curve data). */
export function availableStandards(): StandardKey[] {
  return (Object.keys(STANDARDS) as StandardKey[]).filter(hasUsableData);
}
