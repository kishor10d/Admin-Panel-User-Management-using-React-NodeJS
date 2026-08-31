import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { authApi } from '../../auth/api/auth-api';
import { ChangePasswordForm } from '../../auth/components/change-password-form';
import { useToast } from '../../../app/toast-provider';

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter a name.').max(128, 'Name must be 128 characters or fewer.'),
  email: z.string().trim().min(1, 'Enter an email address.').email('Enter a valid email address.').max(254),
  mobile: z.string().regex(/^\d{0,15}$/, 'Mobile must contain only digits and be 15 digits or fewer.'),
});

type ProfileValues = z.infer<typeof profileSchema>;
type ProfileTab = 'information' | 'password';

export function ProfilePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ProfileTab>('information');
  const toast = useToast();
  const currentUser = useQuery({ queryKey: ['auth', 'me'], queryFn: authApi.me });
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', email: '', mobile: '' },
  });

  useEffect(() => {
    if (currentUser.data) form.reset(toFormValues(currentUser.data.user));
  }, [currentUser.data, form]);

  const saveProfile = useMutation({
    mutationFn: (values: ProfileValues) => authApi.updateProfile(values),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(['auth', 'me'], { user });
      form.reset(toFormValues(user));
      toast.success('Profile updated successfully.');
    },
    onError: (error) => toast.error(error.message),
  });

  if (currentUser.isPending) return <div className="card"><div className="card-body text-body-secondary">Loading profile…</div></div>;
  if (currentUser.isError) return <div className="alert alert-danger">Unable to load your profile.</div>;

  const { user } = currentUser.data;
  const setTab = (tab: ProfileTab) => setActiveTab(tab);

  return (
    <div className="row">
      <div className="col-md-4">
        <section className="card card-primary card-outline mb-4">
          <div className="card-body box-profile">
            <div className="text-center"><i className="bi bi-person-circle display-1 text-body-secondary" aria-hidden="true" /></div>
            <h3 className="profile-username text-center">{user.name ?? user.email}</h3>
            <p className="text-muted text-center">{user.roles.join(', ') || 'Administrator'}</p>
            <ul className="list-group list-group-unbordered mb-3">
              <li className="list-group-item"><b>Email</b><span className="float-end text-break text-end">{user.email}</span></li>
              <li className="list-group-item"><b>Mobile</b><span className="float-end">{user.mobile ?? 'Not provided'}</span></li>
              <li className="list-group-item"><b>Roles</b><span className="float-end text-end">{user.roles.join(', ') || 'None'}</span></li>
            </ul>
          </div>
        </section>
      </div>

      <div className="col-md-8">
        <section className="card">
          <div className="card-header p-0 border-bottom-0">
            <ul className="nav nav-tabs" role="tablist">
              <li className="nav-item" role="presentation">
                <button className={`nav-link ${activeTab === 'information' ? 'active' : ''}`} id="information-tab" type="button" role="tab" aria-controls="information" aria-selected={activeTab === 'information'} onClick={() => setTab('information')}>Admin Information</button>
              </li>
              <li className="nav-item" role="presentation">
                <button className={`nav-link ${activeTab === 'password' ? 'active' : ''}`} id="password-tab" type="button" role="tab" aria-controls="password" aria-selected={activeTab === 'password'} onClick={() => setTab('password')}>Change Password</button>
              </li>
            </ul>
          </div>
          <div className="card-body">
            <div className="tab-content">
              {activeTab === 'information' && <div className="tab-pane fade show active" id="information" role="tabpanel" aria-labelledby="information-tab">
                <form className="row g-3" onSubmit={form.handleSubmit((values) => saveProfile.mutate(values))}>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="profile-name">Full name</label>
                    <input id="profile-name" className={`form-control ${form.formState.errors.name ? 'is-invalid' : ''}`} maxLength={128} {...form.register('name')} />
                    {form.formState.errors.name && <div className="invalid-feedback">{form.formState.errors.name.message}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="profile-email">Email</label>
                    <input id="profile-email" className={`form-control ${form.formState.errors.email ? 'is-invalid' : ''}`} type="email" autoComplete="email" maxLength={254} {...form.register('email')} />
                    {form.formState.errors.email && <div className="invalid-feedback">{form.formState.errors.email.message}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="profile-mobile">Mobile</label>
                    <input id="profile-mobile" className={`form-control ${form.formState.errors.mobile ? 'is-invalid' : ''}`} type="tel" inputMode="numeric" autoComplete="tel" maxLength={15} onInput={(event) => { event.currentTarget.value = event.currentTarget.value.replace(/\D/g, '').slice(0, 15); }} {...form.register('mobile', { setValueAs: (value) => typeof value === 'string' ? value.replace(/\D/g, '').slice(0, 15) : value })} />
                    {form.formState.errors.mobile && <div className="invalid-feedback">{form.formState.errors.mobile.message}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="profile-role">Role</label>
                    <input id="profile-role" className="form-control" value={user.roles.join(', ') || 'No assigned roles'} disabled />
                  </div>
                  <div className="col-12">
                    <button className="btn btn-primary" type="submit" disabled={saveProfile.isPending}>{saveProfile.isPending ? 'Saving…' : 'Save changes'}</button>
                    <button className="btn btn-outline-secondary ms-1" type="button" onClick={() => form.reset(toFormValues(user))}>Cancel</button>
                  </div>
                </form>
              </div>}
              {activeTab === 'password' && <div className="tab-pane fade show active" id="password" role="tabpanel" aria-labelledby="password-tab"><ChangePasswordForm /></div>}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function toFormValues(user: Awaited<ReturnType<typeof authApi.me>>['user']): ProfileValues {
  return { name: user.name ?? '', email: user.email, mobile: user.mobile ?? '' };
}
