/** Pure offline check-in rules (no React Native imports — unit-tested with Vitest). */
export interface Manifest {
  event_id: string;
  generated_at: string;
  valid_until: string;
  tickets: { ticket_id: string; ticket_code: string; status: string; qr_payload: string | null }[];
}

export interface QueuedScan {
  client_scan_id: string;
  scanned_payload: string;
  scanned_at: string;
}

export type ScanResult =
  | { kind: 'granted'; mode: 'online' | 'offline'; ticketCode?: string }
  | { kind: 'denied'; reason: string; mode: 'online' | 'offline' };

export const DENY: Record<string, string> = {
  DENIED_ALREADY_USED: 'Билет уже использован',
  DENIED_INVALID_STATUS: 'Билет неактивен (отменён или в очереди)',
  TICKET_NOT_FOUND: 'Билет не найден на этом мероприятии',
  FORBIDDEN: 'Вы не назначены на это мероприятие',
};

/** Pure offline decision — exported for unit tests. */
export function verifyOffline(payload: string, manifest: Manifest | null, seen: string[]): ScanResult {
  if (!manifest) return { kind: 'denied', reason: 'Нет связи и не загружен офлайн-список билетов', mode: 'offline' };
  const ticket = manifest.tickets.find((t) => t.qr_payload === payload || t.ticket_code === payload);
  if (!ticket) return { kind: 'denied', reason: DENY.TICKET_NOT_FOUND, mode: 'offline' };
  if (ticket.status === 'checked_in' || seen.includes(ticket.ticket_id)) return { kind: 'denied', reason: DENY.DENIED_ALREADY_USED, mode: 'offline' };
  return { kind: 'granted', mode: 'offline', ticketCode: ticket.ticket_code };
}

