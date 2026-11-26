import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, isNetworkError, newIdempotencyKey } from './api';

/**
 * Volunteer check-in that survives bad Wi-Fi:
 * 1. before doors open the device downloads a manifest of valid signed QR payloads;
 * 2. a scan is verified online; if the network is down it is checked against the manifest,
 *    recorded locally and queued;
 * 3. the queue is synced in one batch (POST /check-in-batches) when the connection is back.
 */
import { verifyOffline, type Manifest, type QueuedScan, type ScanResult } from './scan-rules';

export type { Manifest, QueuedScan, ScanResult } from './scan-rules';

const manifestKey = (eventId: string) => `scan:manifest:${eventId}`;
const queueKey = (eventId: string) => `scan:queue:${eventId}`;
const seenKey = (eventId: string) => `scan:seen:${eventId}`;

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : fallback;
}

export async function downloadManifest(eventId: string) {
  const manifest = await api.get<Manifest>(`/events/${eventId}/offline-manifest`);
  await AsyncStorage.setItem(manifestKey(eventId), JSON.stringify(manifest));
  return manifest;
}

export const loadManifest = (eventId: string) => readJson<Manifest | null>(manifestKey(eventId), null);
export const loadQueue = (eventId: string) => readJson<QueuedScan[]>(queueKey(eventId), []);

const DENY: Record<string, string> = {
  DENIED_ALREADY_USED: 'Билет уже использован',
  DENIED_INVALID_STATUS: 'Билет неактивен (отменён или в очереди)',
  TICKET_NOT_FOUND: 'Билет не найден на этом мероприятии',
  FORBIDDEN: 'Вы не назначены на это мероприятие',
};

export async function scan(eventId: string, payload: string): Promise<ScanResult> {
  const clientScanId = newIdempotencyKey();
  try {
    await api.post(`/events/${eventId}/check-ins`, { client_scan_id: clientScanId, scanned_payload: payload });
    return { kind: 'granted', mode: 'online' };
  } catch (error) {
    if (!isNetworkError(error)) {
      const code = (error as { code?: string }).code ?? '';
      return { kind: 'denied', reason: DENY[code] ?? (error as Error).message, mode: 'online' };
    }
  }
  const [manifest, seen, queue] = await Promise.all([loadManifest(eventId), readJson<string[]>(seenKey(eventId), []), loadQueue(eventId)]);
  const result = verifyOffline(payload, manifest, seen);
  if (result.kind === 'granted' && manifest) {
    const ticket = manifest.tickets.find((t) => t.qr_payload === payload || t.ticket_code === payload)!;
    await AsyncStorage.multiSet([
      [seenKey(eventId), JSON.stringify([...seen, ticket.ticket_id])],
      [queueKey(eventId), JSON.stringify([...queue, { client_scan_id: clientScanId, scanned_payload: payload, scanned_at: new Date().toISOString() }])],
    ]);
  }
  return result;
}

export async function syncQueue(eventId: string, deviceId = 'campusmeet-mobile') {
  const queue = await loadQueue(eventId);
  if (!queue.length) return { received: 0, granted: 0 };
  const result = await api.post<{ received: number; granted: number }>(`/events/${eventId}/check-in-batches`, {
    device_id: deviceId,
    scans: queue.map(({ client_scan_id, scanned_payload }) => ({ client_scan_id, scanned_payload })),
  });
  await AsyncStorage.removeItem(queueKey(eventId));
  return result;
}
