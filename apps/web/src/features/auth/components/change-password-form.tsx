import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { z } from 'zod';
import { authApi } from '../api/auth-api';
import { passwordSchema } from '../../../lib/password-policy';
import { useToast } from '../../../app/toast-provider';

const changePasswordSchema = z.object({
  currentPassword: passwordSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((value) => value.password !== value.currentPassword, { path: ['password'], message: 'New password must be different from your current password.' }).refine((value) => value.password === value.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const form = useForm<ChangePasswordValues>({ resolver: zodResolver(changePasswordSchema) });
  const toast = useToast();
  const submit = useMutation({ mutationFn: ({ currentPassword, password }: ChangePasswordValues) => authApi.changePassword(currentPassword, password), onSuccess: () => { form.reset(); toast.success('Password updated successfully.'); }, onError: (error) => toast.error(error.message) });
  return <form onSubmit={form.handleSubmit((values) => submit.mutate(values))}><PasswordField id="current-password" label="Current password" error={form.formState.errors.currentPassword?.message} autoComplete="current-password" registration={form.register('currentPassword')} /><PasswordField id="new-password" label="New password" error={form.formState.errors.password?.message} registration={form.register('password')} /><PasswordField id="confirm-new-password" label="Confirm new password" error={form.formState.errors.confirmPassword?.message} registration={form.register('confirmPassword')} /><div className="text-end"><button className="btn btn-primary" type="submit" disabled={submit.isPending}>{submit.isPending ? 'Updating…' : 'Update password'}</button></div></form>;
}

function PasswordField({ id, label, error, registration, autoComplete = 'new-password' }: { id: string; label: string; error?: string; registration: UseFormRegisterReturn; autoComplete?: string }) { return <div className="mb-3"><label className="form-label" htmlFor={id}>{label}</label><input id={id} className={`form-control ${error ? 'is-invalid' : ''}`} type="password" autoComplete={autoComplete} maxLength={128} {...registration} />{error && <div className="invalid-feedback">{error}</div>}</div>; }
