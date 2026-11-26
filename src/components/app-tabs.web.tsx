import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAP, usePalette } from '@/constants/theme';

/** Web (PWA preview): fixed bottom tab bar with safe-area padding, same four sections as native. */
const TABS = [
  { name: '(afisha)', href: '/', label: 'Афиша', icon: 'event' },
  { name: 'tickets', href: '/tickets', label: 'Билеты', icon: 'confirmation_number' },
  { name: 'schedule', href: '/schedule', label: 'Программа', icon: 'star' },
  { name: 'profile', href: '/profile', label: 'Профиль', icon: 'account_circle' },
] as const;

function TabButton({ isFocused, label, icon, ref, ...props }: TabTriggerSlotProps & { label: string; icon: string }) {
  const c = usePalette();
  const color = isFocused ? c.text : c.textTertiary;
  return (
    <Pressable ref={ref as never} {...props} accessibilityRole="tab" accessibilityState={{ selected: !!isFocused }} style={styles.tab}>
      <SymbolView name={{ web: icon as never }} size={24} tintColor={color} />
      <Text style={[styles.label, { color, fontWeight: isFocused ? '700' : '500' }]}>{label}</Text>
    </Pressable>
  );
}

export default function AppTabs() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <Tabs style={{ flex: 1, backgroundColor: c.background }}>
      <TabSlot style={{ flex: 1 }} />
      <TabList style={[styles.bar, { backgroundColor: c.background, borderTopColor: c.line, paddingBottom: insets.bottom }]}>
        {TABS.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
            <TabButton label={tab.label} icon={tab.icon} />
          </TabTrigger>
        ))}
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, minHeight: 60, minWidth: TAP, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontSize: 12 },
});
