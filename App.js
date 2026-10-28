import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fetchCatalog } from './src/api.mjs';

const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const h = React.createElement;

export default function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function refresh() {
    setLoading(true);
    setError('');
    try { setEvents(await fetchCatalog(apiUrl)); }
    catch (failure) { setError(failure.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);
  return h(SafeAreaView, { style: styles.screen },
    h(ScrollView, { contentContainerStyle: styles.content },
      h(Text, { style: styles.brand }, 'CampusMeet / EventHub'),
      h(Text, { accessibilityRole: 'header', style: styles.title }, 'Встречаемся на кампусе.'),
      h(Text, { style: styles.meta }, 'Лабораторная №4 · Демонстрационная афиша'),
      loading ? h(ActivityIndicator, { accessibilityLabel: 'Загрузка событий' }) : null,
      error ? h(Text, { accessibilityRole: 'alert', style: styles.error }, error) : null,
      ...events.map(event => h(View, { key: event.id, style: styles.event },
        h(Text, { accessibilityRole: 'header', style: styles.eventTitle }, event.title),
        h(Text, null, new Date(event.start_time).toLocaleString('ru-RU')),
        h(Text, null, `Свободных мест: ${event.free_spots}`))),
      !loading && !error && !events.length ? h(Text, null, 'Ближайших мероприятий пока нет.') : null,
      h(Button, { title: 'Обновить афишу', onPress: refresh, disabled: loading, color: '#171717' })));
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, gap: 20 },
  brand: { fontSize: 16, fontWeight: '600', color: '#171717' },
  title: { fontSize: 36, fontWeight: '700', letterSpacing: -1, color: '#171717' },
  meta: { color: '#5d5d5d', fontSize: 14 },
  event: { borderTopWidth: 1, borderTopColor: '#ddd', paddingVertical: 20, gap: 8 },
  eventTitle: { fontSize: 24, fontWeight: '600' },
  error: { color: '#171717', borderWidth: 1, padding: 16 },
});
