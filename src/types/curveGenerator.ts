export type PatientType =
  | 'normal'     // Sem comorbidades → OMS (Score Z)
  | 'down'       // Síndrome de Down → Curvas Brasileiras (Percentil)
  | 'premature'  // Prematuros → Intergrowth/Fenton
  | 'turner'     // Síndrome de Turner
  | 'williams';  // Síndrome de Williams-Beuren

export type CurveKey =
  | 'who_0_5'       // OMS 0-5 anos
  | 'who_5_19'      // OMS 5-19 anos
  | 'down_brazil'   // SD - Curvas Brasileiras (Mustacchi)
  | 'fenton'        // Fenton 2013 (22–50 semanas)
  | 'intergrowth'   // Intergrowth-21 Preterm (27–64 semanas PMA)
  | 'turner'        // Síndrome de Turner (Ranke/Naeraa)
  | 'williams'      // Williams-Beuren (Morris/Pankau)
  | 'achondro';     // Acondroplasia - Clarity (Horton)

export type Gender = 'M' | 'F';

export type OutputMode = 'zscore' | 'percentile';

export type Indicator = 'weight' | 'height' | 'headCirc' | 'bmi';

export const INDICATOR_LABELS: Record<Indicator, string> = {
  weight: 'Peso',
  height: 'Estatura/Comprimento',
  headCirc: 'Perímetro Cefálico',
  bmi: 'IMC',
};

export const INDICATOR_UNITS: Record<Indicator, string> = {
  weight: 'kg',
  height: 'cm',
  headCirc: 'cm',
  bmi: 'kg/m²',
};

export interface CurveDefinition {
  key: CurveKey;
  patientTypes: PatientType[];
  name: string;
  shortName: string;
  description: string;
  whenToUse: string;
  outputMode: OutputMode;
  ageUnit: 'months' | 'weeks_ga';
  ageRange: [number, number];
  availableGenders: Gender[];
  availableIndicators: Indicator[];
  reference: string;
  referenceShort: string;
}

export interface GeneratorFormData {
  gender: Gender | '';
  ageYears: string;
  ageMonths: string;
  gestationalAgeWeeks: string;
  weight: string;
  height: string;
  headCirc: string;
}

export interface PercentileRow {
  age: number;
  P3: number;
  P10: number;
  P25: number;
  P50: number;
  P75: number;
  P90: number;
  P97: number;
}

export interface FentonRow {
  week: number;
  weight_P3: number;  weight_P10: number;  weight_P50: number;  weight_P90: number;  weight_P97: number;
  length_P3: number;  length_P10: number;  length_P50: number;  length_P90: number;  length_P97: number;
  hc_P3: number;      hc_P10: number;      hc_P50: number;      hc_P90: number;      hc_P97: number;
}

export type ResultStatus = 'normal' | 'warning' | 'danger';

export interface IndicatorResult {
  indicator: Indicator;
  label: string;
  value: number;
  unit: string;
  result: number;
  resultType: OutputMode;
  percentile: number;
  zscore?: number;
  status: ResultStatus;
  interpretation: string;
  clinicalNote: string;
}

export interface GeneratorResult {
  patientType: PatientType;
  curveKey: CurveKey;
  curveName: string;
  gender: Gender;
  ageMonths: number;
  gestationalAgeWeeks?: number;
  indicators: IndicatorResult[];
  reference: string;
  referenceShort: string;
  generatedAt: string;
}
