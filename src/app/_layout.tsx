import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppTabs from '@/components/app-tabs';
import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/lib/auth';

SplashScreen.preventAutoHideAsync();

function Root() {
  const { ready } = useAuth();
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);
  return <AppTabs />;
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const c = Colors[scheme === 'dark' ? 'dark' : 'light'];
  return (
    <SafeAreaProvider>
      <ThemeProvider value={{ ...base, colors: { ...base.colors, background: c.background, card: c.background, text: c.text, border: c.line, primary: c.text } }}>
        <AuthProvider>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          <Root />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
