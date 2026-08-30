import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { rolesApi, type ManagedRole } from '../api/roles-api';

const roleSchema = z.object({ name: z.string().trim().min(2, 'Enter a role name.').max(50), description: z.string().max(255).optional(), permissionIds: z.array(z.string().uuid()) });
type RoleFormValues = z.infer<typeof roleSchema>;
const emptyValues: RoleFormValues = { name: '', description: '', permissionIds: [] };

export function RolesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ManagedRole | 'new' | null>(null);
  const roles = useQuery({ queryKey: ['roles'], queryFn: rolesApi.list });
  const permissions = useQuery({ queryKey: ['permissions'], queryFn: rolesApi.permissions });
  const form = useForm<RoleFormValues>({ resolver: zodResolver(roleSchema), defaultValues: emptyValues });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['roles'] });

  useEffect(() => {
    if (editing === 'new' || !editing) form.reset(emptyValues);
    else form.reset({ name: editing.name, description: editing.description ?? '', permissionIds: editing.permissions.map((permission) => permission.id) });
  }, [editing, form]);

  const save = useMutation({ mutationFn: (values: RoleFormValues) => editing === 'new' ? rolesApi.create(values) : rolesApi.update(editing!.id, values), onSuccess: () => { setEditing(null); refresh(); } });
  const deactivate = useMutation({ mutationFn: rolesApi.deactivate, onSuccess: refresh });
  const togglePermission = (id: string, checked: boolean) => { const selected = form.getValues('permissionIds'); form.setValue('permissionIds', checked ? [...selected, id] : selected.filter((value) => value !== id), { shouldDirty: true }); };

  return <div className="roles-page"><div className="page-actions"><button className="btn btn-primary" onClick={() => setEditing('new')}><i className="bi bi-plus-circle-fill me-1" />Add role</button></div><div className="table-card">{roles.isPending && <p>Loading roles…</p>}{roles.isError && <p className="status-error">{roles.error.message}</p>}{roles.data && <table><thead><tr><th>Role</th><th>Permissions</th><th>Status</th><th /></tr></thead><tbody>{roles.data.roles.map((role) => <tr key={role.id}><td><strong>{role.name}</strong>{role.description && <div className="muted-text">{role.description}</div>}</td><td>{role.permissions.length ? role.permissions.map((permission) => permission.key).join(', ') : 'No permissions'}</td><td><span className={role.isActive ? 'status-active' : 'status-inactive'}>{role.isActive ? 'Active' : 'Inactive'}</span></td><td className="row-actions"><button className="link-button" onClick={() => setEditing(role)}>Edit</button>{role.isActive && role.name !== 'System Administrator' && <button className="link-button danger" disabled={deactivate.isPending} onClick={() => { if (window.confirm(`Deactivate ${role.name}?`)) deactivate.mutate(role.id); }}>Deactivate</button>}</td></tr>)}</tbody></table>}</div>{editing && <div className="modal-backdrop"><form className="user-form role-form" onSubmit={form.handleSubmit((values) => save.mutate(values))}><div className="modal-heading"><h2>{editing === 'new' ? 'Add role' : 'Edit role'}</h2><button type="button" className="link-button" onClick={() => setEditing(null)}>Close</button></div><label>Role name<input {...form.register('name')} /></label>{form.formState.errors.name && <small>{form.formState.errors.name.message}</small>}<label>Description<input {...form.register('description')} /></label><fieldset><legend>Permissions</legend>{permissions.isPending && <p>Loading permissions…</p>}{permissions.data?.permissions.map((permission) => <label className="permission-option" key={permission.id}><input type="checkbox" checked={form.watch('permissionIds').includes(permission.id)} onChange={(event) => togglePermission(permission.id, event.target.checked)} /><span><strong>{permission.key}</strong>{permission.description && <small>{permission.description}</small>}</span></label>)}</fieldset>{save.isError && <p className="status-error">{save.error.message}</p>}<div className="form-actions"><button type="button" onClick={() => setEditing(null)}>Cancel</button><button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save role'}</button></div></form></div>}</div>;
}
