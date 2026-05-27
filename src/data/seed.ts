import type { Patient } from '../context/AppContext';

/**
 * Demo patients seeded on first run (empty localStorage).
 * Each illustrates a different growth profile so charts and reports
 * are pre-populated for demonstration purposes.
 *
 * Profiles:
 *  1. Ana Beatriz  — Menina, 12 m, crescimento NORMAL (peso, altura e PC em torno do P50)
 *  2. Lucas Miguel — Menino, 28 m, crescimento NORMAL ao longo de 2 anos
 *  3. Sofia        — Menina,  8 m, ABAIXO do esperado: peso e altura < -2 DP
 *  4. Pedro        — Menino, 18 m, ACIMA do esperado em peso (sobrepeso persistente)
 *  5. Isabela      — Menina,  4 m, peso e altura normais, PC ABAIXO de -2 DP
 */
export const seedPatients: Patient[] = [
  // ── 1. Ana Beatriz Ferreira ─────────────────────────────────────────────────
  // Desenvolvimento normal. Todos os pontos próximos ao P50 da OMS (meninas).
  {
    id: 'seed-ana-beatriz',
    name: 'Ana Beatriz Ferreira',
    birthDate: '2025-05-10',
    gender: 'F',
    parentName: 'Fernanda Ferreira',
    accessCode: 'ANAB01',
    status: 'active',
    consultations: [
      { id: 'ab-1', date: '2025-05-10', weight: 3.2, height: 49.0, headCirc: 33.8 },
      { id: 'ab-2', date: '2025-07-10', weight: 5.1, height: 57.2, headCirc: 38.4 },
      { id: 'ab-3', date: '2025-09-10', weight: 6.4, height: 62.3, headCirc: 40.7 },
      { id: 'ab-4', date: '2025-11-10', weight: 7.3, height: 65.8, headCirc: 42.3 },
      { id: 'ab-5', date: '2026-02-10', weight: 8.2, height: 70.2, headCirc: 44.0 },
      { id: 'ab-6', date: '2026-05-10', weight: 9.1, height: 74.1, headCirc: 45.3 },
    ],
  },

  // ── 2. Lucas Miguel Costa ───────────────────────────────────────────────────
  // Desenvolvimento normal ao longo de 28 meses. Ganho de peso e estatura
  // dentro dos limites esperados da OMS em todas as consultas.
  {
    id: 'seed-lucas-miguel',
    name: 'Lucas Miguel Costa',
    birthDate: '2024-01-15',
    gender: 'M',
    parentName: 'Roberto Costa',
    accessCode: 'LUCM01',
    status: 'active',
    consultations: [
      { id: 'lm-1', date: '2024-01-15', weight: 3.4, height: 50.0, headCirc: 34.7 },
      { id: 'lm-2', date: '2024-04-15', weight: 6.5, height: 61.6, headCirc: 40.7 },
      { id: 'lm-3', date: '2024-07-15', weight: 8.0, height: 67.8, headCirc: 43.5 },
      { id: 'lm-4', date: '2025-01-15', weight: 9.7, height: 76.0, headCirc: 46.3 },
      { id: 'lm-5', date: '2025-07-15', weight: 11.0, height: 82.5, headCirc: 47.5 },
      { id: 'lm-6', date: '2026-01-15', weight: 12.3, height: 88.0, headCirc: 48.4 },
      { id: 'lm-7', date: '2026-05-01', weight: 13.2, height: 91.5 },
    ],
  },

  // ── 3. Sofia Rodrigues ──────────────────────────────────────────────────────
  // Peso e altura consistentemente abaixo de -2 DP desde o nascimento.
  // Perfil sugestivo de atraso de crescimento e baixo peso para a idade.
  {
    id: 'seed-sofia-rodrigues',
    name: 'Sofia Rodrigues',
    birthDate: '2025-09-15',
    gender: 'F',
    parentName: 'Mariana Rodrigues',
    accessCode: 'SOFR01',
    status: 'active',
    consultations: [
      { id: 'sr-1', date: '2025-09-15', weight: 2.3, height: 45.0, headCirc: 31.5 },
      { id: 'sr-2', date: '2025-11-15', weight: 3.5, height: 51.5, headCirc: 35.2 },
      { id: 'sr-3', date: '2026-01-15', weight: 4.5, height: 56.5, headCirc: 37.3 },
      { id: 'sr-4', date: '2026-03-15', weight: 5.3, height: 60.8, headCirc: 39.0 },
      { id: 'sr-5', date: '2026-05-15', weight: 5.9, height: 63.2, headCirc: 40.2 },
    ],
  },

  // ── 4. Pedro Henrique Alves ─────────────────────────────────────────────────
  // Peso acima de +2 DP (acima do P97) em todas as consultas, com estatura
  // dentro dos limites normais. Perfil de sobrepeso progressivo.
  {
    id: 'seed-pedro-alves',
    name: 'Pedro Henrique Alves',
    birthDate: '2024-11-01',
    gender: 'M',
    parentName: 'Carla Alves',
    accessCode: 'PEDH01',
    status: 'active',
    consultations: [
      { id: 'pa-1', date: '2024-11-01', weight: 4.1, height: 50.8, headCirc: 35.0 },
      { id: 'pa-2', date: '2025-02-01', weight: 8.2, height: 62.0, headCirc: 41.2 },
      { id: 'pa-3', date: '2025-05-01', weight: 11.2, height: 68.5, headCirc: 44.0 },
      { id: 'pa-4', date: '2025-08-01', weight: 13.5, height: 73.5, headCirc: 46.0 },
      { id: 'pa-5', date: '2025-11-01', weight: 15.0, height: 77.5, headCirc: 47.5 },
      { id: 'pa-6', date: '2026-02-01', weight: 16.8, height: 81.0 },
      { id: 'pa-7', date: '2026-05-01', weight: 18.5, height: 84.5 },
    ],
  },

  // ── 5. Isabela Moraes ───────────────────────────────────────────────────────
  // Peso e altura dentro do esperado, porém perímetro cefálico abaixo de -2 DP
  // em todos os registros. Perfil que requer acompanhamento neurológico.
  {
    id: 'seed-isabela-moraes',
    name: 'Isabela Moraes',
    birthDate: '2026-01-22',
    gender: 'F',
    parentName: 'Juliana Moraes',
    accessCode: 'ISAM01',
    status: 'active',
    consultations: [
      { id: 'im-1', date: '2026-01-22', weight: 3.2, height: 49.5, headCirc: 31.5 },
      { id: 'im-2', date: '2026-02-22', weight: 4.1, height: 53.8, headCirc: 33.5 },
      { id: 'im-3', date: '2026-03-22', weight: 5.0, height: 57.3, headCirc: 35.0 },
      { id: 'im-4', date: '2026-05-22', weight: 6.3, height: 61.8, headCirc: 37.2 },
    ],
  },
];
