import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { authApi } from './auth';
import { useState } from 'react';
import { ForgotPasswordPage } from './password-pages';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});
type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [forgotPassword, setForgotPassword] = useState(false);
  const queryClient = useQueryClient();
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const login = useMutation({
    mutationFn: ({ email, password }: LoginValues) => authApi.login(email, password),
    onSuccess: ({ user }) => queryClient.setQueryData(['auth', 'me'], { user }),
  });

  if (forgotPassword) return <ForgotPasswordPage onBack={() => setForgotPassword(false)} />;
  return (
    <main className="login-page">
      <form className="login-card" onSubmit={form.handleSubmit((values) => login.mutate(values))}>
        <h1>CIAS Admin</h1>
        <p>Sign in to continue.</p>
        <label>Email<input type="email" autoComplete="email" {...form.register('email')} /></label>
        {form.formState.errors.email && <small>{form.formState.errors.email.message}</small>}
        <label>Password<input type="password" autoComplete="current-password" {...form.register('password')} /></label>
        {form.formState.errors.password && <small>{form.formState.errors.password.message}</small>}
        {login.isError && <p className="status-error">{login.error.message}</p>}
        <button type="submit" disabled={login.isPending}>{login.isPending ? 'Signing in…' : 'Sign in'}</button>
        <button type="button" className="link-button" onClick={() => setForgotPassword(true)}>Forgot password?</button>
      </form>
    </main>
  );
}
