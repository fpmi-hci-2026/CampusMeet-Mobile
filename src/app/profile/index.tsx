import { useRouter } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Body, Button, Field, Notice, Title } from '@/components/ui';
import { MaxContentWidth, Space, usePalette } from '@/constants/theme';
import { ApiError } from '@/lib/api';
import { isStaff, useAuth } from '@/lib/auth';
import { API_BASE } from '@/lib/config';
import { validateAuth } from '@/lib/validation';
import type { Profile } from '@/lib/types';
import { useResource } from '@/lib/use-resource';

const ROLES: Record<string, string> = { attendee: 'Участник', volunteer: 'Волонтёр', organizer: 'Организатор', admin: 'Администратор', speaker: 'Спикер', team_lead: 'Капитан команды' };

function SignInForm() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<ComponentRef<typeof TextInput>>(null);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  async function submit() {
    const found = validateAuth(mode, values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      if (mode === 'login') await login(values.email.trim(), values.password);
      else await register(values.name.trim(), values.email.trim(), values.password);
    } catch (error) {
      if (error instanceof ApiError && error.errors) setErrors({ ...error.errors, name: error.errors.full_name });
      else setErrors({ form: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.form}>
      <Title>{mode === 'login' ? 'Вход' : 'Регистрация'}</Title>
      <Body muted>Один аккаунт для сайта и приложения: билеты, очередь и личная программа.</Body>
      {errors.form && <Notice tone="error">{errors.form}</Notice>}
      {mode === 'register' && (
        <Field label="Имя и фамилия" value={values.name} onChangeText={(name) => setValues({ ...values, name })} autoComplete="name" textContentType="name" returnKeyType="next" onSubmitEditing={() => emailRef.current?.focus()} error={errors.name} />
      )}
      <Field ref={emailRef} label="Email" value={values.email} onChangeText={(email) => setValues({ ...values, email })} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" returnKeyType="next" onSubmitEditing={() => passwordRef.current?.focus()} error={errors.email} />
      <Field
        ref={passwordRef}
        label="Пароль"
        value={values.password}
        onChangeText={(password) => setValues({ ...values, password })}
        secureTextEntry
        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        textContentType={mode === 'login' ? 'password' : 'newPassword'}
        returnKeyType="go"
        onSubmitEditing={submit}
        error={errors.password}
        hint={mode === 'register' ? 'Не короче 8 символов, буквы и цифры' : undefined}
      />
      <Button title={mode === 'login' ? 'Войти' : 'Создать аккаунт'} onPress={submit} loading={busy} />
      <Button tone="ghost" title={mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'} onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrors({}); }} />
      <Notice tone="info">Демо-аккаунты (пароль campusmeet2026): artem@example.invalid — участник, daria@example.invalid — волонтёр.</Notice>
    </View>
  );
}

function ProfileView() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const c = usePalette();
  const { data } = useResource<Profile>('/me');
  return (
    <View style={styles.form}>
      <Title>{data?.full_name ?? user?.full_name}</Title>
      <Body muted>
        {user?.email}, {ROLES[user?.role ?? 'attendee']}
      </Body>
      <View style={styles.stats}>
        <View style={[styles.stat, { borderTopColor: c.text }]}>
          <Body muted small>Активные билеты</Body>
          <Text style={[styles.statValue, { color: c.text }]}>{data?.tickets_active ?? '—'}</Text>
        </View>
        <View style={[styles.stat, { borderTopColor: c.text }]}>
          <Body muted small>В программе</Body>
          <Text style={[styles.statValue, { color: c.text }]}>{data?.favourites ?? '—'}</Text>
        </View>
      </View>
      {isStaff(user) && <Button title="Контроль входа (сканер)" onPress={() => router.push('/profile/scanner')} />}
      <Button tone="danger" title="Выйти" onPress={logout} />
      <Body muted small>Сервер: {API_BASE}</Body>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        {user ? <ProfileView /> : <SignInForm />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Space.l, paddingBottom: Space.xxl * 2, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  form: { gap: Space.l },
  stats: { flexDirection: 'row', gap: Space.l },
  stat: { flex: 1, borderTopWidth: 2, paddingTop: Space.s },
  statValue: { fontSize: 32, fontWeight: '500' },
});
