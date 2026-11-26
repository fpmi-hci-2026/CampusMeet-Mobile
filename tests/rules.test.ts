import { describe, expect, it } from 'vitest';
import { availability, seatsText } from '@/lib/format';
import { verifyOffline, type Manifest } from '@/lib/scan-rules';
import { validateAuth } from '@/lib/validation';

const manifest: Manifest = {
  event_id: 'ev-1',
  generated_at: '2026-12-05T08:00:00Z',
  valid_until: '2026-12-05T20:00:00Z',
  tickets: [
    { ticket_id: 't1', ticket_code: 'DEMO-AAA', status: 'registered', qr_payload: 'v1.t1.u1.sig' },
    { ticket_id: 't2', ticket_code: 'DEMO-BBB', status: 'checked_in', qr_payload: 'v1.t2.u2.sig' },
  ],
};

describe('offline check-in rules', () => {
  it('grants a valid signed payload or ticket code once', () => {
    expect(verifyOffline('v1.t1.u1.sig', manifest, [])).toMatchObject({ kind: 'granted', mode: 'offline' });
    expect(verifyOffline('DEMO-AAA', manifest, [])).toMatchObject({ kind: 'granted' });
  });

  it('denies reuse, unknown codes and missing manifest', () => {
    expect(verifyOffline('v1.t1.u1.sig', manifest, ['t1'])).toMatchObject({ kind: 'denied', reason: 'Билет уже использован' });
    expect(verifyOffline('v1.t2.u2.sig', manifest, [])).toMatchObject({ kind: 'denied' });
    expect(verifyOffline('forged', manifest, [])).toMatchObject({ kind: 'denied', reason: 'Билет не найден на этом мероприятии' });
    expect(verifyOffline('v1.t1.u1.sig', null, [])).toMatchObject({ kind: 'denied' });
  });
});

describe('auth form rules', () => {
  it('validates registration', () => {
    expect(Object.keys(validateAuth('register', { name: 'A', email: 'x', password: 'abc' }))).toEqual(['name', 'email', 'password']);
    expect(validateAuth('register', { name: 'Анна Ли', email: 'anna@bsu.by', password: 'пароль2026' })).toEqual({});
    expect(validateAuth('login', { name: '', email: 'anna@bsu.by', password: '' })).toEqual({ password: 'Введите пароль' });
  });
});

describe('shared formatting', () => {
  it('matches web client seat states', () => {
    const e = { status: 'registration_open' as const, capacity_limit: 2, waitlist_enabled: true };
    expect(availability({ ...e, free_spots: 0 })).toBe('waitlist');
    expect(seatsText({ ...e, free_spots: 2 })).toBe('2 места из 2');
  });
});
