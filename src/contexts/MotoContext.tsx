import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MotoProfile } from '@/types/moto';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

interface MotoContextType {
  motorcycles: MotoProfile[];
  currentMotoId: string | null;
  currentMoto: MotoProfile | null;
  addMotorcycle: (moto: Omit<MotoProfile, 'id'>) => string;
  updateMotorcycle: (id: string, moto: Partial<MotoProfile>) => void;
  deleteMotorcycle: (id: string) => void;
  setCurrentMoto: (id: string) => void;
  getStorageKey: (baseKey: string) => string;
}

const MotoContext = createContext<MotoContextType | undefined>(undefined);

export function MotoProvider({ children }: { children: ReactNode }) {
  const [motorcycles, setMotorcycles] = useState<MotoProfile[]>(() => {
    const stored = localStorage.getItem('moto-motorcycles');
    return stored ? JSON.parse(stored) : [];
  });

  const [currentMotoId, setCurrentMotoId] = useState<string | null>(() => {
    const stored = localStorage.getItem('moto-current-id');
    return stored || null;
  });

  // Persist motorcycles
  useEffect(() => {
    localStorage.setItem('moto-motorcycles', JSON.stringify(motorcycles));
  }, [motorcycles]);

  // Persist current moto id
  useEffect(() => {
    if (currentMotoId) {
      localStorage.setItem('moto-current-id', currentMotoId);
    }
  }, [currentMotoId]);

  // Get current motorcycle object
  const currentMoto = motorcycles.find(m => m.id === currentMotoId) || null;

  // Add a new motorcycle
  const addMotorcycle = (moto: Omit<MotoProfile, 'id'>): string => {
    const id = generateId();
    const newMoto = { ...moto, id };
    setMotorcycles(prev => [...prev, newMoto]);
    
    // If this is the first motorcycle, set it as current
    if (motorcycles.length === 0) {
      setCurrentMotoId(id);
    }
    
    return id;
  };

  // Update a motorcycle
  const updateMotorcycle = (id: string, updates: Partial<MotoProfile>) => {
    setMotorcycles(prev => prev.map(m => 
      m.id === id ? { ...m, ...updates } : m
    ));
  };

  // Delete a motorcycle and its associated data
  const deleteMotorcycle = (id: string) => {
    // Remove associated data
    const keysToRemove = [
      `moto-fuel-records-${id}`,
      `moto-maintenance-records-${id}`,
      `moto-part-records-${id}`,
      `moto-core-parts-${id}`,
      `moto-documents-${id}`,
      `moto-notifications-${id}`,
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));

    setMotorcycles(prev => prev.filter(m => m.id !== id));
    
    // If deleting current moto, switch to first available
    if (currentMotoId === id) {
      const remaining = motorcycles.filter(m => m.id !== id);
      setCurrentMotoId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Set current motorcycle
  const setCurrentMoto = (id: string) => {
    if (motorcycles.some(m => m.id === id)) {
      setCurrentMotoId(id);
    }
  };

  // Get storage key with current moto id
  const getStorageKey = (baseKey: string): string => {
    if (currentMotoId) {
      return `${baseKey}-${currentMotoId}`;
    }
    return baseKey;
  };

  return (
    <MotoContext.Provider value={{
      motorcycles,
      currentMotoId,
      currentMoto,
      addMotorcycle,
      updateMotorcycle,
      deleteMotorcycle,
      setCurrentMoto,
      getStorageKey,
    }}>
      {children}
    </MotoContext.Provider>
  );
}

export function useMoto() {
  const context = useContext(MotoContext);
  if (context === undefined) {
    throw new Error('useMoto must be used within a MotoProvider');
  }
  return context;
}