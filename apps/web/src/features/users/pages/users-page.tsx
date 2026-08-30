import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '../../../app/toast-provider';
import { isValidPassword, PASSWORD_REQUIREMENTS_MESSAGE } from '../../../lib/password-policy';
import { usersApi, type ManagedUser } from '../api/users-api';

const userSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  name: z.string().max(128).optional(),
  mobile: z.string().max(20).optional(),
  password: z.string().refine((value) => !value || isValidPassword(value), PASSWORD_REQUIREMENTS_MESSAGE),
  roleId: z.string().uuid('Select a role.'),
});
type UserFormValues = z.infer<typeof userSchema>;
const emptyValues: UserFormValues = { email: '', name: '', mobile: '', password: '', roleId: '' };

export function UsersPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
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
    onSuccess: () => { toast.success(editing ? 'User updated successfully.' : 'User created successfully.'); setEditing(null); refresh(); },
    onError: (error) => toast.error(error.message),
  });
  const deactivate = useMutation({ mutationFn: usersApi.deactivate, onSuccess: (user) => { toast.success(`${user.email} was deactivated.`); refresh(); }, onError: (error) => toast.error(error.message) });
  const onSearch = (value: string) => { setSearch(value); setPage(1); };

  return <><div className="d-flex justify-content-end mb-3"><button className="btn btn-primary" onClick={() => setEditing({ ...emptyValues, id: '', isActive: true, mustChangePassword: true, roles: [], createdAt: '', updatedAt: '' } as ManagedUser)}><i className="bi bi-person-plus-fill me-1" />Add user</button></div><section className="card"><div className="card-header"><div className="card-tools"><div className="input-group input-group-sm" style={{ width: 320 }}><input className="form-control" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search name, email, or mobile" /><span className="input-group-text"><i className="bi bi-search" /></span></div></div></div><div className="card-body table-responsive p-0">{users.isPending && <div className="p-3 text-body-secondary">Loading users…</div>}{users.isError && <div className="alert alert-danger m-3 mb-0">{users.error.message}</div>}{users.data && <table className="table table-hover text-nowrap mb-0"><thead><tr><th>Name</th><th>Email</th><th>Roles</th><th>Status</th><th className="text-end">Actions</th></tr></thead><tbody>{users.data.items.map((user) => <tr key={user.id}><td>{user.name || '—'}</td><td>{user.email}</td><td>{user.roles.map((role) => role.name).join(', ') || '—'}</td><td><span className={`badge text-bg-${user.isActive ? 'success' : 'secondary'}`}>{user.isActive ? 'Active' : 'Inactive'}</span></td><td className="text-end"><button className="btn btn-outline-primary btn-sm me-2" onClick={() => setEditing(user)}>Edit</button>{user.isActive && <button className="btn btn-outline-danger btn-sm" disabled={deactivate.isPending} onClick={() => { if (window.confirm(`Deactivate ${user.email}?`)) deactivate.mutate(user.id); }}>Deactivate</button>}</td></tr>)}</tbody></table>}</div>{users.data && <div className="card-footer d-flex flex-wrap justify-content-between align-items-center gap-2"><span className="text-body-secondary small">{users.data.total} user(s)</span><nav aria-label="User pagination"><ul className="pagination pagination-sm mb-0"><li className={`page-item ${page <= 1 ? 'disabled' : ''}`}><button className="page-link" onClick={() => setPage(page - 1)}>Previous</button></li><li className="page-item disabled"><span className="page-link">Page {page} of {users.data.totalPages}</span></li><li className={`page-item ${page >= users.data.totalPages ? 'disabled' : ''}`}><button className="page-link" onClick={() => setPage(page + 1)}>Next</button></li></ul></nav></div>}</section>{editing && <div className="modal fade show" style={{ display: 'block' }} role="dialog" aria-modal="true" aria-labelledby="user-modal-title"><div className="modal-dialog modal-dialog-centered"><form className="modal-content" onSubmit={form.handleSubmit((values) => save.mutate(values))}><div className="modal-header"><h2 className="modal-title fs-5" id="user-modal-title">{editing.id ? 'Edit user' : 'Add user'}</h2><button type="button" className="btn-close" onClick={() => setEditing(null)} aria-label="Close" /></div><div className="modal-body"><div className="mb-3"><label className="form-label" htmlFor="user-email">Email</label><input id="user-email" className="form-control" type="email" {...form.register('email')} /></div><div className="mb-3"><label className="form-label" htmlFor="user-name">Name</label><input id="user-name" className="form-control" {...form.register('name')} /></div><div className="mb-3"><label className="form-label" htmlFor="user-mobile">Mobile</label><input id="user-mobile" className="form-control" {...form.register('mobile')} /></div><div className="mb-3"><label className="form-label" htmlFor="user-password">{editing.id ? 'New password (optional)' : 'Password'}</label><input id="user-password" className={`form-control ${form.formState.errors.password ? 'is-invalid' : ''}`} type="password" autoComplete="new-password" {...form.register('password')} />{form.formState.errors.password && <div className="invalid-feedback">{form.formState.errors.password.message}</div>}</div><div><label className="form-label" htmlFor="user-role">Role</label><select id="user-role" className={`form-select ${form.formState.errors.roleId ? 'is-invalid' : ''}`} {...form.register('roleId')}><option value="">Select a role</option>{roles.data?.roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select>{form.formState.errors.roleId && <div className="invalid-feedback">{form.formState.errors.roleId.message}</div>}</div></div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-primary" type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save user'}</button></div></form></div></div>}{editing && <div className="modal-backdrop fade show" />}</>;
}
