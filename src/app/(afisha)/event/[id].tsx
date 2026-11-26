import * as Haptics from 'expo-haptics';
import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge, Body, Button, Notice, OfflineBanner, Title } from '@/components/ui';
import { Fonts, MaxContentWidth, Space, TAP, usePalette } from '@/constants/theme';
import { ApiError, api, newIdempotencyKey } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { availability, fullDate, seatsText, statusLabels, timeRange, typeLabels } from '@/lib/format';
import type { CampusEvent, ScheduleItem, Ticket } from '@/lib/types';
import { useResource } from '@/lib/use-resource';

const ERRORS: Record<string, string> = {
  QUOTA_EXHAUSTED: 'Места закончились. Можно встать в лист ожидания.',
  REGISTRATION_CLOSED: 'Регистрация закрыта.',
  ALREADY_REGISTERED: 'Вы уже записаны — билет во вкладке «Билеты».',
  NETWORK_ERROR: 'Нет связи. Запись сохранится только онлайн — попробуйте, когда появится сеть.',
};

function confirm(title: string, message: string, action: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(globalThis.confirm?.(`${title}\n\n${message}`) ?? true);
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: 'Оставить', style: 'cancel', onPress: () => resolve(false) },
      { text: action, style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = usePalette();
  const router = useRouter();
  const { user } = useAuth();
  const event = useResource<CampusEvent>(`/events/${id}`);
  const schedule = useResource<ScheduleItem[]>(`/events/${id}/schedule`);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const e = event.data;
  const state = e ? availability(e) : 'closed';
  const ticket = e?.my_ticket;

  async function register() {
    setBusy(true);
    setMessage(null);
    try {
      const created = await api.post<Ticket>(`/events/${id}/registrations`, { join_waitlist: true }, { 'Idempotency-Key': newIdempotencyKey() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      setMessage({ tone: 'success', text: created.status === 'registered' ? 'Готово! QR-билет — во вкладке «Билеты».' : 'Вы в листе ожидания. Билет появится, когда освободится место.' });
      event.reload();
    } catch (error) {
      const code = error instanceof ApiError ? error.code : '';
      setMessage({ tone: 'error', text: ERRORS[code] ?? (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!ticket || !(await confirm('Отменить запись?', 'Место сразу получит первый из листа ожидания.', 'Отменить запись'))) return;
    setBusy(true);
    try {
      await api.del(`/tickets/${ticket.id}`);
      setMessage({ tone: 'success', text: 'Запись отменена.' });
      event.reload();
    } catch (error) {
      setMessage({ tone: 'error', text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function toggle(item: ScheduleItem) {
    if (!user) return router.push('/profile');
    const next = (schedule.data ?? []).map((i) => (i.id === item.id ? { ...i, in_my_schedule: !i.in_my_schedule } : i));
    schedule.setData(next);
    Haptics.selectionAsync().catch(() => undefined);
    try {
      await (item.in_my_schedule ? api.del(`/me/schedule/${item.id}`) : api.put(`/me/schedule/${item.id}`));
    } catch (error) {
      schedule.reload();
      setMessage({ tone: 'error', text: (error as Error).message });
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: e ? typeLabels[e.event_type] : '' }} />
      {event.offline && <OfflineBanner savedAt={event.savedAt} />}
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={event.refreshing} onRefresh={() => { event.refresh(); schedule.refresh(); }} tintColor={c.text} />}
        contentContainerStyle={styles.content}>
        {!e ? (
          event.error ? <Notice tone="error">{event.error.message}</Notice> : <Body muted>Загружаем…</Body>
        ) : (
          <>
            {e.status !== 'registration_open' && <Badge label={statusLabels[e.status]} />}
            <Title style={styles.title}>{e.title}</Title>
            <View style={styles.facts}>
              <Body>
                {fullDate(e.start_time)}, {timeRange(e.start_time, e.end_time)}
              </Body>
              <Body muted>
                {e.venue_name}, {e.venue_address}
              </Body>
            </View>

            <View style={[styles.panel, { borderColor: c.lineStrong }]}>
              <Text style={[styles.seats, { color: state === 'open' ? c.accent : state === 'closed' ? c.textTertiary : state === 'few' ? c.warnInk : c.danger }]}>{seatsText(e)}</Text>
              {e.waitlist_count > 0 && <Body muted small>В листе ожидания: {e.waitlist_count}</Body>}
              {ticket && (
                <Badge
                  tone={ticket.status === 'waitlisted' ? 'warn' : 'accent'}
                  label={ticket.status === 'waitlisted' ? 'Вы в листе ожидания' : ticket.status === 'checked_in' ? 'Вы уже прошли' : 'Вы записаны'}
                />
              )}
              {!user ? (
                state !== 'closed' && <Button title="Войти и записаться" onPress={() => router.push('/profile')} />
              ) : ticket ? (
                <>
                  {ticket.status !== 'waitlisted' && <Button title="Открыть билет" onPress={() => router.push({ pathname: '/tickets/[id]', params: { id: ticket.id } })} />}
                  {ticket.status !== 'checked_in' && <Button tone="danger" title={ticket.status === 'waitlisted' ? 'Покинуть очередь' : 'Отменить запись'} onPress={cancel} disabled={busy} />}
                </>
              ) : state === 'open' || state === 'few' ? (
                <Button tone="accent" title="Записаться" onPress={register} loading={busy} />
              ) : state === 'waitlist' ? (
                <Button title="Встать в лист ожидания" onPress={register} loading={busy} />
              ) : null}
              {message && <Notice tone={message.tone}>{message.text}</Notice>}
            </View>

            <Text accessibilityRole="header" style={[styles.h2, { color: c.text }]}>
              О мероприятии
            </Text>
            <Body muted style={{ lineHeight: 25 }}>
              {e.description}
            </Body>

            <Text accessibilityRole="header" style={[styles.h2, { color: c.text }]}>
              Программа
            </Text>
            {!user && (
              <Link href="/profile" style={{ color: c.text, textDecorationLine: 'underline', minHeight: TAP, paddingVertical: Space.m }}>
                Войдите, чтобы собрать личную программу
              </Link>
            )}
            {(schedule.data ?? []).length === 0 && <Body muted>Программа появится ближе к дате.</Body>}
            {(schedule.data ?? []).map((item) => (
              <View key={item.id} style={[styles.session, { borderTopColor: c.line }]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.time, { color: c.textTertiary }]}>{timeRange(item.start_time, item.end_time)}</Text>
                  <Text style={[styles.sessionTitle, { color: c.text }]}>{item.title}</Text>
                  <Body muted small>
                    {item.room}
                    {item.speaker_name ? `, ${item.speaker_name}` : ''}
                  </Body>
                </View>
                {user && (
                  <Pressable
                    onPress={() => toggle(item)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: item.in_my_schedule }}
                    accessibilityLabel={item.in_my_schedule ? `Убрать «${item.title}» из программы` : `Добавить «${item.title}» в программу`}
                    hitSlop={8}
                    style={styles.star}>
                    <Text style={{ fontSize: 26, color: item.in_my_schedule ? c.accent : c.textTertiary }}>{item.in_my_schedule ? '★' : '☆'}</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: Space.l, gap: Space.l, paddingBottom: Space.xxl * 2, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  title: { fontSize: 34, lineHeight: 40 },
  facts: { gap: Space.xs },
  panel: { borderWidth: 1, borderRadius: 12, padding: Space.l, gap: Space.m },
  seats: { fontSize: 16, fontWeight: '700' },
  h2: { fontFamily: Fonts.display, fontSize: 24, marginTop: Space.l },
  session: { flexDirection: 'row', alignItems: 'center', gap: Space.m, paddingVertical: Space.m, borderTopWidth: StyleSheet.hairlineWidth },
  time: { fontFamily: Fonts.mono, fontSize: 13 },
  sessionTitle: { fontSize: 16, fontWeight: '600' },
  star: { width: TAP, height: TAP, alignItems: 'center', justifyContent: 'center' },
});
