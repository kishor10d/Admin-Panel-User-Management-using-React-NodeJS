import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import type { ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { authApi } from '../api/auth-api';

const passwordSchema = z.object({ password: z.string().min(12, 'Use at least 12 characters.') });
const changeSchema = passwordSchema.extend({ currentPassword: z.string().min(12, 'Enter your current password.'), confirmPassword: z.string() }).refine((value) => value.password === value.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' });
const resetSchema = passwordSchema.extend({ confirmPassword: z.string() }).refine((value) => value.password === value.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' });

export function ForgotPasswordPage({ onBack }: { onBack: () => void }) {
  const form = useForm<{ email: string }>({ resolver: zodResolver(z.object({ email: z.string().email('Enter a valid email address.') })) });
  const submit = useMutation({ mutationFn: ({ email }: { email: string }) => authApi.forgotPassword(email) });
  return <UnauthenticatedCard title="Reset password"><form onSubmit={form.handleSubmit((values) => submit.mutate(values))}>{submit.isSuccess ? <div className="alert alert-success">If the account exists, a reset link has been sent. In development, check the API terminal.</div> : <><p className="text-body-secondary">Enter your email to request a reset link.</p><div className="mb-3"><label className="form-label" htmlFor="forgot-email">Email</label><input id="forgot-email" className={`form-control ${form.formState.errors.email ? 'is-invalid' : ''}`} type="email" {...form.register('email')} />{form.formState.errors.email && <div className="invalid-feedback">{form.formState.errors.email.message}</div>}</div>{submit.isError && <div className="alert alert-danger py-2">Unable to request a reset link.</div>}<button className="btn btn-primary w-100" type="submit" disabled={submit.isPending}>{submit.isPending ? 'Sending…' : 'Request reset link'}</button></>}<button type="button" className="btn btn-link w-100 mt-2" onClick={onBack}>Back to sign in</button></form></UnauthenticatedCard>;
}

export function ResetPasswordPage() {
  const [params] = useSearchParams(); const token = params.get('token') ?? ''; const form = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema) });
  const submit = useMutation({ mutationFn: ({ password }: z.infer<typeof resetSchema>) => authApi.resetPassword(token, password) });
  return <UnauthenticatedCard title="Choose a new password"><form onSubmit={form.handleSubmit((values) => submit.mutate(values))}>{!token ? <div className="alert alert-danger">This reset link is invalid.</div> : submit.isSuccess ? <div className="alert alert-success">Password reset. <Link to="/">Sign in now.</Link></div> : <><PasswordField id="reset-password" label="New password" error={form.formState.errors.password?.message} registration={form.register('password')} /><PasswordField id="reset-confirmation" label="Confirm password" error={form.formState.errors.confirmPassword?.message} registration={form.register('confirmPassword')} />{submit.isError && <div className="alert alert-danger py-2">This reset link is invalid or expired.</div>}<button className="btn btn-primary w-100" type="submit" disabled={submit.isPending}>{submit.isPending ? 'Resetting…' : 'Reset password'}</button></>}</form></UnauthenticatedCard>;
}

export function ChangePasswordPage() {
  const form = useForm<z.infer<typeof changeSchema>>({ resolver: zodResolver(changeSchema) });
  const submit = useMutation({ mutationFn: ({ currentPassword, password }: z.infer<typeof changeSchema>) => authApi.changePassword(currentPassword, password), onSuccess: () => form.reset() });
  return <div className="card card-outline card-primary" style={{ maxWidth: 560 }}><div className="card-body"><form onSubmit={form.handleSubmit((values) => submit.mutate(values))}><PasswordField id="current-password" label="Current password" error={form.formState.errors.currentPassword?.message} autoComplete="current-password" registration={form.register('currentPassword')} /><PasswordField id="new-password" label="New password" error={form.formState.errors.password?.message} registration={form.register('password')} /><PasswordField id="confirm-new-password" label="Confirm new password" error={form.formState.errors.confirmPassword?.message} registration={form.register('confirmPassword')} />{submit.isError && <div className="alert alert-danger py-2">Current password is incorrect or the request could not be completed.</div>}{submit.isSuccess && <div className="alert alert-success py-2">Password updated successfully.</div>}<div className="text-end"><button className="btn btn-primary" type="submit" disabled={submit.isPending}>{submit.isPending ? 'Updating…' : 'Update password'}</button></div></form></div></div>;
}

function UnauthenticatedCard({ title, children }: { title: string; children: ReactNode }) { return <main className="min-vh-100 d-flex align-items-center justify-content-center bg-body-secondary p-3"><section className="card card-outline card-primary shadow-sm w-100" style={{ maxWidth: 390 }}><div className="card-body login-card-body"><h1 className="h3 text-center mb-4">{title}</h1>{children}</div></section></main>; }
function PasswordField({ id, label, error, registration, autoComplete = 'new-password' }: { id: string; label: string; error?: string; registration: UseFormRegisterReturn; autoComplete?: string }) { return <div className="mb-3"><label className="form-label" htmlFor={id}>{label}</label><input id={id} className={`form-control ${error ? 'is-invalid' : ''}`} type="password" autoComplete={autoComplete} {...registration} />{error && <div className="invalid-feedback">{error}</div>}</div>; }
