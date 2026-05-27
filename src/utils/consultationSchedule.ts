/**
 * Pediatric consultation scheduling based on SBP (Sociedade Brasileira de Pediatria) guidelines.
 */
import { differenceInMonths } from 'date-fns';

/** Returns the recommended interval in months between consultations for a given age. */
export function getRecommendedIntervalMonths(ageMonths: number): number {
  if (ageMonths < 1)  return 0.5;  // every 15 days
  if (ageMonths < 6)  return 1;    // monthly
  if (ageMonths < 12) return 2;    // every 2 months
  if (ageMonths < 24) return 3;    // every 3 months
  if (ageMonths < 72) return 6;    // every 6 months
  return 12;                        // annually (6+ years)
}

export function intervalLabel(months: number): string {
  if (months === 0.5) return 'a cada 15 dias';
  if (months === 1)   return 'mensal';
  if (months === 2)   return 'a cada 2 meses';
  if (months === 3)   return 'a cada 3 meses';
  if (months === 6)   return 'a cada 6 meses';
  return 'anual';
}

export type NextConsultUrgency = 'overdue' | 'soon' | 'ok';

export interface NextConsultInfo {
  dueDate: Date;
  intervalMonths: number;
  isOverdue: boolean;
  daysUntilDue: number;
  label: string;
  urgency: NextConsultUrgency;
}

export function getNextConsultInfo(
  lastConsultDate: string,
  birthDate: string
): NextConsultInfo {
  const lastDate = new Date(lastConsultDate + 'T00:00:00');
  const ageAtLast = differenceInMonths(lastDate, new Date(birthDate + 'T00:00:00'));
  const intervalMonths = getRecommendedIntervalMonths(ageAtLast);

  const dueDate = new Date(lastDate);
  if (intervalMonths === 0.5) {
    dueDate.setDate(dueDate.getDate() + 15);
  } else {
    dueDate.setMonth(dueDate.getMonth() + intervalMonths);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysUntilDue < 0;

  const urgency: NextConsultUrgency = isOverdue ? 'overdue' : daysUntilDue <= 30 ? 'soon' : 'ok';

  const abs = Math.abs(daysUntilDue);
  let label: string;
  if (isOverdue) {
    label = abs < 30 ? `${abs}d em atraso` : `${Math.round(abs / 30)}m em atraso`;
  } else if (daysUntilDue === 0) {
    label = 'Hoje';
  } else if (daysUntilDue <= 30) {
    label = `em ${daysUntilDue} dias`;
  } else {
    const m = Math.round(daysUntilDue / 30);
    label = `em ${m} ${m === 1 ? 'mês' : 'meses'}`;
  }

  return { dueDate, intervalMonths, isOverdue, daysUntilDue, label, urgency };
}
