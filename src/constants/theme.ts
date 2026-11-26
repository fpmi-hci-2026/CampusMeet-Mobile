import { Platform, useColorScheme } from 'react-native';

/** Lab 5 design system: monochrome editorial base, emerald only for "you are in / you can act". */
const light = {
  background: '#ffffff',
  surface: '#f4f4f4',
  surfaceRaised: '#f9f9f9',
  text: '#0d0d0d',
  textSecondary: '#525252',
  textTertiary: '#6b6b6b',
  line: '#e5e5e5',
  lineStrong: '#d4d4d4',
  inverse: '#0d0d0d',
  onInverse: '#ffffff',
  accent: '#047857',
  accentFill: '#10b981',
  accentSoft: '#d1fae5',
  accentInk: '#064e3b',
  warnSoft: '#fef3c7',
  warnInk: '#92400e',
  danger: '#b91c1c',
  dangerSoft: '#fee2e2',
};

const dark: typeof light = {
  background: '#0f172a',
  surface: '#1c273b',
  surfaceRaised: '#162033',
  text: '#f4f4f4',
  textSecondary: '#c2c8d2',
  textTertiary: '#9aa3b2',
  line: '#24314a',
  lineStrong: '#334155',
  inverse: '#f4f4f4',
  onInverse: '#0d0d0d',
  accent: '#34d399',
  accentFill: '#10b981',
  accentSoft: '#064e3b',
  accentInk: '#d1fae5',
  warnSoft: '#422006',
  warnInk: '#fde68a',
  danger: '#f87171',
  dangerSoft: '#450a0a',
};

export type Palette = typeof light;
export const Colors = { light, dark };

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

export const Fonts = {
  display: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Literata, Georgia, serif' }),
  body: Platform.select({ ios: 'System', android: 'sans-serif', default: 'Inter, system-ui, sans-serif' }),
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'ui-monospace, monospace' }),
};

export const Space = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;
export const Radius = { s: 6, m: 10, l: 16, pill: 999 } as const;
/** Minimum touch target (Apple HIG 44pt, Material 48dp). */
export const TAP = 48;
export const MaxContentWidth = 720;
