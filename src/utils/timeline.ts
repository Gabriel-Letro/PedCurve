import { differenceInMonths, differenceInDays, parseISO, format } from 'date-fns';
import type { Patient } from '../context/AppContext';

/**
 * Recommended data shape for a consultation-history chart.
 * One entry per consultation, chronologically ascending. Every point is
 * anchored to its consultation date.
 */
export interface TimelinePoint {
  date: string; // ISO date of the consultation
  label: string; // dd/MM/yyyy
  ageMonths: number; // child's age in months at the visit
  indicators: number; // count of weight/height/headCirc recorded
  intervalDays: number; // days since previous consultation (0 for first)
}

/** Builds the consultation timeline from a patient record. */
export function buildTimeline(patient: Patient): TimelinePoint[] {
  const sorted = [...patient.consultations].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return sorted.map((c, i) => {
    const indicators =
      (typeof c.weight === 'number' ? 1 : 0) +
      (typeof c.height === 'number' ? 1 : 0) +
      (typeof c.headCirc === 'number' ? 1 : 0);
    const intervalDays =
      i === 0
        ? 0
        : differenceInDays(parseISO(c.date), parseISO(sorted[i - 1].date));
    return {
      date: c.date,
      label: format(parseISO(c.date), 'dd/MM/yyyy'),
      ageMonths: differenceInMonths(parseISO(c.date), parseISO(patient.birthDate)),
      indicators,
      intervalDays,
    };
  });
}
