import { NativeTabs } from 'expo-router/native-tabs';
import { usePalette } from '@/constants/theme';

/** iOS / Android: real platform tab bar (UITabBarController / BottomNavigationView). */
export default function AppTabs() {
  const c = usePalette();
  return (
    <NativeTabs backgroundColor={c.background} indicatorColor={c.surface} labelStyle={{ selected: { color: c.text } }} tintColor={c.text}>
      <NativeTabs.Trigger name="(afisha)">
        <NativeTabs.Trigger.Label>Афиша</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'calendar', selected: 'calendar' }} md="event" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tickets">
        <NativeTabs.Trigger.Label>Билеты</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'ticket', selected: 'ticket.fill' }} md="confirmation_number" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="schedule">
        <NativeTabs.Trigger.Label>Программа</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'star', selected: 'star.fill' }} md="star" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Профиль</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} md="account_circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
