import { useRouter } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SignInPrompt } from '@/components/sign-in-prompt';
import { Badge, Body, Button, Empty, OfflineBanner } from '@/components/ui';
import { Fonts, MaxContentWidth, Radius, Space, usePalette } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { fullDate, ticketLabels, timeRange } from '@/lib/format';
import type { Ticket } from '@/lib/types';
import { useResource } from '@/lib/use-resource';

export default function TicketsScreen() {
  const { user, ready } = useAuth();
  const c = usePalette();
  const router = useRouter();
  const tickets = useResource<{ items: Ticket[] }>(user ? '/me/tickets' : null);

  if (!ready) return null;
  if (!user) return <SignInPrompt what="свои билеты" />;

  const items = (tickets.data?.items ?? []).filter((t) => t.status !== 'cancelled');
  return (
    <View style={{ flex: 1 }}>
      {tickets.offline && <OfflineBanner savedAt={tickets.savedAt} />}
      <FlatList
        data={items}
        keyExtractor={(t) => t.id}
        contentInsetAdjustmentBehavior="automatic"
        style={styles.list}
        contentContainerStyle={{ padding: Space.l, gap: Space.l }}
        refreshControl={<RefreshControl refreshing={tickets.refreshing} onRefresh={tickets.refresh} tintColor={c.text} />}
        ListHeaderComponent={<Body muted>Билеты сохраняются на устройстве — QR-код откроется и без интернета.</Body>}
        ListEmptyComponent={tickets.loading ? undefined : <Empty text="Билетов пока нет." action={<Button title="Открыть афишу" onPress={() => router.navigate('/')} />} />}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.event_title}, ${ticketLabels[item.status]}. Открыть пропуск`}
            disabled={item.status === 'waitlisted'}
            onPress={() => router.push({ pathname: '/tickets/[id]', params: { id: item.id } })}
            style={({ pressed }) => [styles.card, { borderColor: c.lineStrong, opacity: pressed ? 0.85 : 1 }]}>
            <Badge
              tone={item.status === 'registered' ? 'accent' : item.status === 'waitlisted' ? 'warn' : 'neutral'}
              label={ticketLabels[item.status] + (item.waitlist_position ? `, вы ${item.waitlist_position}-й` : '')}
            />
            <Text style={[styles.title, { color: c.text }]}>{item.event_title}</Text>
            <Body muted small>
              {fullDate(item.event_start_time)}, {timeRange(item.event_start_time, item.event_end_time)}
            </Body>
            <Body muted small>
              {item.venue_name}
            </Body>
            {item.status !== 'waitlisted' && <Text style={[styles.open, { color: c.text }]}>Показать QR-пропуск</Text>}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  card: { borderWidth: 1, borderRadius: Radius.m, padding: Space.l, gap: Space.s },
  title: { fontFamily: Fonts.display, fontSize: 22, lineHeight: 28 },
  open: { fontWeight: '700', marginTop: Space.s, textDecorationLine: 'underline' },
});
