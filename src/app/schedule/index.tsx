import { Link } from 'expo-router';
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { SignInPrompt } from '@/components/sign-in-prompt';
import { Body, Empty, Notice, OfflineBanner } from '@/components/ui';
import { Fonts, MaxContentWidth, Space, TAP, usePalette } from '@/constants/theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { fullDate, timeRange } from '@/lib/format';
import type { MyScheduleItem } from '@/lib/types';
import { useResource } from '@/lib/use-resource';

export default function MyScheduleScreen() {
  const { user, ready } = useAuth();
  const c = usePalette();
  const res = useResource<MyScheduleItem[]>(user ? '/me/schedule' : null);
  if (!ready) return null;
  if (!user) return <SignInPrompt what="личную программу" />;

  const items = res.data ?? [];
  const sections = Object.entries(
    items.reduce<Record<string, MyScheduleItem[]>>((acc, item) => {
      const day = fullDate(item.start_time);
      (acc[day] ??= []).push(item);
      return acc;
    }, {}),
  ).map(([title, data]) => ({ title, data }));
  const conflicts = items.filter((i) => i.conflicts_with.length).length;

  async function remove(item: MyScheduleItem) {
    res.setData(items.filter((i) => i.id !== item.id));
    try {
      res.setData(await api.del<MyScheduleItem[]>(`/me/schedule/${item.id}`));
    } catch {
      res.reload();
    }
  }

  return (
    <View style={{ flex: 1 }}>
      {res.offline && <OfflineBanner savedAt={res.savedAt} />}
      <SectionList
        sections={sections}
        keyExtractor={(i) => i.id}
        style={{ width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: Space.l }}
        refreshControl={<RefreshControl refreshing={res.refreshing} onRefresh={res.refresh} tintColor={c.text} />}
        ListHeaderComponent={conflicts ? <Notice tone="info">Пересекаются по времени: {conflicts}. Уберите лишний доклад.</Notice> : undefined}
        ListEmptyComponent={
          res.loading ? undefined : (
            <Empty
              text="Пока пусто. Откройте мероприятие и отметьте доклады звёздочкой."
              action={<Link href="/" style={{ color: c.text, fontWeight: '700', textDecorationLine: 'underline', paddingVertical: Space.m }}>Открыть афишу</Link>}
            />
          )
        }
        renderSectionHeader={({ section }) => (
          <Text accessibilityRole="header" style={[styles.day, { color: c.text, backgroundColor: c.background }]}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <View style={[styles.row, { borderTopColor: c.line, borderLeftColor: item.conflicts_with.length ? c.warnInk : 'transparent' }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.time, { color: c.textTertiary }]}>{timeRange(item.start_time, item.end_time)}</Text>
              <Text style={[styles.title, { color: c.text }]}>{item.title}</Text>
              <Body muted small>
                {item.event_title}, {item.room}
              </Body>
              {item.conflicts_with.length > 0 && <Text style={{ color: c.warnInk, fontWeight: '600', fontSize: 13 }}>Пересекается с другим докладом</Text>}
            </View>
            <Pressable onPress={() => remove(item)} accessibilityRole="button" accessibilityLabel={`Убрать «${item.title}»`} style={styles.remove} hitSlop={8}>
              <Text style={{ color: c.textSecondary, fontSize: 22 }}>×</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  day: { fontFamily: Fonts.display, fontSize: 20, paddingVertical: Space.s, marginTop: Space.m },
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.m, paddingVertical: Space.m, paddingLeft: Space.s, borderTopWidth: StyleSheet.hairlineWidth, borderLeftWidth: 3 },
  time: { fontFamily: Fonts.mono, fontSize: 13 },
  title: { fontSize: 16, fontWeight: '600' },
  remove: { width: TAP, height: TAP, alignItems: 'center', justifyContent: 'center' },
});
