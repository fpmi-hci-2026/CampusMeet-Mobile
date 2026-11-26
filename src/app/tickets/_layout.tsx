import { Stack } from 'expo-router/stack';
import { usePalette } from '@/constants/theme';

export default function TicketsLayout() {
  const c = usePalette();
  return (
    <Stack screenOptions={{ headerShadowVisible: false, headerStyle: { backgroundColor: c.background }, headerTintColor: c.text, headerBackButtonDisplayMode: 'minimal', contentStyle: { backgroundColor: c.background } }}>
      <Stack.Screen name="index" options={{ title: 'Билеты' }} />
      {/* Full-screen pass: dark surface for scanners and OLED screens (Lab 5 "AMOLED pass"). */}
      <Stack.Screen name="[id]" options={{ presentation: 'modal', title: 'Пропуск', headerStyle: { backgroundColor: '#000000' }, headerTintColor: '#ffffff', contentStyle: { backgroundColor: '#000000' } }} />
    </Stack>
  );
}
