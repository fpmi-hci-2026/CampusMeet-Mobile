import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { EventCard } from '@/components/event-card';
import { Body, Empty, Notice, OfflineBanner } from '@/components/ui';
import { MaxContentWidth, Radius, Space, TAP, usePalette } from '@/constants/theme';
import { typeLabels } from '@/lib/format';
import type { CampusEvent, EventType, Page } from '@/lib/types';
import { useResource } from '@/lib/use-resource';

const TYPES: ('' | EventType)[] = ['', 'meetup', 'hackathon', 'workshop', 'lecture', 'networking'];

/** Whole upcoming catalogue is loaded once and filtered locally, so search works offline too. */
export default function CatalogueScreen() {
  const c = usePalette();
  const { data, error, loading, refreshing, offline, savedAt, refresh } = useResource<Page<CampusEvent>>('/events?upcoming=true&limit=100');
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'' | EventType>('');
  const [available, setAvailable] = useState(false);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.items ?? []).filter(
      (e) =>
        (!type || e.event_type === type) &&
        (!available || (e.status === 'registration_open' && (e.free_spots > 0 || e.waitlist_enabled))) &&
        (!q || `${e.title} ${e.description} ${e.tags.join(' ')}`.toLowerCase().includes(q)),
    );
  }, [data, query, type, available]);

  const header = (
    <View style={styles.header}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Тема, название или технология"
        placeholderTextColor={c.textTertiary}
        accessibilityLabel="Поиск по мероприятиям"
        returnKeyType="search"
        clearButtonMode="while-editing"
        style={[styles.search, { borderColor: c.lineStrong, color: c.text, backgroundColor: c.background }]}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityRole="radiogroup">
        {TYPES.map((value) => {
          const active = type === value;
          return (
            <Pressable
              key={value || 'all'}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => setType(value)}
              style={[styles.chip, { borderColor: active ? c.inverse : c.lineStrong, backgroundColor: active ? c.inverse : 'transparent' }]}>
              <Text style={{ color: active ? c.onInverse : c.text, fontWeight: '500' }}>{value ? typeLabels[value] : 'Все'}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.switchRow}>
        <Text style={{ color: c.text, fontSize: 15 }} nativeID="available-label">
          Только где можно записаться
        </Text>
        <Switch value={available} onValueChange={setAvailable} accessibilityLabelledBy="available-label" accessibilityLabel="Только где можно записаться" trackColor={{ true: c.accentFill, false: c.lineStrong }} />
      </View>
      {error && !data && <Notice tone="error">Не удалось загрузить афишу: {error.message}</Notice>}
      <Body muted small accessibilityLiveRegion="polite">
        {loading ? 'Загружаем…' : `Найдено: ${items.length}`}
      </Body>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {offline && <OfflineBanner savedAt={savedAt} />}
      <FlatList
        data={items}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => <EventCard event={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={loading ? undefined : <View style={{ paddingHorizontal: Space.l }}><Empty text="Ничего не нашлось. Попробуйте другую тему или уберите фильтр." /></View>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.text} />}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        style={styles.list}
        contentContainerStyle={{ paddingBottom: Space.xxl }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  header: { gap: Space.m, padding: Space.l },
  search: { minHeight: TAP, borderWidth: 1, borderRadius: Radius.s, paddingHorizontal: Space.m, fontSize: 16 },
  chips: { gap: Space.s },
  chip: { minHeight: 44, minWidth: TAP, paddingHorizontal: Space.l, borderRadius: Radius.pill, borderWidth: 1, justifyContent: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: TAP },
});
