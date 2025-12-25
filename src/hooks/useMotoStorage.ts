import { useState, useEffect, useCallback } from 'react';
import { useMoto } from '@/contexts/MotoContext';

export function useMotoStorage<T>(baseKey: string, initialValue: T) {
  const { currentMotoId, getStorageKey } = useMoto();
  const key = getStorageKey(baseKey);

  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Re-read value when moto changes
  useEffect(() => {
    setStoredValue(readValue());
  }, [currentMotoId, readValue]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const deleteItem = useCallback((id: string) => {
    if (Array.isArray(storedValue)) {
      const newValue = (storedValue as any[]).filter((item: any) => item.id !== id) as T;
      setValue(newValue);
      return true;
    }
    return false;
  }, [storedValue, setValue]);

  return { value: storedValue, setValue, deleteItem };
}