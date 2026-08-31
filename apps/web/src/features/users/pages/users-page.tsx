import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '../../../app/toast-provider';
import { hasPermission, isSystemAdministrator, useCurrentUser } from '../../../app/current-user-context';
import { isValidPassword, PASSWORD_REQUIREMENTS_MESSAGE } from '../../../lib/password-policy';
import { usersApi, type ManagedUser, type UserType } from '../api/users-api';

const userTypes = ['REGULAR', 'SYSTEM_ADMINISTRATOR', 'SERVICE'] as const;
const userTypeLabels: Record<UserType, string> = {
  REGULAR: 'Regular user',
  SYSTEM_ADMINISTRATOR: 'System administrator',
  SERVICE: 'Service account',
};

type UserFormValues = { email: string; name: string; mobile: string; userType: UserType; password: string; roleId: string };

const updateUserSchema: z.ZodType<UserFormValues> = z.object({
  email: z.string().email('Enter a valid email address.'),
  name: z.string().max(128),
  mobile: z.string().max(20),
  userType: z.enum(userTypes),
  password: z.string().refine((value) => !value || isValidPassword(value), PASSWORD_REQUIREMENTS_MESSAGE),
  roleId: z.string().uuid('Select a role.'),
});
const createUserSchema: z.ZodType<UserFormValues> = z.object({
  email: z.string().trim().min(1, 'Enter an email address.').email('Enter a valid email address.'),
  name: z.string().trim().min(1, 'Enter a name.').max(128),
  mobile: z.string().trim().min(1, 'Enter a mobile number.').max(20),
  userType: z.enum(userTypes),
  password: z.string().min(1, 'Enter a password.').refine(isValidPassword, PASSWORD_REQUIREMENTS_MESSAGE),
  roleId: z.string().uuid('Select a role.'),
});
const emptyValues: UserFormValues = { email: '', name: '', mobile: '', userType: 'REGULAR', password: '', roleId: '' };

export function UsersPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const currentUser = useCurrentUser();
  const canCreate = hasPermission(currentUser, 'users.create');
  const canUpdate = hasPermission(currentUser, 'users.update');
  const canDeactivate = hasPermission(currentUser, 'users.delete');
  const canManageSystemAdministrators = isSystemAdministrator(currentUser);
  const availableUserTypes = canManageSystemAdministrators ? userTypes : userTypes.filter((userType) => userType !== 'SYSTEM_ADMINISTRATOR');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ManagedUser | 'new' | null>(null);
  const users = useQuery({ queryKey: ['users', page, search], queryFn: () => usersApi.list(page, search) });
  const roles = useQuery({ queryKey: ['roles'], queryFn: usersApi.roles, enabled: canCreate || canUpdate });
  const form = useForm<UserFormValues>({ resolver: zodResolver(editing === 'new' ? createUserSchema : updateUserSchema), defaultValues: emptyValues });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  useEffect(() => {
    form.reset(editing && editing !== 'new'
      ? { email: editing.email, name: editing.name ?? '', mobile: editing.mobile ?? '', userType: editing.userType, password: '', roleId: editing.roles[0]?.id ?? '' }
      : emptyValues);
  }, [editing, form]);

  const save = useMutation({
    mutationFn: (values: UserFormValues) => {
      const payload: Record<string, unknown> = { email: values.email, name: values.name, mobile: values.mobile, userType: values.userType, roleIds: [values.roleId] };
      if (values.password) payload.password = values.password;
      return editing === 'new' ? usersApi.create({ ...payload, password: values.password }) : usersApi.update(editing!.id, payload);
    },
    onSuccess: () => {
      toast.success(editing === 'new' ? 'User created successfully.' : 'User updated successfully.');
      setEditing(null);
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const deactivate = useMutation({
    mutationFn: usersApi.deactivate,
    onSuccess: (user) => {
      toast.success(`${user.email} was deactivated.`);
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const activate = useMutation({
    mutationFn: usersApi.activate,
    onSuccess: (user) => {
      toast.success(`${user.email} was activated.`);
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const onSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return <>
    {canCreate && <div className="d-flex justify-content-end mb-3"><button className="btn btn-primary" onClick={() => setEditing('new')}><i className="bi bi-person-plus-fill me-1" />Add user</button></div>}
    <section className="card">
      <div className="card-header"><div className="card-tools"><div className="input-group input-group-sm" style={{ width: 320 }}><input className="form-control" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search name, email, or mobile" /><span className="input-group-text"><i className="bi bi-search" /></span></div></div></div>
      <div className="card-body table-responsive p-0">
        {users.isPending && <div className="p-3 text-body-secondary">Loading users…</div>}
        {users.isError && <div className="alert alert-danger m-3 mb-0">{users.error.message}</div>}
        {users.data && <table className="table table-hover text-nowrap mb-0">
          <thead><tr><th>Name</th><th>Email</th><th>User type</th><th>Roles</th><th>Status</th><th className="text-end">Actions</th></tr></thead>
          <tbody>{users.data.items.map((user) => {
            const canManageUser = user.userType !== 'SYSTEM_ADMINISTRATOR' || canManageSystemAdministrators;
            return <tr key={user.id}>
            <td>{user.name || '—'}</td><td>{user.email}</td><td>{userTypeLabels[user.userType]}</td><td>{user.roles.map((role) => role.name).join(', ') || '—'}</td>
            <td><span className={`badge text-bg-${user.isActive ? 'success' : 'secondary'}`}>{user.isActive ? 'Active' : 'Inactive'}</span></td>
            <td className="text-end"><div className="d-flex justify-content-end align-items-center gap-2">
              {canUpdate && canManageUser && <button className="btn btn-outline-primary btn-sm" onClick={() => setEditing(user)} aria-label={`Edit ${user.email}`} title="Edit user"><i className="bi bi-pencil" /></button>}
              {canDeactivate && canManageUser && user.isActive && <button className="btn btn-outline-danger btn-sm" disabled={deactivate.isPending} onClick={() => { if (window.confirm(`Deactivate ${user.email}?`)) deactivate.mutate(user.id); }} aria-label={`Deactivate ${user.email}`} title="Deactivate user"><i className="bi bi-trash" /></button>}
              {canUpdate && canManageUser && !user.isActive && <button className="btn btn-outline-success btn-sm" disabled={activate.isPending} onClick={() => { if (window.confirm(`Activate ${user.email}?`)) activate.mutate(user.id); }} aria-label={`Activate ${user.email}`} title="Activate user"><i className="bi bi-arrow-counterclockwise" /></button>}
            </div></td>
          </tr>;
          })}</tbody>
        </table>}
      </div>
      {users.data && <div className="card-footer d-flex flex-wrap justify-content-between align-items-center gap-2"><span className="text-body-secondary small">{users.data.total} user(s)</span><nav aria-label="User pagination"><ul className="pagination pagination-sm mb-0"><li className={`page-item ${page <= 1 ? 'disabled' : ''}`}><button className="page-link" onClick={() => setPage(page - 1)}>Previous</button></li><li className="page-item disabled"><span className="page-link">Page {page} of {users.data.totalPages}</span></li><li className={`page-item ${page >= users.data.totalPages ? 'disabled' : ''}`}><button className="page-link" onClick={() => setPage(page + 1)}>Next</button></li></ul></nav></div>}
    </section>
    {editing && <UserModal editing={editing} form={form} roles={roles.data?.roles ?? []} availableUserTypes={availableUserTypes} saving={save.isPending} onClose={() => setEditing(null)} onSave={(values) => save.mutate(values)} />}
  </>;
}

function UserModal({ editing, form, roles, availableUserTypes, saving, onClose, onSave }: {
  editing: ManagedUser | 'new';
  form: ReturnType<typeof useForm<UserFormValues>>;
  roles: Array<{ id: string; name: string }>;
  availableUserTypes: readonly UserType[];
  saving: boolean;
  onClose: () => void;
  onSave: (values: UserFormValues) => void;
}) {
  return <>
    <div className="modal fade show" style={{ display: 'block' }} role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
      <div className="modal-dialog modal-dialog-centered">
        <form className="modal-content" onSubmit={form.handleSubmit(onSave)}>
          <div className="modal-header"><h2 className="modal-title fs-5" id="user-modal-title">{editing === 'new' ? 'Add user' : 'Edit user'}</h2><button type="button" className="btn-close" onClick={onClose} aria-label="Close" /></div>
          <div className="modal-body">
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label" htmlFor="user-email">Email</label>
                <input id="user-email" className={`form-control ${form.formState.errors.email ? 'is-invalid' : ''}`} type="email" {...form.register('email')} />
                {form.formState.errors.email && <div className="invalid-feedback">{form.formState.errors.email.message}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="user-name">Name</label>
                <input id="user-name" className={`form-control ${form.formState.errors.name ? 'is-invalid' : ''}`} {...form.register('name')} />
                {form.formState.errors.name && <div className="invalid-feedback">{form.formState.errors.name.message}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="user-mobile">Mobile</label>
                <input id="user-mobile" className={`form-control ${form.formState.errors.mobile ? 'is-invalid' : ''}`} {...form.register('mobile')} />
                {form.formState.errors.mobile && <div className="invalid-feedback">{form.formState.errors.mobile.message}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="user-type">User type</label>
                <select id="user-type" className={`form-select ${form.formState.errors.userType ? 'is-invalid' : ''}`} {...form.register('userType')}>{availableUserTypes.map((userType) => <option key={userType} value={userType}>{userTypeLabels[userType]}</option>)}</select>
                {form.formState.errors.userType && <div className="invalid-feedback">{form.formState.errors.userType.message}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="user-role">Role</label>
                <select id="user-role" className={`form-select ${form.formState.errors.roleId ? 'is-invalid' : ''}`} {...form.register('roleId')}><option value="">Select a role</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select>
                {form.formState.errors.roleId && <div className="invalid-feedback">{form.formState.errors.roleId.message}</div>}
              </div>
              <div className="col-12">
                <label className="form-label" htmlFor="user-password">{editing === 'new' ? 'Password' : 'New password (optional)'}</label>
                <input id="user-password" className={`form-control ${form.formState.errors.password ? 'is-invalid' : ''}`} type="password" autoComplete="new-password" {...form.register('password')} />
                {form.formState.errors.password && <div className="invalid-feedback">{form.formState.errors.password.message}</div>}
              </div>
            </div>
          </div>
          <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save user'}</button></div>
        </form>
      </div>
    </div>
    <div className="modal-backdrop fade show" />
  </>;
}
