import { Stack } from 'expo-router/stack';
import { usePalette } from '@/constants/theme';

export default function ProfileLayout() {
  const c = usePalette();
  return (
    <Stack screenOptions={{ headerShadowVisible: false, headerStyle: { backgroundColor: c.background }, headerTintColor: c.text, headerBackButtonDisplayMode: 'minimal', contentStyle: { backgroundColor: c.background } }}>
      <Stack.Screen name="index" options={{ title: 'Профиль' }} />
      <Stack.Screen name="scanner" options={{ title: 'Контроль входа' }} />
    </Stack>
  );
}
