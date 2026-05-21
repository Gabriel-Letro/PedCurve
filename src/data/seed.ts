import type { Patient } from '../context/AppContext';

/**
 * Demo / mock data so charts and reports are populated on first run.
 * Seeded only when localStorage is empty. Access codes are fixed for
 * easy testing of the Parent view.
 */
export const seedPatients: Patient[] = [
  {
    id: 'seed-maria-eduarda',
    name: 'Maria Eduarda',
    birthDate: '2025-02-10',
    gender: 'F',
    parentName: 'Camila Souza',
    accessCode: 'MARIA1',
    consultations: [
      { id: 's-me-1', date: '2025-02-12', weight: 3.3, height: 49.5, headCirc: 34.2 },
      { id: 's-me-2', date: '2025-04-10', weight: 5.4, height: 57.8, headCirc: 39.1 },
      { id: 's-me-3', date: '2025-07-15', weight: 7.2, height: 65.1, headCirc: 42.4 },
      { id: 's-me-4', date: '2025-11-20', weight: 8.6, height: 71.5, headCirc: 44.6 },
      { id: 's-me-5', date: '2026-04-05', weight: 9.8, height: 76.3, headCirc: 45.8 },
    ],
  },
  {
    id: 'seed-joao-pedro',
    name: 'João Pedro',
    birthDate: '2023-08-22',
    gender: 'M',
    parentName: 'Roberto Lima',
    accessCode: 'JOAO22',
    consultations: [
      { id: 's-jp-1', date: '2023-09-01', weight: 3.6, height: 51.0, headCirc: 35.0 },
      { id: 's-jp-2', date: '2024-02-22', weight: 7.9, height: 67.2, headCirc: 43.0 },
      { id: 's-jp-3', date: '2024-08-22', weight: 9.8, height: 74.6, headCirc: 46.1 },
      { id: 's-jp-4', date: '2025-08-22', weight: 12.4, height: 86.5, headCirc: 48.2 },
      { id: 's-jp-5', date: '2026-03-15', weight: 14.1, height: 93.0 },
    ],
  },
];
