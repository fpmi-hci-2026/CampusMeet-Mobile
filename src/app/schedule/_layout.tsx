import { Stack } from 'expo-router/stack';
import { usePalette } from '@/constants/theme';

export default function ScheduleLayout() {
  const c = usePalette();
  return (
    <Stack screenOptions={{ headerShadowVisible: false, headerStyle: { backgroundColor: c.background }, headerTintColor: c.text, contentStyle: { backgroundColor: c.background } }}>
      <Stack.Screen name="index" options={{ title: 'Моя программа' }} />
    </Stack>
  );
}
