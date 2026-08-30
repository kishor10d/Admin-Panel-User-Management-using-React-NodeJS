import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '../../../app/toast-provider';
import { rolesApi, type ManagedRole } from '../api/roles-api';

const roleSchema = z.object({ name: z.string().trim().min(2, 'Enter a role name.').max(50), description: z.string().max(255).optional(), permissionIds: z.array(z.string().uuid()) });
type RoleFormValues = z.infer<typeof roleSchema>;
const emptyValues: RoleFormValues = { name: '', description: '', permissionIds: [] };

export function RolesPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState<ManagedRole | 'new' | null>(null);
  const roles = useQuery({ queryKey: ['roles'], queryFn: rolesApi.list });
  const permissions = useQuery({ queryKey: ['permissions'], queryFn: rolesApi.permissions });
  const form = useForm<RoleFormValues>({ resolver: zodResolver(roleSchema), defaultValues: emptyValues });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['roles'] });

  useEffect(() => {
    if (editing === 'new' || !editing) form.reset(emptyValues);
    else form.reset({ name: editing.name, description: editing.description ?? '', permissionIds: editing.permissions.map((permission) => permission.id) });
  }, [editing, form]);

  const save = useMutation({ mutationFn: (values: RoleFormValues) => editing === 'new' ? rolesApi.create(values) : rolesApi.update(editing!.id, values), onSuccess: () => { toast.success(editing === 'new' ? 'Role created successfully.' : 'Role updated successfully.'); setEditing(null); refresh(); }, onError: (error) => toast.error(error.message) });
  const deactivate = useMutation({ mutationFn: rolesApi.deactivate, onSuccess: (role) => { toast.success(`${role.name} was deactivated.`); refresh(); }, onError: (error) => toast.error(error.message) });
  const togglePermission = (id: string, checked: boolean) => { const selected = form.getValues('permissionIds'); form.setValue('permissionIds', checked ? [...selected, id] : selected.filter((value) => value !== id), { shouldDirty: true }); };

  return <><div className="d-flex justify-content-end mb-3"><button className="btn btn-primary" onClick={() => setEditing('new')}><i className="bi bi-plus-circle-fill me-1" />Add role</button></div><section className="card"><div className="card-body table-responsive p-0">{roles.isPending && <div className="p-3 text-body-secondary">Loading roles…</div>}{roles.isError && <div className="alert alert-danger m-3 mb-0">{roles.error.message}</div>}{roles.data && <table className="table table-hover align-middle mb-0"><thead><tr><th>Role</th><th>Permissions</th><th>Status</th><th className="text-end">Actions</th></tr></thead><tbody>{roles.data.roles.map((role) => <tr key={role.id}><td><strong>{role.name}</strong>{role.description && <div className="text-body-secondary small mt-1">{role.description}</div>}</td><td className="text-body-secondary">{role.permissions.length ? role.permissions.map((permission) => permission.key).join(', ') : 'No permissions'}</td><td><span className={`badge text-bg-${role.isActive ? 'success' : 'secondary'}`}>{role.isActive ? 'Active' : 'Inactive'}</span></td><td className="text-end text-nowrap"><button className="btn btn-outline-primary btn-sm me-2" onClick={() => setEditing(role)}>Edit</button>{role.isActive && role.name !== 'System Administrator' && <button className="btn btn-outline-danger btn-sm" disabled={deactivate.isPending} onClick={() => { if (window.confirm(`Deactivate ${role.name}?`)) deactivate.mutate(role.id); }}>Deactivate</button>}</td></tr>)}</tbody></table>}</div></section>{editing && <div className="modal fade show" style={{ display: 'block' }} role="dialog" aria-modal="true" aria-labelledby="role-modal-title"><div className="modal-dialog modal-dialog-centered modal-lg"><form className="modal-content" onSubmit={form.handleSubmit((values) => save.mutate(values))}><div className="modal-header"><h2 className="modal-title fs-5" id="role-modal-title">{editing === 'new' ? 'Add role' : 'Edit role'}</h2><button type="button" className="btn-close" onClick={() => setEditing(null)} aria-label="Close" /></div><div className="modal-body"><div className="mb-3"><label className="form-label" htmlFor="role-name">Role name</label><input id="role-name" className={`form-control ${form.formState.errors.name ? 'is-invalid' : ''}`} {...form.register('name')} />{form.formState.errors.name && <div className="invalid-feedback">{form.formState.errors.name.message}</div>}</div><div className="mb-3"><label className="form-label" htmlFor="role-description">Description</label><input id="role-description" className="form-control" {...form.register('description')} /></div><fieldset className="border rounded p-3"><legend className="float-none w-auto fs-6 px-2 mb-0">Permissions</legend>{permissions.isPending && <p className="text-body-secondary mb-0">Loading permissions…</p>}{permissions.data?.permissions.map((permission) => <div className="form-check py-2 border-bottom" key={permission.id}><input id={`permission-${permission.id}`} className="form-check-input" type="checkbox" checked={form.watch('permissionIds').includes(permission.id)} onChange={(event) => togglePermission(permission.id, event.target.checked)} /><label className="form-check-label" htmlFor={`permission-${permission.id}`}><strong>{permission.key}</strong>{permission.description && <span className="d-block text-body-secondary small">{permission.description}</span>}</label></div>)}</fieldset></div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-primary" type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save role'}</button></div></form></div></div>}{editing && <div className="modal-backdrop fade show" />}</>;
}
