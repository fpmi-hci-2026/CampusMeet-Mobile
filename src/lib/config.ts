import { Platform } from 'react-native';

/**
 * API base URL. Set EXPO_PUBLIC_API_BASE_URL in .env for a phone on the same Wi-Fi
 * (e.g. http://192.168.1.10:8000/api/v1). Android emulator reaches the host via 10.0.2.2.
 */
export const API_BASE = (
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8000/api/v1' : 'http://127.0.0.1:8000/api/v1')
).replace(/\/$/, '');
