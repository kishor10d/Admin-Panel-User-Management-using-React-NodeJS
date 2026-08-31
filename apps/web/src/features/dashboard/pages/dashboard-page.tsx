import { useQuery } from '@tanstack/react-query';
import type { HealthResponse } from '@cias/shared-types';
import { Link } from 'react-router-dom';
import { hasPermission, useCurrentUser } from '../../../app/current-user-context';
import { apiRequest } from '../../../lib/api-client';

async function getHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>('/health');
}

export function DashboardPage() {
  const health = useQuery({ queryKey: ['health'], queryFn: getHealth, retry: false });
  const user = useCurrentUser();
  const canReadUsers = hasPermission(user, 'users.read');
  const canCreateUsers = hasPermission(user, 'users.create');
  const canReadRoles = hasPermission(user, 'roles.read');
  const canManageRoles = hasPermission(user, 'roles.manage');
  const canReadLoginHistory = hasPermission(user, 'login-history.read');

  return <>
    <div className="row">
      {canReadUsers && <DashboardBox color="primary" title="Users" description="User management" icon="bi-people-fill" to="/users" linkLabel="Manage users" />}
      {canReadRoles && <DashboardBox color="success" title="Roles" description="Access control" icon="bi-shield-check" to="/roles" linkLabel="Manage roles" />}
      {canReadLoginHistory && <DashboardBox color="warning" title="Audit" description="Login activity" icon="bi-clock-history" to="/login-history" linkLabel="View history" />}
      <div className="col-lg-3 col-6"><div className="small-box text-bg-info"><div className="inner"><h3>{health.data?.database === 'configured' ? 'Online' : 'Offline'}</h3><p>Database status</p></div><i className="small-box-icon bi bi-database-check" /><span className="small-box-footer">{health.isPending ? 'Checking API…' : health.isError ? 'API unavailable' : `Database: ${health.data?.database}`}</span></div></div>
    </div>
    <div className="row">
      <div className="col-lg-7"><div className="card"><div className="card-header"><h3 className="card-title"><i className="bi bi-lightning-charge-fill me-2" />Quick start</h3></div><div className="card-body"><p className="mb-3">Use the available administration tools or update your profile.</p><div className="d-flex flex-wrap gap-2">{canCreateUsers && <Link className="btn btn-primary" to="/users"><i className="bi bi-person-plus-fill me-1" />Add user</Link>}{canManageRoles && <Link className="btn btn-outline-secondary" to="/roles">Configure roles</Link>}<Link className="btn btn-outline-secondary" to="/profile">My profile</Link></div></div></div></div>
      <div className="col-lg-5"><div className="card card-outline card-primary"><div className="card-header"><h3 className="card-title">System status</h3></div><div className="card-body"><div className="d-flex justify-content-between border-bottom pb-2 mb-2"><span>API</span><strong className={health.isError ? 'text-danger' : 'text-success'}>{health.isError ? 'Unavailable' : 'Connected'}</strong></div><div className="d-flex justify-content-between"><span>Database</span><strong>{health.data?.database ?? 'Checking'}</strong></div></div></div></div>
    </div>
  </>;
}

function DashboardBox({ color, title, description, icon, to, linkLabel }: { color: string; title: string; description: string; icon: string; to: string; linkLabel: string }) {
  return <div className="col-lg-3 col-6"><div className={`small-box text-bg-${color}`}><div className="inner"><h3>{title}</h3><p>{description}</p></div><i className={`small-box-icon bi ${icon}`} /><Link className="small-box-footer" to={to}>{linkLabel} <i className="bi bi-arrow-right-circle" /></Link></div></div>;
}
