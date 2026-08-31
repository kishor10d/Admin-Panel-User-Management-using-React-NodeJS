import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { authApi } from '../api/auth-api';
import { passwordSchema } from '../../../lib/password-policy';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Enter an email address.').email('Enter a valid email address.').max(254),
  password: passwordSchema,
});
type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const queryClient = useQueryClient();
  const csrf = useQuery({ queryKey: ['auth', 'csrf'], queryFn: authApi.csrf, staleTime: Infinity });
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const login = useMutation({
    mutationFn: ({ email, password }: LoginValues) => authApi.login(email, password),
    onSuccess: ({ user }) => queryClient.setQueryData(['auth', 'me'], { user }),
  });

  return <main className="login-page bg-body-secondary">
    <div className="login-box">
      <div className="login-logo">CIAS <b>Admin</b></div>
      <div className="card">
        <div className="card-body login-card-body">
          <p className="login-box-msg">Sign in to start your session</p>
          <form onSubmit={form.handleSubmit((values) => login.mutate(values))}>
            {login.isError && <div className="alert alert-danger py-2" role="alert">{login.error.message}</div>}
            <div className="input-group mb-3">
              <input id="login-email" className={`form-control ${form.formState.errors.email ? 'is-invalid' : ''}`} type="email" placeholder="Email" autoComplete="email" aria-label="Email" maxLength={254} {...form.register('email')} />
              <div className="input-group-text"><span className="bi bi-envelope" /></div>
              {form.formState.errors.email && <div className="invalid-feedback d-block">{form.formState.errors.email.message}</div>}
            </div>
            <div className="input-group mb-3">
              <input id="login-password" className={`form-control ${form.formState.errors.password ? 'is-invalid' : ''}`} type="password" placeholder="Password" autoComplete="current-password" aria-label="Password" maxLength={128} {...form.register('password')} />
              <div className="input-group-text"><span className="bi bi-lock-fill" /></div>
              {form.formState.errors.password && <div className="invalid-feedback d-block">{form.formState.errors.password.message}</div>}
            </div>
            <div className="row">
              <div className="col-12"><button className="btn btn-primary w-100" type="submit" disabled={login.isPending || csrf.isPending}>{login.isPending ? 'Signing in…' : 'Sign In'}</button></div>
            </div>
          </form>
          <p className="mb-1 mt-3"><Link to="/forgot-password">I forgot my password</Link></p>
        </div>
      </div>
    </div>
  </main>;
}
