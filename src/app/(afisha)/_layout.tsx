import { Stack } from 'expo-router/stack';
import { usePalette } from '@/constants/theme';

export default function AfishaLayout() {
  const c = usePalette();
  return (
    <Stack screenOptions={{ headerShadowVisible: false, headerStyle: { backgroundColor: c.background }, headerTintColor: c.text, headerBackButtonDisplayMode: 'minimal', contentStyle: { backgroundColor: c.background } }}>
      <Stack.Screen name="index" options={{ title: 'Афиша' }} />
      <Stack.Screen name="event/[id]" options={{ title: '' }} />
    </Stack>
  );
}
