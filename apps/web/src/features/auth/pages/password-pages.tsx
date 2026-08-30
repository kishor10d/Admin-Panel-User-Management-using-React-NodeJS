import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { authApi } from '../api/auth-api';

const passwordSchema = z.object({ password: z.string().min(12, 'Use at least 12 characters.') });
const changeSchema = passwordSchema.extend({ currentPassword: z.string().min(12, 'Enter your current password.'), confirmPassword: z.string() }).refine((value) => value.password === value.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' });
const resetSchema = passwordSchema.extend({ confirmPassword: z.string() }).refine((value) => value.password === value.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' });

export function ForgotPasswordPage({ onBack }: { onBack: () => void }) {
  const form = useForm<{ email: string }>({ resolver: zodResolver(z.object({ email: z.string().email('Enter a valid email address.') })) });
  const submit = useMutation({ mutationFn: ({ email }: { email: string }) => authApi.forgotPassword(email) });
  return <main className="login-page"><form className="login-card" onSubmit={form.handleSubmit((values) => submit.mutate(values))}><h1>Reset password</h1>{submit.isSuccess ? <p>If the account exists, a reset link has been sent. In development, check the API terminal.</p> : <><p>Enter your email to request a reset link.</p><label>Email<input type="email" {...form.register('email')} /></label>{form.formState.errors.email && <small>{form.formState.errors.email.message}</small>}{submit.isError && <p className="status-error">Unable to request a reset link.</p>}<button type="submit" disabled={submit.isPending}>{submit.isPending ? 'Sending…' : 'Request reset link'}</button></>}<button type="button" className="link-button" onClick={onBack}>Back to sign in</button></form></main>;
}

export function ResetPasswordPage() {
  const [params] = useSearchParams(); const token = params.get('token') ?? ''; const form = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema) });
  const submit = useMutation({ mutationFn: ({ password }: z.infer<typeof resetSchema>) => authApi.resetPassword(token, password) });
  return <main className="login-page"><form className="login-card" onSubmit={form.handleSubmit((values) => submit.mutate(values))}><h1>Choose a new password</h1>{!token ? <p className="status-error">This reset link is invalid.</p> : submit.isSuccess ? <p>Password reset. <Link to="/">Sign in now.</Link></p> : <><label>New password<input type="password" autoComplete="new-password" {...form.register('password')} /></label>{form.formState.errors.password && <small>{form.formState.errors.password.message}</small>}<label>Confirm password<input type="password" autoComplete="new-password" {...form.register('confirmPassword')} /></label>{form.formState.errors.confirmPassword && <small>{form.formState.errors.confirmPassword.message}</small>}{submit.isError && <p className="status-error">This reset link is invalid or expired.</p>}<button type="submit" disabled={submit.isPending}>{submit.isPending ? 'Resetting…' : 'Reset password'}</button></>}</form></main>;
}

export function ChangePasswordPage() {
  const form = useForm<z.infer<typeof changeSchema>>({ resolver: zodResolver(changeSchema) });
  const submit = useMutation({ mutationFn: ({ currentPassword, password }: z.infer<typeof changeSchema>) => authApi.changePassword(currentPassword, password), onSuccess: () => form.reset() });
  return <div className="password-page"><form className="user-form inline-form" onSubmit={form.handleSubmit((values) => submit.mutate(values))}><label>Current password<input type="password" autoComplete="current-password" {...form.register('currentPassword')} /></label>{form.formState.errors.currentPassword && <small>{form.formState.errors.currentPassword.message}</small>}<label>New password<input type="password" autoComplete="new-password" {...form.register('password')} /></label>{form.formState.errors.password && <small>{form.formState.errors.password.message}</small>}<label>Confirm new password<input type="password" autoComplete="new-password" {...form.register('confirmPassword')} /></label>{form.formState.errors.confirmPassword && <small>{form.formState.errors.confirmPassword.message}</small>}{submit.isError && <p className="status-error">Current password is incorrect or the request could not be completed.</p>}{submit.isSuccess && <p className="status-active">Password updated successfully.</p>}<div className="form-actions"><span /><button type="submit" disabled={submit.isPending}>{submit.isPending ? 'Updating…' : 'Update password'}</button></div></form></div>;
}
