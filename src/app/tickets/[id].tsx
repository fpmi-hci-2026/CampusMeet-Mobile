import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Fonts, Space } from '@/constants/theme';
import { fullDate, ticketLabels, timeRange } from '@/lib/format';
import type { Ticket } from '@/lib/types';
import { useResource } from '@/lib/use-resource';

/** Full-screen "AMOLED pass": true black, maximum QR contrast, works from the offline cache. */
export default function PassScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, offline } = useResource<{ items: Ticket[] }>('/me/tickets', { refetchOnFocus: false });
  const ticket = data?.items.find((t) => t.id === id);

  if (!ticket) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Билет не найден. Обновите список билетов.</Text>
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.status} accessibilityLiveRegion="polite">
        {ticketLabels[ticket.status]}
        {offline ? ' · офлайн' : ''}
      </Text>
      <Text accessibilityRole="header" style={styles.title}>
        {ticket.event_title}
      </Text>
      <Text style={styles.muted}>
        {fullDate(ticket.event_start_time)}, {timeRange(ticket.event_start_time, ticket.event_end_time)}
      </Text>
      <Text style={styles.muted}>{ticket.venue_name}</Text>
      {ticket.qr_payload ? (
        <View style={styles.qr} accessible accessibilityRole="image" accessibilityLabel={`QR-код билета на «${ticket.event_title}»`}>
          <QRCode value={ticket.qr_payload} size={240} backgroundColor="#ffffff" color="#000000" ecl="M" />
        </View>
      ) : (
        <Text style={styles.muted}>QR-код появится, когда место будет подтверждено.</Text>
      )}
      <Text style={styles.code}>{ticket.ticket_code}</Text>
      <Text style={styles.hint}>Увеличьте яркость экрана и поднесите телефон к сканеру волонтёра.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Space.xl, backgroundColor: '#000' },
  content: { padding: Space.xl, gap: Space.m, alignItems: 'center', backgroundColor: '#000', minHeight: '100%' },
  status: { color: '#34d399', fontWeight: '700', fontSize: 15 },
  title: { color: '#fff', fontFamily: Fonts.display, fontSize: 28, lineHeight: 34, textAlign: 'center' },
  muted: { color: '#c2c8d2', fontSize: 15, textAlign: 'center' },
  qr: { marginTop: Space.l, padding: Space.l, backgroundColor: '#fff', borderRadius: 16 },
  code: { color: '#fff', fontFamily: Fonts.mono, fontSize: 16, letterSpacing: 1, marginTop: Space.s },
  hint: { color: '#9aa3b2', fontSize: 13, textAlign: 'center', maxWidth: 300 },
});
