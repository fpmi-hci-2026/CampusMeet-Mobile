import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Badge, Body, Button, Notice } from '@/components/ui';
import { MaxContentWidth, Radius, Space, TAP, usePalette } from '@/constants/theme';
import { dateTime } from '@/lib/format';
import { downloadManifest, loadManifest, loadQueue, scan, syncQueue, type Manifest, type ScanResult } from '@/lib/offline-scans';
import type { CampusEvent } from '@/lib/types';
import { useResource } from '@/lib/use-resource';

/** Volunteer check-in: camera QR scan (or manual code), offline fallback and batch sync. */
export default function ScannerScreen() {
  const c = usePalette();
  const events = useResource<CampusEvent[]>('/me/staff-events');
  const [eventId, setEventId] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState<ScanResult | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [queued, setQueued] = useState(0);
  const [manual, setManual] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const lock = useRef(false);

  const active = (events.data ?? []).filter((e) => e.status !== 'completed' && e.status !== 'draft' && e.status !== 'cancelled');
  const current = eventId ?? active[0]?.id ?? null;

  useEffect(() => {
    if (!current) return;
    loadManifest(current).then(setManifest);
    loadQueue(current).then((q) => setQueued(q.length));
  }, [current]);

  async function handle(payload: string) {
    if (!current || lock.current || !payload.trim()) return;
    lock.current = true;
    const res = await scan(current, payload.trim());
    setResult(res);
    Haptics.notificationAsync(res.kind === 'granted' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => undefined);
    setQueued((await loadQueue(current)).length);
    setTimeout(() => (lock.current = false), 1500);
  }

  async function prepareOffline() {
    if (!current) return;
    try {
      const m = await downloadManifest(current);
      setManifest(m);
      setStatus(`Офлайн-список загружен: ${m.tickets.length} билетов`);
    } catch (e) {
      setStatus((e as Error).message);
    }
  }

  async function sync() {
    if (!current) return;
    try {
      const r = await syncQueue(current);
      setQueued(0);
      setStatus(`Синхронизировано сканов: ${r.received}, подтверждено: ${r.granted}`);
    } catch (e) {
      setStatus((e as Error).message);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {active.length === 0 && !events.loading && <Notice tone="info">Вы не назначены волонтёром ни на одно мероприятие.</Notice>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.events} accessibilityRole="radiogroup" accessibilityLabel="Мероприятие">
        {active.map((e) => {
          const selected = e.id === current;
          return (
            <Pressable
              key={e.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setEventId(e.id)}
              style={[styles.chip, { backgroundColor: selected ? c.inverse : 'transparent', borderColor: selected ? c.inverse : c.lineStrong }]}>
              <Text numberOfLines={1} style={{ color: selected ? c.onInverse : c.text, fontWeight: '600' }}>
                {e.title}
              </Text>
              <Text style={{ color: selected ? c.onInverse : c.textTertiary, fontSize: 12 }}>{dateTime(e.start_time)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {current && (
        <>
          <View style={[styles.camera, { backgroundColor: c.surface }]}>
            {permission?.granted ? (
              <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={({ data }) => handle(data)} />
            ) : (
              <View style={styles.cameraOff}>
                <Body muted>Камера нужна для сканирования QR-кодов.</Body>
                <Button title="Разрешить камеру" onPress={requestPermission} />
              </View>
            )}
          </View>

          {result && (
            <View
              accessibilityLiveRegion="assertive"
              accessibilityRole="alert"
              style={[styles.result, { backgroundColor: result.kind === 'granted' ? c.accentSoft : c.dangerSoft }]}>
              <Text style={[styles.resultTitle, { color: result.kind === 'granted' ? c.accentInk : c.danger }]}>{result.kind === 'granted' ? 'Проход разрешён' : 'Отказ'}</Text>
              {result.kind === 'denied' && <Body style={{ color: c.danger }}>{result.reason}</Body>}
              <Badge label={result.mode === 'offline' ? 'Проверено офлайн, ждёт синхронизации' : 'Проверено сервером'} tone={result.mode === 'offline' ? 'warn' : 'neutral'} />
            </View>
          )}

          <View style={styles.manual}>
            <TextInput
              value={manual}
              onChangeText={setManual}
              placeholder="Код билета вручную, DEMO-…"
              placeholderTextColor={c.textTertiary}
              autoCapitalize="characters"
              accessibilityLabel="Код билета вручную"
              style={[styles.input, { borderColor: c.lineStrong, color: c.text }]}
              onSubmitEditing={() => handle(manual)}
            />
            <Button title="Проверить" onPress={() => handle(manual)} />
          </View>

          <View style={[styles.offlineBox, { borderColor: c.line }]}>
            <Body small muted>
              {manifest ? `Офлайн-список от ${dateTime(manifest.generated_at)}: ${manifest.tickets.length} билетов` : 'Офлайн-список не загружен — без сети проверка будет невозможна.'}
            </Body>
            <Button tone="secondary" title="Загрузить офлайн-список" onPress={prepareOffline} />
            <Body small muted>Сканов в очереди на синхронизацию: {queued}</Body>
            <Button tone="secondary" title="Синхронизировать" onPress={sync} disabled={!queued} />
            {status && <Notice tone="info">{status}</Notice>}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Space.l, gap: Space.l, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  events: { gap: Space.s },
  chip: { minHeight: TAP, maxWidth: 240, paddingHorizontal: Space.l, paddingVertical: Space.s, borderWidth: 1, borderRadius: Radius.m, justifyContent: 'center' },
  camera: { height: 280, borderRadius: Radius.l, overflow: 'hidden' },
  cameraOff: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Space.m, padding: Space.l },
  result: { padding: Space.l, borderRadius: Radius.m, gap: Space.s },
  resultTitle: { fontSize: 22, fontWeight: '700' },
  manual: { flexDirection: 'row', gap: Space.s },
  input: { flex: 1, minHeight: TAP, borderWidth: 1, borderRadius: Radius.s, paddingHorizontal: Space.m, fontSize: 16 },
  offlineBox: { borderWidth: 1, borderRadius: Radius.m, padding: Space.l, gap: Space.m },
});
