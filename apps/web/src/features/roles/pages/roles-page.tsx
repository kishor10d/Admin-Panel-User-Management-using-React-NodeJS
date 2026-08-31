import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { useToast } from '../../../app/toast-provider';
import { hasPermission, useCurrentUser } from '../../../app/current-user-context';
import { rolesApi, type ManagedRole } from '../api/roles-api';

const roleSchema = z.object({
  name: z.string().trim().min(2, 'Enter a role name.').max(50),
  description: z.string().max(255).optional(),
});
type RoleFormValues = z.infer<typeof roleSchema>;
const emptyValues: RoleFormValues = { name: '', description: '' };

export function RolesPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const currentUser = useCurrentUser();
  const canManage = hasPermission(currentUser, 'roles.manage');
  const [editing, setEditing] = useState<ManagedRole | 'new' | null>(null);
  const roles = useQuery({ queryKey: ['roles'], queryFn: rolesApi.list });
  const form = useForm<RoleFormValues>({ resolver: zodResolver(roleSchema), defaultValues: emptyValues });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['roles'] });

  useEffect(() => {
    form.reset(editing && editing !== 'new'
      ? { name: editing.name, description: editing.description ?? '' }
      : emptyValues);
  }, [editing, form]);

  const save = useMutation({
    mutationFn: (values: RoleFormValues) => editing === 'new'
      ? rolesApi.create(values)
      : rolesApi.update(editing!.id, values),
    onSuccess: () => {
      toast.success(editing === 'new' ? 'Role created successfully.' : 'Role updated successfully.');
      setEditing(null);
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const deactivate = useMutation({
    mutationFn: rolesApi.deactivate,
    onSuccess: (role) => {
      toast.success(`${role.name} was deactivated.`);
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const activate = useMutation({
    mutationFn: rolesApi.activate,
    onSuccess: (role) => {
      toast.success(`${role.name} was activated.`);
      refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  return <>
    {canManage && <div className="d-flex justify-content-end mb-3">
      <button className="btn btn-primary" onClick={() => setEditing('new')}>
        <i className="bi bi-plus-circle-fill me-1" />Add role
      </button>
    </div>}
    <section className="card">
      <div className="card-body table-responsive p-0">
        {roles.isPending && <div className="p-3 text-body-secondary">Loading roles…</div>}
        {roles.isError && <div className="alert alert-danger m-3 mb-0">{roles.error.message}</div>}
        {roles.data && <table className="table table-hover align-middle mb-0">
          <thead><tr><th>Role</th><th>Assigned permissions</th><th>Status</th><th className="text-end">Actions</th></tr></thead>
          <tbody>{roles.data.roles.map((role) => <tr key={role.id}>
            <td><strong>{role.name}</strong>{role.description && <div className="text-body-secondary small mt-1">{role.description}</div>}</td>
            <td className="text-body-secondary">{role.permissions.length} assigned</td>
            <td><span className={`badge text-bg-${role.isActive ? 'success' : 'secondary'}`}>{role.isActive ? 'Active' : 'Inactive'}</span></td>
            <td className="text-end text-nowrap">
              <div className="d-flex justify-content-end align-items-center gap-2">
              <Link className="btn btn-outline-primary btn-sm" to={`/roles/${role.id}`} aria-label={`View ${role.name}`} title="View role"><i className="bi bi-eye" /></Link>
              {canManage && <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditing(role)} aria-label={`Edit ${role.name}`} title="Edit role"><i className="bi bi-pencil" /></button>}
              {canManage && role.isActive && role.name !== 'System Administrator' && <button className="btn btn-outline-danger btn-sm" disabled={deactivate.isPending} onClick={() => {
                if (window.confirm(`Deactivate ${role.name}?`)) deactivate.mutate(role.id);
              }} aria-label={`Deactivate ${role.name}`} title="Deactivate role"><i className="bi bi-trash" /></button>}
              {canManage && !role.isActive && <button className="btn btn-outline-success btn-sm" disabled={activate.isPending} onClick={() => {
                if (window.confirm(`Activate ${role.name}?`)) activate.mutate(role.id);
              }} aria-label={`Activate ${role.name}`} title="Activate role"><i className="bi bi-arrow-counterclockwise" /></button>}
              </div>
            </td>
          </tr>)}</tbody>
        </table>}
      </div>
    </section>
    {editing && <RoleModal editing={editing} form={form} saving={save.isPending} onClose={() => setEditing(null)} onSave={(values) => save.mutate(values)} />}
  </>;
}

function RoleModal({ editing, form, saving, onClose, onSave }: {
  editing: ManagedRole | 'new';
  form: ReturnType<typeof useForm<RoleFormValues>>;
  saving: boolean;
  onClose: () => void;
  onSave: (values: RoleFormValues) => void;
}) {
  return <>
    <div className="modal fade show" style={{ display: 'block' }} role="dialog" aria-modal="true" aria-labelledby="role-modal-title">
      <div className="modal-dialog modal-dialog-centered">
        <form className="modal-content" onSubmit={form.handleSubmit(onSave)}>
          <div className="modal-header"><h2 className="modal-title fs-5" id="role-modal-title">{editing === 'new' ? 'Add role' : 'Edit role'}</h2><button type="button" className="btn-close" onClick={onClose} aria-label="Close" /></div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label" htmlFor="role-name">Role name</label>
              <input id="role-name" className={`form-control ${form.formState.errors.name ? 'is-invalid' : ''}`} {...form.register('name')} />
              {form.formState.errors.name && <div className="invalid-feedback">{form.formState.errors.name.message}</div>}
            </div>
            <div>
              <label className="form-label" htmlFor="role-description">Description</label>
              <textarea id="role-description" className="form-control" rows={3} {...form.register('description')} />
            </div>
          </div>
          <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save role'}</button></div>
        </form>
      </div>
    </div>
    <div className="modal-backdrop fade show" />
  </>;
}
