import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { authApi } from '../api/auth-api';
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
  return <main className="min-vh-100 d-flex align-items-center justify-content-center bg-body-secondary p-3"><form className="card card-outline card-primary shadow-sm w-100" style={{ maxWidth: 390 }} onSubmit={form.handleSubmit((values) => login.mutate(values))}><div className="card-body login-card-body"><h1 className="h3 text-center mb-1">CIAS Admin</h1><p className="text-center text-body-secondary mb-4">Sign in to continue.</p><div className="mb-3"><label className="form-label" htmlFor="login-email">Email</label><input id="login-email" className={`form-control ${form.formState.errors.email ? 'is-invalid' : ''}`} type="email" autoComplete="email" {...form.register('email')} />{form.formState.errors.email && <div className="invalid-feedback">{form.formState.errors.email.message}</div>}</div><div className="mb-3"><label className="form-label" htmlFor="login-password">Password</label><input id="login-password" className={`form-control ${form.formState.errors.password ? 'is-invalid' : ''}`} type="password" autoComplete="current-password" {...form.register('password')} />{form.formState.errors.password && <div className="invalid-feedback">{form.formState.errors.password.message}</div>}</div>{login.isError && <div className="alert alert-danger py-2" role="alert">{login.error.message}</div>}<button className="btn btn-primary w-100" type="submit" disabled={login.isPending}>{login.isPending ? 'Signing in…' : 'Sign in'}</button><button type="button" className="btn btn-link w-100 mt-2" onClick={() => setForgotPassword(true)}>Forgot password?</button></div></form></main>;
}
