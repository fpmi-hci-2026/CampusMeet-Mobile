/** Client-side form rules mirroring the API (RegisterRequest / LoginRequest). */
export function validateAuth(mode: 'login' | 'register', v: { name: string; email: string; password: string }) {
  const errors: Record<string, string> = {};
  if (mode === 'register' && v.name.trim().length < 2) errors.name = 'Укажите имя и фамилию';
  if (!/^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/.test(v.email.trim())) errors.email = 'Введите email в формате name@example.com';
  if (mode === 'register' && (v.password.length < 8 || !/\d/.test(v.password) || !/\p{L}/u.test(v.password))) errors.password = 'Не короче 8 символов, буквы и цифры';
  if (mode === 'login' && !v.password) errors.password = 'Введите пароль';
  return errors;
}

