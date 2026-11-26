import type { ComponentRef, ReactNode, Ref } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { Fonts, Radius, Space, TAP, usePalette } from '@/constants/theme';

type Tone = 'primary' | 'accent' | 'secondary' | 'danger' | 'ghost';

export function Button({
  title,
  tone = 'primary',
  loading,
  disabled,
  icon,
  style,
  ...rest
}: PressableProps & { title: string; tone?: Tone; loading?: boolean; icon?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = usePalette();
  const bg = { primary: c.inverse, accent: c.accent, secondary: 'transparent', danger: 'transparent', ghost: 'transparent' }[tone];
  const fg = { primary: c.onInverse, accent: c.background === '#ffffff' ? '#ffffff' : '#062c22', secondary: c.text, danger: c.danger, ghost: c.text }[tone];
  const border = tone === 'secondary' ? c.lineStrong : tone === 'danger' ? c.danger : 'transparent';
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      disabled={off}
      style={({ pressed }) => [styles.button, { backgroundColor: bg, borderColor: border, opacity: off ? 0.55 : pressed ? 0.8 : 1 }, style]}
      {...rest}>
      {loading ? <ActivityIndicator color={fg} /> : icon}
      <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Title({ style, ...props }: TextProps) {
  const c = usePalette();
  return <Text accessibilityRole="header" style={[styles.title, { color: c.text }, style]} {...props} />;
}

export function Body({ style, muted, small, ...props }: TextProps & { muted?: boolean; small?: boolean }) {
  const c = usePalette();
  return <Text style={[styles.body, small && styles.small, { color: muted ? c.textSecondary : c.text }, style]} {...props} />;
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'accent' | 'warn' | 'danger' }) {
  const c = usePalette();
  const map = {
    neutral: [c.surface, c.textSecondary],
    accent: [c.accentSoft, c.accentInk],
    warn: [c.warnSoft, c.warnInk],
    danger: [c.dangerSoft, c.danger],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function Field({ label, error, hint, style, ...props }: TextInputProps & { label: string; error?: string; hint?: string; ref?: Ref<ComponentRef<typeof TextInput>> }) {
  const c = usePalette();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: c.text }]} nativeID={`label-${label}`}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        aria-invalid={!!error}
        placeholderTextColor={c.textTertiary}
        style={[styles.input, { borderColor: error ? c.danger : c.lineStrong, color: c.text, backgroundColor: c.background }, style]}
        {...props}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" style={[styles.small, { color: c.danger, fontWeight: '600' }]}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={[styles.small, { color: c.textTertiary }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

export function Notice({ tone, children }: { tone: 'success' | 'error' | 'info'; children: ReactNode }) {
  const c = usePalette();
  const bg = tone === 'success' ? c.accentSoft : tone === 'error' ? c.dangerSoft : c.surface;
  const fg = tone === 'success' ? c.accentInk : tone === 'error' ? c.danger : c.textSecondary;
  return (
    <View accessibilityLiveRegion="polite" accessibilityRole={tone === 'error' ? 'alert' : 'text'} style={[styles.notice, { backgroundColor: bg, borderLeftColor: fg }]}>
      <Text style={[styles.small, { color: fg, fontWeight: '500' }]}>{children}</Text>
    </View>
  );
}

export function OfflineBanner({ savedAt }: { savedAt: number | null }) {
  const c = usePalette();
  const when = savedAt ? new Date(savedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : null;
  return (
    <View accessibilityRole="alert" style={[styles.offline, { backgroundColor: c.warnSoft }]}>
      <Text style={[styles.small, { color: c.warnInk, fontWeight: '600' }]}>
        Нет сети — показаны сохранённые данные{when ? ` от ${when}` : ''}
      </Text>
    </View>
  );
}

export function Empty({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <Body muted>{text}</Body>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: TAP,
    paddingHorizontal: Space.xl,
    borderRadius: Radius.s,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Space.s,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '600', fontFamily: Fonts.body },
  title: { fontFamily: Fonts.display, fontSize: 30, lineHeight: 36, fontWeight: '500', letterSpacing: -0.4 },
  body: { fontFamily: Fonts.body, fontSize: 16, lineHeight: 24 },
  small: { fontSize: 14, lineHeight: 20 },
  badge: { alignSelf: 'flex-start', borderRadius: Radius.pill, paddingHorizontal: Space.s, paddingVertical: 2 },
  badgeText: { fontSize: 13, fontWeight: '600' },
  field: { gap: Space.s },
  label: { fontSize: 14, fontWeight: '600' },
  input: { minHeight: TAP, borderWidth: 1, borderRadius: Radius.s, paddingHorizontal: Space.m, fontSize: 16 },
  notice: { padding: Space.m, borderRadius: Radius.s, borderLeftWidth: 3 },
  offline: { paddingVertical: Space.s, paddingHorizontal: Space.l },
  empty: { gap: Space.l, paddingVertical: Space.xxl, alignItems: 'flex-start' },
});
