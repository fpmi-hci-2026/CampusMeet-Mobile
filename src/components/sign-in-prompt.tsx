import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Body, Button } from '@/components/ui';
import { Space } from '@/constants/theme';

export function SignInPrompt({ what }: { what: string }) {
  const router = useRouter();
  return (
    <View style={{ padding: Space.l, gap: Space.l }}>
      <Body muted>Войдите, чтобы увидеть {what}.</Body>
      <Button title="Войти" onPress={() => router.push('/profile')} style={{ alignSelf: 'flex-start' }} />
    </View>
  );
}
