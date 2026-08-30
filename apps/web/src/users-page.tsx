import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { usersApi, type ManagedUser } from './users';

const userSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  name: z.string().max(128).optional(),
  mobile: z.string().max(20).optional(),
  password: z.string().refine((value) => !value || value.length >= 12, 'Use at least 12 characters.'),
  roleId: z.string().uuid('Select a role.'),
});
type UserFormValues = z.infer<typeof userSchema>;

const emptyValues: UserFormValues = { email: '', name: '', mobile: '', password: '', roleId: '' };

export function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const users = useQuery({ queryKey: ['users', page, search], queryFn: () => usersApi.list(page, search) });
  const roles = useQuery({ queryKey: ['roles'], queryFn: usersApi.roles });
  const form = useForm<UserFormValues>({ resolver: zodResolver(userSchema), defaultValues: emptyValues });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  useEffect(() => {
    if (!editing) form.reset(emptyValues);
    else form.reset({ email: editing.email, name: editing.name ?? '', mobile: editing.mobile ?? '', password: '', roleId: editing.roles[0]?.id ?? '' });
  }, [editing, form]);

  const save = useMutation({
    mutationFn: (values: UserFormValues) => {
      const payload: Record<string, unknown> = { email: values.email, name: values.name, mobile: values.mobile, roleIds: [values.roleId] };
      if (values.password) payload.password = values.password;
      return editing ? usersApi.update(editing.id, payload) : usersApi.create({ ...payload, password: values.password });
    },
    onSuccess: () => { setEditing(null); refresh(); },
  });
  const deactivate = useMutation({ mutationFn: usersApi.deactivate, onSuccess: refresh });

  const onSearch = (value: string) => { setSearch(value); setPage(1); };
  return (
    <div className="users-page">
      <div className="page-heading"><div><h1>Users</h1><p>Manage access to this application.</p></div><button onClick={() => setEditing({ ...emptyValues, id: '', isActive: true, mustChangePassword: true, roles: [], createdAt: '', updatedAt: '' } as ManagedUser)}>Add user</button></div>
      <div className="table-card">
        <input className="search-input" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search name, email, or mobile" />
        {users.isPending && <p>Loading users…</p>}
        {users.isError && <p className="status-error">{users.error.message}</p>}
        {users.data && <><table><thead><tr><th>Name</th><th>Email</th><th>Roles</th><th>Status</th><th /></tr></thead><tbody>{users.data.items.map((user) => <tr key={user.id}><td>{user.name || '—'}</td><td>{user.email}</td><td>{user.roles.map((role) => role.name).join(', ') || '—'}</td><td><span className={user.isActive ? 'status-active' : 'status-inactive'}>{user.isActive ? 'Active' : 'Inactive'}</span></td><td className="row-actions"><button className="link-button" onClick={() => setEditing(user)}>Edit</button>{user.isActive && <button className="link-button danger" disabled={deactivate.isPending} onClick={() => { if (window.confirm(`Deactivate ${user.email}?`)) deactivate.mutate(user.id); }}>Deactivate</button>}</td></tr>)}</tbody></table><div className="pagination"><span>{users.data.total} user(s)</span><div><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {users.data.totalPages}</span><button disabled={page >= users.data.totalPages} onClick={() => setPage(page + 1)}>Next</button></div></div></>}
      </div>
      {editing && <div className="modal-backdrop"><form className="user-form" onSubmit={form.handleSubmit((values) => save.mutate(values))}><div className="modal-heading"><h2>{editing.id ? 'Edit user' : 'Add user'}</h2><button type="button" className="link-button" onClick={() => setEditing(null)}>Close</button></div><label>Email<input type="email" {...form.register('email')} /></label><label>Name<input {...form.register('name')} /></label><label>Mobile<input {...form.register('mobile')} /></label><label>{editing.id ? 'New password (optional)' : 'Password'}<input type="password" autoComplete="new-password" {...form.register('password')} /></label>{form.formState.errors.password && <small>{form.formState.errors.password.message}</small>}<label>Role<select {...form.register('roleId')}><option value="">Select a role</option>{roles.data?.roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>{form.formState.errors.roleId && <small>{form.formState.errors.roleId.message}</small>}{save.isError && <p className="status-error">{save.error.message}</p>}<div className="form-actions"><button type="button" onClick={() => setEditing(null)}>Cancel</button><button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save user'}</button></div></form></div>}
    </div>
  );
}
