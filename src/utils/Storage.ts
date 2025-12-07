// src/utils/Storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'SESSIONS';

export type Session = {
  id: number;
  date: string; // YYYY-MM-DD
  duration: number; // dakika
  category: string;
  distractionCount: number;
  isCompleted: boolean;
};

export const saveSession = async (session: Session): Promise<void> => {
  const existing = await getSessions();
  const updated = [...existing, session];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const getSessions = async (): Promise<Session[]> => {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const clearSessions = async (): Promise<void> => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};
