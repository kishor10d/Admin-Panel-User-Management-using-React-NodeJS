import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { authApi } from '../api/auth-api';

const passwordSchema = z.object({ password: z.string().min(12, 'Use at least 12 characters.') });
const resetSchema = passwordSchema.extend({ confirmPassword: z.string() }).refine((value) => value.password === value.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' });

export function ForgotPasswordPage() {
  const form = useForm<{ email: string }>({ resolver: zodResolver(z.object({ email: z.string().email('Enter a valid email address.') })) });
  const submit = useMutation({ mutationFn: ({ email }: { email: string }) => authApi.forgotPassword(email) });
  return <main className="login-page bg-body-secondary">
    <div className="forgot-box">
      <div className="login-logo">CIAS <b>Admin</b></div>
      <div className="card">
        <div className="card-body login-card-body">
          <p className="login-box-msg">You forgot your password? Here you can easily retrieve a new password.</p>
          <form onSubmit={form.handleSubmit((values) => submit.mutate(values))}>
            {submit.isSuccess ? <div className="alert alert-success">If the account exists, a reset link has been sent. In development, check the API terminal.</div> : <><div className="input-group mb-3"><input id="forgot-email" className={`form-control ${form.formState.errors.email ? 'is-invalid' : ''}`} type="email" placeholder="Email" autoComplete="email" aria-label="Email" {...form.register('email')} /><div className="input-group-text"><span className="bi bi-envelope" /></div>{form.formState.errors.email && <div className="invalid-feedback d-block">{form.formState.errors.email.message}</div>}</div>{submit.isError && <div className="alert alert-danger py-2">Unable to request a reset link.</div>}<div className="row"><div className="col-12"><button className="btn btn-primary w-100" type="submit" disabled={submit.isPending}>{submit.isPending ? 'Sending…' : 'Request new password'}</button></div></div></>}
          </form>
          <p className="mt-3 mb-1"><Link to="/">Login</Link></p>
        </div>
      </div>
    </div>
  </main>;
}

export function ResetPasswordPage() {
  const [params] = useSearchParams(); const token = params.get('token') ?? ''; const form = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema) });
  const submit = useMutation({ mutationFn: ({ password }: z.infer<typeof resetSchema>) => authApi.resetPassword(token, password) });
  return <main className="login-page bg-body-secondary">
    <div className="login-box">
      <div className="login-logo">CIAS <b>Admin</b></div>
      <div className="card">
        <div className="card-body login-card-body">
          <p className="login-box-msg">You are only one step away from your new password. Recover your password now.</p>
          <form onSubmit={form.handleSubmit((values) => submit.mutate(values))}>
            {!token ? <div className="alert alert-danger">This reset link is invalid.</div> : submit.isSuccess ? <div className="alert alert-success">Password reset. <Link to="/">Sign in now.</Link></div> : <><div className="input-group mb-3"><input id="reset-password" className={`form-control ${form.formState.errors.password ? 'is-invalid' : ''}`} type="password" placeholder="New password" autoComplete="new-password" aria-label="New password" {...form.register('password')} /><div className="input-group-text"><span className="bi bi-lock-fill" /></div>{form.formState.errors.password && <div className="invalid-feedback d-block">{form.formState.errors.password.message}</div>}</div><div className="input-group mb-3"><input id="reset-confirmation" className={`form-control ${form.formState.errors.confirmPassword ? 'is-invalid' : ''}`} type="password" placeholder="Confirm password" autoComplete="new-password" aria-label="Confirm password" {...form.register('confirmPassword')} /><div className="input-group-text"><span className="bi bi-lock-fill" /></div>{form.formState.errors.confirmPassword && <div className="invalid-feedback d-block">{form.formState.errors.confirmPassword.message}</div>}</div>{submit.isError && <div className="alert alert-danger py-2">This reset link is invalid or expired.</div>}<div className="row"><div className="col-12"><button className="btn btn-primary w-100" type="submit" disabled={submit.isPending}>{submit.isPending ? 'Resetting…' : 'Change password'}</button></div></div></>}
          </form>
          <p className="mt-3 mb-1"><Link to="/">Login</Link></p>
        </div>
      </div>
    </div>
  </main>;
}
