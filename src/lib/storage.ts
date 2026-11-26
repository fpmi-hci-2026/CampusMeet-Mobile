import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/** Tokens: Keychain / Keystore on devices, localStorage on web (SecureStore has no web backend). */
export const secure = {
  async get(key: string) {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string) {
    if (Platform.OS === 'web') return globalThis.localStorage?.setItem(key, value);
    return SecureStore.setItemAsync(key, value);
  },
  async remove(key: string) {
    if (Platform.OS === 'web') return globalThis.localStorage?.removeItem(key);
    return SecureStore.deleteItemAsync(key);
  },
};

export interface Cached<T> {
  data: T;
  savedAt: number;
}

/** Offline cache of API responses (catalogue, tickets, programme) for use without network. */
export const cache = {
  async read<T>(key: string): Promise<Cached<T> | null> {
    try {
      const raw = await AsyncStorage.getItem('cache:' + key);
      return raw ? (JSON.parse(raw) as Cached<T>) : null;
    } catch {
      return null;
    }
  },
  async write<T>(key: string, data: T) {
    await AsyncStorage.setItem('cache:' + key, JSON.stringify({ data, savedAt: Date.now() }));
  },
  async clearUserData() {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys.filter((k) => k.startsWith('cache:/me') || k.startsWith('scan')));
  },
};
