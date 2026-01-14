import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PendingPrescription {
  imageBase64: string;
  imagePath?: string;
  prescriptionId?: string;
  parsedMedicines: string[];
  consentGiven: boolean;
}

interface PrescriptionContextType {
  pendingPrescription: PendingPrescription | null;
  setPendingPrescription: (prescription: PendingPrescription | null) => void;
  clearPrescription: () => void;
}

const PrescriptionContext = createContext<PrescriptionContextType | undefined>(undefined);

export function PrescriptionProvider({ children }: { children: ReactNode }) {
  const [pendingPrescription, setPendingPrescription] = useState<PendingPrescription | null>(null);

  const clearPrescription = () => setPendingPrescription(null);

  return (
    <PrescriptionContext.Provider
      value={{
        pendingPrescription,
        setPendingPrescription,
        clearPrescription,
      }}
    >
      {children}
    </PrescriptionContext.Provider>
  );
}

export function usePrescription() {
  const context = useContext(PrescriptionContext);
  if (!context) {
    throw new Error('usePrescription must be used within PrescriptionProvider');
  }
  return context;
}
