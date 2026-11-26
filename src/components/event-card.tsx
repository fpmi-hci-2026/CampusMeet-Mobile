import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Fonts, Space, usePalette } from '@/constants/theme';
import { availability, dayNumber, seatsText, shortMonth, time, typeLabels, weekday } from '@/lib/format';
import type { CampusEvent } from '@/lib/types';

export function EventCard({ event }: { event: CampusEvent }) {
  const c = usePalette();
  const state = availability(event);
  const seatColor = state === 'open' ? c.accent : state === 'few' ? c.warnInk : state === 'closed' ? c.textTertiary : c.danger;
  const filled = Math.min(1, event.registered_count / event.capacity_limit);
  const router = useRouter();
  return (
      <Pressable
        onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
        accessibilityRole="link"
        accessibilityLabel={`${event.title}. ${typeLabels[event.event_type]}, ${dayNumber(event.start_time)} ${shortMonth(event.start_time)}, ${time(event.start_time)}. ${seatsText(event)}`}
        style={({ pressed }) => [styles.row, { borderTopColor: c.line, backgroundColor: pressed ? c.surfaceRaised : 'transparent' }]}>
        <View style={styles.date} importantForAccessibility="no-hide-descendants">
          <Text style={[styles.day, { color: c.text }]}>{dayNumber(event.start_time)}</Text>
          <Text style={[styles.month, { color: c.textTertiary }]}>
            {shortMonth(event.start_time)}, {weekday(event.start_time)}
          </Text>
        </View>
        <View style={styles.body} importantForAccessibility="no-hide-descendants">
          <Text style={[styles.kind, { color: c.textSecondary }]}>
            {typeLabels[event.event_type]}  <Text style={{ color: c.textTertiary, fontWeight: '500' }}>{time(event.start_time)}</Text>
          </Text>
          <Text style={[styles.title, { color: c.text }]}>{event.title}</Text>
          <Text style={[styles.venue, { color: c.textSecondary }]} numberOfLines={1}>
            {event.venue_name}
          </Text>
          <Text style={[styles.seats, { color: seatColor }]}>{seatsText(event)}</Text>
          {state !== 'closed' && (
            <View style={[styles.track, { backgroundColor: c.surface }]}>
              <View style={[styles.fill, { width: `${filled * 100}%`, backgroundColor: c.text }]} />
            </View>
          )}
        </View>
      </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Space.l, paddingVertical: Space.l, paddingHorizontal: Space.l, borderTopWidth: StyleSheet.hairlineWidth },
  date: { width: 56 },
  day: { fontFamily: Fonts.display, fontSize: 40, lineHeight: 42, fontWeight: '500', letterSpacing: -1 },
  month: { fontSize: 13, marginTop: Space.xs },
  body: { flex: 1, gap: Space.xs },
  kind: { fontSize: 13, fontWeight: '600' },
  title: { fontFamily: Fonts.display, fontSize: 20, lineHeight: 25, fontWeight: '500' },
  venue: { fontSize: 14 },
  seats: { fontSize: 14, fontWeight: '600', marginTop: Space.xs },
  track: { height: 4, borderRadius: 2, overflow: 'hidden', maxWidth: 200 },
  fill: { height: 4 },
});
