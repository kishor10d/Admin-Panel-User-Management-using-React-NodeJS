import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '../../../app/toast-provider';
import { hasPermission, isSystemAdministrator, useCurrentUser } from '../../../app/current-user-context';
import { DataTableFooter, EmptyTableRow, SortableTableHeader } from '../../../components/ui/data-table';
import { ConfirmationModal } from '../../../components/ui/confirmation-modal';
import { isValidPassword, PASSWORD_REQUIREMENTS_MESSAGE } from '../../../lib/password-policy';
import { useDebouncedValue } from '../../../lib/use-debounced-value';
import { usersApi, type ListUsersOptions, type ManagedUser, type UserType } from '../api/users-api';

const userTypes = ['REGULAR', 'SYSTEM_ADMINISTRATOR', 'SERVICE'] as const;
const userTypeLabels: Record<UserType, string> = {
  REGULAR: 'Regular user',
  SYSTEM_ADMINISTRATOR: 'System administrator',
  SERVICE: 'Service account',
};

type UserFormValues = { email: string; name: string; mobile: string; userType: UserType; password: string; roleId: string };

const updateUserSchema: z.ZodType<UserFormValues> = z.object({
  email: z.string().trim().min(1, 'Enter an email address.').email('Enter a valid email address.').max(254),
  name: z.string().trim().min(2, 'Enter a name.').max(128),
  mobile: z.string().regex(/^\d{0,15}$/, 'Mobile must contain only digits and be 15 digits or fewer.'),
  userType: z.enum(userTypes),
  password: z.string().refine((value) => !value || isValidPassword(value), PASSWORD_REQUIREMENTS_MESSAGE),
  roleId: z.string().uuid('Select a role.'),
});
const createUserSchema: z.ZodType<UserFormValues> = z.object({
  email: z.string().trim().min(1, 'Enter an email address.').email('Enter a valid email address.').max(254),
  name: z.string().trim().min(1, 'Enter a name.').max(128),
  mobile: z.string().trim().min(1, 'Enter a mobile number.').regex(/^\d{1,15}$/, 'Mobile must contain only digits and be 15 digits or fewer.'),
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
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState<ListUsersOptions['sortBy']>('createdAt');
  const [sortOrder, setSortOrder] = useState<ListUsersOptions['sortOrder']>('DESC');
  const [editing, setEditing] = useState<ManagedUser | 'new' | null>(null);
  const [confirmation, setConfirmation] = useState<{ user: ManagedUser; action: 'activate' | 'deactivate' } | null>(null);
  const debouncedSearch = useDebouncedValue(search);
  const users = useQuery({ queryKey: ['users', page, limit, debouncedSearch, sortBy, sortOrder], queryFn: () => usersApi.list({ page, limit, search: debouncedSearch, sortBy, sortOrder }) });
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
      setConfirmation(null);
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const activate = useMutation({
    mutationFn: usersApi.activate,
    onSuccess: (user) => {
      toast.success(`${user.email} was activated.`);
      setConfirmation(null);
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const onSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const changeLimit = (nextLimit: number) => { setLimit(nextLimit); setPage(1); };
  const toggleSort = (field: ListUsersOptions['sortBy']) => {
    if (sortBy === field) setSortOrder((current) => current === 'ASC' ? 'DESC' : 'ASC');
    else { setSortBy(field); setSortOrder('ASC'); }
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
          <thead><tr><SortableTableHeader label="Name" field="name" sortBy={sortBy} sortOrder={sortOrder} onSort={(field) => toggleSort(field as ListUsersOptions['sortBy'])} /><SortableTableHeader label="Email" field="email" sortBy={sortBy} sortOrder={sortOrder} onSort={(field) => toggleSort(field as ListUsersOptions['sortBy'])} /><SortableTableHeader label="User type" field="userType" sortBy={sortBy} sortOrder={sortOrder} onSort={(field) => toggleSort(field as ListUsersOptions['sortBy'])} /><th>Roles</th><SortableTableHeader label="Status" field="isActive" sortBy={sortBy} sortOrder={sortOrder} onSort={(field) => toggleSort(field as ListUsersOptions['sortBy'])} /><th className="text-end">Actions</th></tr></thead>
          <tbody>{users.data.items.map((user) => {
            const canManageUser = user.userType !== 'SYSTEM_ADMINISTRATOR' || canManageSystemAdministrators;
            return <tr key={user.id}>
            <td>{user.name || '—'}</td><td>{user.email}</td><td>{userTypeLabels[user.userType]}</td><td>{user.roles.map((role) => role.name).join(', ') || '—'}</td>
            <td><span className={`badge text-bg-${user.isActive ? 'success' : 'secondary'}`}>{user.isActive ? 'Active' : 'Inactive'}</span></td>
            <td className="text-end"><div className="d-flex justify-content-end align-items-center gap-2">
              {canUpdate && canManageUser && <button className="btn btn-outline-primary btn-sm" onClick={() => setEditing(user)} aria-label={`Edit ${user.email}`} title="Edit user"><i className="bi bi-pencil" /></button>}
              {canDeactivate && canManageUser && user.isActive && <button className="btn btn-outline-danger btn-sm" disabled={deactivate.isPending} onClick={() => setConfirmation({ user, action: 'deactivate' })} aria-label={`Deactivate ${user.email}`} title="Deactivate user"><i className="bi bi-trash" /></button>}
              {canUpdate && canManageUser && !user.isActive && <button className="btn btn-outline-success btn-sm" disabled={activate.isPending} onClick={() => setConfirmation({ user, action: 'activate' })} aria-label={`Activate ${user.email}`} title="Activate user"><i className="bi bi-arrow-counterclockwise" /></button>}
            </div></td>
          </tr>;
          })}{users.data.items.length === 0 && <EmptyTableRow colSpan={6} message="No users found." />}</tbody>
        </table>}
      </div>
      {users.data && <DataTableFooter itemLabel="users" total={users.data.total} page={page} totalPages={users.data.totalPages} limit={limit} onPageChange={setPage} onLimitChange={changeLimit} />}
    </section>
    {editing && <UserModal editing={editing} form={form} roles={roles.data?.roles ?? []} rolesLoading={roles.isPending} rolesError={roles.isError ? roles.error.message : undefined} availableUserTypes={availableUserTypes} saving={save.isPending} onClose={() => setEditing(null)} onSave={(values) => save.mutate(values)} />}
    {confirmation && <ConfirmationModal title={`${confirmation.action === 'activate' ? 'Activate' : 'Deactivate'} user`} message={<>Are you sure you want to {confirmation.action} <strong>{confirmation.user.email}</strong>?</>} confirmLabel={`${confirmation.action === 'activate' ? 'Activate' : 'Deactivate'} user`} variant={confirmation.action === 'activate' ? 'success' : 'danger'} pending={confirmation.action === 'activate' ? activate.isPending : deactivate.isPending} onConfirm={() => confirmation.action === 'activate' ? activate.mutate(confirmation.user.id) : deactivate.mutate(confirmation.user.id)} onCancel={() => setConfirmation(null)} />}
  </>;
}

function UserModal({ editing, form, roles, rolesLoading, rolesError, availableUserTypes, saving, onClose, onSave }: {
  editing: ManagedUser | 'new';
  form: ReturnType<typeof useForm<UserFormValues>>;
  roles: Array<{ id: string; name: string }>;
  rolesLoading: boolean;
  rolesError?: string;
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
                <input id="user-email" className={`form-control ${form.formState.errors.email ? 'is-invalid' : ''}`} type="email" maxLength={254} {...form.register('email')} />
                {form.formState.errors.email && <div className="invalid-feedback">{form.formState.errors.email.message}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="user-name">Name</label>
                <input id="user-name" className={`form-control ${form.formState.errors.name ? 'is-invalid' : ''}`} maxLength={128} {...form.register('name')} />
                {form.formState.errors.name && <div className="invalid-feedback">{form.formState.errors.name.message}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="user-mobile">Mobile</label>
                <input id="user-mobile" className={`form-control ${form.formState.errors.mobile ? 'is-invalid' : ''}`} type="tel" inputMode="numeric" autoComplete="tel" maxLength={15} onInput={(event) => { event.currentTarget.value = event.currentTarget.value.replace(/\D/g, '').slice(0, 15); }} {...form.register('mobile', { setValueAs: (value) => typeof value === 'string' ? value.replace(/\D/g, '').slice(0, 15) : value })} />
                {form.formState.errors.mobile && <div className="invalid-feedback">{form.formState.errors.mobile.message}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="user-type">User type</label>
                <select id="user-type" className={`form-select ${form.formState.errors.userType ? 'is-invalid' : ''}`} {...form.register('userType')}>{availableUserTypes.map((userType) => <option key={userType} value={userType}>{userTypeLabels[userType]}</option>)}</select>
                {form.formState.errors.userType && <div className="invalid-feedback">{form.formState.errors.userType.message}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="user-role">Role</label>
                <select id="user-role" className={`form-select ${form.formState.errors.roleId ? 'is-invalid' : ''}`} disabled={rolesLoading || Boolean(rolesError)} {...form.register('roleId')}><option value="">{rolesLoading ? 'Loading roles…' : rolesError ? 'Roles unavailable' : 'Select a role'}</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select>
                {form.formState.errors.roleId && <div className="invalid-feedback">{form.formState.errors.roleId.message}</div>}
                {rolesError && <div className="form-text text-danger">{rolesError}</div>}
              </div>
              <div className="col-12">
                <label className="form-label" htmlFor="user-password">{editing === 'new' ? 'Password' : 'New password (optional)'}</label>
                <input id="user-password" className={`form-control ${form.formState.errors.password ? 'is-invalid' : ''}`} type="password" autoComplete="new-password" maxLength={128} {...form.register('password')} />
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
