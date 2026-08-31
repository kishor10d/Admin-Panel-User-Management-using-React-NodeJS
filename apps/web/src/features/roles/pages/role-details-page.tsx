import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useToast } from '../../../app/toast-provider';
import { hasPermission, useCurrentUser } from '../../../app/current-user-context';
import { rolesApi, type PermissionItem } from '../api/roles-api';

const actionLabels: Record<string, string> = {
  read: 'View',
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
  manage: 'Manage',
};

function readableModule(module: string) {
  return module.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function readablePermission(permission: PermissionItem) {
  const [module, action] = permission.key.split('.');
  return `${actionLabels[action] ?? action} ${readableModule(module)}`;
}

export function RoleDetailsPage() {
  const { roleId = '' } = useParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const currentUser = useCurrentUser();
  const canManage = hasPermission(currentUser, 'roles.manage');
  const role = useQuery({ queryKey: ['roles', roleId], queryFn: () => rolesApi.get(roleId), enabled: Boolean(roleId) });
  const permissions = useQuery({ queryKey: ['permissions'], queryFn: rolesApi.permissions });
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  useEffect(() => {
    if (role.data) setSelectedPermissionIds(role.data.permissions.map((permission) => permission.id));
  }, [role.data]);

  const matrix = useMemo(() => {
    const grouped = new Map<string, PermissionItem[]>();
    for (const permission of permissions.data?.permissions ?? []) {
      const module = permission.key.split('.')[0];
      grouped.set(module, [...(grouped.get(module) ?? []), permission]);
    }
    return [...grouped.entries()].sort(([first], [second]) => first.localeCompare(second));
  }, [permissions.data]);

  const actions = useMemo(() => {
    const available = new Set((permissions.data?.permissions ?? []).map((permission) => permission.key.split('.')[1]));
    return ['read', 'create', 'update', 'delete', 'manage'].filter((action) => available.has(action));
  }, [permissions.data]);

  const savePermissions = useMutation({
    mutationFn: () => rolesApi.updatePermissions(roleId, selectedPermissionIds),
    onSuccess: (updatedRole) => {
      queryClient.setQueryData(['roles', roleId], updatedRole);
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role permissions updated successfully.');
    },
    onError: (error) => toast.error(error.message),
  });

  const togglePermission = (id: string, checked: boolean) => {
    setSelectedPermissionIds((selected) => checked ? [...selected, id] : selected.filter((permissionId) => permissionId !== id));
  };

  if (role.isPending) return <div className="card"><div className="card-body text-body-secondary">Loading role…</div></div>;
  if (role.isError || !role.data) return <div className="alert alert-danger">{role.isError ? role.error.message : 'Role not found.'}</div>;

  const selected = new Set(selectedPermissionIds);
  const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

  return <div className="row">
    <div className="col-12">
      <section className="card card-primary card-outline">
        <div className="card-header"><h3 className="card-title">Role information</h3><div className="card-tools"><Link className="btn btn-outline-secondary btn-sm" to="/roles">Back to roles</Link></div></div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6"><div className="text-body-secondary small">Role name</div><strong>{role.data.name}</strong></div>
            <div className="col-md-6"><div className="text-body-secondary small">Status</div><span className={`badge text-bg-${role.data.isActive ? 'success' : 'secondary'}`}>{role.data.isActive ? 'Active' : 'Inactive'}</span></div>
            <div className="col-12"><div className="text-body-secondary small">Description</div><span>{role.data.description || 'No description provided.'}</span></div>
            <div className="col-md-6"><div className="text-body-secondary small">Created</div><span>{formatDate(role.data.createdAt)}</span></div>
            <div className="col-md-6"><div className="text-body-secondary small">Last updated</div><span>{formatDate(role.data.updatedAt)}</span></div>
          </div>
        </div>
      </section>
    </div>
    <div className="col-12">
      <section className="card">
        <div className="card-header"><h3 className="card-title">Permissions</h3><div className="card-tools"><span className="text-body-secondary small">{canManage ? 'Select the actions this role can perform.' : 'Assigned actions for this role.'}</span></div></div>
        <div className="card-body p-0">
          {permissions.isPending && <div className="p-3 text-body-secondary">Loading permissions…</div>}
          {permissions.isError && <div className="alert alert-danger m-3 mb-0">{permissions.error.message}</div>}
          {permissions.data && <div className="table-responsive"><table className="table table-bordered table-hover align-middle mb-0">
            <thead><tr><th>Module</th>{actions.map((action) => <th className="text-center" key={action}>{actionLabels[action] ?? action}</th>)}</tr></thead>
            <tbody>{matrix.map(([module, modulePermissions]) => {
              const byAction = new Map(modulePermissions.map((permission) => [permission.key.split('.')[1], permission]));
              return <tr key={module}><th scope="row">{readableModule(module)}</th>{actions.map((action) => {
                const permission = byAction.get(action);
                return <td className="text-center" key={action}>{permission && (canManage
                  ? <div className="form-check d-inline-flex mb-0"><input className="form-check-input" type="checkbox" id={`permission-${permission.id}`} checked={selected.has(permission.id)} onChange={(event) => togglePermission(permission.id, event.target.checked)} aria-label={readablePermission(permission)} title={readablePermission(permission)} /></div>
                  : <i className={`bi ${selected.has(permission.id) ? 'bi-check-lg text-success' : 'bi-dash text-body-secondary'}`} aria-label={selected.has(permission.id) ? `${readablePermission(permission)} allowed` : `${readablePermission(permission)} not allowed`} />)}</td>;
              })}</tr>;
            })}</tbody>
          </table></div>}
        </div>
        {canManage && <div className="card-footer"><button className="btn btn-primary" disabled={permissions.isPending || savePermissions.isPending} onClick={() => savePermissions.mutate()}>{savePermissions.isPending ? 'Saving…' : 'Save permissions'}</button></div>}
      </section>
    </div>
  </div>;
}
