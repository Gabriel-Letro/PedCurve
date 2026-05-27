import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { seedPatients } from '../data/seed';

export type Gender = 'M' | 'F';

/** Soft-delete status. Absent/'active' = visible; 'inactive' = archived. */
export type PatientStatus = 'active' | 'inactive';

export interface Consultation {
  id: string;
  date: string; // ISO date string
  weight?: number;
  height?: number;
  headCirc?: number;
  notes?: string;
}

export interface Patient {
  id: string;
  name: string;
  birthDate: string; // ISO date string
  gender: Gender;
  parentName: string;
  accessCode: string;
  consultations: Consultation[];
  status?: PatientStatus; // optional for backwards compatibility
}

interface AppContextType {
  patients: Patient[];
  addPatient: (patient: Omit<Patient, 'id' | 'accessCode' | 'consultations'>) => void;
  addPatientWithConsultation: (
    patient: Omit<Patient, 'id' | 'accessCode' | 'consultations'>,
    consultation: Omit<Consultation, 'id'>
  ) => void;
  getPatient: (id: string) => Patient | undefined;
  getPatientByAccessCode: (code: string) => Patient | undefined;
  addConsultation: (patientId: string, consultation: Omit<Consultation, 'id'>) => void;
  deleteConsultation: (patientId: string, consultationId: string) => void;
  /** Soft delete: marks the patient inactive (recoverable). */
  archivePatient: (patientId: string) => void;
  /** Restores a soft-deleted patient. */
  restorePatient: (patientId: string) => void;
  /** Hard delete: permanently removes the patient and all data. */
  deletePatient: (patientId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = '@PedCurve:patients';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>(() => {
    let stored: Patient[] = [];
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          stored = parsed as Patient[];
        } else {
          throw new Error('Formato inválido no armazenamento local.');
        }
      }
    } catch (err) {
      console.error('PedCurve: dados corrompidos no localStorage, reiniciando.', err);
      try { localStorage.removeItem(LOCAL_STORAGE_KEY); } catch { /* ignore */ }
    }
    // Always ensure seed patients are present (re-insert any that were removed).
    const storedIds = new Set(stored.map((p) => p.id));
    const missingSeed = seedPatients.filter((p) => !storedIds.has(p.id));
    return [...missingSeed, ...stored];
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(patients));
    } catch (err) {
      console.error('PedCurve: falha ao salvar no localStorage.', err);
    }
  }, [patients]);

  const randomCode = () =>
    Math.random().toString(36).substring(2, 8).toUpperCase();

  const generateUniqueAccessCode = (existing: Patient[]): string => {
    const taken = new Set(existing.map((p) => p.accessCode.toUpperCase()));
    let code = randomCode();
    let guard = 0;
    while (taken.has(code)) {
      code = randomCode();
      if (++guard > 50) {
        code = (code + randomCode()).substring(0, 8);
        if (!taken.has(code)) break;
      }
    }
    return code;
  };

  const addPatient = (
    patientData: Omit<Patient, 'id' | 'accessCode' | 'consultations'>
  ) => {
    setPatients((prev) => {
      const newPatient: Patient = {
        ...patientData,
        id: uuidv4(),
        accessCode: generateUniqueAccessCode(prev),
        consultations: [],
        status: 'active',
      };
      return [...prev, newPatient];
    });
  };

  const getPatient = (id: string) => patients.find((p) => p.id === id);

  const getPatientByAccessCode = (code: string) =>
    patients.find(
      (p) => p.accessCode.toUpperCase() === code.trim().toUpperCase()
    );

  const addConsultation = (
    patientId: string,
    consultationData: Omit<Consultation, 'id'>
  ) => {
    setPatients((prev) =>
      prev.map((patient) => {
        if (patient.id === patientId) {
          return {
            ...patient,
            consultations: [
              ...patient.consultations,
              { ...consultationData, id: uuidv4() },
            ].sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            ),
          };
        }
        return patient;
      })
    );
  };

  const deleteConsultation = (patientId: string, consultationId: string) => {
    setPatients((prev) =>
      prev.map((patient) => {
        if (patient.id === patientId) {
          return {
            ...patient,
            consultations: patient.consultations.filter(
              (c) => c.id !== consultationId
            ),
          };
        }
        return patient;
      })
    );
  };

  const setStatus = (patientId: string, status: PatientStatus) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, status } : p))
    );
  };

  const addPatientWithConsultation = (
    patientData: Omit<Patient, 'id' | 'accessCode' | 'consultations'>,
    consultationData: Omit<Consultation, 'id'>
  ) => {
    setPatients((prev) => {
      const newPatient: Patient = {
        ...patientData,
        id: uuidv4(),
        accessCode: generateUniqueAccessCode(prev),
        consultations: [{ ...consultationData, id: uuidv4() }],
        status: 'active',
      };
      return [...prev, newPatient];
    });
  };

  const archivePatient = (patientId: string) => setStatus(patientId, 'inactive');
  const restorePatient = (patientId: string) => setStatus(patientId, 'active');

  const deletePatient = (patientId: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== patientId));
  };

  return (
    <AppContext.Provider
      value={{
        patients,
        addPatient,
        addPatientWithConsultation,
        getPatient,
        getPatientByAccessCode,
        addConsultation,
        deleteConsultation,
        archivePatient,
        restorePatient,
        deletePatient,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
